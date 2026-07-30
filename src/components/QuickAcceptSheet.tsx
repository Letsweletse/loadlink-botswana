import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { MapPin, Package } from "lucide-react";

export default function QuickAcceptSheet({ open = true, onClose, booking, onAccept }: any) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!open || !booking) return null;

  async function accept() {
    setBusy(true); setErr("");
    try {
      const updated = await base44.entities.Booking.update(booking.id, {
        status: "Accepted",
        driver: user?.full_name || "Driver",
        driver_phone: user?.phone,
        accepted_at: new Date().toISOString(),
      });
      onAccept?.(updated);
      onClose?.();
    } catch (e: any) {
      setErr(e.message || "Could not accept this load.");
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-[#C9A05A]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Load offer</span>
        </div>
        <p className="text-2xl font-extrabold text-[#3D2B0E] tabular-nums">P{booking.offer}</p>
        <div className="mt-4 space-y-2">
          <div className="flex gap-2 text-sm"><MapPin className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" /><span className="text-[#3D2B0E]">{booking.pickup}</span></div>
          <div className="flex gap-2 text-sm"><MapPin className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5" /><span className="text-[#3D2B0E]">{booking.dropoff}</span></div>
        </div>
        <p className="text-xs text-[#6B7280] mt-3">{booking.km}km · {booking.load || booking.cargo_description || "General cargo"}</p>
        {err && <p className="mt-3 text-sm text-[#DC2626] bg-[#FEF2F2] border border-red-200 rounded-xl p-3">{err}</p>}
        <button onClick={accept} disabled={busy}
          className="mt-5 w-full h-12 rounded-xl bg-[#C9A05A] text-white font-bold disabled:opacity-50">
          {busy ? "Accepting…" : "Accept load"}
        </button>
      </div>
    </div>
  );
}
