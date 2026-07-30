import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function AdminEarningsDashboard() {
  const [s, setS] = useState({ loads: 0, gross: 0, commission: 0, active: 0 });
  useEffect(() => {
    (async () => {
      const all = await base44.entities.Booking.list("-created_at", 500);
      const gross = all.reduce((t: number, b: any) => t + Number(b.offer || 0), 0);
      setS({
        loads: all.length,
        gross,
        commission: Math.round(gross * 0.1),
        active: all.filter((b: any) => !["delivered", "completed"].includes(b.status)).length,
      });
    })();
  }, []);
  const cells: [string, string | number][] = [
    ["Total loads", s.loads], ["Gross value", `P${s.gross}`],
    ["Commission (10%)", `P${s.commission}`], ["Active now", s.active],
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cells.map(([l, v]) => (
        <div key={l} className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280] mb-1">{l}</p>
          <p className="text-xl font-extrabold text-[#3D2B0E] tabular-nums">{v}</p>
        </div>
      ))}
    </div>
  );
}
