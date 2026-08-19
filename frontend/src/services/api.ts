import axios from 'axios';

export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'https://api.antaglomaflorist.id/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});
