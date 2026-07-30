import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Calendar } from "lucide-react";

export default function DriverSchedule() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.phone) return;
    base44.entities.Booking.filter({ driver_phone: user.phone }, "-created_at", 50).then(
      (r: any[]) => setRows(r.filter(b => !["delivered", "completed"].includes(b.status)))
    );
  }, [user?.phone]);

  if (!rows.length) return <p className="text-sm text-[#9CA3AF] py-6 text-center">No scheduled jobs</p>;

  return (
    <div className="space-y-2">
      {rows.map(b => (
        <div key={b.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#FFF8EC] flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-[#C9A05A]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#3D2B0E] text-sm truncate">{b.pickup} → {b.dropoff}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{b.status} · P{b.offer} · {b.km}km</p>
          </div>
        </div>
      ))}
    </div>
  );
}
