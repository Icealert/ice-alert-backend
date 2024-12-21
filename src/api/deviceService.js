import axios from 'axios';
import API_BASE_URL, { API_CONFIG } from './config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  ...API_CONFIG
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request:', {
    method: request.method?.toUpperCase(),
    url: request.url,
    baseURL: request.baseURL,
    fullUrl: `${request.baseURL}${request.url}`,
    params: request.params
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
      message: error.message
    });

    let errorMessage = 'An unexpected error occurred';
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || 'Invalid request';
          break;
        case 401:
          errorMessage = 'Unauthorized';
          break;
        case 403:
          errorMessage = 'Access denied';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 500:
          errorMessage = 'Server error';
          break;
        default:
          errorMessage = error.response.data?.message || error.message;
      }
    } else if (error.request) {
      errorMessage = 'Network error';
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
      const response = await api.get('/device_settings', {
        params: {
          select: '*',
          order: 'created_at.desc'
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      throw error;
    }
  },

  // Get device by ID
  async getDevice(deviceId) {
    try {
      console.log('Fetching device:', deviceId);
      const response = await api.get('/device_settings', {
        params: {
          id: `eq.${deviceId}`,
          select: '*'
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch device:', error);
      throw error;
    }
  },

  // Get device by IceAlert ID
  async getDeviceByIceAlertId(icealertId) {
    try {
      console.log('Fetching device by IceAlert ID:', icealertId);
      const response = await api.get('/device_settings', {
        params: {
          icealert_id: `eq.${icealertId}`,
          select: '*'
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch device by IceAlert ID:', error);
      throw error;
    }
  },

  // Get device readings
  async getDeviceReadings(icealertId, hours = 24) {
    try {
      console.log('Fetching readings for device:', icealertId, 'hours:', hours);
      const timeLimit = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const response = await api.get('/device_data', {
        params: {
          icealert_id: `eq.${icealertId}`,
          created_at: `gte.${timeLimit}`,
          select: '*',
          order: 'created_at.desc'
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch device readings:', error);
      throw error;
    }
  },

  // Submit new reading
  async submitReading(reading) {
    try {
      console.log('Submitting new reading:', reading);
      const response = await api.post('/device_data', reading, {
        headers: {
          'Prefer': 'return=minimal'
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to submit reading:', error);
      throw error;
    }
  },

  // Update device settings
  async updateDeviceSettings(deviceId, settings) {
    try {
      console.log('Updating device settings:', deviceId, settings);
      const response = await api.patch('/device_settings', settings, {
        params: {
          id: `eq.${deviceId}`
        },
        headers: {
          'Prefer': 'return=minimal'
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to update device settings:', error);
      throw error;
    }
  }
};

export default deviceService; 