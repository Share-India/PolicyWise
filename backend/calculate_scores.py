
import csv
import json
import os

CSV_FILE = "Insurance_plan_dataset.csv"
OUTPUT_FILE = "plan_scores.json"

def calculate_scores():
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found.")
        return

    scores_data = {}
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        
        # Identify feature columns (Exclude metadata)
        # Metadata: Sr No, Insurance Company, Base Plan Name
        skip_cols = ['Sr No', 'Insurance Company', 'Base Plan Name']
        feature_cols = [h for h in headers if h not in skip_cols]
        
        total_features = len(feature_cols)
        print(f"Total Feature Columns Detected: {total_features}")
        
        # Negative Keywords (Values that indicate a feature is NOT present or BAD)
        # We are generous: if it has *some* coverage, we count it as positive.
        # We only penalize "Not Available", "Zero", "Not Covered", "No".
        negative_values = [
            "not available", "not covered", "not applicable", "na", "-", 
            "no coverage",  "not included"
        ]
        
        # Strict "No" check: "No (Capped)" is still negative? 
        # User wants "Positive Features". 
        # "No (Capped...)" means coverage exists but is bad. "Not Available" means no coverage.
        # Let's count "Bad Coverage" as 0.5? User said "Count Positives".
        # Let's stick to binary: Is the feature present?
        
        for row in reader:
            company = row.get('Insurance Company', 'Unknown').strip()
            plan_name = row.get('Base Plan Name', 'Unknown').strip()
            
            # Create a unique key for the plan
            # Matches how main.py extracts name: usually just Plan Name
            # But duplicate plan names exist across companies?
            # Let's use "Plan Name" as key, assuming unique enough for lookup or "Company - Plan"
            # The backend recommendation usually keeps them separate.
            
            fullname = f"{company} - {plan_name}" # For debugging
            
            positives = 0
            
            for col in feature_cols:
                val = row.get(col, "").strip().lower()
                
                is_negative = False
                if not val: 
                    is_negative = True # Empty
                elif val in negative_values:
                    is_negative = True
                elif val.startswith("no ") and "room" not in col.lower() and "sub-limit" not in col.lower():
                    # "No (Specific)" might be negative
                    # But "No Sub-limits" is POSITIVE!
                    # "No Claim Bonus" is POSITIVE!
                    pass
                
                # Correction for "No Sub-limits" column:
                if "no sub-limits" in col.lower():
                    # If val says "No...", it implies THERE ARE sublimits? 
                    # Column Name: "No Sub-limits"
                    # Value: "No (Capped...)" -> Means "No, there are caps". -> Negative feature status?
                    # Value: "Yes" -> Means "Yes, No Sublimits" -> Positive.
                    if val.startswith("no"):
                        is_negative = True
                
                if not is_negative:
                    positives += 1
            
            # Calculate Score
            # Formula: (Count / Total) * 10
            raw_score = (positives / total_features) * 10
            final_score = round(raw_score, 2)
            
            # Store by Plan Name for easy lookup
            # We'll normalize keys to lowercase for fuzzy matching later
            key = f"{plan_name.lower().strip()}|{company.lower().strip()}"
            
            scores_data[key] = {
                "score": final_score,
                "positives": positives,
                "total": total_features,
                "company": company,
                "plan_name": plan_name
            }
            
            print(f"Plan: {plan_name} ({company}) | Key: {key} | Pos: {positives}/{total_features} | Score: {final_score}")

    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(scores_data, f, indent=4)
        
    print(f"Saved scores for {len(scores_data)} plans to {OUTPUT_FILE}")

if __name__ == "__main__":
    calculate_scores()
