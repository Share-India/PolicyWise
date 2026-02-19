import os
import sys
import json
import csv
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(override=True)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    sys.exit(1)

client = genai.Client(api_key=api_key)
app = FastAPI()

# --- LOAD PRE-CALCULATED PLAN SCORES & USPs & RAW CSV CONTENT ---
PLAN_SCORES_DATA = {}

PLAN_USP_DATA = {} # Restored for USP.csv
DATASET_COLUMNS = []

# Global CSV Content Strings (Loaded once to save I/O)
FEATURES_CSV_CONTENT = ""
COMPANY_RATIOS_CSV_CONTENT = ""
PLANS_DATABASE_CSV_CONTENT = ""
USP_CSV_CONTENT = ""

try:
    if os.path.exists("plan_scores.json"):
        with open("plan_scores.json", "r", encoding="utf-8") as f:
            # Normalize keys to lowercase for easier lookup
            raw_data = json.load(f)
            for k, v in raw_data.items():
                PLAN_SCORES_DATA[k.lower().strip()] = v
        print(f"DEBUG: Loaded {len(PLAN_SCORES_DATA)} plan scores successfully.")

    if os.path.exists("Insurance_plan_dataset.csv"):
        # Load raw content for AI context
        with open("Insurance_plan_dataset.csv", "r", encoding="utf-8") as f:
             PLANS_DATABASE_CSV_CONTENT = f.read()

        # Re-read for structured data parsing
        with open("Insurance_plan_dataset.csv", "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            headers = next(reader)
            # Filter out non-feature columns
            skip_cols = ['Sr No', 'Insurance Company', 'Base Plan Name']
            DATASET_COLUMNS = [h.strip().lower() for h in headers if h not in skip_cols and h.strip()]
            

                    
        print(f"DEBUG: Loaded {len(DATASET_COLUMNS)} dataset columns for whitelist.")
    else:
        print("WARNING: Insurance_plan_dataset.csv not found.")

    if os.path.exists("features3.csv"):
        with open("features3.csv", "r", encoding="utf-8") as f:
            FEATURES_CSV_CONTENT = f.read()
    else:
        print("WARNING: features3.csv not found.")

    if os.path.exists("company_performance_ratios.csv"):
        with open("company_performance_ratios.csv", "r", encoding="utf-8") as f:
            COMPANY_RATIOS_CSV_CONTENT = f.read()
    else:
        print("WARNING: company_performance_ratios.csv not found.")

    # --- RESTORED: Load USPs from USP.csv ---
    if os.path.exists("USP.csv"):
        with open("USP.csv", "r", encoding="utf-8") as f:
            USP_CSV_CONTENT = f.read() # Load raw content for AI context to avoid duplicate key issues
            
            # Also load dict for legacy lookups (if any)
            f.seek(0)
            reader = csv.DictReader(f)
            for row in reader:
                # USP.csv headers: Sr No, Insurance Company, Base Plan Name, Unique Selling Point (USP)
                p_name = row.get("Base Plan Name", "").strip().lower()
                company = row.get("Insurance Company", "").strip().lower()
                usp_text = row.get("Unique Selling Point (USP)", "").strip()
                if p_name and usp_text:
                    # Use composite key to avoid duplicates (e.g. "Premier Plan" exists in 2 companies)
                    unique_key = f"{p_name}|{company}"
                    if unique_key in PLAN_USP_DATA:
                        print(f"DEBUG: USP Collision ignored for key: {unique_key}")
                    PLAN_USP_DATA[unique_key] = usp_text
        print(f"DEBUG: Loaded {len(PLAN_USP_DATA)} Plan USPs from USP.csv.")
    else:
        print("WARNING: USP.csv not found.")

except Exception as e:
    print(f"WARNING: Failed to load auxiliary data: {e}")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Using models discovered via check_models.py (Prioritizing Standard models for better output quality)
MODEL_CANDIDATES = [
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash-preview-09-2025",
    "gemini-2.5-flash-lite-preview-09-2025",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash"
]

import difflib
import io

# City Tier Configuration
TIER_1_CITIES = [
    "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata", 
    "pune", "ahmedabad", "gurgaon", "gurugram", "noida"
]

# Blacklisted Companies (User Request)
BLACKLISTED_COMPANIES = ["niva bupa", "care health", "star health"]

# Financial Constants
CURRENT_INFLATION_RATE = 7.0 # 7% Annual Inflation calculation for Shield

def analyze_user_profile(extracted_data):
    """
    Analyzes extracted data to create a user profile for specific recommendations.
    Returns a dictionary with derived attributes.
    """
    profile = {
        "city_tier": "Tier 2/3",
        "recommended_min_si": "10 Lakhs",
        "life_stage": "Individual",
        "family_type": "Individual"
    }
    
    # 1. Geography Analysis
    city = extracted_data.get("city", "").lower().strip()
    if any(t1 in city for t1 in TIER_1_CITIES):
        profile["city_tier"] = "Tier 1 (Metro)"
        profile["recommended_min_si"] = "25 Lakhs - 50 Lakhs" # Higher cost of living
    else:
        profile["city_tier"] = "Tier 2/3"
        profile["recommended_min_si"] = "10 Lakhs - 25 Lakhs"

    # 2. Family Composition Analysis
    policy_type = extracted_data.get("coverage", "").lower()
    members = extracted_data.get("policy_holders", [])
    
    if "floater" in policy_type or len(members) > 1:
        profile["family_type"] = "Floater / Family"
        profile["life_stage"] = "Family"
    else:
        profile["family_type"] = "Individual"
        profile["life_stage"] = "Single"

    # 3. Age Analysis (New)
    ages = []
    for p in extracted_data.get("policy_holders", []):
         try:
             ages.append(int(p.get("age", 0)))
         except:
             pass
    
    max_age = max(ages) if ages else 30
    if max_age < 35:
        profile["age_group"] = "Young Adult (Prioritize: Low Premium, Wellness, Lock-in Age)"
    elif max_age < 50:
        profile["age_group"] = "Mid-Life (Prioritize: Comprehensive features, Maternity if relevant)"
    else:
        profile["age_group"] = "Senior (Prioritize: No Co-pay, Short Wait Periods, PED Cover)"

    return profile



def match_policy_in_csv(company_name, plan_name, csv_content):
    """
    Robustly matches a policy in the CSV database.
    1. Filters by exact/fuzzy company name.
    2. Uses difflib to find best plan name match.
    """
    if not plan_name or not csv_content:
        return None

    best_match = None
    highest_ratio = 0.0
    
    # Normalize inputs
    norm_company = company_name.lower().strip()
    norm_plan = plan_name.lower().strip()
    
    reader = csv.DictReader(io.StringIO(csv_content))
    
    for row in reader:
        # Check Company Match (handle "Co. Ltd" etc)
        csv_company = row.get("Insurance Company", "").lower()
        if norm_company not in csv_company and csv_company not in norm_company:
             continue # Skip if company doesn't match at all
             
        # Check Plan Match
        csv_plan = row.get("Base Plan Name", "").lower()
        ratio = difflib.SequenceMatcher(None, norm_plan, csv_plan).ratio()
        
        # Boost ratio if exact substring match
        if norm_plan in csv_plan:
            ratio += 0.1
            
        if ratio > highest_ratio:
            highest_ratio = ratio
            best_match = row

    # Threshold for acceptance
    if highest_ratio > 0.5: # generous threshold due to variations
        print(f"DEBUG: Found CSV Match! Input: '{plan_name}' -> Matched: '{best_match['Base Plan Name']}' (Score: {highest_ratio:.2f})")
        return best_match
    
    return None

def parse_date(date_str):
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d-%b-%Y", "%d %b %Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None

async def generate_content_with_fallback(client, contents, **kwargs):
    last_exception = None
    for model in MODEL_CANDIDATES:
        try:
            print(f"Attempting model: {model}")

            config_params = {"response_mime_type": "application/json"}
            
            # Merge kwargs into config_params (e.g. temperature)
            if kwargs:
                config_params.update(kwargs) # This allows passing temperature=0.0

            # If tools are provided, we cannot enforce JSON mime_type easily on all models
            # But the user wants JSON. 
            if "tools" in config_params:
                 # If tools are used, mime_type must be removed for some models or handled differently
                 # ideally we keep tools in config and remove mime_type if it conflicts
                 config_params.pop("response_mime_type", None)

            response = await run_in_threadpool(
                client.models.generate_content,
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(**config_params)
            )
            print(f"Success with model: {model}")
            return response
        except Exception as e:
            print(f"Model {model} failed: {e}")
            last_exception = e
            continue
    print("All models failed.")
    raise last_exception or Exception("All models failed")

@app.post("/api/extract")
async def extract_policy(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        # Read features CSV for context
        features_csv_content = FEATURES_CSV_CONTENT
        if not features_csv_content:
             features_csv_content = "Room Rent, NCB, Restoration, Waiting Periods, Co-pay"

        # --- NEW: Filter Features to only match Dataset Columns ---
        # User wants ONLY features present in the dataset to be displayed/extracted.
        try:
            if DATASET_COLUMNS:
                dataset_features = DATASET_COLUMNS

                # Parse features3.csv to filter lines
                filtered_lines = []
                # Keep header
                lines = features_csv_content.splitlines()
                if lines:
                    filtered_lines.append(lines[0]) 
                
                import difflib
                
                for line in lines[1:]:
                    if not line.strip(): continue
                    parts = line.split(',')
                    if len(parts) >= 2:
                        category = parts[0].strip()
                        feat_name = parts[1].strip().lower()
                        
                        # Strict/Fuzzy Match check
                        matched = False
                        
                        # CRITICAL FIX: ALWAYS Include Non-Negotiable and Must Have features
                        # Even if they don't perfectly match dataset columns, user wants to see them.
                        # AI will try to synthesize data (e.g. Pre & Post) or report N/A.
                        if category in ["Non-Negotiable Benefits", "Must Have"]:
                            matched = True
                        
                        # For other categories (Good to Have, Special), STRICTLY match dataset
                        elif feat_name in dataset_features:
                            matched = True
                        else:
                            # Fuzzy check against dataset columns
                            # e.g. "Room Rent" vs "Room Rent Limit"
                            matches = difflib.get_close_matches(feat_name, dataset_features, n=1, cutoff=0.7)
                            if matches:
                                matched = True
                            else:
                                # Reverse containment check
                                for df in dataset_features:
                                    if feat_name in df or df in feat_name:
                                        matched = True
                                        break
                        
                        if matched:
                            filtered_lines.append(line)
                
                # Update features_csv to only contain filtered list
                features_csv = "\n".join(filtered_lines)
                print(f"DEBUG: Filtered Features List to {len(filtered_lines)} items based on Dataset.")
            else:
                features_csv = features_csv_content
        except Exception as e:
            print(f"WARNING: Feature Filtering Failed: {e}")
            features_csv = features_csv_content


        current_date_str = datetime.now().strftime("%d-%b-%Y")
        
        # Enhanced extraction prompt
        prompt = f"""Analyze this health insurance document. 
        
        REFERENCE FEATURES LIST:
        {features_csv}

        INSTRUCTIONS:
        1. Extract basic info:
           - **company**: EXTRACT THE FULL LEGAL NAME (e.g., "Go Digit General Insurance Ltd.", "HDFC ERGO General Insurance Company Ltd."). Do NOT use abbreviations like "Digit" or "HDFC".
        2. EXTRACT POLICY DATES:
           - Look for "Policy Start Date", "Inception Date", "Risk Start Date", or "Date of First Inception".
           - **CRITICAL**: Return the exact date string found (e.g., "12/05/2020") in the JSON under policy_details -> start_date.
        3. EXTRACT POLICY HOLDERS: Look for names, dates of birth (DOB). Return DOB in JSON.
        4. EXTRACT ADDRESS/LOCATION:
           - Look for the Proposer's address. Extract the **City** and **Pincode**.
        5. EXTRACT SUM INSURED BREAKDOWN:
             - **CRITICAL**: Identify "Base Sum Insured" (A).
             - Identify "No Claim Bonus" / "Cumulative Bonus" (B).
             - **CRITICAL**: Look for "Cumulative Bonus Super" / "No Claim Bonus Super" / "Protector Shield". This is often a SEPARATE column or mentioned in the **NOTES** below the table.
             - Identify "Additional Bonus" / "Recharge" (C).
             - **CRITICAL**: Identify "Deductible" or "Aggregate Deductible" (Terms that REDUCE cover).
             - **INSTRUCTION**: READ THE NOTES section below tables carefully. If it mentions "NCB Shield" or "Super Bonus" applied, find the amount.
             - "components": Create a list of ALL distinct positive values found.
             - Labels: "Base Sum Insured", "Cumulative Bonus", "Super No Claim Bonus", "Recharge Benefit", "Deductible".
             - Example: [{{ "label": "Base Sum Insured", "value": "10,00,000" }}, {{ "label": "Deductible", "value": "50,000" }}]
             - **CRITICAL**: Do NOT include components that are Percentages (e.g. "Bonus %"). Only include the absolute currency AMOUNT.
        5. CRITICAL: Scan the document for EVERY feature listed in the "REFERENCE FEATURES LIST" above.
        6. If a feature is found, capture its specific limit, waiting period, or condition.
        7. Compile a "comprehensive_findings" text block that lists EVERY found feature and its detail.

        Return JSON:
        {{ 
          "company": "", 
          "plan": "", 
          "premium": "", 
          "coverage": "", 
          "policy_details": {{ "start_date": "", "vintage": "" }},
          "sum_insured": {{ 
             "total": "", 
             "components": [ {{ "label": "", "value": "" }} ]
          }},
          "policy_holders": [
            {{ "name": "", "dob": "", "age": "" }}
          ],
          "features_found": {{ "room_rent": "", "ncb": "", "restoration": "", "ped_wait": "", "copay": "" }},
          "comprehensive_findings": "Full text summary of all features found matched against the reference list..."
        }}
        """
        try:
            response = await generate_content_with_fallback(client, [prompt, types.Part.from_bytes(data=content, mime_type=file.content_type)], temperature=0.0)
            
            # clean json
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                 text = text.split("```")[1].split("```")[0].strip()
            
            # Auto-repair common JSON errors if needed (simple check)
            try:
                data = json.loads(text, strict=False)
            except json.JSONDecodeError as e_idx:
                # Fallback: try to find the substring between first { and last }
                try:
                    start = text.find("{")
                    end = text.rfind("}") + 1
                    if start != -1 and end != -1:
                        text = text[start:end]
                        data = json.loads(text, strict=False)
                    else:
                        raise ValueError("No JSON found")
                except Exception as e_inner:
                    print(f"FAILED TO PARSE JSON in EXTRACT. Error: {e_inner}. Raw text: {text}")
                    # Return safe default
                    data = {
                       "company": "Unknown", 
                       "plan": "Unknown", 
                       "premium": "0", 
                       "coverage": "0", 
                       "policy_details": { "start_date": "", "vintage": "Unknown" },
                       "sum_insured": { "total": "0", "components": [] },
                       "policy_holders": [],
                       "features_found": {},
                       "comprehensive_findings": "Could not extract data."
                    }

            # --- PYTHON SIDE: RECALCULATE AGES PRECISELY ---
            # The LLM often hallucinates the current year or does bad math. 
            # We trust the DOB extraction more than the Age calculation.
            if "policy_holders" in data and isinstance(data["policy_holders"], list):
                today = datetime.now()
                for person in data["policy_holders"]:
                    dob_str = person.get("dob", "")
                    if dob_str:
                        # Try to parse DOB
                        dob_date = parse_date(dob_str)
                        
                        if dob_date:
                            # Calculate precise age
                            age = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
                            person["age"] = str(age) # Override LLM age

            # --- PYTHON SIDE: CALCULATE TOTAL SUM INSURED ---
            if "sum_insured" in data and "components" in data["sum_insured"]:
                components = data["sum_insured"]["components"]
                total_val = 0
                
                def extract_number(val_str):
                    if not val_str: return 0
                    s = str(val_str).strip().replace(',', '')
                    # Handle decimals: If there's a dot, take only the integer part
                    if '.' in s:
                        s = s.split('.')[0]
                    # Remove non-digits
                    clean = ''.join(c for c in s if c.isdigit())
                    return int(clean) if clean else 0

                def format_indian_currency(n):
                    s = str(n)
                    if len(s) <= 3:
                        return s
                    dic = s[:-3]
                    last_3 = s[-3:]
                    groups = []
                    while len(dic) > 2:
                        groups.insert(0, dic[-2:])
                        dic = dic[:-2]
                    groups.insert(0, dic)
                    return ",".join(groups) + "," + last_3

                valid_components = []
                has_inflation_shield_feature = False

                for comp in components:
                    val = extract_number(comp.get("value", "0"))
                    label = comp.get("label", "").lower()
                    
                    if val > 0:
                        # Skip percentages from calculation
                        if "%" in label or "percent" in label:
                             pass 
                             continue
                        
                        # [NEW] Check for Inflation Shield / Care Shield / Protector
                        # User Rule: Ignore PDF value, calculate standardized 7% per year
                        # FIXED: Removed "bonus super" to ensure No Claim Bonus Super is NOT skipped.
                        if "inflation" in label or "shield" in label or "protector" in label:
                             print(f"DEBUG: Detected Inflation Shield Feature '{label}' - Ignoring PDF Value {val}, will recalculate.")
                             has_inflation_shield_feature = True
                             continue # Skip adding the PDF value

                        if "deductible" in label:
                            total_val -= val
                        else:
                            total_val += val

                        comp["value"] = format_indian_currency(val) # Apply Indian Format directly
                        valid_components.append(comp) # Add only valid components

                # Update with filtered list
                data["sum_insured"]["components"] = valid_components
                
                # --- NEW: STANDARDIZED INFLATION SHIELD CALCULATION ---
                if has_inflation_shield_feature:
                     try:
                        # 1. Calculate Tenure
                        years_active = 1
                        start_date_str = data.get("policy_details", {}).get("start_date", "")
                        if start_date_str:
                             s_date = parse_date(start_date_str)
                             if s_date:
                                 years_active = datetime.now().year - s_date.year
                                 if years_active < 1: years_active = 1
                        
                        # 2. Find Base SI
                        base_si = 0
                        for comp in valid_components:
                            lbl = comp.get("label", "").lower()
                            if "base" in lbl or "sum insured" in lbl:
                                 val_str = comp.get("value", "0")
                                 base_si = extract_number(val_str)
                                 break
                        
                        if base_si > 0:
                            # 3. Calculate Shield: Base * 7% * Years
                            inflation_amt = int(base_si * (CURRENT_INFLATION_RATE / 100) * years_active)
                            
                            if inflation_amt > 0:
                                shield_component = {
                                    "label": f"Inflation Shield ({CURRENT_INFLATION_RATE}% x {years_active} yrs)",
                                    "value": format_indian_currency(inflation_amt)
                                }
                                data["sum_insured"]["components"].append(shield_component)
                                
                                # Add to total
                                total_val += inflation_amt
                                print(f"DEBUG: Calculated Standardized Inflation Shield: {inflation_amt}")
                     except Exception as e:
                         print(f"WARNING: Standardized Inflation Shield Calc Failed: {e}")

                # FORCE OVERWRITE: Use our calculated total from valid components
                # This fixes the issue where AI's total includes hidden/hallucinated values
                data["sum_insured"]["total"] = format_indian_currency(total_val)

            return data

        except Exception as e:
            print(f"JSON Parse Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response. Please try again.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/compare")
async def compare_policy(data: dict):
    try:
        # Read features from CSV
        features_csv = FEATURES_CSV_CONTENT
        if not features_csv:
            print("WARNING: features3.csv content missing")

        # Read Company Tiers from CSV
        company_data_csv = COMPANY_RATIOS_CSV_CONTENT
        if not company_data_csv:
             print("WARNING: company_performance_ratios.csv content missing")

        # Read Insurance Plans Database
        plans_database_csv = PLANS_DATABASE_CSV_CONTENT
        if not plans_database_csv:
             print("WARNING: Insurance_plan_dataset.csv content missing")

        # Read USP CSV
        usp_csv = USP_CSV_CONTENT
        if not usp_csv:
             print("WARNING: USP.csv content missing")

        # Calculate Policy Tenure from Inception Date
        inception_date_str = data.get('policy_details', {}).get('start_date', '')
        calculated_tenure = "Unknown"
        
        if inception_date_str:
            inception_date = parse_date(inception_date_str)
            if inception_date:
                today = datetime.now()
                # Calculate difference in years and months
                years = today.year - inception_date.year
                months = today.month - inception_date.month
                if months < 0:
                    years -= 1
                    months += 12
                calculated_tenure = f"{years} Years {months} Months"

        # [MODIFIED] Check if company exists in CSV (Robust Fallback Logic)
        company_name = data.get("company", "").lower().strip()
        is_company_known = False
        
        if company_name and company_data_csv:
            # 1. Direct substring check (fast)
            if company_name in company_data_csv.lower():
                is_company_known = True
            else:
                # 2. Reverse substring check (e.g. "Bajaj Allianz" in "Bajaj Allianz General Insurance...")
                try:
                    # Parse the CSV options to get list of valid company names
                    # We use a quick csv reader on the string content
                    import io
                    reader = csv.DictReader(io.StringIO(company_data_csv))
                    for row in reader:
                        known_name = row.get("Company Name", "").strip().lower()
                        if known_name and (known_name in company_name):
                            is_company_known = True
                            print(f"DEBUG: Matched input '{company_name}' with known company '{known_name}'")
                            break
                        
                        # 3. First Word Check (e.g. "Chola" in "Cholamandalam")
                        # Split both by space and check if first token matches
                        known_first = known_name.split(' ')[0] if known_name else ""
                        input_first = company_name.split(' ')[0] if company_name else ""
                        
                        if known_first and len(known_first) > 3 and known_first in company_name:
                             # Safe guard: Only if first word is significant (>3 chars)
                             is_company_known = True
                             print(f"DEBUG: Fuzzy Matched First Word '{known_first}' in input '{company_name}'")
                             break
                except Exception as e:
                    print(f"WARNING: Failed to parse company CSV for matching: {e}")

        CSV_FALLBACK_INSTRUCTION = ""
        if not is_company_known:
            print(f"Company '{company_name}' not found in CSV. Using 'Others' fallback.")
            CSV_FALLBACK_INSTRUCTION = """
            **IMPORTANT: The company name is not explicitly found in Reference Data 2.**
            You MUST use the **"Others"** row from "Ref 2 CSV DATA" for the Current Policy Stats.
            - CSR: Use the value from the "Others" row.
            - Complaints: Use the value from the "Others" row.
            - Solvency: Use the value from the "Others" row.
            - Tier: Use the value from the "Others" row.
            """

        # [NEW] Perform Strict Verification against Plan Database
        input_plan_name = data.get("policy_details", {}).get("plan", "") # Changed from "plan_name" to "plan"
        verified_row = match_policy_in_csv(data.get("company", ""), input_plan_name, plans_database_csv)
        
        VERIFIED_DATA_SECTION = ""
        if verified_row:
            # Format row as a clean string for the LLM
            row_str = " | ".join([f"{k}: {v}" for k, v in verified_row.items() if v and v != "Not Applicable"])
            VERIFIED_DATA_SECTION = f"""
            *** VERIFIED DATABASE MATCH FOR CURRENT POLICY ***
            We found an EXACT MATCH for this policy in our database:
            Match: "{verified_row.get('Base Plan Name')}" by "{verified_row.get('Insurance Company')}"
            
            OFFICIAL DATA SPECS:
            {row_str}
            
            CRITICAL INSTRUCTION: You MUST use the above 'OFFICIAL DATA SPECS' if data is missing from the PDF.
            """

        # --- STEP 2: ANALYZE PROFILE & GENERATE COMPARISON ---
        user_profile = analyze_user_profile(data)

        # --- PREPARE FEATURE LIST STRING FOR PROMPT ---
        # strictly list the columns we want analyzed
        feature_list_str = "\n        ".join([f"- {col}" for col in DATASET_COLUMNS]) if DATASET_COLUMNS else "- (All columns in Ref 3)"

        # --- NEW: PARSE FEATURES BY CATEGORY FOR COMPARISON ---
        # We need specific lists to force the AI to check ALL of them for the Comparison section
        nn_features_list = []
        mh_features_list = []
        try:
            if FEATURES_CSV_CONTENT:
                # Simple CSV parsing of the string
                import io
                f_io = io.StringIO(FEATURES_CSV_CONTENT)
                reader = csv.reader(f_io)
                for row in reader:
                    if len(row) >= 2:
                        cat = row[0].strip().lower()
                        feat = row[1].strip()
                        if "non-negotiable" in cat:
                            nn_features_list.append(feat)
                        elif "must have" in cat:
                            mh_features_list.append(feat)
        except Exception as e:
            print(f"Error parsing features for lists: {e}")
            # Fallbacks if parsing fails
            nn_features_list = ["Infinite Care", "No Sub-limits", "Consumables Cover", "Inflation Protector", "No Claim Bonus", "Restoration Benefit"]
            mh_features_list = ["Room Rent", "ICU Charges", "Day Care Treatments", "Claim Protector", "Pre & Post Hospitalization"]

        nn_features_str = ", ".join(nn_features_list)
        mh_features_str = ", ".join(mh_features_list)

        # REQUIRED PROMPT: Must match Frontend 'recommendations' schema
        # REFACTORED PROMPT STRUCTURE
        prompt = f"""
        Act as an expert insurance advisor for "Share India". 
        {CSV_FALLBACK_INSTRUCTION}
        
        # 1. INPUT DATA (CONTEXT)
        ---------------------------------------------------
        **EXISTING POLICY (Source of Truth)**:
        - Basic Info: {json.dumps(data)}
        - Policy Vintage: {data.get('policy_details', {}).get('vintage', 'Unknown')}
        - **CALCULATED TENURE**: {calculated_tenure} (Use this for Waiting Period Analysis)
        - Detailed Findings: {data.get('comprehensive_findings', 'Not available')}
        - Company: "{data.get('company')}"
        {VERIFIED_DATA_SECTION}

        **USER PROFILE**:
        - Age Group: {user_profile.get('age_group', 'General')}
        - Location: {data.get('city', 'Unknown')} ({user_profile['city_tier']})
        - Family Details: {user_profile['family_type']} ({user_profile['life_stage']})
        - Current Premium: {data.get('premium', 'Unknown')}
        
        **REFERENCE DATA**:
        - **Ref 1 (Features)**: Classification (Must Have, Good to Have, etc.).
        Ref 1 CSV DATA:
        {features_csv}

        - **Ref 2 (Company Performance)**: Claims Ratio, CSR, Solvency, Complaints.
        Ref 2 CSV DATA:
        {company_data_csv}

        - **Ref 3 (Plan Database)**: VALID Plans, Coverages, Limits. DO NOT INVENT PLANS.
        Ref 3 CSV DATA:
        {plans_database_csv}

        - **Ref 4 (USPs)**: Unique Selling Points for plans.
        Ref 4 CSV DATA:
        {usp_csv}

        # 2. ANALYSIS RULES & LOGIC
        ---------------------------------------------------
        **A. WAITING PERIOD ANALYSIS**:
        - Use **CALCULATED TENURE** as "Time Served".
        - Compare against Waiting Periods for PEDs/Specific Illnesses.
        - If Time Served > Wait Period -> MARK AS COVERED / WAIT OVER.
        - If Time Served < Wait Period -> Calculate remaining time.

        **B. FEATURE CHECKLIST (MANDATORY)**:
        - **Analyze the following specific features (Columns from Ref 3)**:
        {feature_list_str}

        - **CRITICAL INSTRUCTION**: You MUST return a finding for **EVERY SINGLE FEATURE** listed above.
        - Do NOT skip any feature. If information is missing, estimate it or mark "Not Available".
        
        - **CATEGORY MAPPING RULE (STRICT)**:
          - You MUST assign each feature to EXACTLY ONE of these 4 categories:
            1. **"Non-Negotiable Benefits"**
            2. **"Must Have"**
            3. **"Good to Have"**
            4. **"Special Features"**
          - **CRITICAL**: The properties "Maternity", "Value Added", "Waiting Periods", etc., from Ref 1 are NOT valid categories for output.
          - **MAPPING**:
            - Map "Waiting Periods" -> **"Must Have"**
            - Map "Maternity", "Treatments" -> **"Special Features"**
            - Map "Value Added" -> **"Good to Have"**
          - If you return a category not in the top 4 list, IT WILL NOT BE DISPLAYED.

        - Status: "Positive" (Present/Good) or "Negative" (Missing/Capped/Bad).
        - Value: Short finding (e.g. "Capped at 1%", "Available", "Not Covered").
        - **IMPORTANT**: 
          - If the feature is confirmed to be **ABSENT** or **EXCLUDED**, set Value to **"Not Covered"**.
          - Do NOT use single words like "No" or "None". Use "Not Covered".

        **C. PRODUCT SCORE**:
        - **Data Source**: Use ONLY the ~28 features in Ref 3 (Plan Database).
        - **Formula**: (Count of Positive "Must Have" & "Non-Negotiable" matched in Ref 3) / (Total matched in Ref 3) * 10.
        - **Constraint**: Use this EXACT formula for both Current Policy and Recommendations.

        **D. RECOMMENDATION LOGIC (MULTI-FACTOR)**:
        1. **Geographical**: 
           - **Tier 1 (Metro)**: Recommend High SI (25L-50L+). High medical costs.
           - **Tier 2/3**: Balance coverage/affordability.
        2. **Age/Family Strategy**:
           - **Young**: Prioritize Age Lock, Wellness, Low Premium.
           - **Senior**: Prioritize No Co-pay, Short Wait Periods.
           - **Family**: Prioritize Maternity, Newborn, Restoration.
        3. **USP**: Cite specific USPs from Ref 4.
        4. **Premium**: Estimate premiums based on Age/SI/Market rates (2025). NO "Check website".
        
        **E. SELECTION CONSTRAINTS**:
        - **Quantity**: EXACTLY 3 distinct plans from DIFFERENT companies.
        - **Blacklist**: DO NOT recommend **Niva Bupa, Care Health, Star Health** (User Blocked).
        - **Allowed**: HDFC Ergo, ManipalCigna, Aditya Birla, SBI General, Bajaj Allianz, ICICI Lombard, Tata AIG, Future Generali.
        - **Performance**: Ensure selected companies have **CSR > 85%**.

        # 3. OUTPUT SCHEMA (JSON ONLY)
        ---------------------------------------------------
        Return PURE JSON. No markdown formatting.
        {{
            "location_analysis": {{
                "city": "{data.get('city', 'Unknown')}",
                "tier": "{user_profile['city_tier']}",
                "insight": "Healthcare costs in {data.get('city', 'your city')} are [High/Moderate/Low]... (Mention specific costs)",
                "major_illnesses": [
                    {{ "illness": "Cardiac Surgery", "estimated_cost": "₹5L - ₹8L" }},
                    {{ "illness": "Cancer Treatment", "estimated_cost": "₹15L+" }},
                    {{ "illness": "Organ Transplant", "estimated_cost": "₹25L+" }},
                    {{ "illness": "Dengue/Severe Infection", "estimated_cost": "₹1L - ₹3L" }}
                ],
                "verdict": "Your Sum Insured of {data.get('sum_insured', {}).get('total', '...')} is [Adequate/Insufficient] because..."
            }},
            "feature_analysis": [
                {{ "category": "Non-Negotiable Benefits", "feature": "Infinite Care", "status": "Positive", "value": "Available" }},
                {{ "category": "Must Have", "feature": "Room Rent", "status": "Negative", "value": "Capped at 1%" }},
                {{ "category": "Must Have", "feature": "...", "status": "...", "value": "..." }},
                // ... MUST INCLUDE ALL 28+ FEATURES LISTED ABOVE ...
            ],
            "product_score": 7.5,
            "current_policy_stats": {{
                "company": "Company Name",
                "csr": "98.5%", "csr_rank": "5",
                "solvency": "1.8", "solvency_rank": "1",
                "complaints": "95%", "complaints_rank": "2"
            }},
            "recommendations": [
                {{
                    "category": "Upgrade: [Type] (Reason)",
                    "items": [
                        {{
                            "company": "Full Legal Name",
                            "name": "Plan Name", 
                            "type": "...", 
                            "positive_features_count": 65,
                            "premium": "₹20,000 - ₹25,000", 
                            "description": "USP: ...", 
                             "stats": {{ "csr": "98.5%", "solvency": "1.8", "complaints": "95%" }},
                            "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
                            "non_negotiable": [
                                {{ "feature": "Infinite Care", "existing": "Not Covered", "proposed": "Yes", "status": "Upgrade" }}
                            ],
                            "must_have": [
                                {{ "feature": "Room Rent", "existing": "1% limit", "proposed": "No Limit", "status": "Upgrade" }}
                            ],
                            "good_to_have": [
                                {{ "feature": "Air Ambulance", "existing": "Not Covered", "proposed": "Covered up to 2.5L", "status": "Upgrade" }}
                            ],
                            "special_features": [
                                {{ "feature": "Robotic Surgery", "existing": "Not Covered", "proposed": "Covered", "status": "Upgrade" }}
                            ],
                            "red_flags": [
                                "Co-payment clause present in many competitor base plans (highlight if relevant)"
                            ]
                        }}
                    ]
                }}
            ]
        }}
        
        CRITICAL INSTRUCTION FOR 'recommendations':
        1. **Quantity**: EXACTLY 3 distinct plans.
        2. **Diversity**: DIFFERENT COMPANIES.
        3. **COMPARISON LOGIC (STRICT)**:
           - **Rule**: Compare 'Existing Policy' vs 'Recommended Plan'.
           - **VISIBILITY**: If 'Existing' == 'Proposed' -> HIDE (Do not include in list). 
           - **EXCEPTION**: If distinct and differentiable -> SHOW.
        
        4. **NON-NEGOTIABLE BENEFITS**:
           - **MANDATORY CHECK**: You MUST iterate through **EACH** of these features:
             [{nn_features_str}]
           - For **EVERY** feature in this list:
             - Compare Existing vs Proposed.
             - If they differ (even slightly, e.g. "Capped" vs "No Limit"), **YOU MUST INCLUDE IT**.
             - ONLY skip if they are absolutely identical (e.g. "Covered" vs "Covered").
        
        5. **MUST HAVE FEATURES**:
           - **MANDATORY CHECK**: You MUST iterate through **EACH** of these features:
             [{mh_features_str}]
           - Same rule: If they differ, **INCLUDE IT**. Do NOT filter out valid differences.

        6. **GOOD TO HAVE FEATURES**:
           - Select **EXACTLY 5 to 7** unique features from the "Good to Have" category that show the **BIGGEST UPGRADES**.
           - Do not show identicals.
           
        7. **SPECIAL FEATURES**:
           - Select **EXACTLY 5 to 7** unique features from the "Special Features" category that show the **BIGGEST UPGRADES**.

        CRITICAL INSTRUCTION FOR 'current_policy_stats':
        - Look up the **EXISTING POLICY'S COMPANY** in "Ref 2 CSV DATA".
        - **CSR (Claim Settlement Ratio)**: Extract the value from the **"Claims Paid Ratio"** column (Col 2) and its **Rank** (Col 3).
        - **Complaints**: Extract "Complaints Settlement Ratio" (Column 9) and its **Rank** (Column 10).
        - **Solvency**: Extract "Solvency Ratio" (March 2024 value) and its **Rank** (Column 16).
        - **Format**: 
          - Ratios: Percentage or Number (e.g. "98.5%", "1.85").
          - Ranks: **ONLY THE NUMBER** (e.g. "1", "5", "10"). Do NOT add "Top" or "Tier".

        CRITICAL INSTRUCTION FOR 'stats' FIELD (Recommendations):
        - Same logic as above. Extract Ratio and Rank.
        - JSON Structure for stats: {{ "csr": "98%", "csr_rank": "5", "solvency": "1.8", "solvency_rank": "1", "complaints": "99%", "complaints_rank": "2" }}
        - **csr**: Extract "Claims Paid Ratio" from "Ref 2 CSV DATA". Format as percentage (e.g. "98.2%").
        - **solvency**: Extract "Solvency Ratio" from "Ref 2 CSV DATA". Format as number (e.g. "1.9").
        - **complaints**: Extract "Complaints Settlement Ratio" from "Ref 2". Format as percentage (e.g. "98%").
        - If data is missing for a company, estimate based on tier.

        CRITICAL INSTRUCTION FOR 'benefits' FIELD:
        - You MUST list 3-4 KEY SELLING POINTS from "Reference Data 3" (Plan Database).
        - Focus on "No Room Rent Limit", "Unlimited Restoration", "Bonus", or "No Claim Bonus".
        - Short, punchy bullet points.

        3. **PREMIUM ESTIMATION (MANDATORY)**:
           - **CRITICAL RULE**: NEVER, under any circumstances, output "Please search" or "Check website". This is an automated report. YOU must provide the data.
           - **Method 1 (Search)**: Try to find the actual premium brochure via Google Search.
           - **Method 2 (Estimation - REQUIRED Fallback)**: If search fails, you **MUST ESTIMATE** the premium based on:
             - **Age**: {data.get('policy_holders', [{'age': 30}])[0].get('age', 30)} years
             - **Sum Insured**: {data.get('policy_details', {}).get('sum_insured', '5 Lakh')}
             - **Family Type**: {data.get('policy_type', 'Individual')}
             - **Market Knowledge**: Use your internal knowledge of 2025 Indian Health Insurance pricing.
           - **Output Format**: Always output a realistic range (e.g. "₹22,000 - ₹26,000").
           - **Constraint**: Premiums must vary by plan.

        **CRITICAL SELECTION LOGIC (DYNAMIC & PERSONALIZED)**:
        Do NOT just pick the top 3 companies by CSR. You MUST select plans that fit the **User Profile**:
        - **Profile**: {user_profile['age_group']}
        - **Location**: {user_profile['city_tier']}
        
        **Selection Strategy**:
        1. **Young Users (<35)**: Prioritize plans with "Age Lock", "Wellness Points", or "Low Premiums" (e.g. Niva Bupa ReAssure, Aditya Birla).
        2. **Seniors (>50)**: Prioritize "No Co-pay", "Reduced PED Waiting" (e.g. Care Senior, Star Health).
        3. **Tier 2/3 Cities**: Prioritize "Value for Money" & "Network Strength" (e.g. SBI, Bajaj, Star).
        4. **Premium Seekers (Tier 1)**: Prioritize "High No Claim Bonus", "Global Cover", "Infinite Restoration" (e.g. HDFC Optima Secure, Manipal Cigna).
        
        **DIVERSITY RULE**: 
        - Choose 3 Distinct Companies.
        - **CSR Filter**: Ensure all selected companies have **CSR > 85%**.
        - **Sorting**: Among the suitable plans, rank them by how well they solve the user's specific needs, NOT just by CSR. Be smart. Not everyone needs the most expensive Platinum plan.

        **NEGATIVE CONSTRAINT (STRICT)**:
        - **DO NOT** recommend plans from the following companies: **Niva Bupa, Care Health, Star Health**.
        - The user has explicitly blocked them.
        - FAILURE to follow this will result in a penalty.
        - Recommended Alternatives: HDFC Ergo, ManipalCigna, Aditya Birla, SBI General, Bajaj Allianz, ICICI Lombard, Tata AIG, Future Generali.

        3. **DISPLAY RULES (STRICT)**:
           - **Company Name**: Output ONLY the official company name (e.g., "HDFC Ergo"). **DO NOT** append "(Tier 1)" or any other stats to the name string. The user wants a clean display.
           - **Description Field (CRITICAL - USP)**:
             - You MUST find the **Unique Selling Point (USP)** of this specific plan from its brochure or your knowledge.
             - START the description with "USP: [The USP]".
             - Follow it with a brief 1-line overview of why this plan is superior.
             - Example: "USP: Industry's only unlimited restoration benefit for unrelated illnesses. This plan offers..."

        4. **DATA SOURCE RULES (STRICT)**:
           - **Current Policy Data ("Existing")**:
             - PRIMARY SOURCE: Use the 'DETAILED FOUND FEATURES' text block provided at the top.
             - **SECONDARY SOURCE (CRITICAL)**: If a feature is NOT found in the text, check **Reference Data 3 (Plan Database)**. If the *Current Policy Name* matches a plan in that CSV, USE THAT DATA to fill missing fields.
             - **TERTIARY SOURCE (WEB SEARCH)**: If the feature is NOT in the PDF or the CSV, you **MUST** use the Google Search tool to find the official brochure/policy wording for the specific '[Company Name] [Plan Name]'. Look specifically for the missing feature value.
             - **FINAL FALLBACK**: Only output "Not Available" if the feature is completely unknown after checking PDF, CSV, and the Web.
             - **CRITICAL**: Do NOT output "Unknown" or "Not Mentioned. If you don't see it in the text, ESTIMATE it based on standard market features for that plan.
             - **PED WAITING PERIOD LOGIC**:
               - Identify the "Pre-Existing Disease" or "PED" waiting period from the found features (usually 2, 3, or 4 years).
               - Compare it against the **Policy Vintage** ({data.get('policy_details', {}).get('vintage', 'Unknown')}).
               - If Vintage > Waiting Period, set the Existing Value to "**Passed**" or "**Waived**".
               - If Vintage < Waiting Period, set the Existing Value to "**X Years Remaining**" (calculate the difference).
           - **Recommended Policy Data ("Proposed")**: You MUST use "Reference Data 3 (Plan Database)" for ALL recommended plan details.
           - **Feature Categorization**: You MUST use "Reference Data 1" (features3.csv) to decide if a feature is "Non-Negotiable Benefits", "Must Have", "Good to Have", etc.
           - **Company Tier**: You MUST use "Reference Data 2" (Company Ratios) for Tier and reliability stats. 
           
        5. **DISPLAY RULES**:
           - **Extracted Company Name**: Output the full legal name (e.g. "The New India Assurance Co. Ltd."). 
           - **CRITICAL cleanup**: CUT OFF any text that appears **after** "Ltd." or "Co.". 
           - **REMOVE** any parenthetical text like "(Government of India Undertaking)" or "(A Joint Venture...)" if it appears after the main name.
           - Example: "The New India Assurance Co. Ltd. (Govt of India)" -> "The New India Assurance Co. Ltd."
           - **Row Visibility**: If a feature is "No" or "Unknown" for BOTH the "Existing" and "Proposed" policy, DO NOT include that row in the output JSON. We only want to see differences or relevant features.
           - **Company Tier**: You MUST use "Reference Data 2" (Company Ratios) for Tier and reliability stats.

        9. **RED FLAGS / THINGS TO AVOID**:
           - Check the "Red Flag" category in Reference Data 1 (e.g., Co-Payment, Room Rent Limits).
           - If the *Recommended Plan* has any of these, OR if the *Current Policy* has them and they are being eliminated, mention it.
           - Example logic: "The existing 20% Co-Payment is eliminated in this proposed plan." OR "Warning: This plan has a 10% Co-Payment."
           - Populate the "red_flags" JSON array with these warnings.
        10. **PROS vs CONS (STRICT FEATURE MAPPING)**:
           - **Reference**: Use 'Reference Data 1' ({features_csv}) for the list of Must Have/Good to Have features AND their "One-liner Explanation".
           - **PROS Logic**: 
             - List features from 'Reference Data 1' that the **EXISTING POLICY HAS**.
             - Format: "Feature Name: [Details/Limit]. [One-liner Explanation]"
             - Example: "Room Rent: Covered up to 1% of SI. Covers hospital room charges up to eligible limits."
             - Do NOT use prefixes like "Must Have:" or "Good to Have:".
           - **CONS Logic**: 
             - List features from 'Reference Data 1' that the **EXISTING POLICY LACKS** (or has poor limits on).
             - Format: "Feature Name: Not Covered / limit is low. [One-liner Explanation]"
             - Example: "Robotic Surgery: Not Covered. Covers advanced medical treatments like robotic surgery."
             - Do NOT use prefixes like "Missing:", "Must Have:", or "Red Flag:". Just the statement.
             - Also check "Red Flags" present in the existing policy.
           - **Format**: Return simple string arrays.
        """

        search_tool = types.Tool(google_search=types.GoogleSearch())

        try:
            response = await generate_content_with_fallback(
                client,
                contents=prompt,
                tools=[search_tool],
                temperature=0.0 # Deterministic output
            )

        except Exception as e:
             print(f"ALL MODELS FAILED: {e}")
             raise HTTPException(status_code=429, detail="All AI models are currently busy. Please try again later.")

        text = response.text
        if not text:
            raise ValueError("AI returned empty response")
        
        print(f"DEBUG: AI Raw Text (First 500 chars): {text[:500]}...")
        
        text = text.replace("```json", "").replace("```", "").strip()
        try:
             result = json.loads(text)
             # REMOVED AGGRESSIVE FILTERING to ensure all features are displayed
             print(f"DEBUG: Feature Analysis Count: {len(result.get('feature_analysis', []))}")
                 
             if "feature_analysis" in result:
                 # --- DETERMINISTIC SCORE CALCULATION ---
                 # User complained about inconsistency. We calculate score in Python now.
                 try:
                     # Use the count of DATASET_COLUMNS as denominator (approx 28)
                     total_features_denominator = len(DATASET_COLUMNS) if DATASET_COLUMNS else 70 
                     
                     positive_features = 0
                     for item in result["feature_analysis"]:
                         if item.get("status") == "Positive":
                             positive_features += 1
                     
                     # Calculate Score
                     score = (positive_features / total_features_denominator) * 10
                     result["product_score"] = round(score, 2)
                     print(f"DEBUG: Calc Score: {result['product_score']} (Pos: {positive_features}/{total_features_denominator})")
                 except Exception as e:
                     print(f"Score Calc Error: {e}")

                     features = result['feature_analysis']
                     
                     # 1. Filter relevant categories
                     non_negotiable = [f for f in features if f.get('category') == 'Non-Negotiable Benefits']
                     must_have = [f for f in features if f.get('category') == 'Must Have']
                     good_to_have = [f for f in features if f.get('category') == 'Good to Have']
                     special_features = [f for f in features if f.get('category') == 'Special Features']
                     
                     # 2. Count Positives
                     pos_nn = sum(1 for f in non_negotiable if f.get('status') == 'Positive')
                     pos_mh = sum(1 for f in must_have if f.get('status') == 'Positive')
                     pos_gh = sum(1 for f in good_to_have if f.get('status') == 'Positive')
                     pos_sf = sum(1 for f in special_features if f.get('status') == 'Positive')
                     
                     total_relevant = len(non_negotiable) + len(must_have) + len(good_to_have) + len(special_features)
                     total_positive = pos_nn + pos_mh + pos_gh + pos_sf
                     
                     # 3. Calculate Score (Matches prompt formula: (Pos / Total) * 10)
                     # We can add explicit penalty for Red Flags if valid, but let's stick to the core ratio first.
                     if total_relevant > 0:
                         calc_score = round((total_positive / total_relevant) * 10, 2)
                     else:
                         calc_score = 0.0
                         
                     # 4. Apply Deductions for Red Flags (if mapped in feature_analysis as Negative with specific keyword?)
                     # For now, let's trust the ratio.
                     
                     print(f"DEBUG: Calc Score: {calc_score} (Pos: {total_positive}/{total_relevant})")
                     result['product_score'] = calc_score
                     
                 except Exception as e:
                     print(f"DEBUG: Score Calculation Failed: {e}")
                     # Keep original or default to 0
                     if 'product_score' not in result:
                         result['product_score'] = 0.0

             if "recommendations" in result:
                 # Standardize Structure: Frontend expects [{ category:..., items: [...] }]
                 recs = result['recommendations']
                 
                 # Case 1: AI returned a flat list of plans directly
                 if isinstance(recs, list) and len(recs) > 0 and "items" not in recs[0]:
                     print("DEBUG: Detected Flat List of Recommendations. Wrapping in Category.")
                     result['recommendations'] = [{
                         "category": "Recommended Upgrades",
                         "items": recs
                     }]
                 
                 # Inspect the standardized structure
                 final_recs = result['recommendations']
                 print(f"DEBUG: Recommendation Categories: {len(final_recs)}")
                 
                 total_plans = 0
                 for cat in final_recs:
                     items = cat.get('items', [])
                     total_plans += len(items)
                     for idx, plan in enumerate(items):
                         c_name = plan.get('company', 'Unknown').lower().strip()
                         
                         # --- BLACKLIST FILTER ---
                         if any(blocked in c_name for blocked in BLACKLISTED_COMPANIES):
                             print(f"DEBUG: Skipped Blacklisted Company: {c_name}")
                             continue

                         p_name = plan.get('name', 'Unknown').lower().strip()
                         
                         # --- OVERRIDE WITH PRE-CALCULATED SCORES & USP ---
                         found_match = False
                         # --- OVERRIDE WITH PRE-CALCULATED SCORES & USP ---
                         found_match = False
                         if PLAN_SCORES_DATA:
                             # 1. subset scores by company to handle same-name plans (e.g. Premier Plan)
                             c_norm = c_name.lower().strip().replace("general insurance", "").replace("insurance", "").strip()
                             candidate_scores = {} 
                             
                             for k, v in PLAN_SCORES_DATA.items():
                                 if "|" in k:
                                     k_p, k_c = k.split("|") # Format: plan|company
                                     # Company Match: Fuzzy containment
                                     if k_c in c_norm or c_norm in k_c:
                                         candidate_scores[k_p] = v, k # Store value and full key
                             
                             # 2. Match Plan Name within candidates
                             matched_data = None
                             matched_p_name = None
                             
                             if p_name in candidate_scores:
                                 matched_data, _ = candidate_scores[p_name]
                                 matched_p_name = p_name
                             else:
                                 # Fuzzy match plan name
                                 import difflib
                                 match = difflib.get_close_matches(p_name, candidate_scores.keys(), n=1, cutoff=0.6)
                                 if match:
                                     matched_data, _ = candidate_scores[match[0]]
                                     matched_p_name = match[0]
                                     print(f"DEBUG: Fuzzy matched '{p_name}' to '{matched_p_name}' for company '{c_name}'")

                             if matched_data:
                                 plan['product_score'] = matched_data['score']
                                 plan['positive_features_count'] = matched_data['positives']
                                 plan['total_features_count'] = matched_data['total']
                                 
                                 # Update p_name for USP lookup
                                 # Need to reconstruct the composite key for USP lookup if USP data also uses composite keys?
                                 # Yes, PLAN_USP_DATA now uses composite keys too.
                                 
                                 # Let's try to find USP using the same composite key logic
                                 # We can't just set p_name = matched_p_name because USP lookup needs company too.
                                 
                                 found_match = True
                                 
                                 # --- USP OVERRIDE ---
                                 # PLAN_USP_DATA keys are also "plan|company"
                                 # We can try to construct the key using the matched plan name and the matched company from score data?
                                 # Value in candidate_scores was (v, k). k is the full key "plan|company"
                                 
                                 _, full_key = candidate_scores[matched_p_name]
                                 
                                 if full_key in PLAN_USP_DATA:
                                     usp = PLAN_USP_DATA[full_key]
                                     if not usp.lower().startswith("usp"):
                                         plan['description'] = f"USP: {usp}"
                                     else:
                                         plan['description'] = usp
                                     print(f"DEBUG: Injected USP for {full_key}")


                         # (USP injection handled above in score block)

                         # Get values for display
                         feat_count = plan.get('positive_features_count', 0)
                         total_count = plan.get('total_features_count', 30) # Default to ~30 if not found
                         calc_score = plan.get('product_score', 0)
                             
                         print(f"DEBUG: Plan {idx+1} ({c_name}): Positive Features = {feat_count}/{total_count} --> Score = {calc_score}/10")

                 print(f"DEBUG: Total Recommended Plans Found: {total_plans}")

        except json.JSONDecodeError:
             # Fallback: Find the first { and last }
             try:
                 start = text.find("{")
                 end = text.rfind("}") + 1
                 if start != -1 and end != -1:
                     result = json.loads(text[start:end])
                 else:
                     raise ValueError("No JSON found in text")
             except Exception:
                 print(f"FAILED TO PARSE JSON. Raw text: {text}")
                 # Return a safe default object to prevent crash
                 result = {
                    "pros": ["Could not analyze policy details."],
                    "cons": ["AI response was not in expected format."],
                    "current_policy_stats": {
                        "company": data.get("company", "Unknown"),
                        "csr": "N/A", "csr_rank": "N/A",
                        "solvency": "N/A", "solvency_rank": "N/A",
                        "complaints": "N/A", "complaints_rank": "N/A"
                    },
                    "recommendations": []
                 }

        # Enforce cons >= pros logic (Sales Perspective)
        # Ensure pros are never more than cons to prevent the plan looking "too good" to switch from.
        if "pros" in result and "cons" in result:
             # STRICT LIMIT: Max 7 items each
            result["pros"] = result["pros"][:7]
            result["cons"] = result["cons"][:7]

            if len(result["pros"]) > len(result["cons"]):
                # Truncate pros to match the length of cons
                result["pros"] = result["pros"][:len(result["cons"])]

        try:
            csr_map = {}
            # Load CSR data
            try:
                with open("company_performance_ratios.csv", "r", encoding="utf-8") as f:
                    reader = csv.reader(f)
                    next(reader) # Header 1
                    next(reader) # Header 2
                    for row in reader:
                        if len(row) > 1:
                            # Clean name: remove special chars, lowercase
                            name_key = row[0].strip().lower().replace("general insurance", "").replace("insurance", "").strip()
                            ratio_str = row[1].replace('%', '').replace(',', '').strip()
                            try:
                                csr_map[name_key] = float(ratio_str)
                            except:
                                pass
            except: 
                pass

            if "recommendations" in result:
                # Iterate each category and sort items
                for cat in result["recommendations"]:
                    if "items" in cat:
                        def get_csr_score(rec):
                            c_name = rec.get("company", "").lower().replace("general insurance", "").replace("insurance", "").strip()
                            # Try exact match
                            if c_name in csr_map:
                                return csr_map[c_name]
                            # Try fuzzy containment
                            for k, v in csr_map.items():
                                if k in c_name or c_name in k:
                                    return v
                            return 0.0
                        
                        # Sort Descending by CSR (REMOVED: Let AI logic prevail for diversity)
                        # cat["items"].sort(key=get_csr_score, reverse=True)
                        pass

        except Exception as e:
             print(f"Sorting Error: {e}") 

        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"COMPARISON ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)