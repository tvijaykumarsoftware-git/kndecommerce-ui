import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5107/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const isLoginRequest = config.url?.replace(/^\/+/, '').toLowerCase() === 'auth/login';
  if (token && !isLoginRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default API;
