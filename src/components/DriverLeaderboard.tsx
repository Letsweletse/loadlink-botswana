import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy } from "lucide-react";

export default function DriverLeaderboard() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const loads = await base44.entities.Booking.list("-created_at", 500);
      const by: Record<string, { name: string; trips: number; earned: number }> = {};
      loads.filter((l: any) => l.driver_phone && ["delivered","completed"].includes(l.status))
        .forEach((l: any) => {
          const k = l.driver_phone;
          by[k] = by[k] || { name: l.driver || k, trips: 0, earned: 0 };
          by[k].trips++; by[k].earned += Number(l.offer || 0);
        });
      setRows(Object.values(by).sort((a, b) => b.trips - a.trips).slice(0, 10));
    })();
  }, []);

  if (!rows.length) return <p className="text-sm text-[#9CA3AF] py-6 text-center">No completed trips yet</p>;

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.name + i} className="bg-white border border-[#E5E7EB] rounded-2xl p-3 flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${i === 0 ? "bg-[#FFF0E6] text-[#F97316]" : "bg-[#F9FAFB] text-[#6B7280]"}`}>
            {i === 0 ? <Trophy className="h-4 w-4" /> : i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#0F0F0F] truncate">{r.name}</p>
            <p className="text-xs text-[#6B7280]">{r.trips} trips</p>
          </div>
          <p className="font-extrabold text-[#0F0F0F] tabular-nums">P{r.earned}</p>
        </div>
      ))}
    </div>
  );
}
