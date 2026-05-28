import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuthStore } from '../store/authStore';
import VMLogo from '../components/VMLogo';

export default function ShopDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('orders'); // orders, products, analytics
  const [loading, setLoading] = useState(true);

  // New Product Form Inputs
  const [showProductForm, setShowProductForm] = useState(false);
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pOfferPrice, setPOfferPrice] = useState('');
  const [pStock, setPStock] = useState('10');
  const [pCategory, setPCategory] = useState('');
  const [pTags, setPTags] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch shop metadata, analytics, products, and categories
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get owner's shop details
      const shopRes = await API.get('/shops/my-shop/');
      const activeShop = shopRes.data;
      setShop(activeShop);

      // 2. Get analytics
      const analyticRes = await API.get(`/shops/${activeShop.id}/analytics/`);
      setAnalytics(analyticRes.data);

      // 3. Get shop orders
      const orderRes = await API.get('/orders/');
      setOrders(orderRes.data);

      // 4. Get products
      const prodRes = await API.get(`/products/?shop=${activeShop.id}`);
      setProducts(prodRes.data);

      // 5. Get shop product categories
      const catRes = await API.get(`/products/categories/?shop=${activeShop.id}`);
      setCategories(catRes.data);
      if (catRes.data.length > 0) {
        setPCategory(catRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await API.post(`/orders/${orderId}/update-status/`, { status: newStatus });
      // Reload order updates
      const res = await API.get('/orders/');
      setOrders(res.data);
      
      // Reload analytics
      const analyticRes = await API.get(`/shops/${shop.id}/analytics/`);
      setAnalytics(analyticRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!pName || !pPrice || !pCategory) {
      setFormError('Please fill in required fields.');
      return;
    }
    setFormError('');

    try {
      const payload = {
        shop: shop.id,
        category: pCategory,
        name: pName,
        description: pDescription,
        price: parseFloat(pPrice).toFixed(2),
        offer_price: pOfferPrice ? parseFloat(pOfferPrice).toFixed(2) : null,
        stock_quantity: parseInt(pStock),
        is_available: true,
        tags: pTags,
        variants: []
      };

      await API.post('/products/', payload);
      setShowProductForm(false);
      
      // Reset fields
      setPName('');
      setPDescription('');
      setPPrice('');
      setPOfferPrice('');
      setPTags('');
      
      // Reload products list
      const prodRes = await API.get(`/products/?shop=${shop.id}`);
      setProducts(prodRes.data);
    } catch (err) {
      setFormError('Failed to add product. Try again.');
    }
  };

  if (loading && !shop) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkbg-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-darkbg-200 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Standalone Merchant Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-darkbg-100 border-b border-slate-200 dark:border-slate-800 shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center space-x-3 text-xl font-extrabold tracking-tight text-brand-500">
              <VMLogo className="h-8 w-8" glow={false} />
              <span className="hidden sm:inline">Vadakara Mart Merchant</span>
            </div>

            {/* Navigation Links for Merchant Modules */}
            {shop && (
              <nav className="flex space-x-1 sm:space-x-2">
                {['orders', 'products', 'analytics'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === tab 
                        ? 'bg-brand-500 text-white shadow-glass' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden md:inline text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Store Owner: {user?.username}
            </span>
            <button 
              onClick={() => {
                logout();
                navigate('/login');
              }} 
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-500 border border-slate-200 dark:border-slate-800 rounded-full hover:border-rose-200 transition-all shadow-premium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow w-full">
        {!shop ? (
          <div className="max-w-md mx-auto my-12 text-center p-8 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold">🏪 Shop Setup Required</h2>
            <p className="text-xs text-slate-400 mt-2">
              Your account is registered as a merchant but you haven't set up a shop yet. Please contact admin to configure.
            </p>
          </div>
        ) : (
          <>
      
      {/* Shop Info Header banner */}
      <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center text-xl shadow-glass font-bold">
            {shop.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{shop.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Verified Merchant Dashboard • {shop.category_name}</p>
          </div>
        </div>
      </div>

      {/* Content tabs renders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
            Incoming Orders Checklist ({orders.length})
          </h3>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No orders received yet. Once customers place orders, they will appear here with dynamic action buttons.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((ord) => (
                <div 
                  key={ord.id}
                  className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-5 rounded-2xl shadow-premium space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Order #{ord.id}</p>
                      <p className="text-[9px] text-slate-400">{new Date(ord.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/20 text-brand-500 uppercase">
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Items ordered list */}
                  <div className="space-y-2 text-xs">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-slate-500 font-semibold">{item.quantity}x {item.product_name}</span>
                        <span className="text-slate-400">{item.price_at_order} INR</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-slate-200/50 dark:border-slate-800/30 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-slate-400">Total Amount</p>
                      <p className="text-sm font-extrabold text-brand-500">{ord.total_amount} INR</p>
                    </div>

                    {/* Operational transition controls */}
                    <div className="flex gap-2">
                      {ord.status === 'PENDING' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(ord.id, 'ACCEPTED')}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-premium"
                        >
                          Accept Order ✓
                        </button>
                      )}
                      {ord.status === 'ACCEPTED' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                          className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow-premium"
                        >
                          Prepare Food / Package 🍳
                        </button>
                      )}
                      {ord.status === 'PREPARING' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(ord.id, 'OUT_FOR_DELIVERY')}
                          className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-bold shadow-premium"
                        >
                          Dispatch Delivery Partner 🚴
                        </button>
                      )}
                      {['PENDING', 'ACCEPTED'].includes(ord.status) && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(ord.id, 'CANCELLED')}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 rounded-lg text-[10px] font-bold"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
              Product Inventory Catalog ({products.length})
            </h3>
            <button
              onClick={() => setShowProductForm(!showProductForm)}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glass"
            >
              {showProductForm ? 'Cancel' : '+ Add New Product'}
            </button>
          </div>

          {/* Add Product Form */}
          {showProductForm && (
            <form onSubmit={handleAddProduct} className="bg-white dark:bg-darkbg-100 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-premium space-y-4 max-w-xl">
              <h4 className="font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-2">New Product Form</h4>
              {formError && <p className="text-xs text-rose-500 text-center">{formError}</p>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Crispy Wrap"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Category *</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Details about product ingredients..."
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Base Price (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="150"
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Offer Price (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="120"
                    value={pOfferPrice}
                    onChange={(e) => setPOfferPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Search Keywords / Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="wrap, chicken, snacks"
                  value={pTags}
                  onChange={(e) => setPTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-glass"
              >
                Save Product to Catalog 💾
              </button>
            </form>
          )}

          {/* Product grid list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((prod) => (
              <div 
                key={prod.id}
                className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-4 rounded-2xl shadow-premium space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{prod.name}</p>
                    <p className="text-[9px] text-slate-400">{prod.category_name}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    prod.is_available 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                      : 'bg-slate-50 text-slate-400'
                  }`}>
                    {prod.is_available ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{prod.description || 'No description provided.'}</p>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{prod.current_price} INR</span>
                    {prod.offer_price && <span className="text-[9px] text-slate-400 line-through ml-2">{prod.price} INR</span>}
                  </div>
                  <span className="text-[9px] text-slate-400">Stock: {prod.stock_quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-1">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Revenue</p>
            <p className="text-3xl font-extrabold text-emerald-500">{analytics.total_revenue.toFixed(2)} INR</p>
            <p className="text-[10px] text-slate-400 mt-1">Direct completed payouts</p>
          </div>
          <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-1">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Completed Orders</p>
            <p className="text-3xl font-extrabold text-brand-500">{analytics.orders_count}</p>
            <p className="text-[10px] text-slate-400 mt-1">Confirmed hyperlocal shipments</p>
          </div>
          <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-1">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Average Order Value</p>
            <p className="text-3xl font-extrabold text-blue-500">{analytics.avg_order_value.toFixed(2)} INR</p>
            <p className="text-[10px] text-slate-400 mt-1">Basket value per delivery</p>
          </div>
        </div>
      )}
          </>
        )}
      </div>
    </div>
  );
}
