import axios from 'axios';

// Hardcode the API URL to ensure all instances connect to the same backend
const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api; 