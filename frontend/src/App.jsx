import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useLocationStore } from './store/locationStore';
import VMLogo from './components/VMLogo';

// Page Imports
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ShopDetail from './pages/ShopDetail';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import ShopDashboard from './pages/ShopDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Custom Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, role, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isLoggedIn) {
        await fetchProfile();
      }
      setLoading(false);
    };
    initAuth();
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkbg-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect unauthorized roles to their respective dashboards
    if (role === 'SHOP_OWNER') return <Navigate to="/shop-dashboard" replace />;
    if (role === 'DELIVERY_PARTNER') return <Navigate to="/delivery-dashboard" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Global Layout Shell Header with location selector & profile dropdown
const ShellLayout = ({ children }) => {
  const { user, logout, role } = useAuthStore();
  const { address, gpsAddress, detectLocation, isDetecting } = useLocationStore();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('dark_mode') === 'true');
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('dark_mode', darkMode);
  }, [darkMode]);

  const getHomeLink = () => {
    if (!user) return '/login';
    if (role === 'SHOP_OWNER') return '/shop-dashboard';
    if (role === 'DELIVERY_PARTNER') return '/delivery-dashboard';
    if (role === 'ADMIN') return '/admin-dashboard';
    return '/';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-darkbg-200 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-darkbg-100/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4 lg:space-x-8">
            {/* Logo */}
            <Link to={getHomeLink()} className="flex items-center space-x-2.5 sm:space-x-3 text-lg sm:text-2xl font-bold font-sans tracking-tight text-brand-500">
              <VMLogo className="h-7 w-7 sm:h-9 sm:w-9" />
              <span className="hidden sm:inline">Vadakara Mart</span>
              <span className="sm:hidden">VM</span>
            </Link>

            {/* Hyperlocal Geolocation Banner (Tablet & Desktop) */}
            {role === 'CUSTOMER' && (
              <button 
                onClick={detectLocation}
                disabled={isDetecting}
                className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-darkbg-200 hover:border-brand-300 dark:hover:border-brand-500 transition-all text-xs font-semibold max-w-[160px] lg:max-w-xs overflow-hidden text-ellipsis whitespace-nowrap shadow-sm"
                title="Detect my current location"
              >
                <span className="text-brand-500 text-sm">🎯</span>
                <span className="text-slate-600 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">
                  {isDetecting ? 'Locating...' : `My Location: ${gpsAddress}`}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 max-w-[80px] sm:max-w-none truncate">
                  {role.replace('_', ' ')}
                </span>
                <span className="hidden md:inline text-sm font-medium">{user.username}</span>
                
                {/* Redirect based on role */}
                {role !== 'CUSTOMER' && (
                  <button 
                    onClick={() => {
                      if (role === 'SHOP_OWNER') navigate('/shop-dashboard');
                      if (role === 'DELIVERY_PARTNER') navigate('/delivery-dashboard');
                      if (role === 'ADMIN') navigate('/admin-dashboard');
                    }}
                    className="text-xs text-brand-500 font-semibold hover:underline"
                  >
                    Dashboard
                  </button>
                )}
                
                <button 
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }} 
                  className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-500 hover:text-rose-500 border border-slate-200 dark:border-slate-800 rounded-full hover:border-rose-200 transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-1.5 sm:space-x-3">
                <Link to="/login" className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-full shadow-glass transition-all">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Location Banner (Sub-header) */}
      {role === 'CUSTOMER' && (
        <div className="flex md:hidden bg-white/95 dark:bg-darkbg-100/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-2 sticky top-16 z-30 transition-all animate-fade-in w-full items-center justify-between">
          <button 
            onClick={detectLocation}
            disabled={isDetecting}
            className="flex items-center space-x-2 px-3 py-1.5 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-darkbg-200 hover:border-brand-300 dark:hover:border-brand-500 transition-all text-[11px] font-bold max-w-full overflow-hidden text-ellipsis whitespace-nowrap shadow-inner"
            title="Detect my current location"
          >
            <span className="text-brand-500 text-xs">🎯</span>
            <span className="text-slate-600 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap">
              {isDetecting ? 'Locating...' : `My Location: ${gpsAddress}`}
            </span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Premium Micro-Footer */}
      <footer className="bg-white dark:bg-darkbg-100 border-t border-slate-100 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-600">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Vadakara Mart Hyperlocal Multi-Vendor Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer hyper-local shopping routes */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <ShellLayout>
              <Home />
            </ShellLayout>
          </ProtectedRoute>
        } />
        <Route path="/shops/:id" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <ShellLayout>
              <ShopDetail />
            </ShellLayout>
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <ShellLayout>
              <Checkout />
            </ShellLayout>
          </ProtectedRoute>
        } />
        <Route path="/orders/:id/track" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <ShellLayout>
              <OrderTracking />
            </ShellLayout>
          </ProtectedRoute>
        } />

        {/* Shop Owner Dashboards */}
        <Route path="/shop-dashboard" element={
          <ProtectedRoute allowedRoles={['SHOP_OWNER']}>
            <ShopDashboard />
          </ProtectedRoute>
        } />

        {/* Delivery Partner Companion */}
        <Route path="/delivery-dashboard" element={
          <ProtectedRoute allowedRoles={['DELIVERY_PARTNER']}>
            <DeliveryDashboard />
          </ProtectedRoute>
        } />

        {/* Admin Dashboard Control */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
