import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://supermarket-backend-g0t0.onrender.com';

const api = axios.create({
  baseURL: API_URL + '/api',
  timeout: 15000,
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

export default api;
