import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowDownCircle, Filter, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from '@tanstack/react-router';
import DriverSummary from '@/components/DriverSummary';

const TYPE_CONFIG = {
  deposit:      { label: 'Deposit',         icon: ArrowDownCircle, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]', sign: '+' },
  fare_payment: { label: 'Load Earnings',   icon: TrendingUp,      color: 'text-[#16A34A]', bg: 'bg-[#F0FDF4]', sign: '+' },
  commission:   { label: 'Commission (10%)',icon: TrendingDown,     color: 'text-red-500',   bg: 'bg-[#FEF2F2]', sign: '-' },
};

function TransactionItem({ tx }) {
  const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.deposit;
  const Icon = cfg.icon;
  const isDebit = tx.type === 'commission';
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-[#F3F4F6] last:border-0">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#3D2B0E]">{cfg.label}</p>
        {tx.description && <p className="text-xs text-[#6B7280] truncate">{tx.description}</p>}
        <p className="text-xs text-[#9CA3AF]">
          {new Date(tx.created_date).toLocaleDateString('en-BW', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <span className={`font-extrabold text-sm ${isDebit ? 'text-red-500' : 'text-[#16A34A]'}`}>
        {cfg.sign}P{tx.amount}
      </span>
    </div>
  );
}

export default function WalletPage() {
  const { user } = useAuth();
  const role = user?.role || 'driver';
  const [transactions, setTransactions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const query = role === 'admin' ? {} : { user_email: user.email };
        const [txns, vehs] = await Promise.all([
          base44.entities.Transaction.filter(query, '-created_date', 200),
          role === 'driver' ? base44.entities.Vehicle.filter({ driver_email: user.email }) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setTransactions(txns);
        setVehicles(vehs);
      } catch (e) {
        console.warn('WalletPage load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.email, role]);

  const filtered = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);

  const totalDeposits   = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalEarnings   = transactions.filter(t => t.type === 'fare_payment').reduce((s, t) => s + t.amount, 0);
  const totalCommission = transactions.filter(t => t.type === 'commission').reduce((s, t) => s + t.amount, 0);
  const netBalance      = totalDeposits + totalEarnings - totalCommission;

  function isoWeek(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  }

  const weeklyEarnings = Array.from({ length: 8 }, (_, i) => {
    const week = new Date();
    week.setDate(week.getDate() - (7 - i) * 7);
    const weekNum = isoWeek(week);
    const weekYear = week.getFullYear();
    const earned = transactions
      .filter(t => {
        const td = new Date(t.created_date);
        return t.type === 'fare_payment' && isoWeek(td) === weekNum && td.getFullYear() === weekYear;
      })
      .reduce((s, t) => s + t.amount, 0);
    return { week: `W${weekNum}`, earned };
  });

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

      {/* Header with balance */}
      <div className="bg-[#3D2B0E] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/" className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Finance</p>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Wallet</h1>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-[#C9A05A] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Wallet className="h-24 w-24" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
            {role === 'admin' ? 'Total App Revenue' : 'Available Balance'}
          </p>
          <p className="text-4xl font-extrabold text-white tracking-tight mb-3">
            {role === 'admin' ? `P${totalCommission.toFixed(2)}` : `P${netBalance.toFixed(2)}`}
          </p>
          {role === 'driver' && vehicles.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {vehicles.map(v => (
                <div key={v.id} className="bg-white/20 rounded-lg px-3 py-1.5 text-xs text-white">
                  <span className="font-bold">{v.number_plate}</span>
                  <span className="opacity-70 ml-1.5">P{v.deposit_balance || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pb-24 space-y-4">

        {/* Summary grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Deposits', amount: totalDeposits, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]', Icon: ArrowDownCircle },
            { label: 'Earnings', amount: totalEarnings, color: 'text-[#16A34A]', bg: 'bg-[#F0FDF4]', Icon: TrendingUp },
            { label: 'Commission', amount: totalCommission, color: 'text-red-500', bg: 'bg-[#FEF2F2]', Icon: TrendingDown },
          ].map(({ label, amount, color, bg, Icon }) => (
            <div key={label} className="bg-white border border-[#E5E7EB] rounded-2xl p-3 shadow-sm">
              <div className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </div>
              <p className={`text-base font-extrabold ${color}`}>P{amount.toFixed(0)}</p>
              <p className="text-[10px] text-[#6B7280] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Weekly earnings chart (driver only) */}
        {role === 'driver' && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-4">Weekly Earnings</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyEarnings} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} formatter={v => `P${v}`} />
                <Bar dataKey="earned" fill="#C9A05A" radius={[6, 6, 0, 0]} name="Earnings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Driver summary */}
        {role === 'driver' && (
          <DriverSummary driverEmail={user.email} showExport={true} defaultOpen={true} />
        )}

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 text-[#9CA3AF] shrink-0" />
          {['all', 'deposit', 'fare_payment', 'commission'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-semibold transition-all ${
                filterType === type
                  ? 'bg-[#C9A05A] text-white shadow-md shadow-[#C9A05A]/20'
                  : 'bg-white border border-[#E5E7EB] text-[#6B7280]'
              }`}
            >
              {type === 'all' ? 'All' : TYPE_CONFIG[type]?.label}
            </button>
          ))}
        </div>

        {/* Transactions */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-[#C9A05A]/30 border-t-[#C9A05A] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-14 w-14 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Wallet className="h-6 w-6 text-[#9CA3AF]" />
            </div>
            <p className="font-bold text-[#3D2B0E] mb-1">No transactions yet</p>
            <p className="text-xs text-[#6B7280]">Transactions will appear here.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl px-4 shadow-sm">
            {filtered.map(tx => <TransactionItem key={tx.id} tx={tx} />)}
          </div>
        )}
      </div>
    </div>
  );
}
