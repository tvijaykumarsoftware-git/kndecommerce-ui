import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ecommerceapi-cicd-e4crb6e4gkgnf3a9.westus3-01.azurewebsites.net/api',
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
