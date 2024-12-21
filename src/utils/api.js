import axios from 'axios';
import API_BASE_URL from '../api/config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request:', {
    method: request.method?.toUpperCase(),
    url: request.url,
    baseURL: request.baseURL,
    fullUrl: `${request.baseURL}${request.url}`,
    headers: request.headers,
    data: request.data,
    withCredentials: request.withCredentials
  });
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      url: response.config.url,
      fullUrl: `${response.config.baseURL}${response.config.url}`,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
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
          errorMessage = error.response.data?.error || 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission.';
          break;
        case 404:
          errorMessage = error.response.data?.error || 'Resource not found.';
          break;
        case 500:
          errorMessage = error.response.data?.error || 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.response.data?.error || error.message;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
      // Log additional CORS-related information
      console.error('Network Error Details:', {
        origin: window.location.origin,
        targetUrl: error.config?.url,
        fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        method: error.config?.method,
        headers: error.config?.headers
      });
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    return Promise.reject(enhancedError);
  }
);

// API endpoints
export const endpoints = {
  // Device endpoints
  getDevices: () => api.get('/devices'),
  getDeviceDetails: (deviceId) => api.get(`/devices/${deviceId}`),
  getDeviceByIceAlertId: (icealertId) => api.get(`/devices/by-icealert/${icealertId}`),
  
  // Alert settings endpoints
  getAlertSettings: (deviceId) => api.get(`/devices/${deviceId}/alerts`),
  updateAlertSettings: (deviceId, settings) => api.put(`/devices/${deviceId}/alerts`, settings),
  
  // Readings endpoints
  getDeviceReadings: (deviceId, hours = 24) => api.get(`/devices/${deviceId}/readings`, { params: { hours } }),
  submitReading: (reading) => api.post('/readings', reading),
  
  // Alert history endpoints
  getAlertHistory: (deviceId, days = 7) => api.get(`/devices/${deviceId}/alert-history`, { params: { days } }),
  
  // Health check
  checkHealth: () => api.get('/health'),
  
  // Debug endpoints
  testDatabase: () => api.get('/test-db'),
  checkSchema: () => api.get('/debug/schema')
};

export default endpoints; 