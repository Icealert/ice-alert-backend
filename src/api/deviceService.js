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
      data: response.data,
      headers: response.headers
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
      stack: error.stack,
      headers: error.config?.headers,
      withCredentials: error.config?.withCredentials
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
      // Log additional CORS-related information
      console.error('CORS Error Details:', {
        origin: window.location.origin,
        targetUrl: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
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
      console.log('Fetching device:', {
        deviceId,
        timestamp: new Date().toISOString(),
        origin: window.location.origin
      });
      
      const response = await api.get(`/devices/${encodeURIComponent(deviceId)}`);
      console.log('Device fetch successful:', {
        deviceId,
        status: response.status,
        hasData: !!response.data,
        dataType: response.data ? typeof response.data : null,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch device:', {
        deviceId,
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack
        },
        request: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          baseURL: error.config?.baseURL
        },
        timestamp: new Date().toISOString()
      });
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
      console.log('Updating alert settings:', {
        deviceId,
        settings,
        timestamp: new Date().toISOString()
      });
      
      // Validate settings object
      if (!settings || typeof settings !== 'object') {
        const error = new Error('Invalid settings object');
        console.error('Settings validation failed:', {
          deviceId,
          error: error.message,
          receivedType: typeof settings,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      // Ensure required fields exist
      const requiredFields = ['enabled', 'conditions'];
      for (const field of requiredFields) {
        if (!(field in settings)) {
          const error = new Error(`Missing required field: ${field}`);
          console.error('Settings validation failed:', {
            deviceId,
            error: error.message,
            missingField: field,
            receivedFields: Object.keys(settings),
            timestamp: new Date().toISOString()
          });
          throw error;
        }
      }

      // Make API request with explicit CORS headers
      const response = await api.put(`/devices/${encodeURIComponent(deviceId)}/alerts`, settings, {
        headers: {
          ...API_CONFIG.headers,
          'Origin': window.location.origin
        }
      });
      
      // Validate response
      if (!response.data) {
        const error = new Error('No data received from server');
        console.error('Settings update failed:', {
          deviceId,
          error: error.message,
          response: {
            status: response.status,
            headers: response.headers
          },
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      console.log('Alert settings updated successfully:', {
        deviceId,
        status: response.status,
        data: response.data,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to update alert settings:', {
        deviceId,
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack
        },
        request: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          baseURL: error.config?.baseURL
        },
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  // Get alert settings
  async getAlertSettings(deviceId) {
    try {
      console.log('Fetching alert settings for device:', deviceId);
      const response = await api.get(`/devices/${encodeURIComponent(deviceId)}/alerts`);
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
      const response = await api.get(`/devices/${encodeURIComponent(deviceId)}/alert-history?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alert history:', error);
      throw error;
    }
  }
};

export default deviceService; 