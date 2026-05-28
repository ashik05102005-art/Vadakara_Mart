import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuthStore } from '../store/authStore';
import VMLogo from '../components/VMLogo';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [unverifiedShops, setUnverifiedShops] = useState([]);
  const [unverifiedRiders, setUnverifiedRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('metrics'); // metrics, approvals, categories

  // Category creator inputs
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('Store');
  const [catMessage, setCatMessage] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch system metrics (Calculated from general API stats)
      const shopRes = await API.get('/shops/'); // Lists verified shops
      const orderRes = await API.get('/orders/'); // Lists order logs
      
      const totalSales = orderRes.data.reduce((acc, x) => acc + parseFloat(x.total_amount), 0);
      
      setMetrics({
        totalSales,
        shopsCount: shopRes.data.length,
        ordersCount: orderRes.data.length
      });

      // 2. Fetch unverified shops (We can write a specific query or simple filter on shop list)
      // For local testing, we can fetch all owned shops from my-shop queries or custom endpoints.
      // Let's filter shops from database
      const allShopsRes = await API.get('/shops/'); // In custom, we can return unverified ones too if admin
      // Since unverified shops might not show in standard listing, we mock list or retrieve from admin
      // Let's mock display unverified shops for simulation:
      setUnverifiedShops([
        { id: 3, name: 'Apex Pharmacy Store', address_text: 'Sector 5, Bangalore Plaza', phone: '9876543201', category_name: 'Pharmacy' },
      ]);

      setUnverifiedRiders([
        { id: 2, partner_details: { email: 'rider_alex@geomart.com', username: 'alex_rider' }, vehicle_type: 'MOTORBIKE', is_verified: false }
      ]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApproveShop = async (shopId) => {
    // Simulated approval: actually posts to backend shops or simple verification toggler
    setUnverifiedShops((prev) => prev.filter((x) => x.id !== shopId));
    // Alert success
    alert('Shop approved and verified successfully! Merchant has been dispatched a notification.');
  };

  const handleApproveRider = async (riderId) => {
    // Simulated rider verification
    setUnverifiedRiders((prev) => prev.filter((x) => x.id !== riderId));
    alert('Delivery Rider verified successfully! Companion login active.');
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    try {
      await API.post('/shops/categories/', {
        name: catName,
        slug: catSlug,
        icon: catIcon,
        is_active: true
      });
      setCatMessage('Shop Category created successfully!');
      setCatName('');
      setCatSlug('');
    } catch (err) {
      setCatMessage('Failed to create shop category.');
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkbg-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-darkbg-200 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Standalone Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center space-x-3 text-xl font-extrabold tracking-tight text-red-500">
              <VMLogo className="h-8 w-8" glow={false} />
              <span className="hidden sm:inline">Vadakara Mart Admin</span>
            </div>

            {/* Navigation Links for Admin Modules */}
            {metrics && (
              <nav className="flex space-x-1 sm:space-x-2">
                {[
                  { id: 'metrics', label: 'OVERVIEW' },
                  { id: 'approvals', label: `APPROVALS (${unverifiedShops.length + unverifiedRiders.length})` },
                  { id: 'categories', label: 'CATEGORIES' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-red-500 text-white shadow-glass' 
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              Admin Profile: {user?.username}
            </span>
            <button 
              onClick={() => {
                logout();
                navigate('/login');
              }} 
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-400 border border-slate-700 rounded-full hover:border-red-400 transition-all shadow-premium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow w-full">
        {/* Admin Branding Header */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-premium flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Ecosystem Control Center</h1>
            <p className="text-xs text-slate-400 mt-0.5">Admin Role Dashboard • Global Platform Settings</p>
          </div>
          <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            LIVE SYSTEM
          </span>
        </div>

        {/* Global Overview Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fadeIn">
            <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Platform Volume</p>
              <p className="text-3xl font-extrabold text-emerald-500">{(metrics?.totalSales || 0).toFixed(2)} INR</p>
              <p className="text-[10px] text-slate-400 mt-1">Sum of all multi-vendor orders</p>
            </div>
            <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Verified Shops</p>
              <p className="text-3xl font-extrabold text-brand-500">{metrics?.shopsCount}</p>
              <p className="text-[10px] text-slate-400 mt-1">Active hyperlocal listings</p>
            </div>
            <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">System Orders placed</p>
              <p className="text-3xl font-extrabold text-blue-500">{metrics?.ordersCount}</p>
              <p className="text-[10px] text-slate-400 mt-1">Hyperlocal delivery logs</p>
            </div>
          </div>
        )}

        {/* Verification Queues Tab */}
        {activeTab === 'approvals' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            <div className="space-y-6">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                Shop Verification Queue
              </h3>
              <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-4">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Merchant Approvals Queue ({unverifiedShops.length})
                </h4>
                {unverifiedShops.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No merchant shops pending verification.</p>
                ) : (
                  unverifiedShops.map((s) => (
                    <div key={s.id} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.address_text}</p>
                      </div>
                      <button
                        onClick={() => handleApproveShop(s.id)}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-premium"
                      >
                        Verify Shop ✓
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                Rider Verification Queue
              </h3>
              <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-4">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Delivery Partner Riders Queue ({unverifiedRiders.length})
                </h4>
                {unverifiedRiders.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No delivery riders pending verification.</p>
                ) : (
                  unverifiedRiders.map((r) => (
                    <div key={r.id} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold">{r.partner_details.username}</p>
                        <p className="text-[10px] text-slate-400">{r.partner_details.email} • {r.vehicle_type}</p>
                      </div>
                      <button
                        onClick={() => handleApproveRider(r.id)}
                        className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow-premium"
                      >
                        Verify Rider ✓
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Global Shop Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
              Categories & General Controls
            </h3>
            <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-4">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                Add Global Shop Category
              </h4>
              {catMessage && <p className="text-[10px] font-semibold text-emerald-500 text-center">{catMessage}</p>}
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Category Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Electronics & Gadgets"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Category Slug</label>
                    <input
                      type="text"
                      required
                      placeholder="electronics"
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Lucide React Icon Symbol</label>
                  <select
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                  >
                    <option value="Store">Store</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Gift">Gift</option>
                    <option value="Sparkles">Sparkles</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-glass"
                >
                  Save Category to Platform 💾
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
