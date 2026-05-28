import { create } from 'zustand';
import API from '../utils/api';

// Helper to perform free OpenStreetMap Nominatim reverse geocoding lookup
const fetchReverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
      {
        headers: {
          'User-Agent': 'VadakaraMart-Hyperlocal-Platform-App'
        }
      }
    );
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      // Extract nearest recognizable town, suburb, district, village or road
      const townOrSuburb = a.suburb || a.town || a.city_district || a.neighbourhood || a.village || a.road || 'Nearest Town';
      const cityOrState = a.city || a.county || a.state || '';
      return `${townOrSuburb}, ${cityOrState}`.trim();
    }
  } catch (err) {
    console.error('Reverse geocoding lookup failed:', err);
  }
  // Fallback to formatted coordinates
  return `Area near (${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`;
};

export const useLocationStore = create((set, get) => ({
  // Default centered around Bangalore MG Road matching seeded database coords
  latitude: 11.6104,
  longitude: 75.5921,
  address: 'Vadakara, Kerala',
  // Preservation of user's physical GPS location
  gpsLatitude: 11.6104,
  gpsLongitude: 75.5921,
  gpsAddress: 'Vadakara, Kerala',
  savedAddresses: [],
  isDetecting: false,
  error: null,

  setCoordinates: async (lat, lng, addressLabel = '') => {
    set({ latitude: parseFloat(lat), longitude: parseFloat(lng) });
    
    // Resolve coordinates to human-readable address town name dynamically!
    const resolvedLabel = addressLabel || await fetchReverseGeocode(lat, lng);
    set({ address: resolvedLabel });
  },

  detectLocation: async () => {
    set({ isDetecting: true, error: null });
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        set({ error: 'Geolocation is not supported by your browser.', isDetecting: false });
        reject('Not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          set({ latitude: lat, longitude: lng });
          // Reverse-geocode coordinates live using OpenStreetMap
          const resolvedAddress = await fetchReverseGeocode(lat, lng);
          
          set({
            address: resolvedAddress,
            latitude: lat,
            longitude: lng,
            gpsLatitude: lat,
            gpsLongitude: lng,
            gpsAddress: resolvedAddress,
            isDetecting: false
          });
          resolve({ latitude: lat, longitude: lng });
        },
        async (error) => {
          // Fail-safe fallback to seeded Bangalore coordinates
          const fallbackLat = 11.6104;
          const fallbackLng = 75.5921;
          
          set({
            error: 'Failed to access live location. Using default Vadakara center.',
            latitude: fallbackLat,
            longitude: fallbackLng,
            gpsLatitude: fallbackLat,
            gpsLongitude: fallbackLng
          });
          
          const fallbackAddress = await fetchReverseGeocode(fallbackLat, fallbackLng);
          set({
            address: fallbackAddress,
            gpsAddress: fallbackAddress,
            isDetecting: false
          });
          
          resolve({ latitude: fallbackLat, longitude: fallbackLng });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },

  fetchSavedAddresses: async () => {
    try {
      const res = await API.get('/users/addresses/');
      set({ savedAddresses: res.data });
      return res.data;
    } catch (err) {
      set({ error: 'Failed to load saved addresses.' });
    }
  },

  addSavedAddress: async (addressData) => {
    try {
      const res = await API.post('/users/addresses/', addressData);
      set((state) => ({ 
        savedAddresses: [...state.savedAddresses, res.data] 
      }));
      return res.data;
    } catch (err) {
      set({ error: 'Failed to save address.' });
      throw err;
    }
  }
}));
