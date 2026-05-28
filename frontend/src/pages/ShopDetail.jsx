import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../utils/api';
import { useCartStore } from '../store/cartStore';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/media/')) return `http://localhost:8000${url}`;
  if (url.startsWith('media/')) return `http://localhost:8000/${url}`;
  return `http://localhost:8000/media/${url.startsWith('/') ? url.slice(1) : url}`;
};

export default function ShopDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart operations
  const { items: cartItems, shop: cartShop, addItem, updateQuantity, removeItem, error: cartError, resolveConflict, total } = useCartStore();
  
  // Modals/Overlays
  const [conflictProduct, setConflictProduct] = useState(null);
  const [conflictShop, setConflictShop] = useState(null);
  const [variantProduct, setVariantProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Fetch shop metadata
  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        const shopRes = await API.get(`/shops/${id}/`);
        setShop(shopRes.data);

        const catsRes = await API.get(`/products/categories/?shop=${id}`);
        setCategories(catsRes.data);
        if (catsRes.data.length > 0) {
          setSelectedCategory(catsRes.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchShopInfo();
  }, [id]);

  // Fetch products inside active category
  useEffect(() => {
    if (!selectedCategory) return;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/products/?shop=${id}&category=${selectedCategory}`);
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [id, selectedCategory]);

  const handleAddToCart = (product) => {
    // If the product has multiple variants, open variant selector modal!
    if (product.variants && product.variants.length > 0) {
      setVariantProduct(product);
      setSelectedVariant(product.variants[0]);
      return;
    }

    const success = addItem(product, null, shop);
    if (!success && useCartStore.getState().error === 'conflict') {
      setConflictProduct(product);
      setConflictShop(shop);
    }
  };

  const handleVariantSubmit = () => {
    const success = addItem(variantProduct, selectedVariant, shop);
    setVariantProduct(null);
    setSelectedVariant(null);
    
    if (!success && useCartStore.getState().error === 'conflict') {
      setConflictProduct(variantProduct);
      setConflictShop(shop);
    }
  };

  const getCartQuantity = (productId, variantId = null) => {
    const match = cartItems.find(
      (item) => item.product.id === productId && item.variant?.id === (variantId || null)
    );
    return match ? match.quantity : 0;
  };

  if (!shop) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkbg-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col md:flex-row gap-6 lg:gap-8 relative pb-20 md:pb-8">
      
      {/* Catalog & Shop Info Left Column */}
      <div className="flex-grow md:max-w-[calc(100%-280px)] lg:max-w-4xl space-y-6">
        
        {/* Back navigation button */}
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-brand-500 transition-colors bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 px-4 py-2 rounded-xl shadow-premium hover:-translate-y-0.5 transition-all w-fit"
        >
          <span>←</span>
          <span>Go Back to Shops Directory</span>
        </Link>

        {/* Shop Cover Banner */}
        <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl overflow-hidden shadow-premium">
          <div className="h-32 sm:h-44 bg-gradient-to-r from-brand-400 to-rose-500 relative flex items-end p-4 sm:p-6">
            {shop.banner && <img src={getImageUrl(shop.banner)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
            <div className="relative z-10 text-white space-y-0.5 sm:space-y-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded">
                {shop.category_name}
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-none">{shop.name}</h1>
              <p className="text-[10px] sm:text-xs text-white/80 line-clamp-1">{shop.description}</p>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 flex flex-wrap gap-3 sm:gap-4 text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="truncate max-w-[200px] sm:max-w-none">📍 <span className="text-slate-700 dark:text-slate-300">{shop.address_text}</span></div>
            <div>📞 <span className="text-slate-700 dark:text-slate-300">{shop.phone || 'N/A'}</span></div>
            <div>🕒 Hours: <span className="text-emerald-500 font-bold">{shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}</span></div>
            <div>🚚 Radius: <span className="text-slate-700 dark:text-slate-300">{shop.delivery_radius_km} km</span></div>
          </div>
        </div>

        {/* Menu Navigation Categories & List */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Vertical Categories Selection Side menu */}
          <div className="md:col-span-1 space-y-1.5 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-2 md:gap-0">
            <h3 className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-2">
              Menu Categories
            </h3>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-left px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap md:w-full ${
                  selectedCategory === cat.id
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 border-l-4 border-brand-500 shadow-sm'
                    : 'bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Items menu listing */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
              Catalog Items
            </h3>

            {loading ? (
              [1, 2].map((n) => (
                <div key={n} className="h-32 skeleton-shimmer rounded-2xl border border-slate-200/50 dark:border-slate-800/30"></div>
              ))
            ) : products.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No active products listed in this menu category.
              </div>
            ) : (
              products.map((prod) => (
                <div
                  key={prod.id}
                  className="flex bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-4 sm:p-5 rounded-2xl shadow-premium gap-4 sm:gap-5 group hover:border-brand-100 dark:hover:border-brand-900 transition-all"
                >
                  
                  {/* Item Image Mock */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 relative">
                    {prod.image ? (
                      <img src={getImageUrl(prod.image)} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl">🍔</span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-grow min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 group-hover:text-brand-500 transition-colors truncate">
                        {prod.name}
                      </h4>
                      
                      {/* Cart Add/Subtract operations */}
                      {getCartQuantity(prod.id) > 0 && !prod.variants?.length ? (
                        <div className="flex items-center space-x-2.5 bg-brand-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-glass text-[10px] sm:text-xs font-bold flex-shrink-0 select-none">
                          <button onClick={() => updateQuantity(prod.id, null, getCartQuantity(prod.id) - 1)} className="hover:scale-110 transition-transform px-1">
                            -
                          </button>
                          <span>{getCartQuantity(prod.id)}</span>
                          <button onClick={() => updateQuantity(prod.id, null, getCartQuantity(prod.id) + 1)} className="hover:scale-110 transition-transform px-1">
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(prod)}
                          disabled={!prod.is_available}
                          className="px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-glass transition-all disabled:opacity-50 flex-shrink-0"
                        >
                          {prod.variants?.length ? 'Options' : 'Add +'}
                        </button>
                      )}
                    </div>
                    
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-lg line-clamp-2">
                      {prod.description}
                    </p>
                    
                    <div className="flex items-center space-x-2 sm:space-x-3 pt-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {prod.current_price} INR
                      </span>
                      {prod.offer_price && (
                        <span className="text-[9px] sm:text-[10px] text-slate-400 line-through">
                          {prod.price} INR
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Cart Drawer Slide Right (Zomato/Blinkit premium sidebar checkout panel - Visible on Tablet & Desktop) */}
      {cartItems.length > 0 && (
        <div className="hidden md:block w-full md:w-64 lg:w-80 flex-shrink-0">
          <div className="sticky top-20 glass-panel border border-brand-100 dark:border-brand-900/50 p-5 lg:p-6 rounded-2xl shadow-glass space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/30 pb-3 flex-shrink-0">
              <h3 className="font-extrabold text-xs lg:text-sm tracking-tight text-brand-500 flex items-center space-x-2 truncate">
                <span>🛒</span>
                <span>Cart Order from {cartShop?.name.slice(0, 10)}...</span>
              </h3>
              <span className="text-[9px] lg:text-[10px] font-bold px-2 py-0.5 bg-brand-50 dark:bg-brand-950/20 text-brand-500 rounded-full flex-shrink-0">
                {cartItems.length} items
              </span>
            </div>

            {/* Cart Items list */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.product.name}</p>
                    {item.variant && <p className="text-[9px] text-slate-400 truncate">{item.variant.name}</p>}
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className="font-bold text-slate-500">{item.quantity}x</span>
                    <button 
                      onClick={() => removeItem(item.product.id, item.variant?.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors text-sm"
                      title="Remove Item"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-dashed border-slate-200/50 dark:border-slate-800/30 pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-semibold">{useCartStore.getState().subtotal.toFixed(2)} INR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery Fee</span>
                <span className="font-semibold text-brand-500">
                  {useCartStore.getState().deliveryFee === 0 ? 'FREE' : `${useCartStore.getState().deliveryFee.toFixed(2)} INR`}
                </span>
              </div>
              <div className="flex justify-between font-extrabold border-t border-slate-200/50 dark:border-slate-800/30 pt-3 text-sm">
                <span>Total Amount</span>
                <span className="text-brand-500">{total.toFixed(2)} INR</span>
              </div>
            </div>

            {/* Proceed to Checkout Trigger */}
            <Link
              to="/checkout"
              className="block w-full text-center py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-glass font-bold text-xs transition-all"
            >
              Proceed to Checkout 🚀
            </Link>
          </div>
        </div>
      )}

      {/* Discard Cart previous shop conflict pop-up modal */}
      {conflictProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkbg-100 max-w-sm w-full p-6 rounded-2xl shadow-glass text-center space-y-4 border border-slate-200 dark:border-slate-800">
            <span className="text-4xl">⚠️</span>
            <h3 className="font-extrabold text-base tracking-tight">Replace Cart Items?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your cart already contains items from **{cartShop?.name}**. Hyperlocal marketplaces only support single store checkouts. Discard previous items to start this order?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  resolveConflict(true, conflictProduct, null, conflictShop);
                  setConflictProduct(null);
                  setConflictShop(null);
                }}
                className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                Discard & Start Fresh
              </button>
              <button
                onClick={() => {
                  resolveConflict(false);
                  setConflictProduct(null);
                  setConflictShop(null);
                }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-variant Selections Modal overlay */}
      {variantProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkbg-100 max-w-sm w-full p-6 rounded-2xl shadow-glass space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-100">
              Customize '{variantProduct.name}'
            </h3>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
              {variantProduct.variants.map((v) => (
                <label 
                  key={v.id}
                  className="flex items-center justify-between py-3 cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      name="variant-select"
                      checked={selectedVariant?.id === v.id}
                      onChange={() => setSelectedVariant(v)}
                      className="text-brand-500 focus:ring-brand-400"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors">
                      {v.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {v.price_override ? `${v.price_override} INR` : `${variantProduct.current_price} INR`}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={handleVariantSubmit}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                Add Variant to Cart
              </button>
              <button
                onClick={() => {
                  setVariantProduct(null);
                  setSelectedVariant(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Bottom Cart Bar */}
      {cartItems.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-darkbg-100/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-3 shadow-glass flex items-center justify-between animate-slide-up">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🛒</span>
            <div className="text-left">
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)} Items
              </p>
              <p className="text-[10px] text-brand-500 font-bold">
                {total.toFixed(2)} INR
              </p>
            </div>
          </div>
          <Link
            to="/checkout"
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-glass font-bold text-xs flex items-center space-x-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <span>Checkout</span>
            <span>🚀</span>
          </Link>
        </div>
      )}

    </div>
  );
}
