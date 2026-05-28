import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Leaflet custom marker icons
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-rose.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const shopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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

export default function OrderTracking() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [order, setOrder] = useState(null);
  
  // Real-time Delivery coordinates telemetry
  const [riderCoords, setRiderCoords] = useState(null);
  const wsRef = useRef(null);

  // Status mapping
  const statusLevels = ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const getStatusIndex = (currentStatus) => statusLevels.indexOf(currentStatus);

  // Fetch initial order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await API.get(`/orders/${id}/`);
        setOrder(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrderDetails();
  }, [id]);

  // WebSocket Live Updates Connection
  useEffect(() => {
    if (!user || !order) return;

    // Establish link to notifications consumer
    const wsUrl = `ws://localhost:8000/ws/notifications/?user_id=${user.id}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to real-time order tracking WebSocket.');
      // Send signal to subscribe to tracking this specific order
      ws.send(JSON.stringify({
        action: 'track_order',
        order_id: id
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WS Message received:', data);

      if (data.type === 'order_status_update' && parseInt(data.order_id) === parseInt(id)) {
        setOrder((prev) => prev ? { ...prev, status: data.status } : null);
      }
      
      else if (data.type === 'live_location') {
        // Streamed active rider telemetry
        setRiderCoords({
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude)
        });
      }
    };

    ws.onclose = () => {
      console.log('Order tracking WebSocket disconnected.');
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [user, order, id]);

  if (!order) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-darkbg-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  const currentIdx = getStatusIndex(order.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hyperlocal Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/30">
        <div>
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/20 text-brand-500">
            Order #{order.id}
          </span>
          <h1 className="text-xl font-extrabold tracking-tight mt-1.5">Live Delivery Companion</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Status modifications automatically trigger browser alerts and map refreshes.
          </p>
        </div>
        <Link 
          to="/"
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full text-xs font-bold text-center shadow-premium"
        >
          Go Back Home 🏪
        </Link>
      </div>

      {/* Grid Layout: Map Left, Tracking Timeline Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Visual Route Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[450px] rounded-2xl overflow-hidden shadow-premium border border-slate-200/50 dark:border-slate-800/30">
            <MapContainer
              center={[parseFloat(order.delivery_latitude), parseFloat(order.delivery_longitude)]}
              zoom={14}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Customer Delivery Pin */}
              <Marker 
                position={[parseFloat(order.delivery_latitude), parseFloat(order.delivery_longitude)]} 
                icon={customerIcon}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold">🏠 Delivery Address</p>
                    <p className="text-[10px] text-slate-400 mt-1">{order.delivery_address}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Shop Pickup Pin */}
              <Marker 
                position={[parseFloat(order.shop_details.latitude), parseFloat(order.shop_details.longitude)]} 
                icon={shopIcon}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold">🏪 Pickup Shop: {order.shop_details.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{order.shop_details.address_text}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Active Delivery Rider Pin (Rendered dynamically when active coordinates are streamed) */}
              {(riderCoords || (order.status === 'OUT_FOR_DELIVERY')) && (
                <Marker 
                  position={[
                    riderCoords?.latitude || parseFloat(order.shop_details.latitude) + 0.002, 
                    riderCoords?.longitude || parseFloat(order.shop_details.longitude) + 0.002
                  ]} 
                  icon={riderIcon}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">🚴 Delivery Partner</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">En route with your order!</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Route Polyline connecting Shop and Customer */}
              <Polyline 
                positions={[
                  [parseFloat(order.shop_details.latitude), parseFloat(order.shop_details.longitude)],
                  [parseFloat(order.delivery_latitude), parseFloat(order.delivery_longitude)]
                ]}
                pathOptions={{ color: '#f43f5e', weight: 4, dashArray: '6, 12', opacity: 0.7 }}
              />
            </MapContainer>
          </div>
        </div>

        {/* Right Column: Status Timeline & Bill details */}
        <div className="space-y-6">
          
          {/* Tracking Timeline */}
          <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-6">
            <h3 className="font-extrabold text-sm uppercase tracking-tight text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              Delivery Progress
            </h3>

            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-6 py-1">
              
              {/* Timeline Item: Pending */}
              <div className="relative pl-6">
                <span className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentIdx >= 0 ? 'bg-brand-500 text-white live-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  {currentIdx > 0 ? '✓' : '1'}
                </span>
                <div className="text-xs">
                  <p className={`font-bold ${currentIdx >= 0 ? 'text-brand-500' : 'text-slate-400'}`}>Order Placed</p>
                  <p className="text-[10px] text-slate-400">Waiting for merchant confirmation</p>
                </div>
              </div>

              {/* Timeline Item: Accepted */}
              <div className="relative pl-6">
                <span className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentIdx >= 1 ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  {currentIdx > 1 ? '✓' : '2'}
                </span>
                <div className="text-xs">
                  <p className={`font-bold ${currentIdx >= 1 ? 'text-brand-500' : 'text-slate-400'}`}>Accepted by Shop</p>
                  <p className="text-[10px] text-slate-400">Shop owner approved your order</p>
                </div>
              </div>

              {/* Timeline Item: Preparing */}
              <div className="relative pl-6">
                <span className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentIdx >= 2 ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  {currentIdx > 2 ? '✓' : '3'}
                </span>
                <div className="text-xs">
                  <p className={`font-bold ${currentIdx >= 2 ? 'text-brand-500' : 'text-slate-400'}`}>Preparing Meal / Package</p>
                  <p className="text-[10px] text-slate-400">Rider is assigned and prepared</p>
                </div>
              </div>

              {/* Timeline Item: Out for Delivery */}
              <div className="relative pl-6">
                <span className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentIdx >= 3 ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  {currentIdx > 3 ? '✓' : '4'}
                </span>
                <div className="text-xs">
                  <p className={`font-bold ${currentIdx >= 3 ? 'text-brand-500' : 'text-slate-400'}`}>Out for Delivery</p>
                  <p className="text-[10px] text-slate-400">Rider is traveling to your location</p>
                </div>
              </div>

              {/* Timeline Item: Delivered */}
              <div className="relative pl-6">
                <span className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentIdx >= 4 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  {currentIdx >= 4 ? '✓' : '5'}
                </span>
                <div className="text-xs">
                  <p className={`font-bold ${currentIdx >= 4 ? 'text-emerald-500' : 'text-slate-400'}`}>Order Delivered</p>
                  <p className="text-[10px] text-slate-400">Enjoy your items!</p>
                </div>
              </div>

            </div>
          </div>

          {/* Checkout Item list review */}
          <div className="bg-white dark:bg-darkbg-100 border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl shadow-premium space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-tight text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              Items Ordered
            </h3>
            
            <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800 max-h-36 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 text-xs">
                  <div>
                    <span className="font-bold">{item.product_name}</span>
                    {item.variant_name && <span className="text-[9px] text-slate-400 block">{item.variant_name}</span>}
                  </div>
                  <span className="text-slate-500 font-semibold">{item.quantity}x</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-200/50 dark:border-slate-800/30 pt-3 flex justify-between text-xs font-extrabold text-brand-500">
              <span>Paid via {order.payment_method}</span>
              <span>{order.total_amount} INR</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
