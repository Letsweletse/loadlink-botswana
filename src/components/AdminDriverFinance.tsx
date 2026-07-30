import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function AdminDriverFinance() {
  const [trucks, setTrucks] = useState<any[]>([]);
  useEffect(() => { base44.entities.Vehicle.list("-created_at", 200).then(setTrucks); }, []);

  if (!trucks.length) return <p className="text-sm text-[#9CA3AF] py-6 text-center">No registered vehicles yet</p>;

  return (
    <div className="space-y-2">
      {trucks.map(t => (
        <div key={t.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-[#3D2B0E] truncate">{t.name} · {t.plate}</p>
            <p className="text-xs text-[#6B7280]">{t.phone} · {t.category} · {t.status}</p>
          </div>
          <p className="font-extrabold text-[#3D2B0E] tabular-nums shrink-0">P{Number(t.wallet || 0).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
