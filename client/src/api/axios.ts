import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if a token exists (login failures have no token)
    // Must pass through to the component to display an error message
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
