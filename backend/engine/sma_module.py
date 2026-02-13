import yfinance as yf
import pandas as pd

def get_200w_sma(ticker_symbol):
    try:
        ticker = yf.Ticker(ticker_symbol)
        # Fetch 5 years of weekly data to ensure we have at least 200 weeks
        hist = ticker.history(period="max", interval="1wk")
        if len(hist) < 200:
            return None, None, "Not enough historical data to calculate 200-week SMA."
        
        sma_200 = hist['Close'].rolling(window=200).mean().iloc[-1]
        current_price = hist['Close'].iloc[-1]
        
        proximity = ((current_price - sma_200) / sma_200) * 100
        
        return current_price, sma_200, proximity
    except Exception as e:
        return None, None, f"Error fetching data: {e}"

# --- Execution ---
if __name__ == "__main__":
    price, sma, prox = get_200w_sma("BTC-USD")

    if sma is not None:
        print("--- Real Data Test: 200-Week SMA Alert (BTC-USD) ---")
        print(f"Current Price: ${price:,.2f}")
        print(f"200-Week SMA Value: ${sma:,.2f}")
        print(f"Proximity: Current price is {prox:.2f}% above/below the 200w-SMA.")
    else:
        print(f"Error calculating for BTC-USD: {prox}")
