/**
 * FitFlow AI - Axios API Client & Endpoints
 *
 * Local dev  : uses VITE_API_URL from .env  (e.g. http://localhost:5000/api)
 * Vercel prod: uses relative /api path — Vercel rewrites /api/* → server service
 */

import axios from 'axios';

// In production on Vercel, VITE_API_URL is NOT set, so we fall back to '/api'
// (same domain, routed to the Express service via vercel.json rewrites).
// In local dev, set VITE_API_URL=http://localhost:5000/api in your .env file.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
