import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES, calculateFare } from '@/lib/fareUtils';
import { ArrowLeft, AlertCircle, Check, Loader2, MapPin } from 'lucide-react';
import { Link } from '@tanstack/react-router';

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
  const [stops] = useState([]);
  const [fareAdjust, setFareAdjust] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  // Auto-calculate distance using Mapbox
  useEffect(() => {
    if (form.pickup_address && form.dropoff_address && form.pickup_address !== form.dropoff_address) {
      calculateDistance();
    }
  }, [form.pickup_address, form.dropoff_address]);

  async function calculateDistance() {
    if (!form.pickup_address.trim() || !form.dropoff_address.trim()) return;
    
    setCalculatingDistance(true);
    try {
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!mapboxToken) {
        console.log('Mapbox token not found, using manual entry');
        setCalculatingDistance(false);
        return;
      }

      const pickup = encodeURIComponent(form.pickup_address);
      const dropoff = encodeURIComponent(form.dropoff_address);
      
      const geocodePickup = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${pickup}.json?country=BW&limit=1&access_token=${mapboxToken}`
      ).then(r => r.json());

      const geocodeDropoff = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${dropoff}.json?country=BW&limit=1&access_token=${mapboxToken}`
      ).then(r => r.json());

      if (geocodePickup.features?.[0] && geocodeDropoff.features?.[0]) {
        const pickupCoords = geocodePickup.features[0].geometry.coordinates;
        const dropoffCoords = geocodeDropoff.features[0].geometry.coordinates;

        // Calculate distance using Haversine formula
        const dist = calculateHaversineDistance(pickupCoords, dropoffCoords);
        
        if (dist > 0.5) {
          setForm(prev => ({
            ...prev,
            dropoff_distance_km: parseFloat(dist.toFixed(1))
          }));
        }
      }
    } catch (err) {
      console.log('Distance calculation failed, use manual entry');
    } finally {
      setCalculatingDistance(false);
    }
  }

  function calculateHaversineDistance(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const distance = parseFloat(form.dropoff_distance_km) || 0;
  const baseFare = form.category ? calculateFare(form.category, distance) : 0;
  const offeredFare = Math.max(0, baseFare + fareAdjust);

  // Check if form is complete
  const isComplete = form.pickup_address.trim() && form.dropoff_address.trim() && 
                     form.dropoff_distance_km && form.category && 
                     form.goods_description.trim() && form.client_phone.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    try {
      const payload = {
        pickup_address: form.pickup_address,
        dropoff_address: form.dropoff_address,
        category: form.category,
        goods_description: form.goods_description,
        distance_km: parseFloat(form.dropoff_distance_km),
        base_fare: baseFare,
        offered_fare: offeredFare,
        client_phone: form.client_phone,
        stops,
      };

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/broadcast-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to broadcast');
      }

      setSuccess(true);
      setTimeout(() => navigate({ to: '/my-bookings' }), 1500);
    } catch (err) {
      setError(err.message || 'Failed. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="bg-[#3D2B0E] px-4 pt-10 pb-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95">
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">New Request</p>
            <h1 className="text-xl font-extrabold text-white">Book Transport</h1>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-900 text-sm">Request sent!</p>
            <p className="text-xs text-green-700">Redirecting...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-900">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="p-4 pb-32 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pickup */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <Label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Pickup Location *</Label>
            <Input
              className="mt-2 h-12 rounded-xl text-base bg-[#F9FAFB] border-[#E5E7EB] placeholder-[#9CA3AF]"
              placeholder="e.g. Game City, Gaborone"
              value={form.pickup_address}
              onChange={e => setForm(prev => ({ ...prev, pickup_address: e.target.value }))}
              required
            />
          </div>

          {/* Dropoff */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <Label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Dropoff Location *</Label>
            <Input
              className="mt-2 h-12 rounded-xl text-base bg-[#F9FAFB] border-[#E5E7EB] placeholder-[#9CA3AF]"
              placeholder="e.g. Francistown CBD"
              value={form.dropoff_address}
              onChange={e => setForm(prev => ({ ...prev, dropoff_address: e.target.value }))}
              required
            />
          </div>

          {/* Category */}
          {!form.category ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
              <Label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Truck Type *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setForm(prev => ({ ...prev, category: key }))}
                    type="button"
                    className="p-3 rounded-xl border-2 border-[#E5E7EB] hover:border-[#C9A05A] hover:bg-[#FFF8EC] transition-all text-center"
                  >
                    <p className="text-2xl">{cat.icon}</p>
                    <p className="text-xs font-bold text-[#3D2B0E] mt-1">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-[#C9A05A] rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{CATEGORIES[form.category]?.icon}</span>
                <div>
                  <p className="text-sm font-bold text-[#3D2B0E]">{CATEGORIES[form.category]?.label}</p>
                  <p className="text-xs text-[#6B7280]">{CATEGORIES[form.category]?.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setForm(prev => ({ ...prev, category: '' }))}
                className="text-[#9CA3AF] hover:text-[#6B7280] text-lg"
              >
                ✕
              </button>
            </div>
          )}

          {/* Distance */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Distance (km) *</Label>
              {calculatingDistance && (
                <span className="text-xs text-[#C9A05A] font-semibold flex items-center gap-1">
                  <span className="h-2 w-2 bg-[#C9A05A] rounded-full animate-pulse"></span>
                  Auto-calculating...
                </span>
              )}
            </div>
            <div className="relative mt-2">
              <Input
                type="number"
                min="0.1"
                step="0.1"
                className="h-12 rounded-xl text-base bg-[#F9FAFB] border-[#E5E7EB] pr-10"
                placeholder="Distance auto-calculated"
                value={form.dropoff_distance_km}
                onChange={e => setForm(prev => ({ ...prev, dropoff_distance_km: e.target.value }))}
                required
                disabled={calculatingDistance}
              />
              {form.dropoff_distance_km && (
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C9A05A]" />
              )}
            </div>
            {form.pickup_address && form.dropoff_address && !form.dropoff_distance_km && (
              <p className="text-xs text-[#6B7280] mt-2">Calculating distance...</p>
            )}
          </div>

          {/* Goods */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <Label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">What are you transporting? *</Label>
            <Textarea
              className="mt-2 rounded-xl text-base bg-[#F9FAFB] border-[#E5E7EB] resize-none"
              placeholder="e.g. 3 sofas and a fridge"
              value={form.goods_description}
              onChange={e => setForm(prev => ({ ...prev, goods_description: e.target.value }))}
              required
              rows={3}
            />
          </div>

          {/* Phone */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <Label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Phone Number *</Label>
            <Input
              className="mt-2 h-12 rounded-xl text-base bg-[#F9FAFB] border-[#E5E7EB]"
              placeholder="+267 7X XXX XXX"
              value={form.client_phone}
              onChange={e => setForm(prev => ({ ...prev, client_phone: e.target.value }))}
              required
            />
          </div>

          {/* Pricing Summary */}
          {form.category && (
            <div className="bg-gradient-to-r from-[#FFF8EC] to-[#FFFBF3] border border-[#C9A05A]/20 rounded-2xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#6B7280]">Base fare</span>
                  <span className="font-semibold text-[#3D2B0E]">P{baseFare}</span>
                </div>
                {fareAdjust !== 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280]">Adjustment</span>
                    <span className={`font-semibold ${fareAdjust > 0 ? 'text-[#C9A05A]' : 'text-red-500'}`}>
                      {fareAdjust > 0 ? '+' : ''}P{fareAdjust}
                    </span>
                  </div>
                )}
                <div className="border-t border-[#C9A05A]/20 pt-2 flex justify-between items-center">
                  <span className="font-bold text-[#3D2B0E]">Total offer</span>
                  <span className="text-2xl font-extrabold text-[#C9A05A]">P{offeredFare}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* CTA Button - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] shadow-2xl">
        <div className="max-w-lg mx-auto px-4 py-3 pb-safe">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || !isComplete}
            className={`w-full h-14 text-base font-extrabold rounded-2xl transition-all active:scale-95 ${
              isComplete
                ? 'bg-[#C9A05A] hover:bg-[#B08A45] text-white shadow-lg shadow-[#C9A05A]/30'
                : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Broadcasting...
              </span>
            ) : (
              <>
                <span className="text-lg">📡</span>
                <span className="ml-2">Broadcast Request — P{offeredFare}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
