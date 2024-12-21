// Get the API URL from environment variables with proper fallbacks
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'production'
    ? 'https://ice-alert-backend.onrender.com'
    : 'http://localhost:3001'
);

// Ensure URL ends with /api
const normalizedURL = API_BASE_URL.endsWith('/api') 
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

// Log the API configuration
console.log('API Configuration:', {
  rawUrl: API_BASE_URL,
  normalizedUrl: normalizedURL,
  environment: import.meta.env.MODE,
  origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
  timestamp: new Date().toISOString()
});

// Validate the URL format
try {
  new URL(normalizedURL);
} catch (error) {
  console.error('Invalid API URL configuration:', {
    url: normalizedURL,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    environment: import.meta.env.MODE,
    timestamp: new Date().toISOString()
  });
  throw new Error(`Invalid API URL: ${normalizedURL}`);
}

export default normalizedURL;

// Export additional configuration
export const API_CONFIG = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }
};

// Log the complete configuration
console.log('Complete API Configuration:', {
  baseUrl: normalizedURL,
  config: API_CONFIG,
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
}); 