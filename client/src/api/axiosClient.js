import axios from 'axios';

const axiosClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, ''),
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.href = '/login';
    }
    
    // Normalize error format so React doesn't crash on objects
    if (error.response?.data?.error) {
      const errData = error.response.data.error;
      if (typeof errData === 'object' && errData !== null) {
        // Backend 500 Global Error format: { error: { code, message, stack } }
        error.response.data.error = errData.message || 'An unexpected error occurred';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
