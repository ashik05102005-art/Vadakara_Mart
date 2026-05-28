import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import VMLogo from '../components/VMLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const { login, error, isLoggedIn, role } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // If already logged in, redirect straight to the correct dashboard
    if (isLoggedIn && role) {
      if (role === 'SHOP_OWNER') navigate('/shop-dashboard');
      else if (role === 'DELIVERY_PARTNER') navigate('/delivery-dashboard');
      else if (role === 'ADMIN') navigate('/admin-dashboard');
      else navigate('/');
    }
  }, [isLoggedIn, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setValidationError('');
    
    try {
      const user = await login(email, password);
      // Success redirection
      if (user.role === 'SHOP_OWNER') navigate('/shop-dashboard');
      else if (user.role === 'DELIVERY_PARTNER') navigate('/delivery-dashboard');
      else if (user.role === 'ADMIN') navigate('/admin-dashboard');
      else navigate('/');
    } catch (err) {
      // Handled by store error state
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fill credentials for easy testing!
  const fillDemo = (demoType) => {
    setPassword('password123');
    if (demoType === 'CUSTOMER') setEmail('user@geomart.com');
    else if (demoType === 'SHOP') setEmail('shop1@geomart.com');
    else if (demoType === 'RIDER') setEmail('delivery@geomart.com');
    else if (demoType === 'ADMIN') setEmail('admin@geomart.com');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkbg-200 px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl shadow-premium border border-slate-200/50 dark:border-slate-800/30">
        
        {/* Header Branding */}
        <div className="text-center">
          <VMLogo className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-500 hover:text-brand-600 underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Expired Token Notice */}
        {searchParams.get('expired') && (
          <div className="p-3 text-xs text-amber-600 bg-amber-50 rounded-lg text-center dark:bg-amber-950/20 dark:text-amber-400">
            Your session has expired. Please sign in again.
          </div>
        )}

        {/* Error Banners */}
        {(error || validationError) && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 rounded-lg text-center dark:bg-rose-950/20 dark:text-rose-400">
            {validationError || error}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 shadow-glass disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Demo Fast Fills (Wow factor for testing!) */}
        <div className="border-t border-slate-200/50 dark:border-slate-800/30 pt-6">
          <p className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-3">
            Fast Demo Login for Testing
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => fillDemo('CUSTOMER')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-darkbg-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Customer
            </button>
            <button 
              onClick={() => fillDemo('SHOP')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-darkbg-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Shop Owner
            </button>
            <button 
              onClick={() => fillDemo('RIDER')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-darkbg-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Delivery Rider
            </button>
            <button 
              onClick={() => fillDemo('ADMIN')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-darkbg-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Platform Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
