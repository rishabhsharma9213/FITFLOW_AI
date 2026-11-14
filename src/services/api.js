/**
 * FitFlow AI - Axios API Client & Endpoints
 * Connected to Express Backend on http://localhost:5000/api
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('FitFlow API Request Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Fast endpoints (< 300ms) - Never blocked by Gemini
export const getOverviewAnalytics = async () => {
  const response = await api.get('/analytics/overview');
  return response.data;
};

export const getRecommendations = async () => {
  const response = await api.get('/analytics/recommendations');
  return response.data;
};

// Asynchronous AI endpoint (with 8s backend timeout, quota detection & deterministic fallback)
export const getAiInsights = async (force = false) => {
  const response = await api.get('/analytics/ai-insights', {
    params: force ? { force: 'true' } : {},
  });
  return response.data;
};

export const getInventory = async (params = {}) => {
  const response = await api.get('/inventory', { params });
  return response.data;
};

export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
