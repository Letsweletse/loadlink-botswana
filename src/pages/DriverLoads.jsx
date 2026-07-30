import { useState, useEffect, useCallback } from 'react';
import useDriverLocation from '@/hooks/useDriverLocation';
import useDriverNotifications from '@/hooks/useDriverNotifications';
import QuickAcceptSheet from '@/components/QuickAcceptSheet';
import LoadBoardFilters from '@/components/LoadBoardFilters';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import BookingCard from '@/components/BookingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Bell, Navigation, CalendarDays, Wifi, WifiOff, MapPin } from 'lucide-react';
import DriverSchedule from '@/components/DriverSchedule';

function haversineKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEFAULT_FILTERS = { category: 'any', minFare: 0, maxFare: 0, maxDistanceKm: 0, sortBy: 'newest' };

export default function DriverLoads() {
  const { user } = useAuth();
  const [available, setAvailable] = useState([]);
  const [myLoads, setMyLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [savedSearches, setSavedSearches] = useState([]);
  const [matchAlerts, setMatchAlerts] = useState([]);

  useEffect(() => {
    base44.entities.Vehicle.filter({ driver_email: user.email, status: 'approved' }, '-created_date', 1)
      .then(res => setVehicle(res[0] || null));
  }, [user.email]);

  const { tracking, startTracking, stopTracking, error: gpsError } = useDriverLocation(vehicle?.id);
  const { pendingNotification, dismissNotification } = useDriverNotifications(user.email);

  async function toggleAvailability() {
    if (!vehicle) return;
    const next = !vehicle.is_available;
    await base44.entities.Vehicle.update(vehicle.id, { is_available: next });
    setVehicle({ ...vehicle, is_available: next });
  }

  const loadData = useCallback(() => {
    return Promise.all([
      base44.entities.Booking.filter({ status: 'broadcasting' }, '-created_date', 100),
      base44.entities.Booking.filter({ driver_email: user.email }, '-created_date', 50),
    ]).then(([avail, mine]) => {
      setAvailable(avail);
      setMyLoads(mine);
    }).finally(() => setLoading(false));
  }, [user.email]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadSavedSearches = useCallback(() => {
    base44.entities.SavedSearch.filter({ driver_email: user.email }, '-created_date', 20)
      .then(setSavedSearches);
  }, [user.email]);

  useEffect(() => { loadSavedSearches(); }, [loadSavedSearches]);

  useEffect(() => {
    if (!savedSearches.length || !available.length) return;
    const alerts = [];
    for (const s of savedSearches) {
      const matched = available.filter(b => {
        if (s.category && s.category !== 'any' && b.category !== s.category) return false;
        const fare = b.offered_fare || b.base_fare || 0;
        if (s.min_fare > 0 && fare < s.min_fare) return false;
        if (s.max_fare > 0 && fare > s.max_fare) return false;
        if (s.max_distance_km > 0 && vehicle?.current_lat) {
          const dist = haversineKm(vehicle.current_lat, vehicle.current_lng, b.pickup_lat, b.pickup_lng);
          if (dist !== null && dist > s.max_distance_km) return false;
        }
        return true;
      }).length;
      if (matched > 0) alerts.push({ search: s, count: matched });
    }
    setMatchAlerts(alerts);
  }, [savedSearches, available, vehicle]);

  const driverLat = vehicle?.current_lat;
  const driverLng = vehicle?.current_lng;

  const activeLoad = myLoads.find(b => ['picked_up', 'in_transit'].includes(b.status) && b.driver_email === user.email);

  const enRouteLoads = activeLoad
    ? available.filter(b => {
        if (!driverLat || !driverLng) return false;
        const dist = haversineKm(driverLat, driverLng, b.pickup_lat, b.pickup_lng);
        return dist !== null && dist <= 30;
      }).sort((a, b) => {
        const da = haversineKm(driverLat, driverLng, a.pickup_lat, a.pickup_lng) ?? 9999;
        const db = haversineKm(driverLat, driverLng, b.pickup_lat, b.pickup_lng) ?? 9999;
        return da - db;
      })
    : [];

  const filtered = available
    .filter(b => {
      if (filters.category !== 'any' && b.category !== filters.category) return false;
      const fare = b.offered_fare || b.base_fare || 0;
      if (filters.minFare > 0 && fare < filters.minFare) return false;
      if (filters.maxFare > 0 && fare > filters.maxFare) return false;
      if (filters.maxDistanceKm > 0 && driverLat) {
        const dist = haversineKm(driverLat, driverLng, b.pickup_lat, b.pickup_lng);
        if (dist !== null && dist > filters.maxDistanceKm) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'fare_high') return (b.offered_fare || b.base_fare) - (a.offered_fare || a.base_fare);
      if (filters.sortBy === 'fare_low') return (a.offered_fare || a.base_fare) - (b.offered_fare || b.base_fare);
      if (filters.sortBy === 'nearest' && driverLat) {
        const da = haversineKm(driverLat, driverLng, a.pickup_lat, a.pickup_lng) ?? 9999;
        const db = haversineKm(driverLat, driverLng, b.pickup_lat, b.pickup_lng) ?? 9999;
        return da - db;
      }
      return new Date(b.created_date) - new Date(a.created_date);
    });

  const Empty = ({ text }) => (
    <div className="text-center py-14">
      <div className="h-14 w-14 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-3">
        <Truck className="h-6 w-6 text-[#9CA3AF]" />
      </div>
      <p className="text-sm text-[#6B7280]">{text}</p>
    </div>
  );

  const isOnline = vehicle?.is_available;

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

      {/* ── Signature element: Orange status bar ── */}
      <div className={`px-4 pt-12 pb-4 ${isOnline ? 'bg-[#C9A05A]' : 'bg-[#3D2B0E]'} transition-colors duration-300`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60 text-white mb-1">Load Board</p>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isOnline ? 'You\'re Online' : 'You\'re Offline'}
            </h1>
            <p className="text-xs text-white/60 mt-0.5">
              {isOnline ? `${available.length} load${available.length !== 1 ? 's' : ''} available` : 'Go online to receive loads'}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={!vehicle}
            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40 ${
              isOnline
                ? 'bg-white/20 hover:bg-white/30'
                : 'bg-[#C9A05A] hover:bg-[#B08A45]'
            }`}
          >
            {isOnline ? <Wifi className="h-6 w-6 text-white" /> : <WifiOff className="h-6 w-6 text-white" />}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">

        {/* GPS toggle */}
        <div className={`flex items-center justify-between rounded-2xl p-3.5 mb-4 border ${tracking ? 'bg-[#F0FDF4] border-[#16A34A]/30' : 'bg-white border-[#E5E7EB]'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${tracking ? 'bg-[#16A34A]/10' : 'bg-[#F9FAFB]'}`}>
              <MapPin className={`h-4 w-4 ${tracking ? 'text-[#16A34A]' : 'text-[#9CA3AF]'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#3D2B0E]">{tracking ? 'Broadcasting Location' : 'Share GPS'}</p>
              <p className="text-xs text-[#6B7280]">{gpsError || (tracking ? 'Clients can see you live' : 'Start to receive load offers')}</p>
            </div>
          </div>
          <button
            onClick={tracking ? stopTracking : startTracking}
            disabled={!vehicle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${tracking ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${tracking ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {!vehicle && (
          <div className="bg-[#FFFBEB] border border-[#D97706]/20 rounded-2xl p-3.5 mb-4">
            <p className="text-xs text-[#D97706] font-medium">Register your vehicle and get approved to go online and accept loads.</p>
          </div>
        )}

        <QuickAcceptSheet
          notification={pendingNotification}
          onDismiss={dismissNotification}
          driverEmail={user.email}
        />

        {/* Saved search alerts */}
        {matchAlerts.map(({ search, count }) => (
          <div key={search.id} className="flex items-center gap-2 bg-[#FFFBEB] border border-[#D97706]/20 rounded-2xl px-3.5 py-3 mb-3">
            <Bell className="h-4 w-4 text-[#D97706] shrink-0" />
            <p className="text-sm text-[#3D2B0E] flex-1">
              <span className="font-semibold">{search.name}:</span>{' '}
              <span className="text-[#6B7280]">{count} matching load{count > 1 ? 's' : ''} now</span>
            </p>
            <button
              onClick={() => setFilters({
                category: search.category || 'any',
                minFare: search.min_fare || 0,
                maxFare: search.max_fare || 0,
                maxDistanceKm: search.max_distance_km || 0,
                sortBy: search.sort_by || 'newest',
              })}
              className="text-xs font-bold text-[#C9A05A]"
            >
              View
            </button>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#C9A05A]/30 border-t-[#C9A05A] rounded-full animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue={activeLoad ? 'enroute' : 'available'}>
            <TabsList className="w-full mb-4 bg-white border border-[#E5E7EB] rounded-xl p-1 h-auto">
              <TabsTrigger
                value="available"
                className="flex-1 text-xs rounded-lg data-[state=active]:bg-[#C9A05A] data-[state=active]:text-white data-[state=active]:shadow-none font-semibold py-2"
              >
                Available{filtered.length !== available.length ? ` (${filtered.length}/${available.length})` : ` (${available.length})`}
              </TabsTrigger>
              {activeLoad && (
                <TabsTrigger
                  value="enroute"
                  className="flex-1 text-xs rounded-lg data-[state=active]:bg-[#C9A05A] data-[state=active]:text-white font-semibold py-2"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  En Route ({enRouteLoads.length})
                </TabsTrigger>
              )}
              <TabsTrigger
                value="my"
                className="flex-1 text-xs rounded-lg data-[state=active]:bg-[#C9A05A] data-[state=active]:text-white font-semibold py-2"
              >
                My Loads ({myLoads.length})
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="flex-1 text-xs rounded-lg data-[state=active]:bg-[#C9A05A] data-[state=active]:text-white font-semibold py-2"
              >
                <CalendarDays className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              <LoadBoardFilters
                filters={filters}
                onChange={setFilters}
                driverEmail={user.email}
                vehicleLat={driverLat}
                vehicleLng={driverLng}
                savedSearches={savedSearches}
                onSavedSearchLoad={s => setFilters({ category: s.category || 'any', minFare: s.min_fare || 0, maxFare: s.max_fare || 0, maxDistanceKm: s.max_distance_km || 0, sortBy: s.sort_by || 'newest' })}
                onSavedSearchDeleted={loadSavedSearches}
              />
              {filtered.length
                ? <div className="space-y-3">{filtered.map(b => <BookingCard key={b.id} booking={b} />)}</div>
                : <Empty text={available.length ? 'No loads match your filters' : 'No available loads right now'} />
              }
            </TabsContent>

            {activeLoad && (
              <TabsContent value="enroute">
                <div className="flex items-center gap-3 bg-[#F0FDF4] border border-[#16A34A]/20 rounded-2xl px-4 py-3 mb-4">
                  <Navigation className="h-4 w-4 text-[#16A34A] shrink-0 animate-pulse" />
                  <div>
                    <p className="font-semibold text-[#3D2B0E] text-xs">En Route Mode</p>
                    <p className="text-[#6B7280] text-xs">Loads within 30 km of your location</p>
                  </div>
                </div>
                {enRouteLoads.length
                  ? <div className="space-y-3">{enRouteLoads.map(b => <BookingCard key={b.id} booking={b} distanceKm={driverLat ? haversineKm(driverLat, driverLng, b.pickup_lat, b.pickup_lng) : null} />)}</div>
                  : <Empty text={driverLat ? 'No available loads within 30 km' : 'Enable GPS to see nearby loads'} />
                }
              </TabsContent>
            )}

            <TabsContent value="my">
              {myLoads.length
                ? <div className="space-y-3">{myLoads.map(b => <BookingCard key={b.id} booking={b} />)}</div>
                : <Empty text="You haven't accepted any loads yet" />
              }
            </TabsContent>

            <TabsContent value="schedule">
              <DriverSchedule bookings={myLoads} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
