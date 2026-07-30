import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ChevronDown, ChevronUp, Download } from "lucide-react";

type Props = {
  /** Admin usage: view a specific driver's summary by email. */
  driverEmail?: string;
  showExport?: boolean;
  defaultOpen?: boolean;
};

export default function DriverSummary({ driverEmail, showExport = false, defaultOpen = true }: Props) {
  const { user } = useAuth();
  const email = driverEmail ?? user?.email;
  const [s, setS] = useState({ trips: 0, earned: 0, rating: "—", wallet: 0 });
  const [open, setOpen] = useState(defaultOpen);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!email || !open) return;
    (async () => {
      const [trucks, done, ratings] = await Promise.all([
        base44.entities.Vehicle.filter({ driver_email: email }, "-created_date", 5),
        base44.entities.Booking.filter({ driver_email: email }, "-created_date", 200),
        base44.entities.Rating.filter({}, "-created_date", 500),
      ]);
      const delivered = done.filter((b: any) => ["delivered", "completed"].includes(b.status));
      const earned = delivered.reduce((t: number, b: any) => t + Number(b.final_fare ?? b.offer ?? 0), 0);
      const wallet = trucks.reduce((t: number, v: any) => t + Number(v.wallet || 0), 0);
      const driverPhones = new Set(trucks.map((t: any) => t.phone));
      const mine = ratings.filter((r: any) => driverPhones.has(r.driver_phone));
      const avg = mine.length
        ? (mine.reduce((t: number, r: any) => t + Number(r.stars || 0), 0) / mine.length).toFixed(1)
        : "—";
      setS({ trips: delivered.length, earned, rating: avg, wallet });
      setLoaded(true);
    })();
  }, [email, open]);

  function exportCsv() {
    const rows = [
      ["Driver", email],
      ["Trips completed", String(s.trips)],
      ["Total earned", `P${s.earned}`],
      ["Average rating", String(s.rating)],
      ["Wallet balance", `P${s.wallet}`],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${email}-summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cells: [string, string | number][] = [
    ["Trips", s.trips], ["Earned", `P${s.earned}`], ["Rating", s.rating], ["Wallet", `P${s.wallet}`],
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <p className="font-bold text-[#3D2B0E] text-sm truncate">{email || "Your summary"}</p>
        {open ? <ChevronUp className="h-4 w-4 text-[#9CA3AF] shrink-0" /> : <ChevronDown className="h-4 w-4 text-[#9CA3AF] shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          {!loaded ? (
            <div className="py-4 flex justify-center">
              <div className="h-5 w-5 border-2 border-[#C9A05A]/30 border-t-[#C9A05A] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {cells.map(([l, v]) => (
                  <div key={l} className="bg-[#F9FAFB] rounded-xl p-3">
                    <p className="text-[11px] text-[#6B7280] mb-1">{l}</p>
                    <p className="text-lg font-extrabold text-[#3D2B0E] tabular-nums">{v}</p>
                  </div>
                ))}
              </div>
              {showExport && (
                <button onClick={exportCsv}
                  className="mt-3 w-full h-9 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#6B7280] flex items-center justify-center gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
