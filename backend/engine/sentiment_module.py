import os
import requests
import json

api_key = "cae589c527e7498c8c866f1039c39465"
url = "https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical"

headers = {
    'Accepts': 'application/json',
    'X-CMC_PRO_API_KEY': api_key,
}

try:
    # Let's get the most recent value, limit=1
    response = requests.get(url, headers=headers, params={'limit': '1'})
    data = response.json()
    
    print("--- Real Data Test: Crypto Fear & Greed Index ---")
    
    if response.status_code == 200:
        latest_data = data.get("data", [{}])[0]
        value = latest_data.get("value")
        classification = latest_data.get("value_classification")
        timestamp = latest_data.get("timestamp")
        
        if value is not None:
            print(f"Date: {timestamp}")
            print(f"Index Value: {value}/100")
            print(f"Classification: {classification}")
        else:
            print("Could not parse the data from the API response.")
            print(json.dumps(data, indent=2))
    else:
        print(f"API returned an error (Status Code: {response.status_code}):")
        print(json.dumps(data, indent=2))
    
except Exception as e:
    print(f"An error occurred: {e}")
