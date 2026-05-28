import React, { useEffect, useState, useRef } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

const shopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-rose.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const riderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function DeliveryDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active, available, profile

  // Live simulation coordinates
  const [simLat, setSimLat] = useState(11.610000);
  const [simLng, setSimLng] = useState(75.591000);
  const simulationIntervalRef = useRef(null);

  const loadDeliveryData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profile details
      const profRes = await API.get('/delivery/profile/');
      setProfile(profRes.data);
      if (profRes.data.current_latitude) {
        setSimLat(parseFloat(profRes.data.current_latitude));
        setSimLng(parseFloat(profRes.data.current_longitude));
      }

      // 2. Fetch available orders nearby (flat Vadakara coordinates passed for lookup)
      const availRes = await API.get('/delivery/available/?latitude=11.610000&longitude=75.591000');
      setAvailableOrders(availRes.data);

      // 3. Fetch active assignments
      const activeRes = await API.get('/delivery/');
      setActiveAssignments(activeRes.data.filter((x) => x.status !== 'DELIVERED'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryData();
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, []);

  // Live GPS Moving Telemetry Simulation Loop!
  useEffect(() => {
    const active = activeAssignments.find((a) => ['ACCEPTED', 'PICKED_UP'].includes(a.status));
    
    if (active) {
      // If we have an active shipment, start moving closer and closer to the destination!
      const destLat = parseFloat(active.order_details.delivery_latitude);
      const destLng = parseFloat(active.order_details.delivery_longitude);
      
      simulationIntervalRef.current = setInterval(async () => {
        setSimLat((prevLat) => {
          setSimLng((prevLng) => {
            // Compute incremental steps towards customer coordinates
            const deltaLat = destLat - prevLat;
            const deltaLng = destLng - prevLng;
            
            // Speed factor
            const stepLat = prevLat + (deltaLat * 0.05) + (Math.random() - 0.5) * 0.0001;
            const stepLng = prevLng + (deltaLng * 0.05) + (Math.random() - 0.5) * 0.0001;
            
            // Post incremental coordinate packet to telemetry REST API!
            API.post(`/delivery/${active.id}/telemetry/`, {
              latitude: stepLat.toFixed(6),
              longitude: stepLng.toFixed(6)
            }).catch(console.error);

            return stepLng;
          });
          return prevLat + (destLat - prevLat) * 0.05;
        });
      }, 7000);
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    }

    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [activeAssignments]);

  const handleAcceptOrder = async (orderId) => {
    try {
      await API.post(`/delivery/${orderId}/accept/`);
      loadDeliveryData();
      setActiveTab('active');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (assignmentId, newStatus) => {
    try {
      await API.post(`/delivery/${assignmentId}/update-delivery-status/`, { status: newStatus });
      loadDeliveryData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const res = await API.put('/delivery/profile/', { is_available: !profile.is_available });
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkbg-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  const activeShipment = activeAssignments.find((a) => ['ACCEPTED', 'PICKED_UP'].includes(a.status));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-darkbg-200 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Standalone Rider Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-darkbg-100 border-b border-slate-200 dark:border-slate-800 shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center space-x-2 text-xl font-extrabold tracking-tight text-amber-500">
              <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded-lg shadow-glass">R</span>
              <span className="hidden sm:inline">Rider Companion</span>
            </div>

            {/* Navigation Links for Rider Modules */}
            {profile && (
              <nav className="flex space-x-1 sm:space-x-2">
                {['active', 'available', 'profile'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === tab 
                        ? 'bg-amber-500 text-white shadow-glass' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab === 'active' ? 'ACTIVE JOB' : tab === 'available' ? 'FIND JOBS' : 'MY STATS'}
                  </button>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden md:inline text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Rider Profile: {user?.username}
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
      
      {/* Rider Header Bar with Toggle Availability */}
      <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-glass font-bold animate-pulse">
            🚴
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight">Rider Companion Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Available: <span className={profile?.is_available ? 'text-emerald-500 font-bold' : 'text-slate-500'}>
                {profile?.is_available ? 'Online (Accepting Jobs)' : 'Offline'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleToggleAvailability}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-premium ${
              profile?.is_available
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {profile?.is_available ? 'Go Offline' : 'Go Online 🟢'}
          </button>
        </div>
      </div>

      {/* Tabs panels */}
      {activeTab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Job Timeline & Updates */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Active Shipment</h3>
            
            {!activeShipment ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No claimed active shipments. Toggle "Available Jobs" tab to accept shipments.
              </div>
            ) : (
              <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between">
                  <div>
                    <p className="text-xs font-extrabold">Order #{activeShipment.order_details.id}</p>
                    <p className="text-[9px] text-slate-400">Pickup: {activeShipment.order_details.shop_details.name}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full">
                    Payout: {activeShipment.earnings} INR
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                  <p>🏪 **From Store**: {activeShipment.order_details.shop_details.address_text}</p>
                  <p>🏠 **To Customer**: {activeShipment.order_details.delivery_address}</p>
                  <p>📞 Phone: {activeShipment.order_details.shop_details.phone || 'N/A'}</p>
                </div>

                {/* Simulation coordinates panel */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl space-y-1">
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">🛰️ Live Telemetry Simulator</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Streaming active rider coordinates: **{simLat.toFixed(5)} Lat, {simLng.toFixed(5)} Lng**. Customer is watching your pin move on their Leaflet map!
                  </p>
                </div>

                {/* Status Update Button */}
                <div className="pt-2">
                  {activeShipment.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus(activeShipment.id, 'PICKED_UP')}
                      className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-glass"
                    >
                      Confirm Items Picked Up 📦
                    </button>
                  )}
                  {activeShipment.status === 'PICKED_UP' && (
                    <button
                      onClick={() => handleUpdateStatus(activeShipment.id, 'DELIVERED')}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-glass"
                    >
                      Confirm Order Delivered ✓
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Job Map Routing */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Route Optimization Map</h3>
            <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/30 shadow-premium">
              {activeShipment ? (
                <MapContainer
                  center={[parseFloat(activeShipment.order_details.shop_details.latitude), parseFloat(activeShipment.order_details.shop_details.longitude)]}
                  zoom={14}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {/* Shop */}
                  <Marker 
                    position={[parseFloat(activeShipment.order_details.shop_details.latitude), parseFloat(activeShipment.order_details.shop_details.longitude)]}
                    icon={shopIcon}
                  >
                    <Popup><p className="text-xs font-bold">🏪 Pickup Shop</p></Popup>
                  </Marker>
                  {/* Customer */}
                  <Marker 
                    position={[parseFloat(activeShipment.order_details.delivery_latitude), parseFloat(activeShipment.order_details.delivery_longitude)]}
                    icon={customerIcon}
                  >
                    <Popup><p className="text-xs font-bold">🏠 Customer Destination</p></Popup>
                  </Marker>
                  {/* Rider */}
                  <Marker 
                    position={[simLat, simLng]}
                    icon={riderIcon}
                  >
                    <Popup><p className="text-xs font-bold">🚴 You (Active Telemetry)</p></Popup>
                  </Marker>
                  
                  {/* Polyline Route */}
                  <Polyline 
                    positions={[
                      [parseFloat(activeShipment.order_details.shop_details.latitude), parseFloat(activeShipment.order_details.shop_details.longitude)],
                      [simLat, simLng],
                      [parseFloat(activeShipment.order_details.delivery_latitude), parseFloat(activeShipment.order_details.delivery_longitude)]
                    ]}
                    pathOptions={{ color: '#fb7185', weight: 4, opacity: 0.7 }}
                  />
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-darkbg-100 text-xs text-slate-400">
                  Interactive route maps load when a job is claimed.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'available' && (
        <div className="space-y-6">
          <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
            Available Jobs Nearby ({availableOrders.length})
          </h3>

          {!profile?.is_available ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              You must switch your status to "Online" to list and accept shipments.
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              All nearby orders have been claimed. Check back shortly for new dispatch jobs.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableOrders.map((ord) => (
                <div 
                  key={ord.id}
                  className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-5 rounded-2xl shadow-premium flex justify-between gap-4 items-center"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Order #{ord.id}</p>
                    <p className="text-[10px] text-slate-400 truncate">Store: {ord.shop_details.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">Dest: {ord.delivery_address}</p>
                  </div>
                  <div className="flex-shrink-0 text-center space-y-2">
                    <p className="text-xs font-extrabold text-brand-500">15.00 INR</p>
                    <button
                      onClick={() => handleAcceptOrder(ord.id)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold shadow-premium whitespace-nowrap"
                    >
                      Accept Job ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium max-w-md">
          <h3 className="font-extrabold text-sm border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Earnings & Stats</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Completed Payouts</span>
              <span className="font-bold text-emerald-500">{parseFloat(profile?.total_earnings || 0).toFixed(2)} INR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vehicle Registered</span>
              <span className="font-semibold">{profile?.vehicle_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Verification Status</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${profile?.is_verified ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-600'}`}>
                {profile?.is_verified ? 'Verified Rider' : 'Pending Verification'}
              </span>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
