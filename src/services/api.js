/**
 * FitFlow AI - Axios API Client & Endpoints
 *
 * Local dev  : uses http://localhost:5000/api (or VITE_API_URL from local .env)
 * Vercel prod: uses relative '/api' path (routed to Express service via vercel.json)
 *              or a remote production VITE_API_URL if explicitly configured.
 *              Never allows 'localhost' or '127.0.0.1' when accessed from a production domain.
 */

import axios from 'axios';

const isBrowserLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const resolveApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();

  // Production / non-localhost browser: NEVER allow requests to go to localhost
  if (!isBrowserLocalhost) {
    if (
      envUrl &&
      !envUrl.includes('localhost') &&
      !envUrl.includes('127.0.0.1')
    ) {
      return envUrl.replace(/\/+$/, '');
    }
    return '/api';
  }

  // Local development on localhost
  return envUrl || 'http://localhost:5000/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage = error.response?.data?.message;
    if (serverMessage) {
      error.message = serverMessage;
    }
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
