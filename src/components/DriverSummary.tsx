import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function DriverSummary() {
  const { user } = useAuth();
  const [s, setS] = useState({ trips: 0, earned: 0, rating: "—", wallet: 0 });

  useEffect(() => {
    (async () => {
      if (!user?.phone) return;
      const done = await base44.entities.Booking.filter({ driver_phone: user.phone }, "-created_at", 200);
      const delivered = done.filter((b: any) => ["delivered", "completed"].includes(b.status));
      const earned = delivered.reduce((t: number, b: any) => t + Number(b.offer || 0), 0);
      const trucks = await base44.entities.Vehicle.filter({ phone: user.phone }, "-created_at", 1);
      const ratings = await base44.entities.Rating.filter({ driver_phone: user.phone }, "-created_at", 100);
      const avg = ratings.length
        ? (ratings.reduce((t: number, r: any) => t + Number(r.stars || 0), 0) / ratings.length).toFixed(1)
        : "—";
      setS({ trips: delivered.length, earned, rating: avg, wallet: Number(trucks[0]?.wallet || 0) });
    })();
  }, [user?.phone]);

  const cells: [string, string | number][] = [
    ["Trips", s.trips], ["Earned", `P${s.earned}`], ["Rating", s.rating], ["Wallet", `P${s.wallet}`],
  ];

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB]">
      <p className="font-bold text-[#3D2B0E] mb-3">Your Summary</p>
      <div className="grid grid-cols-2 gap-3">
        {cells.map(([l, v]) => (
          <div key={l} className="bg-[#F9FAFB] rounded-xl p-3">
            <p className="text-[11px] text-[#6B7280] mb-1">{l}</p>
            <p className="text-lg font-extrabold text-[#3D2B0E] tabular-nums">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
