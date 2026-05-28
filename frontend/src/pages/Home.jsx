import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLocationStore } from '../store/locationStore';
import API from '../utils/api';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/media/')) return `http://localhost:8000${url}`;
  if (url.startsWith('media/')) return `http://localhost:8000/${url}`;
  return `http://localhost:8000/media/${url.startsWith('/') ? url.slice(1) : url}`;
};

export default function Home() {
  const { latitude, longitude, address, gpsLatitude, gpsLongitude, gpsAddress, detectLocation, isDetecting, setCoordinates } = useLocationStore();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(false);

  // Search logic
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem('recent_searches')) || []
  );

  // Place search logic
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);

  // Haversine formula to compute distance from actual GPS coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const searchRef = useRef(null);
  const placeSearchRef = useRef(null);

  // Debounced place search geocoding lookup
  useEffect(() => {
    if (!placeQuery || placeQuery.length < 3) {
      setPlaceSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoadingPlaces(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeQuery)}&limit=5`,
          {
            headers: {
              'User-Agent': 'VadakaraMart-Hyperlocal-Platform-App'
            }
          }
        );
        const data = await res.json();
        setPlaceSuggestions(data);
      } catch (err) {
        console.error('Place search geocoding lookup failed:', err);
      } finally {
        setLoadingPlaces(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [placeQuery]);

  const handleSelectPlace = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    
    // Extract a shorter recognizable location label
    const parts = place.display_name.split(',');
    const cleanName = parts.slice(0, 3).join(',').trim();
    
    setCoordinates(lat, lon, cleanName);
    setPlaceQuery('');
    setPlaceSuggestions([]);
    setShowPlaceSuggestions(false);
  };

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (placeSearchRef.current && !placeSearchRef.current.contains(e.target)) {
        setShowPlaceSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch shop categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/shops/categories/');
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch shops based on active location and category selection
  useEffect(() => {
    const fetchShops = async () => {
      setLoadingShops(true);
      try {
        console.log("📍 [Hyperlocal Coordinates Detected] Latitude:", latitude, "| Longitude:", longitude, "| Address:", address);
        let url = `/shops/?latitude=${latitude}&longitude=${longitude}`;
        
        // If viewing a searched place different from GPS location, relax standard delivery range to 25km
        if (address !== gpsAddress) {
          url += `&radius=25`;
        }
        
        if (selectedCategory) {
          url += `&category=${selectedCategory}`;
        }
        const res = await API.get(url);
        setShops(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, [latitude, longitude, selectedCategory, address, gpsAddress]);

  // Debounced/asynchronous smart products & shops unified search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await API.get(
          `/products/search/?query=${searchQuery}&latitude=${latitude}&longitude=${longitude}`
        );
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, latitude, longitude]);

  const handleSearchSubmit = (keyword) => {
    if (!keyword) return;
    setSearchQuery(keyword);
    setShowSuggestions(false);
    
    // Save to recent searches
    let updated = [keyword, ...recentSearches.filter((x) => x !== keyword)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      
      {/* Hyperlocal Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/30 shadow-premium">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-500 to-rose-500 bg-clip-text text-transparent">
            Hyperlocal Marketplace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Discover customer coordinates, unified product indexing, and optimized merchant delivery directories.
          </p>
        </div>
        
        {/* Right Column: Active Search Focus Location and Coordinates */}
        <div className="flex flex-col items-start md:items-end gap-1 flex-shrink-0">
          <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Search Focus Location</span>
          <span className="text-xs sm:text-sm font-bold text-brand-500 bg-brand-50 dark:bg-brand-950/20 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-2xl border border-brand-100 dark:border-brand-900/30 max-w-[260px] sm:max-w-xs truncate animate-fade-in" title={address}>
            📍 {address}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500">
            <span>Coordinates:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">({latitude.toFixed(4)}, {longitude.toFixed(4)})</span>
            {address !== gpsAddress && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => setCoordinates(gpsLatitude, gpsLongitude, gpsAddress)}
                  className="font-extrabold text-brand-500 hover:text-brand-600 underline hover:scale-105 transition-all"
                  title="Reset active coordinates back to actual physical location"
                >
                  Reset 🏠
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle Row: Responsive Adaptive Search & Filtering Layout */}
      {/* Mobile: stacks vertically. Tablet (md): searches side-by-side, categories below wrapped. Desktop (lg): Searches (2/3) and Categories (1/3) side-by-side */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:items-center w-full">
        
        {/* Searches Container (Col span 2 / width 2/3 on desktop) */}
        <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Smart Unified Search Bar */}
          <div className="relative" ref={searchRef}>
            <div className="flex items-center bg-white dark:bg-darkbg-100 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 sm:py-3.5 shadow-premium focus-within:ring-2 focus-within:ring-brand-400 transition-all">
              <span className="text-slate-400 text-base sm:text-lg mr-3">🔍</span>
              <input
                type="text"
                placeholder="Search products, dishes, shops..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-transparent focus:outline-none text-xs sm:text-sm text-slate-880 dark:text-slate-200"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Suggestions Overlay */}
            {showSuggestions && (
              <div className="absolute top-14 sm:top-16 left-0 w-full bg-white dark:bg-darkbg-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-glass z-30 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {searching ? (
                  <div className="p-4 text-xs text-slate-400 text-center">Searching suggestions...</div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.map((prod) => (
                      <Link
                        key={prod.id}
                        to={`/shops/${prod.shop}`}
                        onClick={() => handleSearchSubmit(prod.name)}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs"
                      >
                        <div>
                          <p className="font-semibold">{prod.name}</p>
                          <p className="text-[10px] text-slate-400">in {prod.shop_name}</p>
                        </div>
                        <span className="text-[10px] font-bold text-brand-500 bg-brand-50 dark:bg-brand-950/20 px-2 py-0.5 rounded-full">
                          {prod.current_price} INR
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-4 text-xs text-slate-400 text-center">No matching products found nearby.</div>
                ) : null}

                {/* Recent Searches section */}
                {recentSearches.length > 0 && !searchQuery && (
                  <div className="p-4">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Recent Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((keyword, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearchSubmit(keyword)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-slate-600 dark:text-slate-300"
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Place/Area Search Box Column */}
          <div className="relative" ref={placeSearchRef}>
            <div className="flex items-center bg-white dark:bg-darkbg-100 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 sm:py-3.5 shadow-premium focus-within:ring-2 focus-within:ring-brand-400 transition-all">
              <span className="text-brand-500 text-base sm:text-lg mr-3">📍</span>
              <input
                type="text"
                placeholder="Search shop by place area..."
                value={placeQuery}
                onChange={(e) => {
                  setPlaceQuery(e.target.value);
                  setShowPlaceSuggestions(true);
                }}
                onFocus={() => setShowPlaceSuggestions(true)}
                className="w-full bg-transparent focus:outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-200"
              />
              {placeQuery && (
                <button
                  onClick={() => setPlaceQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Place Suggestions Dropdown */}
            {showPlaceSuggestions && placeSuggestions.length > 0 && (
              <div className="absolute top-14 sm:top-16 left-0 w-full bg-white dark:bg-darkbg-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-glass z-45 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                {placeSuggestions.map((place, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs text-slate-600 dark:text-slate-300 font-medium leading-tight block truncate"
                    title={place.display_name}
                  >
                    {place.display_name}
                  </button>
                ))}
              </div>
            )}
            {showPlaceSuggestions && loadingPlaces && (
              <div className="absolute top-14 sm:top-16 left-0 w-full bg-white dark:bg-darkbg-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-glass z-45 text-center text-xs text-slate-400">
                Searching places...
              </div>
            )}
          </div>

        </div>

        {/* Categories Quick Bubbles selection (Takes 1/3 width on desktop) */}
        {/* On Mobile: flex horizontal overflow. On Tablet: wraps nicely. On Desktop: flex row layout */}
        <div className="w-full lg:w-1/3 flex overflow-x-auto md:flex-wrap lg:flex-nowrap md:overflow-x-visible lg:overflow-x-auto gap-2 pb-2 md:pb-0 lg:pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all ${
              !selectedCategory 
                ? 'bg-brand-500 text-white shadow-glass scale-105' 
                : 'bg-white dark:bg-darkbg-100 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Shops
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.slug 
                  ? 'bg-brand-500 text-white shadow-glass scale-105' 
                  : 'bg-white dark:bg-darkbg-100 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

      </div>

      {/* Shop Cards Full-Width Responsive Grid */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-[10px] sm:text-xs uppercase font-extrabold text-slate-400 tracking-wider">
            Nearby Shop Directory ({shops.length})
          </h3>
          {(selectedCategory || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="text-[10px] sm:text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center space-x-1.5 transition-all hover:scale-105"
              title="Reset Search and Category Filters"
            >
              <span>↩</span>
              <span>Go Back to Home / All Shops</span>
            </button>
          )}
        </div>
        
        {loadingShops ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 rounded-3xl skeleton-shimmer border border-slate-200/50 dark:border-slate-800/30"></div>
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="p-12 sm:p-16 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            No active shops in your delivery radius. Try clicking "Use My Current Location" or updating your address coordinates.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                to={`/shops/${shop.id}`}
                className="flex bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-4 sm:p-5 rounded-3xl shadow-premium hover:border-brand-300 dark:hover:border-brand-500/50 hover:-translate-y-1 transition-all gap-4 sm:gap-5 group"
              >
                {/* Shop Banner / Logo mock */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 relative">
                  {shop.logo ? (
                    <img src={getImageUrl(shop.logo)} alt={shop.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl">🏪</span>
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-grow">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-extrabold text-xs sm:text-sm truncate group-hover:text-brand-500 transition-colors">
                      {shop.name}
                    </h4>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full" title="Actual distance from your current location">
                      🏠 {calculateDistance(gpsLatitude, gpsLongitude, parseFloat(shop.latitude), parseFloat(shop.longitude)).toFixed(1)} km
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 truncate leading-relaxed">
                    {shop.description}
                  </p>
                  
                  {/* Proximity calculations to the searched place */}
                  <div className="flex flex-col gap-1 pt-1">
                    {address !== gpsAddress && (
                      <div className="flex items-center space-x-1 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        <span>📍</span>
                        <span className="truncate">{parseFloat(shop.distance || 0).toFixed(1)} km from searched place</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-1.5 sm:pt-2.5 text-[9px] sm:text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-extrabold uppercase text-[8px] sm:text-[9px] ${
                      shop.is_open 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {shop.is_open ? 'Open' : 'Closed'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-800">|</span>
                    <span className="text-slate-500 font-semibold truncate">Delivery Limit: {shop.delivery_radius_km} km</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
