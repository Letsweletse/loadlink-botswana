import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORIES, getStatusColor, getStatusLabel } from '@/lib/fareUtils';
import { ArrowLeft, CheckCircle, XCircle, Truck, Package, DollarSign, Eye, Clock, Navigation, BarChart3, AlertTriangle, ExternalLink } from 'lucide-react';
import FleetMap from '@/components/FleetMap';
import ActiveLoadsMap from '@/components/ActiveLoadsMap';
import AdminSupportInbox from '@/components/AdminSupportInbox';
import AdminDriverFinance from '@/components/AdminDriverFinance';
import VehicleDetailModal from '@/components/VehicleDetailModal';
import DriverSummary from '@/components/DriverSummary';
import AdminEarningsDashboard from '@/components/AdminEarningsDashboard';
import DriverLeaderboard from '@/components/DriverLeaderboard';
import ExpiryAlerts from '@/components/ExpiryAlerts';
import CommissionPayoutTracker from '@/components/CommissionPayoutTracker';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, value, label, color, bg }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
      <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-2xl font-extrabold text-[#0F0F0F]">{value}</p>
      <p className="text-xs text-[#6B7280] mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Vehicle.list('-created_date', 100),
      base44.entities.Booking.list('-created_date', 100),
    ]).then(([v, b]) => { setVehicles(v); setBookings(b); })
      .finally(() => setLoading(false));
  }, []);

  async function approveVehicle(id) {
    await base44.entities.Vehicle.update(id, { status: 'approved' });
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, status: 'approved' } : v));
  }

  async function suspendVehicle(id) {
    await base44.entities.Vehicle.update(id, { status: 'suspended' });
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, status: 'suspended' } : v));
  }

  const totalRevenue = bookings.filter(b => b.status === 'delivered').reduce((s, b) => s + (b.commission || 0), 0);
  const activeLoads  = bookings.filter(b => !['delivered', 'cancelled'].includes(b.status)).length;
  const pending      = vehicles.filter(v => v.status === 'pending').length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
      <div className="w-5 h-5 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

        {/* Header */}
        <div className="bg-[#0F0F0F] px-4 pt-12 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <Link to="/" className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 text-white" />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Operations</p>
              <h1 className="text-lg font-extrabold text-white tracking-tight">Admin Dashboard</h1>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-white">{vehicles.length}</p>
              <p className="text-[10px] text-white/50 mt-0.5">Vehicles</p>
            </div>
            <div className="bg-[#F97316]/20 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-white">{activeLoads}</p>
              <p className="text-[10px] text-white/50 mt-0.5">Active Loads</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-[#F97316]">P{totalRevenue}</p>
              <p className="text-[10px] text-white/50 mt-0.5">Commission</p>
            </div>
          </div>
        </div>

        <div className="p-4 pb-24 space-y-4">

          {/* Pending registrations alert */}
          {pending > 0 && (
            <Link to="/driver-registrations" className="flex items-center justify-between bg-[#FFFBEB] border border-[#D97706]/20 rounded-2xl px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#D97706]/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-[#D97706]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F0F0F]">Driver Registrations</p>
                  <p className="text-xs text-[#6B7280]">{pending} pending approval</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-[#D97706]" />
            </Link>
          )}

          {/* Main tabs — consolidated from 11 to 5 groups */}
          <Tabs defaultValue="fleet">
            <TabsList className="w-full bg-white border border-[#E5E7EB] rounded-xl p-1 h-auto mb-4 grid grid-cols-5">
              {[
                { value: 'fleet',    label: 'Maps',     Icon: Navigation },
                { value: 'vehicles', label: 'Fleet',    Icon: Truck },
                { value: 'bookings', label: 'Loads',    Icon: Package },
                { value: 'finance',  label: 'Finance',  Icon: DollarSign },
                { value: 'support',  label: 'Support',  Icon: AlertTriangle },
              ].map(({ value, label, Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-semibold data-[state=active]:bg-[#F97316] data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Maps tab — fleet + live loads */}
            <TabsContent value="fleet" className="space-y-4">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-[#E5E7EB]">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Fleet Map</p>
                </div>
                <FleetMap height="300px" />
                <p className="text-[10px] text-[#9CA3AF] px-4 py-2">Updates every 6s · Approved vehicles only</p>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-[#E5E7EB]">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Live Loads</p>
                </div>
                <ActiveLoadsMap height="300px" />
                <p className="text-[10px] text-[#9CA3AF] px-4 py-2">Accepted, picked up & in-transit</p>
              </div>
            </TabsContent>

            {/* Fleet tab */}
            <TabsContent value="vehicles">
              <Tabs defaultValue="all">
                <TabsList className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-1 mb-4">
                  <TabsTrigger value="all" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold py-1.5">All ({vehicles.length})</TabsTrigger>
                  <TabsTrigger value="leaderboard" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold py-1.5">Top Drivers</TabsTrigger>
                  <TabsTrigger value="expiry" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold py-1.5">Expiry</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <div className="space-y-3">
                    {vehicles.map(v => {
                      const cat = CATEGORIES[v.category];
                      return (
                        <div key={v.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-xl">
                                {cat?.icon || '🚚'}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-[#0F0F0F]">{v.number_plate}</p>
                                <p className="text-xs text-[#6B7280]">{v.driver_email}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              v.status === 'approved' ? 'bg-[#F0FDF4] text-[#16A34A]'
                              : v.status === 'suspended' ? 'bg-[#FEF2F2] text-red-600'
                              : 'bg-[#FFFBEB] text-[#D97706]'
                            }`}>
                              {v.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#6B7280] mb-3">
                            Permit: {v.ba_permit_number || '—'} · Balance: <span className="font-semibold text-[#F97316]">P{v.deposit_balance || 0}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl border-[#E5E7EB] text-xs font-semibold" onClick={() => setSelectedVehicle(v)}>
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                            {v.status !== 'approved' && (
                              <Button size="sm" className="h-9 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold" onClick={() => approveVehicle(v.id)}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Approve
                              </Button>
                            )}
                            {v.status !== 'suspended' && (
                              <Button size="sm" variant="outline" className="h-9 rounded-xl border-red-200 text-red-600 text-xs font-semibold" onClick={() => suspendVehicle(v.id)}>
                                <XCircle className="h-3 w-3 mr-1" /> Suspend
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {!vehicles.length && (
                      <div className="text-center py-12">
                        <Truck className="h-10 w-10 text-[#9CA3AF] mx-auto mb-2" />
                        <p className="text-sm text-[#6B7280]">No vehicles registered yet</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="leaderboard"><DriverLeaderboard /></TabsContent>
                <TabsContent value="expiry"><ExpiryAlerts /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* Loads tab */}
            <TabsContent value="bookings">
              <div className="space-y-3">
                {bookings.map(b => (
                  <Link key={b.id} to={`/booking/${b.id}`} className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[#0F0F0F] truncate">{b.pickup_address} → {b.dropoff_address}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">P{b.offered_fare || b.base_fare} · {b.client_email}</p>
                    </div>
                    <span className={`ml-3 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${getStatusColor(b.status)}`}>
                      {getStatusLabel(b.status)}
                    </span>
                  </Link>
                ))}
                {!bookings.length && (
                  <div className="text-center py-12">
                    <Package className="h-10 w-10 text-[#9CA3AF] mx-auto mb-2" />
                    <p className="text-sm text-[#6B7280]">No bookings yet</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Finance tab */}
            <TabsContent value="finance">
              <Tabs defaultValue="finance">
                <TabsList className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-1 mb-4">
                  <TabsTrigger value="finance" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold py-1.5">Finance</TabsTrigger>
                  <TabsTrigger value="payouts" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold py-1.5">Payouts</TabsTrigger>
                  <TabsTrigger value="earnings" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold py-1.5">Earnings</TabsTrigger>
                  <TabsTrigger value="summaries" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold py-1.5">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="finance"><AdminDriverFinance /></TabsContent>
                <TabsContent value="payouts"><CommissionPayoutTracker /></TabsContent>
                <TabsContent value="earnings"><AdminEarningsDashboard /></TabsContent>
                <TabsContent value="summaries">
                  <div className="space-y-3">
                    {[...new Set(vehicles.map(v => v.driver_email))].map(email => (
                      <div key={email}>
                        <p className="text-xs text-[#6B7280] font-medium mb-1.5 px-1">{email}</p>
                        <DriverSummary driverEmail={email} showExport={true} defaultOpen={false} />
                      </div>
                    ))}
                    {!vehicles.length && <p className="text-center text-sm text-[#6B7280] py-8">No drivers yet</p>}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Support tab */}
            <TabsContent value="support">
              <AdminSupportInbox />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onUpdated={updated => {
            setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
            setSelectedVehicle(updated);
          }}
        />
      )}
    </>
  );
}
