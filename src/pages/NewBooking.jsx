import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORIES, calculateFare } from '@/lib/fareUtils';
import { ArrowLeft, AlertCircle } from 'lucide-react';
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

  const distance = parseFloat(form.dropoff_distance_km) || 0;
  const baseFare = form.category ? calculateFare(form.category, distance) : 0;
  const offeredFare = Math.max(0, baseFare + fareAdjust);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
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

      // Call backend - all validation happens there
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

      navigate({ to: '/my-bookings' });
    } catch (err) {
      setError(err.message || 'Failed to broadcast. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen pb-32">
      <div className="bg-[#3D2B0E] px-3 sm:px-4 pt-10 sm:pt-12 pb-5 sm:pb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/" className="h-8 sm:h-9 w-8 sm:w-9 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
          <h1 className="text-base sm:text-lg font-extrabold text-white">Book Transport</h1>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-900">{error}</p>
            </div>
          )}

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4">
            <Label className="text-xs font-semibold text-[#6B7280]">Pickup Location *</Label>
            <Input
              className="mt-1 h-10 sm:h-11 rounded-lg text-sm"
              placeholder="e.g. Game City, Gaborone"
              value={form.pickup_address}
              onChange={e => setForm(prev => ({ ...prev, pickup_address: e.target.value }))}
              required
            />
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4">
            <Label className="text-xs font-semibold text-[#6B7280]">Drop-off Location *</Label>
            <Input
              className="mt-1 h-10 sm:h-11 rounded-lg text-sm"
              placeholder="e.g. Francistown CBD"
              value={form.dropoff_address}
              onChange={e => setForm(prev => ({ ...prev, dropoff_address: e.target.value }))}
              required
            />
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4">
            <Label className="text-xs font-semibold text-[#6B7280]">Distance (km) *</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              className="mt-1 h-10 sm:h-11 rounded-lg text-sm"
              value={form.dropoff_distance_km}
              onChange={e => setForm(prev => ({ ...prev, dropoff_distance_km: e.target.value }))}
              required
            />
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4">
            <Label className="text-xs font-semibold text-[#6B7280]">What are you transporting? *</Label>
            <Textarea
              className="mt-2 rounded-lg text-sm resize-none"
              placeholder="e.g. 3 sofas and a fridge"
              value={form.goods_description}
              onChange={e => setForm(prev => ({ ...prev, goods_description: e.target.value }))}
              required
              rows={3}
            />
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:p-4">
            <Label className="text-xs font-semibold text-[#6B7280]">Phone Number *</Label>
            <Input
              className="mt-2 h-10 sm:h-11 rounded-lg text-sm"
              placeholder="+267 7X XXX XXX"
              value={form.client_phone}
              onChange={e => setForm(prev => ({ ...prev, client_phone: e.target.value }))}
              required
            />
          </div>
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-3 sm:px-4 py-3 max-w-lg mx-auto">
        <Button
          type="submit"
          onClick={handleSubmit}
          className="w-full h-12 sm:h-14 text-base font-extrabold rounded-lg sm:rounded-2xl bg-[#C9A05A] hover:bg-[#B08A45] text-white shadow-lg disabled:opacity-50"
          disabled={submitting || !form.category}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Broadcasting…
            </span>
          ) : (
            `📡 Broadcast — P${offeredFare}`
          )}
        </Button>
      </div>
    </div>
  );
}
