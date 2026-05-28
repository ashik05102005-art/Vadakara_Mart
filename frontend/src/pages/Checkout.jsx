import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';
import API from '../utils/api';

export default function Checkout() {
  const { items, shop, subtotal, deliveryFee, coupon, discount, total, applyCoupon, removeCoupon, clearCart } = useCartStore();
  const { savedAddresses, fetchSavedAddresses, addSavedAddress } = useLocationStore();
  const navigate = useNavigate();

  // Address inputs
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newTitle, setNewTitle] = useState('Home');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState('Vadakara');
  const [newPostalCode, setNewPostalCode] = useState('673101');

  // Coupon inputs
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Payment inputs
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    // If cart is empty, redirect home
    if (items.length === 0) {
      navigate('/');
      return;
    }
    // Fetch saved user addresses
    const initAddresses = async () => {
      const addresses = await fetchSavedAddresses();
      if (addresses && addresses.length > 0) {
        setSelectedAddress(addresses[0]);
      }
    };
    initAddresses();
  }, [items, fetchSavedAddresses, navigate]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput) return;
    setCouponError('');
    setCouponSuccess('');

    const res = await applyCoupon(couponInput);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      // Mock latitude and longitude coordinates centered around Vadakara center slightly offset
      const mockLat = 11.6104 + (Math.random() - 0.5) * 0.01;
      const mockLng = 75.5921 + (Math.random() - 0.5) * 0.01;
      
      const newAddr = await addSavedAddress({
        title: newTitle,
        address_line: newAddressLine,
        landmark: newLandmark,
        city: newCity,
        state: 'Kerala',
        postal_code: newPostalCode,
        latitude: mockLat.toFixed(6),
        longitude: mockLng.toFixed(6)
      });
      setSelectedAddress(newAddr);
      setShowAddressForm(false);
      
      // Clear address inputs
      setNewAddressLine('');
      setNewLandmark('');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setCheckoutError('Please select a delivery address.');
      return;
    }
    setSubmitting(true);
    setCheckoutError('');

    try {
      // Structure payload matching backend OrderSerializer rules
      const payload = {
        shop: shop.id,
        subtotal: subtotal.toFixed(2),
        delivery_fee: deliveryFee.toFixed(2),
        discount_applied: discount.toFixed(2),
        total_amount: total.toFixed(2),
        delivery_address: `${selectedAddress.address_line}, ${selectedAddress.landmark ? selectedAddress.landmark + ', ' : ''}${selectedAddress.city} - ${selectedAddress.postal_code}`,
        delivery_latitude: selectedAddress.latitude,
        delivery_longitude: selectedAddress.longitude,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'COD' ? 'PENDING' : 'PAID', // Card/UPI is auto-paid in mock
        coupon_code: coupon ? coupon.code : '',
        items: items.map((item) => ({
          product: item.product.id,
          variant: item.variant ? item.variant.id : null,
          quantity: item.quantity
        }))
      };

      const res = await API.post('/orders/', payload);
      const order = res.data;
      
      // Clear local cart store
      clearCart();
      
      // Redirect to Order Tracking screen!
      navigate(`/orders/${order.id}/track`);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place order. Check items stock.';
      setCheckoutError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
      
      {/* Left Columns: Address select & Payments */}
      <div className="md:col-span-2 space-y-6 sm:space-y-8">
        
        {/* Step 1: Select Delivery Address */}
        <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm uppercase tracking-tight text-slate-800 dark:text-slate-100">
              1. Delivery Address
            </h3>
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="text-xs font-bold text-brand-500 hover:text-brand-600 underline"
            >
              {showAddressForm ? 'Cancel' : '+ Add New Address'}
            </button>
          </div>

          {showAddressForm ? (
            <form onSubmit={handleCreateAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Title</label>
                  <select
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    placeholder="560001"
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Street Address</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Apartment/Flat, Street Details..."
                  value={newAddressLine}
                  onChange={(e) => setNewAddressLine(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Landmark</label>
                  <input
                    type="text"
                    placeholder="Near City Park"
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Bangalore"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-glass"
              >
                Save & Select Address
              </button>
            </form>
          ) : savedAddresses.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No saved addresses found. Please add a new address above to continue.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr)}
                  className={`p-4 rounded-xl border cursor-pointer hover:border-brand-300 dark:hover:border-brand-500/50 transition-all text-xs space-y-1 relative ${
                    selectedAddress?.id === addr.id
                      ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-darkbg-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{addr.title}</span>
                    {selectedAddress?.id === addr.id && <span className="text-brand-500 text-sm">✓</span>}
                  </div>
                  <p className="text-slate-500 leading-relaxed truncate">{addr.address_line}</p>
                  {addr.landmark && <p className="text-slate-400">Landmark: {addr.landmark}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Select Payment Method */}
        <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-6">
          <h3 className="font-extrabold text-sm uppercase tracking-tight text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            2. Payment Options
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:border-brand-300 transition-all ${
                paymentMethod === 'COD'
                  ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-darkbg-100'
              }`}
            >
              <div className="flex items-center space-x-3 text-xs">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="text-brand-500 focus:ring-brand-400"
                />
                <span className="font-bold">Cash on Delivery</span>
              </div>
              <span className="text-lg">💵</span>
            </label>

            <label
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:border-brand-300 transition-all ${
                paymentMethod === 'STRIPE'
                  ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-darkbg-100'
              }`}
            >
              <div className="flex items-center space-x-3 text-xs">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'STRIPE'}
                  onChange={() => setPaymentMethod('STRIPE')}
                  className="text-brand-500 focus:ring-brand-400"
                />
                <span className="font-bold">Stripe Card</span>
              </div>
              <span className="text-lg">💳</span>
            </label>

            <label
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:border-brand-300 transition-all ${
                paymentMethod === 'RAZORPAY'
                  ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-darkbg-100'
              }`}
            >
              <div className="flex items-center space-x-3 text-xs">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                  className="text-brand-500 focus:ring-brand-400"
                />
                <span className="font-bold">Razorpay UPI</span>
              </div>
              <span className="text-lg">📱</span>
            </label>
          </div>
        </div>

      </div>

      {/* Right Column: Order Bill Summary & Coupon application */}
      <div className="space-y-6">
        
        {/* Bill Details */}
        <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-6">
          <h3 className="font-extrabold text-sm uppercase tracking-tight text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            Bill Details
          </h3>

          <div className="space-y-3 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
            {items.map((item, idx) => {
              const price = item.variant?.price_override || item.product.current_price;
              return (
                <div key={idx} className="flex justify-between py-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold truncate text-slate-800 dark:text-slate-200">{item.product.name}</p>
                    {item.variant && <p className="text-[9px] text-slate-400">{item.variant.name}</p>}
                  </div>
                  <span className="font-bold text-slate-500 flex-shrink-0">
                    {item.quantity} x {price} INR
                  </span>
                </div>
              );
            })}
          </div>

          {/* Coupon Code Input */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            {coupon ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-xs border border-emerald-100 dark:border-emerald-900">
                <div>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">Coupon Applied: {coupon.code}</p>
                  <p className="text-[10px] text-slate-400">Saved {discount.toFixed(2)} INR</p>
                </div>
                <button 
                  onClick={removeCoupon}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (e.g. WELCOME10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-grow px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-darkbg-200 focus:outline-none text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Apply
                </button>
              </form>
            )}

            {couponError && <p className="text-[10px] font-semibold text-rose-500 text-center">{couponError}</p>}
            {couponSuccess && <p className="text-[10px] font-semibold text-emerald-500 text-center">{couponSuccess}</p>}
          </div>

          {/* Summary pricing calculations */}
          <div className="border-t border-dashed border-slate-200/50 dark:border-slate-800/30 pt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Items Subtotal</span>
              <span className="font-semibold">{subtotal.toFixed(2)} INR</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-500 font-medium">
                <span>Coupon Discount</span>
                <span>- {discount.toFixed(2)} INR</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Rapid Delivery Fee</span>
              <span className="font-semibold text-brand-500">
                {deliveryFee === 0 ? 'FREE' : `${deliveryFee.toFixed(2)} INR`}
              </span>
            </div>
            <div className="flex justify-between font-extrabold border-t border-slate-200/50 dark:border-slate-800/30 pt-3 text-sm">
              <span>Grand Total</span>
              <span className="text-brand-500">{total.toFixed(2)} INR</span>
            </div>
          </div>

          {checkoutError && (
            <p className="p-3 text-[10px] text-rose-600 bg-rose-50 rounded-lg text-center dark:bg-rose-950/20 dark:text-rose-400">
              {checkoutError}
            </p>
          )}

          {/* Place Order checkout trigger */}
          <button
            onClick={handlePlaceOrder}
            disabled={submitting || !selectedAddress}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-glass font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {submitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              `Place Order: ${total.toFixed(2)} INR 🚀`
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
