import os
import sys
from dotenv import load_dotenv, find_dotenv
from google import genai
from google.genai import types

def test_key():
    print("\n--- DIAGNOSTIC START ---")
    
    # 1. Find the .env file explicitly
    env_path = find_dotenv()  # Auto-finds .env
    if not env_path:
        print("CRITICAL ERROR: No .env file found in this directory or parents!")
        print(f"Current Directory: {os.getcwd()}")
        return

    print(f"Loading environment from: {env_path}")

    # 2. Force Reload (ignore system cache/variables)
    load_dotenv(env_path, override=True)
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found inside .env file.")
        print("Please add: GEMINI_API_KEY=your_key_here")
        return

    # 3. Show Key Snippet (Safe)
    snippet = f"{api_key[:5]}...{api_key[-5:]}" if len(api_key) > 10 else "SHORT_KEY"
    print(f"Loaded Key Snippet: {snippet}")
    print("------------------------")

    # 4. Verify with API
    print("Contacting Google Gemini API...")
    client = genai.Client(api_key=api_key)
    
    models_to_try = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ]

    success = False
    for model in models_to_try:
        try:
            print(f"Testing model: {model} ... ", end="")
            response = client.models.generate_content(
                model=model,
                contents="Hello, confirm connectivity."
            )
            print("SUCCESS! [OK]")
            print(f"Response: {response.text}")
            success = True
            break
        except Exception as e:
            err_str = str(e)
            print("FAILED [X]")
            
            # Smart Error Diagnosis
            if "403" in err_str:
                if "LEAKED" in err_str.upper() or "API key was reported" in err_str:
                    print("\n[!] DIAGNOSIS: KEY LEAKED")
                    print("Google has blocked this specific key because it was exposed.")
                    print("ACTION: You MUST generate a NEW key at aistudio.google.com and update .env")
                else:
                    print("\n[!] DIAGNOSIS: PERMISSION DENIED (403)")
                    print("Check if the API key has the correct permissions (Generative Language API enabled).")
            elif "429" in err_str:
                print("\n[!] DIAGNOSIS: QUOTA EXCEEDED (429)")
                print("You have hit the rate limit. Try again later or switch to a paid plan.")
            elif "404" in err_str:
                 print(f"  -> Model '{model}' not found (404). Trying next...")
                 continue
            else:
                print(f"  -> Unexpected Error: {e}")
            
            # Don't break immediately on 404, but break on auth errors
            if "403" in err_str or "400" in err_str:
                break

    if not success:
        print("\n[X] Verification FAILED. Please check the diagnosis above.")
    else:
        print("\n[OK] Verification PASSED. Your API key and Environment are correctly set up.")

if __name__ == "__main__":
    test_key()
