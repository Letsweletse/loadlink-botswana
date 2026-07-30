import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES, calculateFare, calculateFuelSurcharge, BASE_RADIUS_KM } from '@/lib/fareUtils';
import { ArrowLeft, MapPin, Route, Loader2, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import StopsBuilder from '@/components/StopsBuilder';
import { notifyMatchingDrivers } from '@/hooks/useNotifyDrivers';
import { Link } from '@tanstack/react-router';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(address) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, {
    headers: { 'Accept-Language': 'en' }
  });
  const data = await res.json();
  if (!data.length) throw new Error(`Could not find: ${address}`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function getRoadDistanceKm(fromCoord, toCoord) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromCoord.lng},${fromCoord.lat};${toCoord.lng},${toCoord.lat}?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Could not calculate road distance');
  return data.routes[0].distance / 1000;
}

export default function NewBooking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);

  const [form, setForm] = useState({
    pickup_address: '',
    dropoff_address: '',
    dropoff_distance_km: '',
    category: params.get('category') || '',
    goods_description: '',
    client_phone: user?.phone || '',
  });
  const [stops, setStops] = useState([]);
  const [fareAdjust, setFareAdjust] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState('');
  const calcTimeout = useRef(null);

  const autoCalcDistance = useCallback(async (pickup, dropoff) => {
    if (!pickup.trim() || !dropoff.trim()) return;
    clearTimeout(calcTimeout.current);
    calcTimeout.current = setTimeout(async () => {
      setCalcLoading(true);
      setCalcError('');
      try {
        const [pCoord, dCoord] = await Promise.all([geocode(pickup), geocode(dropoff)]);
        const km = await getRoadDistanceKm(pCoord, dCoord);
        setForm(prev => ({ ...prev, dropoff_distance_km: km.toFixed(1) }));
      } catch {
        setCalcError('Could not calculate distance. Enter manually.');
      } finally {
        setCalcLoading(false);
      }
    }, 800);
  }, []);

  const stopDistances = stops.reduce((s, st) => s + (parseFloat(st.distance_from_prev_km) || 0), 0);
  const distance = stopDistances + (parseFloat(form.dropoff_distance_km) || 0);
  const isHourly = form.category === 'plant_machinery';
  const baseFare = form.category && !isHourly ? calculateFare(form.category, distance) : isHourly ? 500 : 0;
  const offeredFare = Math.max(0, baseFare + fareAdjust);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const stopsPayload = stops.map(s => ({ address: s.address, distance_from_prev_km: parseFloat(s.distance_from_prev_km) || 0, completed: false }));
    const newBooking = await base44.entities.Booking.create({
      client_email: user.email,
      client_name: user.full_name,
      client_phone: form.client_phone,
      pickup_address: form.pickup_address,
      dropoff_address: form.dropoff_address,
      stops: stopsPayload,
      category: form.category,
      goods_description: form.goods_description,
      distance_km: distance,
      base_fare: baseFare,
      offered_fare: offeredFare,
      status: 'broadcasting',
    });
    notifyMatchingDrivers(newBooking).catch(console.error);
    navigate({ to: '/my-bookings' });
  }

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

      {/* Header */}
      <div className="bg-[#0F0F0F] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">New Request</p>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Book Transport</h1>
          </div>
        </div>
      </div>

      <div className="p-4 pb-32">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Locations */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">Route</p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <Label className="text-xs font-semibold text-[#6B7280]">Pickup Location</Label>
                <div className="relative mt-1.5">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#FFF0E6] border-2 border-[#F97316] flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-[#F97316]" />
                  </div>
                  <Input
                    className="pl-11 h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-[#0F0F0F]"
                    placeholder="e.g. Game City, Gaborone"
                    value={form.pickup_address}
                    onChange={e => { update('pickup_address', e.target.value); autoCalcDistance(e.target.value, form.dropoff_address); }}
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#6B7280]">Stop-off Points <span className="text-[#9CA3AF] font-normal">(optional)</span></Label>
                <div className="mt-1.5">
                  <StopsBuilder stops={stops} onChange={setStops} />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#6B7280]">Drop-off Location</Label>
                <div className="relative mt-1.5">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#0F0F0F] flex items-center justify-center">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <Input
                    className="pl-11 h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-[#0F0F0F]"
                    placeholder="e.g. Francistown CBD"
                    value={form.dropoff_address}
                    onChange={e => { update('dropoff_address', e.target.value); autoCalcDistance(form.pickup_address, e.target.value); }}
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#6B7280] flex items-center gap-2">
                  Distance to drop-off (km)
                  {calcLoading && <Loader2 className="h-3 w-3 animate-spin text-[#9CA3AF]" />}
                  {!calcLoading && form.dropoff_distance_km && (
                    <span className="text-[#F97316] font-normal">Auto-calculated</span>
                  )}
                </Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="mt-1.5 h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-[#0F0F0F]"
                  placeholder="Auto-calculated or enter manually"
                  value={form.dropoff_distance_km}
                  onChange={e => update('dropoff_distance_km', e.target.value)}
                  required
                />
                {calcError && <p className="text-xs text-red-500 mt-1">{calcError}</p>}
                {distance > 0 && !calcError && (
                  <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
                    <Route className="h-3 w-3" />
                    Total route: {distance.toFixed(1)} km{stops.length > 0 ? ` across ${stops.length + 1} segments` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Live Fare Estimator */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">Select Vehicle & Fare</p>
              {distance > 0 && <span className="text-xs font-semibold text-[#F97316]">{distance.toFixed(1)} km</span>}
            </div>
            <div className="divide-y divide-[#E5E7EB]">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const est = calculateFare(key, distance);
                const isSelected = form.category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update('category', key)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${
                      isSelected ? 'bg-[#FFF0E6]' : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${isSelected ? 'bg-[#F97316]/10' : 'bg-[#F9FAFB]'}`}>
                        {cat.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isSelected ? 'text-[#F97316]' : 'text-[#0F0F0F]'}`}>{cat.label}</p>
                        <p className="text-xs text-[#6B7280]">Deposit: P{cat.deposit}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className={`font-extrabold ${isSelected ? 'text-[#F97316] text-lg' : 'text-sm text-[#0F0F0F]'}`}>
                        {cat.hourly ? `P${isSelected ? Math.max(0, 500 + fareAdjust) : 500}/hr` : `P${isSelected ? Math.max(0, est + fareAdjust) : est}`}
                      </p>
                      {isSelected && <div className="h-5 w-5 rounded-full bg-[#F97316] flex items-center justify-center"><ChevronRight className="h-3 w-3 text-white" /></div>}
                    </div>
                  </button>
                );
              })}
            </div>

            {form.category && baseFare > 0 && (
              <div className="px-4 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] space-y-3">
                {!isHourly && distance > BASE_RADIUS_KM && (
                  <div className="space-y-1.5 pb-3 border-b border-[#E5E7EB]">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6B7280]">Base fare</span>
                      <span className="font-medium text-[#0F0F0F]">P{CATEGORIES[form.category].baseFare}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6B7280]">Fuel surcharge ({(distance - BASE_RADIUS_KM).toFixed(1)} km beyond {BASE_RADIUS_KM} km)</span>
                      <span className="font-medium text-[#F97316]">+P{calculateFuelSurcharge(distance)}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#0F0F0F]">Adjust Offer</p>
                  <span className={`text-xs font-bold ${fareAdjust < 0 ? 'text-red-500' : fareAdjust > 0 ? 'text-[#F97316]' : 'text-[#6B7280]'}`}>
                    {fareAdjust === 0 ? 'Recommended' : fareAdjust > 0 ? `+P${fareAdjust}` : `-P${Math.abs(fareAdjust)}`}
                  </span>
                </div>
                <Slider
                  min={-Math.round(baseFare * 0.5)}
                  max={Math.round(baseFare * (isHourly ? 5 : 1))}
                  step={10}
                  value={[fareAdjust]}
                  onValueChange={([v]) => setFareAdjust(v)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#9CA3AF]">
                  <span>P{Math.max(0, baseFare - Math.round(baseFare * 0.5))}</span>
                  <button type="button" onClick={() => setFareAdjust(0)} className="text-[#F97316] font-semibold">Reset</button>
                  <span>P{baseFare + Math.round(baseFare * (isHourly ? 5 : 1))}</span>
                </div>
              </div>
            )}
          </div>

          {/* Goods */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">What are you transporting?</Label>
            <Textarea
              className="mt-2 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-[#0F0F0F] resize-none"
              placeholder="e.g. 3 sofas and a fridge"
              value={form.goods_description}
              onChange={e => update('goods_description', e.target.value)}
              required
              rows={3}
            />
          </div>

          {/* Phone */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">WhatsApp / Phone Number</Label>
            <Input
              className="mt-2 h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-[#0F0F0F]"
              placeholder="+267 7X XXX XXX"
              value={form.client_phone}
              onChange={e => update('client_phone', e.target.value)}
              required
            />
          </div>

          {/* Submit — fixed */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-4 py-3 pb-safe max-w-lg mx-auto">
            <Button
              type="submit"
              className="w-full h-14 text-base font-extrabold rounded-2xl bg-[#F97316] hover:bg-[#EA6A0A] text-white shadow-lg shadow-[#F97316]/20 disabled:opacity-50"
              disabled={submitting || !form.category}
            >
              {submitting ? 'Broadcasting…' : `Broadcast — P${offeredFare}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
