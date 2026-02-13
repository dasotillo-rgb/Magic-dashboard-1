import requests
import json
import os
from datetime import datetime

# Define la ruta de salida en el directorio de la base de datos
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../database/fear_greed_history.json')

def fetch_and_save_fear_greed_history():
    """
    Fetches the complete history of the Fear & Greed Index from alternative.me
    and saves it to a JSON file.
    """
    print("Fetching Fear & Greed Index history from alternative.me...")
    
    try:
        # Usamos limit=0 para obtener todos los datos disponibles
        response = requests.get("https://api.alternative.me/fng/?limit=0")
        response.raise_for_status()  # Lanza un error si la petición falla
        
        data = response.json()
        
        if 'data' in data and isinstance(data['data'], list):
            # Formateamos los datos para que sean fáciles de usar
            formatted_data = [
                {
                    "date": datetime.fromtimestamp(int(item['timestamp'])).strftime('%Y-%m-%d'),
                    "value": int(item['value'])
                }
                for item in data['data']
            ]
            
            # Guardamos el archivo JSON
            with open(OUTPUT_FILE, 'w') as f:
                json.dump(formatted_data, f, indent=2)
            
            print(f"Successfully saved {len(formatted_data)} records to {OUTPUT_FILE}")
        else:
            print("Error: API response did not contain the expected data structure.")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from API: {e}")
    except (KeyError, ValueError) as e:
        print(f"Error processing API data: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    fetch_and_save_fear_greed_history()
