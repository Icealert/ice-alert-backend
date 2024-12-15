import axios from 'axios';
import API_BASE_URL, { API_CONFIG } from './config';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  ...API_CONFIG
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request:', {
    method: request.method?.toUpperCase(),
    url: request.url,
    baseURL: request.baseURL,
    headers: request.headers,
    data: request.data
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
      data: response.data
    });
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
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);

export const deviceService = {
  // Fetch device details
  async getDevice(deviceId) {
    try {
      console.log('Fetching device:', deviceId);
      const response = await api.get(`/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch device:', error);
      throw error;
    }
  },

  // Fetch device readings
  async getReadings(deviceId, hours = 24) {
    try {
      console.log('Fetching readings for device:', deviceId, 'hours:', hours);
      const response = await api.get(`/devices/${deviceId}/readings?hours=${hours}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch readings:', error);
      throw error;
    }
  },

  // Update alert settings
  async updateAlertSettings(deviceId, settings) {
    try {
      console.log('Updating alert settings for device:', deviceId, settings);
      
      // Validate settings object
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings object');
      }

      // Ensure required fields exist
      const requiredFields = ['enabled', 'conditions'];
      for (const field of requiredFields) {
        if (!(field in settings)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Make API request
      const response = await api.put(`/devices/${deviceId}/alerts`, settings);
      
      // Validate response
      if (!response.data) {
        throw new Error('No data received from server');
      }

      console.log('Alert settings updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update alert settings:', error);
      throw error;
    }
  },

  // Get alert settings
  async getAlertSettings(deviceId) {
    try {
      console.log('Fetching alert settings for device:', deviceId);
      const response = await api.get(`/devices/${deviceId}/alerts`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alert settings:', error);
      throw error;
    }
  },

  // Get alert history
  async getAlertHistory(deviceId, days = 7) {
    try {
      console.log('Fetching alert history for device:', deviceId, 'days:', days);
      const response = await api.get(`/devices/${deviceId}/alert-history?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alert history:', error);
      throw error;
    }
  }
};

export default deviceService; 