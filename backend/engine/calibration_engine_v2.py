import yfinance as yf
import pandas as pd
from datetime import datetime

# --- Configuration ---
# The new, most important ground truth from the latest image.
TARGET_FLIP_LEVEL_BTC_WEEKLY = 98467.27

# --- Data Acquisition ---
def get_historical_data(ticker, interval='1wk'):
    print(f"Fetching {interval} historical data for {ticker}...")
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="max", interval=interval)
        hist = hist[hist.Volume > 0]
        if not hist.empty:
            print(f"  Successfully fetched data for {ticker}")
            return hist
    except Exception as e:
        print(f"  Error fetching data for {ticker}: {e}")
    return None

# --- Technical Indicator Calculation ---
def calculate_supertrend(df, period, multiplier):
    # (The Supertrend calculation logic remains the same as the previous script)
    high, low, close = df['High'], df['Low'], df['Close']
    df['tr'] = pd.DataFrame([high - low, abs(high - close.shift(1)), abs(low - close.shift(1))]).max(axis=0)
    df['atr'] = df['tr'].rolling(period, min_periods=1).mean()

    df['final_upper'] = df['final_lower'] = 0.0
    midpoint = (high + low) / 2
    df['basic_upper'] = midpoint + multiplier * df['atr']
    df['basic_lower'] = midpoint - multiplier * df['atr']

    for i in range(1, len(df)):
        idx = df.index[i]
        prev_idx = df.index[i-1]
        
        # Use .loc for safe assignment
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

# --- Calibration Engine v2 ---
def run_weekly_calibration(weekly_data):
    print("\nStarting weekly calibration for BTC Flip Level...")
    periods_to_test = range(5, 25) # Expanded range
    multipliers_to_test = [i * 0.1 for i in range(10, 61)] # 1.0 to 6.0 with 0.1 increments

    best_params = {}
    smallest_diff = float('inf')
    total_runs = len(periods_to_test) * len(multipliers_to_test)
    run_count = 0

    for period in periods_to_test:
        for multiplier in multipliers_to_test:
            run_count += 1
            
            df = calculate_supertrend(weekly_data.copy(), period, multiplier)
            
            # The flip level is the most recent 'final_upper' value when the trend is bearish
            latest_trend = df['Supertrend'].iloc[-1]
            if latest_trend == -1:
                calculated_flip_level = df['final_upper'].iloc[-1]
                diff = abs(calculated_flip_level - TARGET_FLIP_LEVEL_BTC_WEEKLY)
                
                if diff < smallest_diff:
                    smallest_diff = diff
                    best_params = {'period': period, 'multiplier': multiplier}
                    print(f"[{run_count}/{total_runs}] New best combo found! P={period}, M={multiplier:.1f} -> Flip: ${calculated_flip_level:,.2f} (Diff: ${diff:,.2f})")
    
    print("\n--- Weekly Calibration Complete ---")
    if best_params:
        print(f"Target Flip Level: ${TARGET_FLIP_LEVEL_BTC_WEEKLY:,.2f}")
        print(f"Best parameters found: {best_params} with a difference of ${smallest_diff:,.2f}")
    else:
        print("Could not find parameters that resulted in a bearish trend.")

    return best_params

# --- Main Execution ---
if __name__ == "__main__":
    btc_weekly_data = get_historical_data("BTC-USD", interval='1wk')
    
    if btc_weekly_data is not None:
        run_weekly_calibration(btc_weekly_data)
    else:
        print("Could not fetch weekly BTC data. Calibration aborted.")

