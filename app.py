from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

# --- Import our new functions! ---
from greengrid_engine import (
    get_current_ward_risk, 
    get_ward_details, 
    get_ward_forecast
)

# Initialize the Flask App
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app) # Allow cross-origin requests

# --- API Endpoint 1: /api/ward-risk/current ---
# (This is from Phase 1, unchanged)
@app.route('/api/ward-risk/current', methods=['GET'])
def api_current_risk():
    """
    API endpoint to get the current vulnerability risk for all wards.
    """
    print("--- API: Request received at /api/ward-risk/current ---")
    try:
        data = get_current_ward_risk()
        print(f"--- API: Successfully processed {len(data)} wards ---")
        return jsonify(data)
    except Exception as e:
        print(f"--- API: Error processing request: {e} ---")
        return jsonify({"error": str(e)}), 500

# --- NEW API Endpoint 2: /api/ward-details/<ward_no> ---
# This uses a <variable> in the URL
@app.route('/api/ward-details/<int:ward_no>', methods=['GET'])
def api_ward_details(ward_no):
    """
    API endpoint to get all historical details for a single ward.
    """
    print(f"--- API: Request received for /api/ward-details/{ward_no} ---")
    try:
        data = get_ward_details(ward_no)
        return jsonify(data)
    except Exception as e:
        print(f"--- API: Error processing request: {e} ---")
        return jsonify({"error": str(e)}), 500

# --- NEW API Endpoint 3: /api/forecast/<ward_no> ---
@app.route('/api/forecast/<int:ward_no>', methods=['GET'])
def api_ward_forecast(ward_no):
    """
    API endpoint to get a 14-day temperature forecast for a single ward.
    """
    print(f"--- API: Request received for /api/forecast/{ward_no} ---")
    try:
        data = get_ward_forecast(ward_no)
        return jsonify(data)
    except Exception as e:
        print(f"--- API: Error processing request: {e} ---")
        return jsonify({"error": str(e)}), 500

# --- Routes to serve HTML pages ---
@app.route('/')
def index():
    """Serve the main index page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (HTML, JS, CSS, etc.)"""
    # Don't serve API routes through this handler
    if filename.startswith('api/'):
        return jsonify({"error": "API endpoint not found"}), 404
    # Only serve files that actually exist
    if os.path.exists(filename) and os.path.isfile(filename):
        return send_from_directory('.', filename)
    return jsonify({"error": "File not found"}), 404

# This makes the server run when you execute `python app.py`
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)