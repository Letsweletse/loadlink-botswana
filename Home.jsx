import { useAuth } from '@/lib/AuthContext';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Shield, Zap, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES } from '@/lib/fareUtils';
import BookingCard from '@/components/BookingCard';
import AdBanner from '@/components/AdBanner';

const CATEGORY_IMAGES = {
  under_2ton: 'https://media.base44.com/images/public/6a0ecbc0726a7633f57d2275/4c6964ede_ChatGPTImageMay16202603_12_26PM.png',
  medium_7ton: 'https://media.base44.com/images/public/6a0ecbc0726a7633f57d2275/7ac747b99_ChatGPTImageMay16202607_33_18PM.png',
  big_over_7ton: 'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=400&q=80',
};

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || 'client';
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  useEffect(() => {
    async function load() {
      try {
        if (role === 'driver') {
          const bookings = await base44.entities.Booking.filter({ status: 'broadcasting' }, '-created_date', 5);
          setRecentBookings(bookings);
        } else if (role === 'client') {
          const bookings = await base44.entities.Booking.filter({ client_email: user.email }, '-created_date', 3);
          setRecentBookings(bookings);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [role, user?.email]);

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative bg-[#0F0F0F] text-white px-5 pt-6 pb-10 overflow-hidden"
      >
        {/* subtle orange glow */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#F97316]/20 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F97316]/40 to-transparent" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#F97316] flex items-center justify-center">
              <span className="text-sm font-extrabold text-white">VL</span>
            </div>
            <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Van-Link</span>
          </div>
          <p className="text-white/60 text-sm mb-1">
            {role === 'driver' ? 'Ready to move?' : 'Dumela 👋'}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {role === 'driver' ? `${firstName}.` : `${firstName}`}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {role === 'driver' ? 'Loads are waiting across Botswana.' : 'Where do you need to move goods today?'}
          </p>
        </div>
      </motion.div>

      <div className="px-4 -mt-5 space-y-5 pb-24">

        {/* Role setup */}
        {!user?.role && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm"
          >
            <p className="font-bold text-[#0F0F0F] mb-1">Complete your profile</p>
            <p className="text-sm text-[#6B7280] mb-3">Are you transporting goods or offering transport?</p>
            <Link to="/profile">
              <Button size="sm" className="bg-[#F97316] hover:bg-[#EA6A0A] text-white rounded-xl">
                Set Up Profile <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* ── CLIENT VIEW ── */}
        {role === 'client' && (
          <>
            {/* Primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <Link to="/new-booking">
                <div className="bg-[#F97316] text-white rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-[#F97316]/20">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <Package className="h-28 w-28" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-90">Instant Booking</span>
                    </div>
                    <h2 className="text-xl font-extrabold mb-1 tracking-tight">Transport Goods</h2>
                    <p className="text-sm opacity-85 mb-4">Find a van or truck near you — now</p>
                    <div className="flex items-center gap-1.5 text-sm font-bold">
                      Book Now <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Category grid */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] mb-3">Vehicle Types</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CATEGORIES).map(([key, cat], index) => {
                  const img = CATEGORY_IMAGES[key];
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + index * 0.07 }}
                    >
                      <Link to={`/new-booking?category=${key}`} className="relative rounded-2xl overflow-hidden h-32 group block shadow-sm">
                        {img ? (
                          <>
                            <img src={img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#F97316] to-[#EA6A0A]" />
                        )}
                        {cat.special && (
                          <span className="absolute top-2 left-2 text-[9px] bg-[#F97316] text-white px-2 py-0.5 rounded-full font-bold z-10">
                            POPULAR
                          </span>
                        )}
                        <div className="absolute bottom-0 inset-x-0 p-3">
                          <p className="text-[11px] font-semibold text-white/80 leading-tight">{cat.label}</p>
                          <p className="text-base font-extrabold text-white">P{cat.baseFare}+</p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── DRIVER VIEW ── */}
        {role === 'driver' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-3"
          >
            {/* Driver hero card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-28 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1485575301924-6891ef935dcd?w=800&q=80"
                  alt="Truck on highway"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                <div className="absolute inset-0 p-4 flex items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-[#F97316]" />
                      <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Driver Hub</span>
                    </div>
                    <p className="font-extrabold text-white text-lg tracking-tight">Your Dashboard</p>
                  </div>
                </div>
              </div>
              <div className="p-4 flex gap-2">
                <Link to="/my-vehicle" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full rounded-xl border-[#E5E7EB] font-semibold">
                    My Vehicle
                  </Button>
                </Link>
                <Link to="/driver-loads" className="flex-1">
                  <Button size="sm" className="w-full rounded-xl bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold">
                    View Loads
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        <AdBanner slot={role === 'driver' ? 1 : 0} />

        {/* Recent / Available */}
        {recentBookings.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] mb-3">
              {role === 'driver' ? 'Available Loads' : 'Recent Bookings'}
            </p>
            <div className="space-y-3">
              {recentBookings.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <BookingCard booking={b} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
