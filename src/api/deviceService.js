import axios from 'axios';
import API_BASE_URL from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const deviceService = {
  // Fetch device details
  async getDevice(deviceId) {
    try {
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
      const response = await api.get(`/devices/${deviceId}/readings?hours=${hours}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch readings:', error);
      throw new Error('Failed to fetch readings');
    }
  },

  // Fetch alert settings
  async getAlertSettings(deviceId) {
    try {
      const response = await api.get(`/devices/${deviceId}/alerts`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alert settings:', error);
      throw new Error('Failed to fetch alert settings');
    }
  },

  // Update alert settings
  async updateAlertSettings(deviceId, settings) {
    try {
      const response = await api.put(`/devices/${deviceId}/alerts`, settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update alert settings:', error);
      throw new Error('Failed to save settings. Please try again.');
    }
  }
};

export default deviceService; 