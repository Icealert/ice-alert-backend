import axios from 'axios';
import API_BASE_URL from '../api/config';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request:', request.method.toUpperCase(), request.url);
  console.log('Request Headers:', request.headers);
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Device endpoints
  getDevices: () => api.get('/devices'),
  getDeviceDetails: (deviceId) => api.get(`/devices/${deviceId}`),
  
  // Alert settings endpoints
  getAlertSettings: (deviceId) => api.get(`/devices/${deviceId}/alerts`),
  updateAlertSettings: (deviceId, settings) => api.put(`/devices/${deviceId}/alerts`, settings),
  
  // Readings endpoints
  getDeviceReadings: (deviceId, hours = 24) => api.get(`/devices/${deviceId}/readings?hours=${hours}`),
  
  // Alert history endpoints
  getAlertHistory: (deviceId, days = 7) => api.get(`/devices/${deviceId}/alert-history?days=${days}`),
  
  // Health check
  checkHealth: () => api.get('/health')
};

export default endpoints; 