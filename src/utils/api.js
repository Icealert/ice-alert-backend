import axios from 'axios';
import API_BASE_URL from '../api/config';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
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
      message: error.message,
      stack: error.stack
    });

    // Enhance error message based on status code
    let errorMessage = 'An unexpected error occurred';
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.response.data?.error || error.message;
      }
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
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