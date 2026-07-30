import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ArrowLeft, Clock } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export default function DriverRegistrations() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Vehicle.filter({ status: 'pending' }, '-created_date', 200)
      .then(setVehicles)
      .finally(() => setLoading(false));
  }, []);

  async function decide(id, status) {
    await base44.entities.Vehicle.update(id, { status });
    setVehicles(prev => prev.filter(v => v.id !== id));
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
      <div className="w-5 h-5 border-2 border-[#C9A05A]/30 border-t-[#C9A05A] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">
      <div className="bg-[#3D2B0E] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Operations</p>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Driver Registrations</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {!vehicles.length && (
          <div className="text-center py-16">
            <Clock className="h-10 w-10 text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-sm text-[#6B7280]">No pending registrations</p>
          </div>
        )}
        {vehicles.map(v => (
          <div key={v.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <p className="font-bold text-sm text-[#3D2B0E]">{v.number_plate || v.plate}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{v.driver_email || v.phone} · {v.category}</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Licence: {v.driver_license_number || '—'} ({v.driver_license_code || '—'}) · Permit: {v.ba_permit_number || '—'}
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="flex-1 h-9 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold"
                onClick={() => decide(v.id, 'approved')}>
                <CheckCircle className="h-3 w-3 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl border-red-200 text-red-600 text-xs font-semibold"
                onClick={() => decide(v.id, 'suspended')}>
                <XCircle className="h-3 w-3 mr-1" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
