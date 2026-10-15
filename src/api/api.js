import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ecommerceapi-cicd-e4crb6e4gkgnf3a9.westus3-01.azurewebsites.net/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default API;
