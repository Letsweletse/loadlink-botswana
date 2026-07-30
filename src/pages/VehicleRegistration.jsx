import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, AlertCircle, CheckCircle, Star, Truck } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import VehicleRegistrationForm from '@/components/VehicleRegistrationForm';

export default function VehicleRegistration() {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Vehicle.filter({ driver_email: user.email }, '-created_date', 1)
      .then(res => { if (res.length) setVehicle(res[0]); })
      .finally(() => setLoading(false));
  }, [user.email]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
      <div className="w-5 h-5 border-2 border-[#C9A05A]/30 border-t-[#C9A05A] rounded-full animate-spin" />
    </div>
  );

  const isPreferred = vehicle && (vehicle.ba_permit_number || vehicle.prdp_expiry);
  const statusColor = vehicle?.status === 'approved'
    ? { bg: 'bg-[#F0FDF4]', border: 'border-[#16A34A]/20', text: 'text-[#16A34A]', icon: <CheckCircle className="h-4 w-4" /> }
    : vehicle?.status === 'suspended'
    ? { bg: 'bg-[#FEF2F2]', border: 'border-red-200', text: 'text-red-600', icon: <AlertCircle className="h-4 w-4" /> }
    : { bg: 'bg-[#FFFBEB]', border: 'border-[#D97706]/20', text: 'text-[#D97706]', icon: <AlertCircle className="h-4 w-4" /> };

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

      {/* Header */}
      <div className="bg-[#3D2B0E] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Driver</p>
            <h1 className="text-lg font-extrabold text-white tracking-tight">
              {vehicle ? 'My Vehicle' : 'Register Vehicle'}
            </h1>
          </div>
        </div>

        {/* Vehicle status card in header */}
        {vehicle && (
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#C9A05A]/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-[#C9A05A]" />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-white">{vehicle.number_plate || 'Your Vehicle'}</p>
                <p className="text-xs text-white/50">{vehicle.make_model}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">Balance</p>
                <p className="font-extrabold text-[#C9A05A]">P{vehicle.deposit_balance || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 pb-24 space-y-3">

        {/* Status badge */}
        {vehicle && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-2xl border ${statusColor.bg} ${statusColor.border} ${statusColor.text}`}>
            {statusColor.icon}
            <span className="font-semibold">
              Status: {vehicle.status?.charAt(0).toUpperCase() + vehicle.status?.slice(1)}
            </span>
          </div>
        )}

        {/* Preferred badge */}
        {isPreferred && (
          <div className="flex items-center gap-3 bg-[#FFFBEB] border border-[#D97706]/20 rounded-2xl px-4 py-3">
            <Star className="h-5 w-5 fill-[#C9A05A] text-[#C9A05A] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#3D2B0E]">Preferred Driver</p>
              <p className="text-xs text-[#6B7280]">You get early load notifications</p>
            </div>
          </div>
        )}

        <VehicleRegistrationForm fixedDriverEmail={user.email} existingVehicle={vehicle} />
      </div>
    </div>
  );
}
