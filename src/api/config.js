// Get the API URL from environment variables, fallback to production URL if not set
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ice-alert-backend.onrender.com';

console.log('API Base URL:', API_BASE_URL); // For debugging

export default API_BASE_URL; 