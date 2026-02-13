import requests
import json

api_key = "ykb72riz5v3mb3vaie_pp4nnlnurz74zdr6"
url = "https://api.santiment.net/graphql"

query = """
query {
  marketcap: getMetric(metric: "marketcap_usd") {
    timeseriesData(slug: "bitcoin", from: "utc_now-2d", to: "utc_now", interval: "1d") {
      value
    }
  }
  realized_value: getMetric(metric: "realized_value_usd") {
    timeseriesData(slug: "bitcoin", from: "utc_now-2d", to: "utc_now", interval: "1d") {
      value
    }
  }
}
"""

payload = json.dumps({'query': query})
headers = {
    "Content-Type": "application/json",
    "x-api-key": api_key
}

try:
    response = requests.post(url, headers=headers, data=payload)
    response.raise_for_status()
    data = response.json()

    print("--- Real Data Test: NUPL (Net Unrealized Profit/Loss) for Bitcoin ---")
    errors = data.get("errors")
    if errors:
        print("API returned errors:")
        for error in errors:
            print(error.get("message"))
    else:
        marketcap_data = data.get("data", {}).get("marketcap", {}).get("timeseriesData", [])
        realized_value_data = data.get("data", {}).get("realized_value", {}).get("timeseriesData", [])

        if marketcap_data and realized_value_data:
            latest_marketcap = marketcap_data[-1].get("value")
            latest_realized_value = realized_value_data[-1].get("value")
            
            if latest_marketcap > 0:
                nupl = (latest_marketcap - latest_realized_value) / latest_marketcap
                
                print(f"Latest Market Cap: ${latest_marketcap:,.2f}")
                print(f"Latest Realized Value (Cap): ${latest_realized_value:,.2f}")
                print(f"Calculated NUPL: {nupl:.4f}")

                if nupl > 0.75:
                    interpretation = "Euphoria/Greed (Potential Market Top)"
                elif nupl > 0.5:
                    interpretation = "Belief/Denial"
                elif nupl > 0.25:
                    interpretation = "Optimism/Anxiety"
                elif nupl > 0:
                    interpretation = "Hope/Fear"
                else:
                    interpretation = "Capitulation (Potential Market Bottom)"
                print(f"Interpretation: {interpretation}")
            else:
                print("Market cap is zero, cannot calculate NUPL.")
        else:
            print("Could not retrieve the necessary data components (Market Cap or Realized Value).")

except requests.exceptions.HTTPError as http_err:
    print(f"HTTP error occurred: {http_err}")
    print(f"Response content: {response.text}")
except Exception as err:
    print(f"An error occurred: {err}")
