import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from prophet import Prophet
import logging

# Suppress informational messages from Prophet
logging.getLogger('cmdstanpy').setLevel(logging.WARNING)

DATA_FILE = 'weather_data_with_population.csv'

def load_and_process_data():
    """
    Loads, cleans, and engineers features from the CSV file.
    """
    try:
        df = pd.read_csv(DATA_FILE)
    except FileNotFoundError:
        print(f"ERROR: Data file not found at {DATA_FILE}")
        return pd.DataFrame()

    # --- 1. Data Cleaning ---
    df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y')
    
    numeric_cols = ['temperature_max', 'humidity_max', 'precipitation_sum', 'Population', 'ward_no']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Cast ward_no to integer for safe matching
    df['ward_no'] = df['ward_no'].astype(int)

    df.dropna(subset=numeric_cols, inplace=True)

    # --- 2. Feature Engineering (Your Risk Index) ---
    df['Heat_Risk_Index'] = (
        (df['temperature_max'] * 0.5) +
        (df['humidity_max'] * 0.3) -
        (df['precipitation_sum'] * 0.2)
    )

    # --- 3. Population Exposure Model ---
    df['Population_At_Risk'] = df['Heat_Risk_Index'] * df['Population']

    # --- 4. Vulnerability Ranking (Scaling) ---
    # We create the scaler here but will apply it only to the 'current' data
    # to avoid scaling historical data unnecessarily in this function.
    if not df.empty and 'Population_At_Risk' in df.columns:
        scaler = MinMaxScaler(feature_range=(0, 100))
        # Fit on the entire column
        df['Vulnerability_Score'] = scaler.fit_transform(
            df[['Population_At_Risk']]
        )
    else:
        df['Vulnerability_Score'] = None
    
    return df

def get_current_ward_risk():
    """
    Processes all data and returns the risk data for the *most recent date*.
    """
    df = load_and_process_data()
    if df.empty:
        return []
        
    latest_date = df['date'].max()
    print(f"--- Engine: Fetching data for latest date: {latest_date} ---")
    
    df_current = df[df['date'] == latest_date].copy()
    
    output_columns = [
        'ward_no', 'ward_name', 'latitude', 'longitude',
        'Population', 'temperature_max', 'humidity_max',
        'Heat_Risk_Index', 'Population_At_Risk', 'Vulnerability_Score'
    ]
    
    # Ensure all required columns exist before trying to access them
    final_cols = [col for col in output_columns if col in df_current.columns]
    df_output = df_current[final_cols].round(2)
    
    return df_output.to_dict(orient='records')

# --- NEW FUNCTION 1: Get Historical Data ---
def get_ward_details(ward_no):
    """
    Gets all historical data for a single specified ward.
    """
    df = load_and_process_data()
    
    # Filter for the specific ward
    df_ward = df[df['ward_no'] == ward_no].copy()
    
    if df_ward.empty:
        return {"error": f"No data found for ward_no {ward_no}"}
        
    # Convert date to string format for JSON
    df_ward['date'] = df_ward['date'].dt.strftime('%Y-%m-%d')
    
    # Return all data for this ward
    return df_ward.to_dict(orient='records')

# --- NEW FUNCTION 2: Get AI Forecast ---
def get_ward_forecast(ward_no):
    """
    Trains a model and returns a 14-day forecast for a specific ward.
    """
    df = load_and_process_data()
    
    df_ward = df[df['ward_no'] == ward_no].copy()
    
    if df_ward.empty or len(df_ward) < 10: # Need some data to train
        return {"error": f"Not enough data to create forecast for ward {ward_no}"}

    # --- 1. Prepare data for Prophet ---
    # Prophet requires columns to be named 'ds' (date) and 'y' (value)
    df_prophet = df_ward[['date', 'temperature_max']].rename(
        columns={'date': 'ds', 'temperature_max': 'y'}
    )
    
    # --- 2. Train the model ---
    m = Prophet(
        daily_seasonality=False, 
        weekly_seasonality=True, 
        yearly_seasonality=False
    ).add_seasonality(name='monthly', period=30.5, fourier_order=5)
    
    m.fit(df_prophet)
    
    # --- 3. Create future dates to predict ---
    # We will forecast for the next 14 days
    future = m.make_future_dataframe(periods=14)
    
    # --- 4. Get predictions ---
    forecast = m.predict(future)
    
    # --- 5. Format the output ---
    # We only want to return the *future* predictions
    
    # Get the last date from our *actual* data
    last_actual_date = df_prophet['ds'].max()
    
    # Filter the forecast to only include dates *after* our last actual date
    df_future_forecast = forecast[forecast['ds'] > last_actual_date].copy()
    
    # Select only the columns we need for our chart
    output_cols = ['ds', 'yhat', 'yhat_lower', 'yhat_upper']
    df_output = df_future_forecast[output_cols]
    
    # 'yhat' is the predicted temperature
    # 'yhat_lower'/'upper' are the confidence intervals
    df_output = df_output.round(2)
    
    # Convert date to string for JSON
    df_output['ds'] = df_output['ds'].dt.strftime('%Y-%m-%d')
    
    print(f"--- Engine: Successfully created 14-day forecast for ward {ward_no} ---")
    
    return df_output.to_dict(orient='records')


# This is so we can test the file by running it directly
if __name__ == "__main__":
    print("Testing GreenGrid Engine...")
    
    # Test 1: Get current risk (from Phase 1)
    current_risk = get_current_ward_risk()
    print(f"\nFound {len(current_risk)} wards for the latest date.")
    if current_risk:
        print(f"Sample current risk: {current_risk[0]['ward_name']}, Score: {current_risk[0]['Vulnerability_Score']}")

    # Test 2: Get details for one ward (New)
    test_ward_no = 1
    ward_details = get_ward_details(test_ward_no)
    if 'error' not in ward_details:
        print(f"\nFound {len(ward_details)} historical records for ward {test_ward_no}.")

    # Test 3: Get forecast for one ward (New)
    ward_forecast = get_ward_forecast(test_ward_no)
    if 'error' not in ward_forecast:
        print(f"\nCreated {len(ward_forecast)}-day forecast for ward {test_ward_no}.")
        print(f"Sample forecast: {ward_forecast[0]}")