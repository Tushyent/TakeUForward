import axios from 'axios';

const isDeployed = window.location.hostname !== 'localhost';
const rawUrl = import.meta.env.VITE_API_URL;
const baseURL = (
  // In production, force proxied path instead of a hardcoded Render URL
  isDeployed && rawUrl && rawUrl.includes('.onrender.com')
    ? '/api'
    : (rawUrl || '/api')
).replace(/\/+$/, '');

const axiosClient = axios.create({ baseURL, withCredentials: true });

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prevent infinite loop if we are already on the login page
    if (error.response && error.response.status === 401) {
      const publicAuthPaths = ['/login', '/pending-approval', '/alumni-invite'];
      const isPublicAuthPath = publicAuthPaths.some(path => window.location.pathname.startsWith(path));

      if (!isPublicAuthPath) {
        window.location.href = '/login';
      }
    }
    
    // Ensure error is always a string so React doesn't crash on objects.
    // Backend standard format: { error: { message: 'string' } }
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
