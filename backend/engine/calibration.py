import yfinance as yf
import datetime

def calculate_supertrend(df, period=10, atr_multiplier=3):
    high = df['High']
    low = df['Low']
    close = df['Close']

    # Calculate ATR
    df['H-L'] = high - low
    df['H-PC'] = abs(high - df['Close'].shift(1))
    df['L-PC'] = abs(low - df['Close'].shift(1))

    df['TR'] = df[['H-L', 'H-PC', 'L-PC']].max(axis=1)
    atr = df['TR'].rolling(period).mean()

    # Calculate upper and lower band
    df['Upper Basic'] = (high + low) / 2 + atr_multiplier * atr
    df['Lower Basic'] = (high + low) / 2 - atr_multiplier * atr

    df['Upper Final'] = 0.0
    df['Lower Final'] = 0.0
    df['Supertrend'] = 0.0

    for i in range(1, len(df)):
        df['Upper Final'][i] = df['Upper Basic'][i] if df['Upper Basic'][i] < df['Upper Final'][i-1] or df['Close'][i-1] > df['Upper Final'][i-1] else df['Upper Basic'][i]
        df['Lower Final'][i] = df['Lower Basic'][i] if df['Lower Basic'][i] > df['Lower Final'][i-1] or df['Close'][i-1] < df['Lower Final'][i-1] else df['Lower Basic'][i]

        if df['Close'][i] > df['Upper Final'][i-1]:
            df['Supertrend'][i] = df['Lower Final'][i]
        elif df['Close'][i] < df['Lower Final'][i-1]:
            df['Supertrend'][i] = df['Upper Final'][i]
        else:
            df['Supertrend'][i] = df['Supertrend'][i-1] # Keep the trend if price is within the bands

    return df[['Close', 'Supertrend']]

def is_bearish_trend(ticker, timeframe='1mo', period=10, atr_multiplier=3):
    data = yf.download(ticker, period=timeframe)
    if data.empty:
        return None # Indicate that data could not be retrieved
    supertrend_data = calculate_supertrend(data.copy(), period, atr_multiplier)
    current_close = supertrend_data['Close'][-1]
    current_supertrend = supertrend_data['Supertrend'][-1]
    return current_close < current_supertrend

# Calculate the date 1 month, 4 days, 13 hours, and 35 minutes ago
now = datetime.datetime.now(datetime.timezone.utc)
time_ago = now - datetime.timedelta(days=4+31, hours=13, minutes=35)

# Check if BTC is in a bearish trend
is_bearish = is_bearish_trend('BTC-USD')

if is_bearish is None:
    print("Error: Could not retrieve BTC-USD data from Yahoo Finance.")
else:
    if is_bearish:
        print("BTC-USD is currently in a bearish trend on the monthly chart.")
    else:
        print("BTC-USD is NOT in a bearish trend on the monthly chart.")

    # Print the current price of BTC
    btc_data = yf.download('BTC-USD', period='1d')
    if not btc_data.empty:
        current_price = btc_data['Close'][-1]
        print(f"Current BTC price: {current_price:.2f}")
    else:
        print("Error: Could not retrieve current BTC price.")