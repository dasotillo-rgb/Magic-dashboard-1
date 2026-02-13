import yfinance as yf
import pandas as pd
from datetime import datetime

# --- Configuration ---
GROUND_TRUTH = {
    "BTC-USD": "2025-12-31",
    "ETH-USD": "2025-12-31",
    "BNB-USD": "2025-07-01",
    "XRP-USD": "2025-12-31",
    "SOL-USD": "2025-12-31",
}

# --- Data Acquisition ---
def get_historical_data(tickers):
    print("Fetching historical data...")
    data = {}
    for ticker in tickers:
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="max", interval="1mo")
            hist = hist[hist.Volume > 0]
            if not hist.empty:
                data[ticker] = hist
                print(f"  Successfully fetched data for {ticker}")
        except Exception as e:
            print(f"  Error fetching data for {ticker}: {e}")
    return data

# --- Technical Indicator Calculation ---
def calculate_supertrend(df, period, multiplier):
    high, low, close = df['High'], df['Low'], df['Close']
    df['tr'] = pd.DataFrame([high - low, abs(high - close.shift(1)), abs(low - close.shift(1))]).max(axis=0)
    df['atr'] = df['tr'].rolling(period).mean()

    df['final_upper'] = df['final_lower'] = 0.0
    midpoint = (high + low) / 2
    df['basic_upper'] = midpoint + multiplier * df['atr']
    df['basic_lower'] = midpoint - multiplier * df['atr']

    for i in range(period, len(df)):
        idx = df.index[i]
        prev_idx = df.index[i-1]
        
        df.loc[idx, 'final_upper'] = df.loc[idx, 'basic_upper'] if df.loc[idx, 'basic_upper'] < df.loc[prev_idx, 'final_upper'] or close.loc[prev_idx] > df.loc[prev_idx, 'final_upper'] else df.loc[prev_idx, 'final_upper']
        df.loc[idx, 'final_lower'] = df.loc[idx, 'basic_lower'] if df.loc[idx, 'basic_lower'] > df.loc[prev_idx, 'final_lower'] or close.loc[prev_idx] < df.loc[prev_idx, 'final_lower'] else df.loc[prev_idx, 'final_lower']

    df['Supertrend'] = 1 # Default to Bullish
    for i in range(period, len(df)):
        idx = df.index[i]
        prev_idx = df.index[i-1]
        if close[idx] <= df.loc[prev_idx, 'final_upper']:
            df.loc[idx, 'Supertrend'] = -1
        elif close[idx] > df.loc[prev_idx, 'final_lower']:
            df.loc[idx, 'Supertrend'] = 1
        else:
            df.loc[idx, 'Supertrend'] = df.loc[prev_idx, 'Supertrend']
            
    return df

# --- Calibration Engine ---
def find_closest_flip_date(df, target_date_str):
    df['trend_change'] = df['Supertrend'].diff()
    bearish_flips = df[df['trend_change'] == -2]
    
    if bearish_flips.empty:
        return None, 99999  # High error if no flip is found

    target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
    
    time_diffs = [(d.to_pydatetime().replace(tzinfo=None) - target_date).days for d in bearish_flips.index]
    closest_flip_idx = pd.Series(abs(pd.Series(time_diffs))).idxmin()
    closest_date = bearish_flips.index[closest_flip_idx]
    error = abs(time_diffs[closest_flip_idx])
    
    return closest_date, error

def run_calibration(historical_data):
    print("\nStarting full calibration process...")
    periods_to_test = range(5, 15)
    multipliers_to_test = [i * 0.5 for i in range(2, 11)] # 1.0 to 5.0

    best_params = {}
    lowest_total_error = float('inf')
    total_runs = len(periods_to_test) * len(multipliers_to_test)
    run_count = 0

    for period in periods_to_test:
        for multiplier in multipliers_to_test:
            run_count += 1
            total_error = 0
            
            print(f"[{run_count}/{total_runs}] Testing P={period}, M={multiplier}...", end=" ")

            for ticker, data in historical_data.items():
                df = calculate_supertrend(data.copy(), period, multiplier)
                _, error = find_closest_flip_date(df, GROUND_TRUTH[ticker])
                total_error += error
            
            print(f"Total Error = {total_error} days")

            if total_error < lowest_total_error:
                lowest_total_error = total_error
                best_params = {'period': period, 'multiplier': multiplier}
                print(f"*** New best parameters found! Error: {lowest_total_error}, Params: {best_params} ***")
    
    print("\n--- Calibration Complete ---")
    print(f"Lowest total error across all assets: {lowest_total_error} days")
    print(f"Optimal parameters: {best_params}")
    return best_params

# --- Main Execution ---
if __name__ == "__main__":
    tickers_to_test = list(GROUND_TRUTH.keys())
    all_data = get_historical_data(tickers_to_test)
    
    if all_data:
        run_calibration(all_data)
    else:
        print("Could not fetch all required data. Calibration aborted.")
