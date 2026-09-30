import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ecommerceportalapi-f2cccjhqgng9fag6.westus3-01.azurewebsites.net/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request - Token may be invalid or expired.');
    }
    return Promise.reject(error);
  }
);

export default API;
