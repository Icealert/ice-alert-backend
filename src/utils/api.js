import axios from 'axios';

// Always use the deployed backend URL
const API_BASE_URL = 'https://ice-alert-backend.onrender.com/api';

const api = {
  // Device endpoints
  getDevices: () => axios.get(`${API_BASE_URL}/devices`),
  
  getDeviceDetails: (deviceId) => 
    axios.get(`${API_BASE_URL}/devices/${deviceId}`),
  
  // Alert settings endpoints
  getAlertSettings: (deviceId) =>
    axios.get(`${API_BASE_URL}/devices/${deviceId}/alerts`),
  
  updateAlertSettings: (deviceId, settings) =>
    axios.put(`${API_BASE_URL}/devices/${deviceId}/alerts`, settings),
  
  // Readings endpoints
  getDeviceReadings: (deviceId, hours = 24) =>
    axios.get(`${API_BASE_URL}/devices/${deviceId}/readings?hours=${hours}`),
  
  // Alert history endpoints
  getAlertHistory: (deviceId, days = 7) =>
    axios.get(`${API_BASE_URL}/devices/${deviceId}/alert-history?days=${days}`),
  
  // Health check
  checkHealth: () => axios.get(`${API_BASE_URL}/health`)
};

export default api; 