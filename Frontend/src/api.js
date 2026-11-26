import axios from 'axios';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants';

const BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({ baseURL: BASE_URL });

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single-flight token refresh: retries queued requests once the access
// token has been rotated, and logs the user out if refresh fails.
let isRefreshing = false;
let waiters = [];

function flushQueue(error, token = null) {
  waiters.forEach((cb) => cb(token, error));
  waiters = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);

    if (status === 401 && !original?._retry && refreshToken) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waiters.push((token, refreshErr) => {
            if (refreshErr) reject(refreshErr);
            else {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            }
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });
        const newToken = res.data.access;
        localStorage.setItem(ACCESS_TOKEN, newToken);
        flushQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;