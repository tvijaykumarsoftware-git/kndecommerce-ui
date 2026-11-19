import axios from 'axios';
import appSettings from '../appsettings.json';

export const API_BASE_URL = appSettings.ApiUrls[appSettings.BackendType];

if (!API_BASE_URL) {
  throw new Error(`Unsupported BackendType "${appSettings.BackendType}". Use "local" or "azure".`);
}

export const API_ORIGIN = new URL(API_BASE_URL).origin;

const API = axios.create({
  baseURL: API_BASE_URL,
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
