import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import VMLogo from '../components/VMLogo';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { register, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !phone) {
      setValidationError('Email, Password and Phone number are required.');
      return;
    }
    setLoading(true);
    setValidationError('');

    try {
      const user = await register(email, password, role, phone, username);
      if (user.role === 'SHOP_OWNER') navigate('/shop-dashboard');
      else if (user.role === 'DELIVERY_PARTNER') navigate('/delivery-dashboard');
      else navigate('/');
    } catch (err) {
      // Handled by store error state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkbg-200 px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl shadow-premium border border-slate-200/50 dark:border-slate-800/30">
        
        {/* Header Branding */}
        <div className="text-center">
          <VMLogo className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold tracking-tight">Create Account</h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-500 hover:text-brand-600 underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Error Banners */}
        {(error || validationError) && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 rounded-lg text-center dark:bg-rose-950/20 dark:text-rose-400">
            {validationError || error}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Username (Optional)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superstar"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all text-sm"
              />
            </div>
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
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Select Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all text-sm"
              >
                <option value="CUSTOMER">Customer / Buyer</option>
                <option value="SHOP_OWNER">Shop Owner / Merchant</option>
                <option value="DELIVERY_PARTNER">Delivery Rider</option>
              </select>
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

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 shadow-glass disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
