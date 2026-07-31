import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, TrendingUp, Package, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CATEGORIES } from '@/lib/fareUtils';

const STATUS_COLORS = {
  broadcasting: '#D97706',
  accepted:     '#2563EB',
  in_transit:   '#7C3AED',
  delivered:    '#16A34A',
  cancelled:    '#DC2626',
};

export default function Analytics() {
  const { user } = useAuth();
  const role = user?.role || 'client';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = role === 'admin' ? {} : role === 'driver' ? { driver_email: user.email } : { client_email: user.email };
    base44.entities.Booking.filter(query, '-created_date', 500)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [user.email, role]);

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - i));
    const dayKey = day.toDateString();
    const count = bookings.filter(b => new Date(b.created_date).toDateString() === dayKey).length;
    const revenue = bookings.filter(b => new Date(b.created_date).toDateString() === dayKey && b.final_fare).reduce((s, b) => s + (b.final_fare || 0), 0);
    const label = day.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    return { day: label, count, revenue };
  });

  const statusData = Object.keys(STATUS_COLORS).map(s => ({
    name: s.replace('_', ' '),
    value: bookings.filter(b => b.status === s).length,
    color: STATUS_COLORS[s],
  })).filter(d => d.value > 0);

  const categoryData = Object.entries(CATEGORIES).map(([key, cat]) => ({
    name: cat.label,
    icon: cat.icon,
    count: bookings.filter(b => b.category === key).length,
    revenue: bookings.filter(b => b.category === key && b.final_fare).reduce((s, b) => s + (b.final_fare || 0), 0),
  }));

  const totalRevenue = bookings.filter(b => b.final_fare).reduce((s, b) => s + b.final_fare, 0);
  const delivered = bookings.filter(b => b.status === 'delivered').length;
  const active = bookings.filter(b => ['accepted', 'picked_up', 'in_transit'].includes(b.status)).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
      <div className="w-5 h-5 border-2 border-[#C9A05A]/30 border-t-[#C9A05A] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

      {/* Header */}
      <div className="bg-[#3D2B0E] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Insights</p>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Analytics</h1>
          </div>
        </div>

        {/* Top stats in header */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] text-white/50 uppercase tracking-wide mb-1">Total Bookings</p>
            <p className="text-2xl font-extrabold text-white">{bookings.length}</p>
          </div>
          <div className="bg-[#C9A05A]/20 rounded-xl p-3">
            <p className="text-[10px] text-white/50 uppercase tracking-wide mb-1">{role === 'admin' ? 'Total Revenue' : 'Total Fare'}</p>
            <p className="text-2xl font-extrabold text-white">P{totalRevenue.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-4">

        {/* Stat pills */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#3D2B0E]">{delivered}</p>
              <p className="text-xs text-[#6B7280]">Delivered</p>
            </div>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
              <Clock className="h-4 w-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#3D2B0E]">{active}</p>
              <p className="text-xs text-[#6B7280]">Active</p>
            </div>
          </div>
        </div>

        {/* Bookings chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-4">Bookings — Last 14 Days</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={last14} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
              <Bar dataKey="count" fill="#C9A05A" radius={[6, 6, 0, 0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-4">Revenue — Last 14 Days (P)</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={last14} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} formatter={v => `P${v}`} />
              <Line type="monotone" dataKey="revenue" stroke="#C9A05A" strokeWidth={2.5} dot={false} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        {statusData.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-4">Status Breakdown</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={28} outerRadius={52} dataKey="value" strokeWidth={0}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs capitalize text-[#3D2B0E]">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#3D2B0E]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* By category */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-4">By Vehicle Type</p>
          <div className="space-y-3">
            {categoryData.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-lg">
                  {d.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#3D2B0E]">{d.name}</p>
                  {d.revenue > 0 && <p className="text-xs text-[#6B7280]">P{d.revenue} earned</p>}
                </div>
                <span className="text-sm font-extrabold text-[#C9A05A]">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
