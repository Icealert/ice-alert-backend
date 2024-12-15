// Get the API URL from environment variables, fallback to production URL if not set
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ice-alert-backend.onrender.com';

// Log the API URL for debugging
console.log('API Base URL:', API_BASE_URL);

// Validate the URL format
try {
  new URL(API_BASE_URL);
} catch (error) {
  console.error('Invalid API URL:', API_BASE_URL);
  throw new Error(`Invalid API URL: ${API_BASE_URL}`);
}

export default API_BASE_URL;

// Export additional configuration
export const API_CONFIG = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}; 