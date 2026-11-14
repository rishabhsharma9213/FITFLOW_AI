/**
 * FitFlow AI - Axios API Client
 * Configured for backend communication in subsequent phases.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standard error logging
    console.error('FitFlow API Request Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
