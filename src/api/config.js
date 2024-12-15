// Get the API URL from environment variables, fallback to production URL if not set
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ice-alert-backend.onrender.com';

// Log the API configuration
console.log('API Configuration:', {
  baseUrl: API_BASE_URL,
  environment: import.meta.env.MODE,
  origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
  timestamp: new Date().toISOString()
});

// Validate the URL format
try {
  new URL(API_BASE_URL);
} catch (error) {
  console.error('Invalid API URL configuration:', {
    url: API_BASE_URL,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    environment: import.meta.env.MODE,
    timestamp: new Date().toISOString()
  });
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

// Log the complete configuration
console.log('Complete API Configuration:', {
  baseUrl: API_BASE_URL,
  config: API_CONFIG,
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
}); 