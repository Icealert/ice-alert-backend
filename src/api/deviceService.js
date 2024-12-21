import axios from 'axios';
import API_BASE_URL, { API_CONFIG } from './config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
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
}, error => {
  console.error('Request Error:', error);
  return Promise.reject(error);
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
      stack: error.stack,
      headers: error.config?.headers,
      withCredentials: error.config?.withCredentials
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
          errorMessage = `Resource not found: ${error.config?.url}`;
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
      console.error('CORS Error Details:', {
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

// Export the service
const deviceService = {
  // Get all devices
  async getDevices() {
    try {
      console.log('Fetching all devices');
      const response = await api.get('/devices');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      throw error;
    }
  },

  // Get device by ID
  async getDevice(deviceId) {
    try {
      console.log('Fetching device:', deviceId);
      const response = await api.get(`/devices/${encodeURIComponent(deviceId)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch device:', error);
      throw error;
    }
  },

  // Get device by IceAlert ID
  async getDeviceByIceAlertId(icealertId) {
    try {
      console.log('Fetching device by IceAlert ID:', icealertId);
      const response = await api.get(`/devices/by-icealert/${encodeURIComponent(icealertId)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch device by IceAlert ID:', error);
      throw error;
    }
  },

  // Get device readings
  async getDeviceReadings(icealertId, hours = 24) {
    try {
      console.log('Fetching readings for device:', icealertId, 'hours:', hours);
      const response = await api.get(`/devices/by-icealert/${encodeURIComponent(icealertId)}/readings`, {
        params: { hours }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch device readings:', error);
      throw error;
    }
  },

  // Submit new reading
  async submitReading(reading) {
    try {
      console.log('Submitting new reading:', reading);
      const response = await api.post('/readings', reading);
      return response.data;
    } catch (error) {
      console.error('Failed to submit reading:', error);
      throw error;
    }
  },

  // Get alert settings
  async getAlertSettings(icealertId) {
    try {
      console.log('Fetching alert settings for device:', icealertId);
      const response = await api.get(`/devices/${encodeURIComponent(icealertId)}/alerts`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alert settings:', error);
      throw error;
    }
  },

  // Update alert settings
  async updateAlertSettings(icealertId, settings) {
    try {
      console.log('Updating alert settings for device:', icealertId, settings);
      const response = await api.put(`/devices/by-icealert/${encodeURIComponent(icealertId)}/alerts`, settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update alert settings:', error);
      throw error;
    }
  },

  // Get alert history
  async getAlertHistory(deviceId, days = 7) {
    try {
      console.log('Fetching alert history for device:', deviceId, 'days:', days);
      const response = await api.get(`/devices/${encodeURIComponent(deviceId)}/alert-history`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alert history:', error);
      throw error;
    }
  },

  // Test database connection
  async testConnection() {
    try {
      console.log('Testing database connection');
      const response = await api.get('/test-db');
      return response.data;
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  },

  // Check database schema
  async checkSchema() {
    try {
      console.log('Checking database schema');
      const response = await api.get('/debug/schema');
      return response.data;
    } catch (error) {
      console.error('Schema check failed:', error);
      throw error;
    }
  }
};

export default deviceService; 