import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CATEGORIES, getStatusColor, getStatusLabel, calculateCommission } from '@/lib/fareUtils';
import { ArrowLeft, MapPin, Phone, Package, Clock, CheckCircle, Navigation, Star, FileText, CircleDot, AlertTriangle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import useDriverLocation from '@/hooks/useDriverLocation';
import LiveTrackingMap from '@/components/LiveTrackingMap';
import RatingModal from '@/components/RatingModal';
import BookingChat from '@/components/BookingChat';
import InvoiceModal from '@/components/InvoiceModal';
import RouteOptimizer from '@/components/RouteOptimizer';
import LoadPaymentModal from '@/components/LoadPaymentModal';

const STATUS_STEPS = ['broadcasting', 'accepted', 'picked_up', 'in_transit', 'delivered'];
const STATUS_LABELS = { broadcasting: 'Broadcasting', accepted: 'Accepted', picked_up: 'Picked Up', in_transit: 'In Transit', delivered: 'Delivered' };

export default function BookingDetail() {
  const { id } = useParams({ strict: false });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [vehicleId, setVehicleId] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  const role = user?.role || 'client';

  const isActiveTransit = role === 'driver' && ['picked_up', 'in_transit'].includes(booking?.status) && booking?.driver_email === user?.email;
  const { tracking, startTracking, stopTracking } = useDriverLocation(vehicleId, false);

  useEffect(() => {
    if (booking?.vehicle_id) setVehicleId(booking.vehicle_id);
  }, [booking?.vehicle_id]);

  useEffect(() => {
    if (isActiveTransit && vehicleId) startTracking();
    else stopTracking();
    return () => stopTracking();
  }, [isActiveTransit, vehicleId]);

  useEffect(() => {
    base44.entities.Booking.get(id).then(b => {
      setBooking(b);
      if (b.status === 'delivered' && b.driver_email) {
        base44.entities.Rating.filter({ booking_id: id, client_email: user.email })
          .then(r => { if (r.length) setExistingRating(r[0]); });
      }
    }).finally(() => setLoading(false));
  }, [id]);

  async function acceptLoad() {
    setUpdating(true);
    const vehicles = await base44.entities.Vehicle.filter({ driver_email: user.email, status: 'approved' });
    if (!vehicles.length) { alert('Register and get your vehicle approved first'); setUpdating(false); return; }
    const vehicle = vehicles.find(v => v.category === booking.category);
    if (!vehicle) { alert('No matching vehicle for this category'); setUpdating(false); return; }
    if (vehicle.deposit_balance < CATEGORIES[booking.category].deposit) {
      alert(`Minimum deposit of P${CATEGORIES[booking.category].deposit} required`); setUpdating(false); return;
    }
    const commission = Math.round(Number(booking.offered_fare ?? booking.fare ?? 0) * 0.10);
    // Atomic accept: only succeeds if the load is still broadcasting at write
    // time, so two drivers tapping accept on the same load can't both win it.
    const { data: updated, error } = await supabase
      .from('loads')
      .update({
        status: 'Accepted',
        driver_email: user.email,
        driver_phone: user.phone,
        vehicle_id: vehicle.id,
        accepted_at: new Date().toISOString(),
        commission,
      })
      .eq('id', id)
      .eq('status', 'Broadcasting')
      .select()
      .maybeSingle();
    if (error) { alert(error.message); setUpdating(false); return; }
    if (!updated) { alert('This load was just accepted by another driver.'); setUpdating(false); return; }
    setBooking(prev => ({
      ...prev,
      status: 'accepted',
      driver_email: user.email,
      driver_phone: user.phone,
      accepted_at: updated.accepted_at,
      commission,
    }));
    setShowPayment(true);
    setUpdating(false);
  }

  async function updateStatus(newStatus) {
    setUpdating(true);
    const data = { status: newStatus };
    if (newStatus === 'picked_up') data.picked_up_at = new Date().toISOString();
    if (newStatus === 'delivered') {
      data.delivered_at = new Date().toISOString();
      data.final_fare = booking.offered_fare;
      const commission = calculateCommission(booking.offered_fare);
      data.commission = commission;
      if (booking.vehicle_id) {
        const vehicles = await base44.entities.Vehicle.filter({ driver_email: booking.driver_email, status: 'approved' });
        const driverVehicle = vehicles.find(v => v.id === booking.vehicle_id) || vehicles[0];
        if (driverVehicle) {
          const newBalance = Math.max(0, (driverVehicle.deposit_balance || 0) - commission);
          const vehicleUpdate = { deposit_balance: newBalance };
          if (newBalance <= 0) vehicleUpdate.status = 'suspended';
          await base44.entities.Vehicle.update(driverVehicle.id, vehicleUpdate);
          await base44.entities.Transaction.create({
            user_email: booking.driver_email,
            type: 'commission',
            amount: commission,
            booking_id: id,
            vehicle_id: driverVehicle.id,
            description: `Commission — ${booking.pickup_address} → ${booking.dropoff_address}`,
          });
          if (newBalance <= 0) alert('⚠️ Balance depleted. Vehicle suspended until topped up.');
        }
      }
    }
    await base44.entities.Booking.update(id, data);
    setBooking(prev => ({ ...prev, ...data }));
    setUpdating(false);
  }

  async function markStopComplete(stopIndex) {
    const updatedStops = (booking.stops || []).map((s, i) => i === stopIndex ? { ...s, completed: true } : s);
    await base44.entities.Booking.update(id, { stops: updatedStops });
    setBooking(prev => ({ ...prev, stops: updatedStops }));
  }

  async function increaseFare() {
    const newFare = (booking.offered_fare || booking.base_fare) + 50;
    setUpdating(true);
    await base44.entities.Booking.update(id, { offered_fare: newFare });
    setBooking(prev => ({ ...prev, offered_fare: newFare }));
    setUpdating(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
      <div className="w-5 h-5 border-2 border-[#C9A05A]/30 border-t-[#C9A05A] rounded-full animate-spin" />
    </div>
  );
  if (!booking) return <div className="p-5 text-center text-[#6B7280]">Booking not found</div>;

  const cat = CATEGORIES[booking.category];
  const currentStepIndex = STATUS_STEPS.indexOf(booking.status);

  return (
    <>
      <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

        {/* Header */}
        <div className="bg-[#3D2B0E] px-4 pt-12 pb-5">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => window.history.back()}
              className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </button>
            <h1 className="text-base font-bold text-white">Booking Details</h1>
          </div>

          {/* Status progress bar */}
          {booking.status !== 'cancelled' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                {STATUS_STEPS.filter(s => s !== 'cancelled').map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`h-1.5 flex-1 rounded-full transition-all ${i <= currentStepIndex ? 'bg-[#C9A05A]' : 'bg-white/20'}`} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${booking.status === 'delivered' ? 'bg-[#16A34A]' : 'bg-[#C9A05A] animate-pulse'}`} />
                <p className="text-xs font-semibold text-white">
                  {STATUS_LABELS[booking.status] || booking.status}
                </p>
                {isActiveTransit && (
                  <span className="ml-auto text-xs text-white/60 flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {tracking ? 'Broadcasting location' : 'Starting GPS…'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4 pb-32">

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm">
            <LiveTrackingMap
              vehicleId={booking.vehicle_id || null}
              pickupLat={booking.pickup_lat}
              pickupLng={booking.pickup_lng}
              dropoffLat={booking.dropoff_lat}
              dropoffLng={booking.dropoff_lng}
            />
          </div>

          {/* Route card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-[#FFF8EC] flex items-center justify-center">
                <span className="text-xl">{cat?.icon}</span>
              </div>
              <div>
                <p className="font-bold text-[#3D2B0E] text-sm">{cat?.label}</p>
                {booking.distance_km && <p className="text-xs text-[#6B7280]">{booking.distance_km} km</p>}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-[#FFF8EC] border-2 border-[#C9A05A] flex items-center justify-center shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-[#C9A05A]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Pickup</p>
                  <p className="text-sm font-medium text-[#3D2B0E]">{booking.pickup_address}</p>
                </div>
              </div>
              {booking.stops?.length > 0 && (
                <div className="ml-3.5 border-l-2 border-dashed border-[#E5E7EB] pl-6 py-1">
                  <p className="text-xs text-[#6B7280]">{booking.stops.length} stop{booking.stops.length > 1 ? 's' : ''}</p>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-[#3D2B0E] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Drop-off</p>
                  <p className="text-sm font-medium text-[#3D2B0E]">{booking.dropoff_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stops */}
          {booking.stops?.length > 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CircleDot className="h-4 w-4 text-[#D97706]" />
                <span className="text-sm font-bold text-[#3D2B0E]">
                  Stop-offs ({booking.stops.filter(s => s.completed).length}/{booking.stops.length} done)
                </span>
              </div>
              <div className="space-y-2">
                {booking.stops.map((stop, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${stop.completed ? 'bg-[#F0FDF4] border-[#16A34A]/20' : 'bg-[#F9FAFB] border-[#E5E7EB]'}`}>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${stop.completed ? 'bg-[#16A34A] text-white' : 'bg-[#C9A05A] text-white'}`}>
                      {stop.completed ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <p className={`text-sm flex-1 ${stop.completed ? 'line-through text-[#9CA3AF]' : 'text-[#3D2B0E]'}`}>{stop.address}</p>
                    {role === 'driver' && booking.driver_email === user.email && !stop.completed && ['picked_up', 'in_transit'].includes(booking.status) && (
                      <button onClick={() => markStopComplete(i)} className="text-xs font-bold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-1 rounded-full">
                        Done
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === 'driver' && booking.driver_email === user.email && booking.stops?.length >= 2 && ['accepted', 'picked_up', 'in_transit'].includes(booking.status) && (
            <RouteOptimizer booking={booking} onStopsReordered={newStops => setBooking(prev => ({ ...prev, stops: newStops }))} />
          )}

          {/* Goods */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Cargo</p>
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-[#6B7280] mt-0.5 shrink-0" />
              <p className="text-sm text-[#3D2B0E]">{booking.goods_description}</p>
            </div>
          </div>

          {/* Fare */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280] mb-3">Fare</p>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-[#6B7280]">Base fare</span>
              <span className="text-sm font-medium text-[#3D2B0E]">P{booking.base_fare}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span className="font-bold text-[#3D2B0E]">Offered fare</span>
              <span className="font-extrabold text-[#C9A05A] text-xl">P{booking.offered_fare || booking.base_fare}</span>
            </div>
            {booking.commission && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E5E7EB]">
                <span className="text-xs text-[#6B7280]">Commission (10%)</span>
                <span className="text-xs font-semibold text-red-500">−P{booking.commission}</span>
              </div>
            )}
          </div>

          {/* Contact */}
          {booking.driver_email && (
            <button
              onClick={() => setShowChat(true)}
              className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-2xl p-4 text-sm font-semibold text-[#3D2B0E] w-full shadow-sm active:scale-[0.98] transition-transform"
            >
              <span className="text-xl">💬</span>
              <span>Message {role === 'client' ? 'Driver' : 'Client'}</span>
            </button>
          )}

          {booking.client_phone && (
            <a
              href={`https://wa.me/${booking.client_phone.replace(/\s+/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 bg-[#F0FDF4] border border-[#16A34A]/20 rounded-2xl p-4 text-sm font-semibold text-[#16A34A] active:scale-[0.98] transition-transform"
            >
              <Phone className="h-4 w-4" />
              WhatsApp Client
            </a>
          )}
        </div>

        {/* ── Fixed action bar ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-4 py-3 pb-safe max-w-lg mx-auto space-y-2">
          {role === 'driver' && booking.status === 'broadcasting' && (
            <Button onClick={acceptLoad} disabled={updating} className="w-full h-14 rounded-2xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-extrabold text-base shadow-lg shadow-[#C9A05A]/20">
              {updating ? 'Accepting…' : 'Accept Load'}
            </Button>
          )}
          {role === 'driver' && booking.driver_email === user.email && booking.status === 'accepted' && (
            <Button onClick={() => updateStatus('picked_up')} disabled={updating} className="w-full h-14 rounded-2xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-extrabold text-base shadow-lg shadow-[#C9A05A]/20">
              {updating ? 'Updating…' : 'Confirm Pickup'}
            </Button>
          )}
          {role === 'driver' && booking.driver_email === user.email && booking.status === 'picked_up' && (
            <Button onClick={() => updateStatus('in_transit')} disabled={updating} className="w-full h-14 rounded-2xl bg-[#3D2B0E] hover:bg-[#1A1A1A] text-white font-extrabold text-base">
              Mark In Transit
            </Button>
          )}
          {role === 'driver' && booking.driver_email === user.email && booking.status === 'in_transit' && (
            <Button onClick={() => updateStatus('delivered')} disabled={updating} className="w-full h-14 rounded-2xl bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-base shadow-lg shadow-[#16A34A]/20">
              <CheckCircle className="h-5 w-5 mr-2" /> Confirm Delivery
            </Button>
          )}
          {role === 'client' && booking.status === 'broadcasting' && (
            <Button onClick={increaseFare} disabled={updating} variant="outline" className="w-full h-12 rounded-2xl border-[#E5E7EB] font-bold">
              Increase Offer (+P50) — currently P{booking.offered_fare || booking.base_fare}
            </Button>
          )}
          {booking.status === 'delivered' && (
            <Button variant="outline" onClick={() => setShowInvoice(true)} className="w-full h-11 rounded-xl border-[#E5E7EB] font-semibold text-[#3D2B0E] flex items-center gap-2">
              <FileText className="h-4 w-4" /> View Invoice
            </Button>
          )}
          {role === 'client' && booking.status === 'delivered' && booking.driver_email && (
            existingRating ? (
              <div className="flex items-center justify-center gap-1 py-2">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={`h-5 w-5 ${n <= existingRating.stars ? 'fill-[#C9A05A] text-[#C9A05A]' : 'text-[#E5E7EB]'}`} />
                ))}
                <span className="text-xs text-[#6B7280] ml-2">You rated this driver</span>
              </div>
            ) : (
              <Button onClick={() => setShowRating(true)} variant="outline" className="w-full h-11 rounded-xl border-[#E5E7EB] font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-[#C9A05A]" /> Rate Your Driver
              </Button>
            )
          )}
        </div>
      </div>

      {/* SOS button */}
      {['accepted', 'picked_up', 'in_transit'].includes(booking?.status) && (
        <Link
          to="/support" search={{ booking_id: booking.id, type: "emergency" }}
          className="fixed bottom-28 right-4 z-50 flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-2xl shadow-xl font-bold text-sm active:scale-95 transition-transform"
        >
          <AlertTriangle className="h-4 w-4" /> SOS
        </Link>
      )}

      {showRating && (
        <RatingModal
          booking={booking}
          clientEmail={user.email}
          onDone={() => {
            setShowRating(false);
            base44.entities.Rating.filter({ booking_id: id, client_email: user.email })
              .then(r => { if (r.length) setExistingRating(r[0]); });
          }}
        />
      )}
      {showInvoice && <InvoiceModal booking={booking} onClose={() => setShowInvoice(false)} />}
      {showChat && <BookingChat booking={booking} currentUserEmail={user.email} onClose={() => setShowChat(false)} />}
      {showPayment && <LoadPaymentModal booking={booking} onDone={() => setShowPayment(false)} />}
    </>
  );
}
