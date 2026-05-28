import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject simplejwt Access Token if logged in
API.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem('access_token');
    if (access) {
      config.headers['Authorization'] = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Auto refresh access token on 401 Unauthorized errors
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loop if token refresh itself fails
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login/')) {
      originalRequest._retry = true;
      
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post('http://localhost:8000/api/auth/token/refresh/', { refresh });
          const newAccess = res.data.access;
          const newRefresh = res.data.refresh;
          
          localStorage.setItem('access_token', newAccess);
          if (newRefresh) {
            localStorage.setItem('refresh_token', newRefresh);
          }
          
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          return API(originalRequest);
        } catch (refreshError) {
          // If refresh token has expired or is invalid, clear tokens and logout user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login?expired=true';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;
