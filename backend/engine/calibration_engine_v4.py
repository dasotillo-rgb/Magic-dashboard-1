import yfinance as yf
import pandas as pd
import numpy as np

# --- Configuration ---
TARGETS = {
    "BTC-USD": 98467.27,
    "SOL-USD": 136.50,
    "ETH-USD": 3103.00
}

# --- Data Acquisition ---
def get_historical_data(tickers, interval='1wk'):
    print("Fetching weekly historical data...")
    data = {}
    for ticker in tickers:
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="max", interval=interval)
            hist = hist[hist.Volume > 0]
            if not hist.empty:
                print(f"  Successfully fetched data for {ticker}")
                data[ticker] = hist
        except Exception as e:
            print(f"  Error fetching data for {ticker}: {e}")
    return data

# --- Technical Indicator Calculation ---
def calculate_supertrend(df, period, multiplier):
    # This logic has been battle-tested now.
    high, low, close = df['High'], df['Low'], df['Close']
    df['tr'] = pd.DataFrame([high - low, abs(high - close.shift(1)), abs(low - close.shift(1))]).max(axis=0)
    df['atr'] = df['tr'].rolling(period, min_periods=1).mean()

    df['final_upper'] = df['final_lower'] = np.nan
    midpoint = (high + low) / 2
    df['basic_upper'] = midpoint + multiplier * df['atr']
    df['basic_lower'] = midpoint - multiplier * df['atr']

    for i in range(1, len(df)):
        idx = df.index[i]
        prev_idx = df.index[i-1]
        
        df.loc[idx, 'final_upper'] = df.loc[idx, 'basic_upper'] if df.loc[idx, 'basic_upper'] < df.loc[prev_idx, 'final_upper'] or close.loc[prev_idx] > df.loc[prev_idx, 'final_upper'] else df.loc[prev_idx, 'final_upper']
        df.loc[idx, 'final_lower'] = df.loc[idx, 'basic_lower'] if df.loc[idx, 'basic_lower'] > df.loc[prev_idx, 'final_lower'] or close.loc[prev_idx] < df.loc[prev_idx, 'final_lower'] else df.loc[prev_idx, 'final_lower']

    df['Supertrend'] = 1 # Default to Bullish
    for i in range(1, len(df)):
        idx = df.index[i]
        prev_idx = df.index[i-1]
        if close[idx] <= df.loc[prev_idx, 'final_upper']:
            df.loc[idx, 'Supertrend'] = -1
        elif close[idx] > df.loc[prev_idx, 'final_lower']:
            df.loc[idx, 'Supertrend'] = 1
        else:
            df.loc[idx, 'Supertrend'] = df.loc[prev_idx, 'Supertrend']
            
    return df

# --- Calibration Engine v4 ---
def run_triple_calibration(historical_data):
    print("\nStarting TRIPLE calibration for BTC, SOL, & ETH Flip Levels...")
    periods_to_test = range(5, 25)
    multipliers_to_test = [i * 0.1 for i in range(10, 61)] # 1.0 to 6.0

    best_params = {}
    lowest_combined_error = float('inf')
    total_runs = len(periods_to_test) * len(multipliers_to_test)
    run_count = 0

    for period in periods_to_test:
        for multiplier in multipliers_to_test:
            run_count += 1
            combined_error = 0
            
            for ticker, target_level in TARGETS.items():
                data = historical_data.get(ticker)
                if data is None: continue

                df = calculate_supertrend(data.copy(), period, multiplier)
                
                latest_trend = df['Supertrend'].iloc[-1]
                if latest_trend == -1:
                    calculated_flip_level = df['final_upper'].iloc[-1]
                    error = abs(calculated_flip_level - target_level) / target_level
                    combined_error += error
                else:
                    combined_error += 999 

            if run_count % 10 == 0:
                 print(f"[{run_count}/{total_runs}] P={period}, M={multiplier:.1f} -> Combined Error: {combined_error:.4f}")

            if combined_error < lowest_combined_error:
                lowest_combined_error = combined_error
                best_params = {'period': period, 'multiplier': multiplier}
                print(f"*** New best parameters found! Error: {lowest_combined_error:.4f}, Params: {best_params} ***")
    
    print("\n--- Triple Calibration Complete ---")
    if best_params:
        print(f"Best parameters found: {best_params} with a combined percentage error of {lowest_combined_error:.4f}")
        print("\nFinal Validation:")
        for ticker, target_level in TARGETS.items():
            data = historical_data.get(ticker)
            df = calculate_supertrend(data.copy(), best_params['period'], best_params['multiplier'])
            calculated_flip = df['final_upper'].iloc[-1]
            print(f"  {ticker}: Target=${target_level:,.2f} -> Calculated=${calculated_flip:,.2f}")
    else:
        print("Could not find suitable parameters.")

    return best_params

# --- Main Execution ---
if __name__ == "__main__":
    tickers_to_test = list(TARGETS.keys())
    all_data = get_historical_data(tickers_to_test)
    
    # Validation: Ensure all data was fetched
    if len(all_data) == len(tickers_to_test) and all(not df.empty for df in all_data.values()):
        run_triple_calibration(all_data)
    else:
        print("Error: Could not fetch valid historical data for all tickers. Calibration aborted.")
