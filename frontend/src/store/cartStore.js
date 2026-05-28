import { create } from 'zustand';
import API from '../utils/api';

export const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('cart_items')) || [],
  shop: JSON.parse(localStorage.getItem('cart_shop')) || null,
  coupon: null,
  discount: 0.00,
  subtotal: 0.00,
  deliveryFee: 15.00,
  total: 0.00,
  error: null,

  calculateTotals: () => {
    const { items, coupon } = get();
    
    // Sum subtotal
    const subtotal = items.reduce((acc, item) => {
      const price = item.variant?.price_override 
        ? parseFloat(item.variant.price_override) 
        : parseFloat(item.product.current_price);
      return acc + (price * item.quantity);
    }, 0.00);

    // Apply coupon discounts
    let discount = 0.00;
    if (coupon) {
      if (coupon.discount_percent > 0) {
        discount = subtotal * (parseFloat(coupon.discount_percent) / 100.0);
      } else if (coupon.discount_amount > 0) {
        discount = parseFloat(coupon.discount_amount);
      }
      discount = Math.min(discount, subtotal); // Discount cannot exceed subtotal
    }

    // Flat delivery fee (free if order subtotal exceeds 100.00!)
    const deliveryFee = subtotal > 0 && subtotal >= 100.00 ? 0.00 : (subtotal > 0 ? 15.00 : 0.00);
    const total = subtotal - discount + deliveryFee;

    set({ subtotal, discount, deliveryFee, total });
  },

  addItem: (product, variant = null, shop) => {
    const { items, shop: currentShop } = get();
    
    // Check if adding from a different shop
    if (currentShop && currentShop.id !== shop.id) {
      set({ error: 'conflict' }); // Trigger conflict state in UI to ask user to clear cart
      return false;
    }

    let updatedItems = [...items];
    const existingIndex = items.findIndex(
      (item) => item.product.id === product.id && item.variant?.id === (variant?.id || null)
    );

    if (existingIndex > -1) {
      updatedItems[existingIndex].quantity += 1;
    } else {
      updatedItems.push({ product, variant, quantity: 1, shop });
    }

    localStorage.setItem('cart_items', JSON.stringify(updatedItems));
    localStorage.setItem('cart_shop', JSON.stringify(shop));
    
    set({ items: updatedItems, shop, error: null });
    get().calculateTotals();
    return true;
  },

  updateQuantity: (productId, variantId = null, quantity) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(productId, variantId);
      return;
    }

    const updatedItems = items.map((item) => {
      if (item.product.id === productId && item.variant?.id === (variantId || null)) {
        return { ...item, quantity };
      }
      return item;
    });

    localStorage.setItem('cart_items', JSON.stringify(updatedItems));
    set({ items: updatedItems });
    get().calculateTotals();
  },

  removeItem: (productId, variantId = null) => {
    const { items } = get();
    const updatedItems = items.filter(
      (item) => !(item.product.id === productId && item.variant?.id === (variantId || null))
    );

    if (updatedItems.length === 0) {
      localStorage.removeItem('cart_items');
      localStorage.removeItem('cart_shop');
      set({ items: [], shop: null, coupon: null });
    } else {
      localStorage.setItem('cart_items', JSON.stringify(updatedItems));
      set({ items: updatedItems });
    }
    get().calculateTotals();
  },

  applyCoupon: async (code) => {
    const { subtotal } = get();
    set({ error: null });
    try {
      const res = await API.get(`/orders/coupons/validate/?code=${code}&subtotal=${subtotal}`);
      if (res.data.valid) {
        set({ coupon: res.data });
        get().calculateTotals();
        return { success: true, message: 'Coupon applied successfully!' };
      } else {
        set({ error: res.data.message });
        return { success: false, message: res.data.message };
      }
    } catch (err) {
      set({ error: 'Invalid coupon code.' });
      return { success: false, message: 'Invalid coupon code.' };
    }
  },

  removeCoupon: () => {
    set({ coupon: null, discount: 0.00 });
    get().calculateTotals();
  },

  clearCart: () => {
    localStorage.removeItem('cart_items');
    localStorage.removeItem('cart_shop');
    set({ items: [], shop: null, coupon: null, subtotal: 0, discount: 0, total: 0, error: null });
  },

  resolveConflict: (confirmClear, product = null, variant = null, shop = null) => {
    if (confirmClear) {
      get().clearCart();
      if (product && shop) {
        get().addItem(product, variant, shop);
      }
    } else {
      set({ error: null });
    }
  }
}));
