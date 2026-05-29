import { create } from 'zustand';
import API from '../utils/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isLoggedIn: !!localStorage.getItem('access_token'),
  role: localStorage.getItem('user_role') || null,
  isAuthenticating: false,
  error: null,

  login: async (email, password) => {
    set({ isAuthenticating: true, error: null });
    try {
      const res = await API.post('/auth/login/', { email, password });
      const { access, refresh } = res.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Fetch user profile info
      const profileRes = await API.get('/auth/profile/');
      const user = profileRes.data;
      
      localStorage.setItem('user_role', user.role);
      
      set({ 
        user, 
        isLoggedIn: true, 
        role: user.role, 
        isAuthenticating: false 
      });
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Invalid email or password.';
      set({ error: errMsg, isAuthenticating: false });
      throw err;
    }
  },

  register: async (email, password, role, phone, username) => {
    set({ isAuthenticating: true, error: null });
    try {
      const res = await API.post('/auth/register/', { 
        email, 
        password, 
        role, 
        phone, 
        username 
      });
      const { access, refresh, user } = res.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_role', user.role);
      
      set({ 
        user, 
        isLoggedIn: true, 
        role: user.role, 
        isAuthenticating: false 
      });
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.email?.[0] || 'Registration failed.';
      set({ error: errMsg, isAuthenticating: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    set({ user: null, isLoggedIn: false, role: null, error: null });
  },

  fetchProfile: async () => {
    if (!get().isLoggedIn) return null;
    try {
      const res = await API.get('/auth/profile/');
      const user = res.data;
      localStorage.setItem('user_role', user.role);
      set({ user, role: user.role });
      return user;
    } catch (err) {
      get().logout();
      return null;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await API.put('/auth/profile/', profileData);
      set({ user: res.data });
      return res.data;
    } catch (err) {
      set({ error: 'Failed to update profile.' });
      throw err;
    }
  }
}));
