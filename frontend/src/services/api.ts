import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Do NOT auto-redirect on 401 here — AuthContext handles token invalidation.
// Only reject so the caller's .catch() fires.
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;
