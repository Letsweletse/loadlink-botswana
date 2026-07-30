import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import BookingCard from '@/components/BookingCard';
import { Package, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Booking.filter({ client_email: user.email }, '-created_date', 50)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [user.email]);

  const active = bookings.filter(b => !['delivered', 'cancelled'].includes(b.status));
  const past = bookings.filter(b => ['delivered', 'cancelled'].includes(b.status));

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

      {/* Header */}
      <div className="bg-[#3D2B0E] px-4 pt-12 pb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Your Account</p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">My Bookings</h1>
        </div>
        <Link to="/new-booking">
          <div className="h-10 w-10 rounded-xl bg-[#C9A05A] flex items-center justify-center shadow-lg shadow-[#C9A05A]/30">
            <Plus className="h-5 w-5 text-white" />
          </div>
        </Link>
      </div>

      <div className="p-4 pb-24 space-y-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 border-2 border-[#C9A05A]/30 border-t-[#C9A05A] rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Package className="h-8 w-8 text-[#9CA3AF]" />
            </div>
            <p className="font-bold text-[#3D2B0E] mb-1">No bookings yet</p>
            <p className="text-sm text-[#6B7280] mb-5">Book your first transport to get started.</p>
            <Link to="/new-booking">
              <Button className="rounded-xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-bold shadow-md shadow-[#C9A05A]/20">
                Book Transport
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] mb-3">Active</p>
                <div className="space-y-3">
                  {active.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] mb-3">Past</p>
                <div className="space-y-3">
                  {past.map(b => <BookingCard key={b.id} booking={b} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
