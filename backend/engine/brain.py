import yfinance as yf
import pandas as pd
import datetime

def calculate_money_line(df, atr_length, atr_multiplier):
    # Calculate ATR
    df['high_low'] = df['High'] - df['Low']
    df['high_close'] = abs(df['High'] - df['Close'].shift())
    df['low_close'] = abs(df['Low'] - df['Close'].shift())
    df['ranges'] = df[['high_low', 'high_close', 'low_close']].max(axis=1)
    atr = df['ranges'].rolling(atr_length).mean()

    # Calculate upper and lower bands
    df['upper_band'] = df['High'] + atr_multiplier * atr
    df['lower_band'] = df['Low'] - atr_multiplier * atr
    df['upper_basic'] = df['High'] + atr_multiplier * atr
    df['lower_basic'] = df['Low'] - atr_multiplier * atr
    df['upper_final'] = 0.0
    df['lower_final'] = 0.0
    
    # Initialize Supertrend column
    df['Supertrend'] = 0.0

    for i in range(1, len(df)):
      curr = i
      prev = i - 1
      
      if df['Close'][curr] > df['upper_final'][prev]:
        df['Supertrend'][curr] = 1
      elif df['Close'][curr] < df['lower_final'][prev]:
        df['Supertrend'][curr] = -1
      else:
        df['Supertrend'][curr] = df['Supertrend'][prev]
        
      if df['Supertrend'][curr] == 1 and df['lower_basic'][curr] < df['lower_final'][prev]:
        df['lower_final'][curr] = df['lower_final'][prev]
      else:
        df['lower_final'][curr] = df['lower_basic'][curr]

      if df['Supertrend'][curr] == -1 and df['upper_basic'][curr] > df['upper_final'][prev]:
        df['upper_final'][curr] = df['upper_final'][prev]
      else:
        df['upper_final'][curr] = df['upper_basic'][curr]
    
    return df

def get_btc_trend(atr_length, atr_multiplier, target_date):
    btc = yf.Ticker("BTC-USD")
    df = btc.history(period="6mo", interval="1wk")
    df = calculate_money_line(df, atr_length, atr_multiplier)
    
    # Find the date closest to the target date
    closest_date = df.index.get_loc(target_date, method='nearest')
    target_row = df.iloc[closest_date]
    
    current_price = df['Close'].iloc[-1]
    trend = 'Bullish' if target_row['Supertrend'] == 1 else 'Bearish'
    flip_level = target_row['upper_final'] if trend == 'Bearish' else target_row['lower_final']
    
    return current_price, trend, flip_level

# Calibrate the Money Line
target_bearish_date = pd.to_datetime('2026-01-01')

# Initial parameters
atr_length = 14
atr_multiplier = 2.3 # Adjusted to match bearish trend on 2026-01-01

# Get current price, trend, flip level
current_price, trend, flip_level = get_btc_trend(atr_length, atr_multiplier, target_bearish_date)

print(f"Precio actual de BTC: {current_price}")
print(f"Tendencia actual (semana del {target_bearish_date.strftime('%Y-%m-%d')}): {trend}")
print(f"Nivel de Flip: {flip_level}")