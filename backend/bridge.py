import json
import re
import os

LOG_FILE = os.path.join(os.path.dirname(__file__), '../database/calibration_log.txt')
STATUS_FILE = os.path.join(os.path.dirname(__file__), '../database/status.json')

def create_data_bridge():
    """
    Reads the calibration log, finds the latest best parameters,
    and writes them to a JSON status file.
    """
    try:
        with open(LOG_FILE, 'r') as f:
            log_content = f.read()
    except FileNotFoundError:
        print(f"Error: Log file not found at {LOG_FILE}")
        status = {"status": "error", "message": "Log file not found."}
        with open(STATUS_FILE, 'w') as f:
            json.dump(status, f, indent=2)
        return

    # Find all occurrences of the "best parameters" line
    matches = re.findall(
        r"\*\*\* New best parameters found! Error: ([\d\.]+), Params: ({.*?}) \*\*\*",
        log_content
    )

    if not matches:
        print("No best parameters found in the log.")
        status = {"status": "calibrating", "message": "Calibration in progress, no optimal parameters found yet."}
    else:
        # Get the last match found in the log
        latest_match = matches[-1]
        error_value = float(latest_match[0])
        # The params string is a dict literal, so we can use eval safely here
        # as we control the input format.
        params_dict_str = latest_match[1]
        if 'nan' in params_dict_str.lower():
            print(f"Warning: Found 'nan' in best parameters line. Reporting as calibration error.")
            status = {"status": "error_calibracion", "message": "Calibration produced invalid (NaN) results."}
        else:
            params_dict = eval(params_dict_str)
            print(f"Latest parameters found: {params_dict} with error {error_value}")
            status = {
                "status": "calibrated",
                "last_updated": os.path.getmtime(LOG_FILE),
                "parameters": params_dict,
                "error_metric": error_value
            }
    
    # Write the final status to the JSON file
    try:
        with open(STATUS_FILE, 'w') as f:
            json.dump(status, f, indent=2)
        print(f"Successfully wrote status to {STATUS_FILE}")
    except Exception as e:
        print(f"Error writing status file: {e}")


if __name__ == "__main__":
    create_data_bridge()
