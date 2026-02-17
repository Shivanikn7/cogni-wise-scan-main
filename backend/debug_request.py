
import requests
import json

url = "http://localhost:5000/api/chat/send"
payload = {
    "user_id": "test_user_123",
    "message": "Hello, are you working?",
    "history": []
}

try:
    print(f"Sending POST to {url}...")
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    
    with open("error_debug.json", "w", encoding="utf-8") as f:
        f.write(response.text)
        
    print("Response saved to error_debug.json")
except Exception as e:
    print(f"Request failed: {e}")
