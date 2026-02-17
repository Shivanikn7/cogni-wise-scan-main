import os
from dotenv import load_dotenv

# Load env variables (look for .env)
# Try to look up one level (root) for .env if not found in current dir
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv() 

KEY = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {'Yes' if KEY else 'No'} (First 5 chars: {KEY[:5] if KEY else 'None'})")

try:
    from google import genai
    print("Successfully imported google.genai")
except ImportError as e:
    print(f"FAILED to import google.genai: {e}")
    exit(1)

try:
    client = genai.Client(api_key=KEY)
    print("Client initialized.")
    print("Listing available models...")
    for model in client.models.list(config={"query_base": True}):
        print(f"Model: {model.name}")
        
    print("Attempting generation with 'gemini-1.5-flash' again (as a check)...")
    # Try gemini-1.5-flash-001 if the short alias fails?
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash-001', 
            contents="Hello test"
        )
        print("Success with gemini-1.5-flash-001")
    except Exception as e:
        print(f"Failed with gemini-1.5-flash-001: {e}")

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp', 
            contents="Hello test"
        )
        print("Success with gemini-2.0-flash-exp")
    except Exception as e:
        print(f"Failed with gemini-2.0-flash-exp: {e}")
except Exception as e:
    print(f"Generation FAILED: {e}")
    import traceback
    traceback.print_exc()
