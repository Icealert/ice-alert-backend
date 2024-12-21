// Get the API URL from environment variables
const API_BASE_URL = '/api';

// Log the API configuration
console.log('API Configuration:', {
  baseUrl: API_BASE_URL,
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
});

export default API_BASE_URL;

// Export additional configuration
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Log the complete configuration
console.log('Complete API Configuration:', {
  baseUrl: API_BASE_URL,
  config: API_CONFIG,
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
}); 