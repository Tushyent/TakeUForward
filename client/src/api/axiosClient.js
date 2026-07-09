import axios from 'axios';
import toast from 'react-hot-toast';

const axiosClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, ''),
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
    }
    
    // Normalize error format so React doesn't crash on objects.
    // The backend uses both { error: 'string' } and { error: { message: 'string' } }
    if (error.response?.data?.error) {
      const errData = error.response.data.error;
      if (typeof errData === 'object' && errData !== null) {
        error.response.data.error = errData.message || 'An unexpected error occurred';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
