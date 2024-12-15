import axios from 'axios';
import API_BASE_URL from './config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request:', {
    method: request.method?.toUpperCase(),
    url: request.url,
    baseURL: request.baseURL,
    headers: request.headers
  });
  return request;
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
    return Promise.reject(error);
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
      throw new Error('Failed to fetch device data');
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
      throw new Error('Failed to fetch device readings');
    }
  },

  // Update alert settings
  async updateAlertSettings(deviceId, settings) {
    try {
      console.log('Updating alert settings for device:', deviceId, settings);
      const response = await api.put(`/devices/${deviceId}/alerts`, settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update alert settings:', error);
      throw new Error('Failed to update alert settings');
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
      throw new Error('Failed to fetch alert settings');
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
      throw new Error('Failed to fetch alert history');
    }
  }
};

export default deviceService; 