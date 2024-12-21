from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

devices = {}
analytics_data = {}

@app.route('/devices', methods=['GET'])
def get_devices():
    return jsonify(list(devices.values()))

@app.route('/devices/<device_id>', methods=['GET'])
def get_device(device_id):
    if device_id not in devices:
        return jsonify({"error": "Device not found"}), 404
    return jsonify({"device": devices[device_id], "analytics": analytics_data.get(device_id, [])})

@app.route('/devices/<device_id>/preferences', methods=['POST'])
def set_preferences(device_id):
    preferences = request.json
    # Save preferences logic here
    return jsonify({"message": "Preferences saved successfully"}), 200

@app.route('/data', methods=['POST'])
def receive_data():
    data = request.json
    device_id = data['device_id']
    devices[device_id] = {
        "id": device_id,
        "name": data.get('name', 'Unknown Device'),
        "status": "Good" if data['temperature'] < 50 else "Bad",
        "temperature": data['temperature'],
        "humidity": data['humidity'],
        "flow_rate": data['flow_rate'],
        "last_water_flow": data['timestamp']
    }
    if device_id not in analytics_data:
        analytics_data[device_id] = []
    analytics_data[device_id].append(data)
    return jsonify({"message": "Data received successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True) 