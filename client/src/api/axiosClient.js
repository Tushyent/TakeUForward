import axios from 'axios';
import toast from 'react-hot-toast';

const axiosClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, ''),
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prevent infinite loop if we are already on the login page
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/alumni-invite') {
        window.location.href = '/login';
      }
    } else if (error.response) {
      // Show toast for non-401 errors
      const errorMsg = error.response.data?.error?.message || error.response.data?.error || 'An unexpected error occurred';
      if (typeof errorMsg === 'string') {
        toast.error(errorMsg);
      }
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
