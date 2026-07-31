import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { MapPin, Package, X } from "lucide-react";
import LoadPaymentModal from "./LoadPaymentModal";

type Props = {
  // Used by DriverLoads: a real-time "new load for you" popup driven by a Notification row
  notification?: any;
  onDismiss?: () => void;
  driverEmail?: string;
  // Used when opened directly from a load card
  open?: boolean;
  booking?: any;
  onClose?: () => void;
  onAccept?: (b: any) => void;
};

export default function QuickAcceptSheet({
  notification, onDismiss, driverEmail,
  open, booking: bookingProp, onClose, onAccept,
}: Props) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<any | null>(bookingProp ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [acceptedBooking, setAcceptedBooking] = useState<any | null>(null);

  const isOpen = open ?? Boolean(notification);
  const close = onClose ?? onDismiss;

  useEffect(() => {
    if (bookingProp) { setBooking(bookingProp); return; }
    if (notification?.load_id) {
      base44.entities.Booking.get(notification.load_id).then(setBooking).catch(() => setBooking(null));
    }
  }, [notification?.load_id, bookingProp]);

  if (acceptedBooking) {
    return (
      <LoadPaymentModal
        booking={acceptedBooking}
        onDone={() => {
          onAccept?.(acceptedBooking);
          setAcceptedBooking(null);
          close?.();
        }}
      />
    );
  }

  if (!isOpen || !booking) return null;

  async function accept() {
    setBusy(true); setErr("");
    try {
      // Atomic, race-safe accept: only succeeds if the load is still
      // Broadcasting at the moment of the write. If two drivers tap
      // accept on the same load at once, only the first write matches
      // the .eq("status","Broadcasting") filter -- the second gets back
      // zero rows instead of silently overwriting the first driver's claim.
      const commission = Math.round(Number(booking.offer ?? booking.offered_fare ?? 0) * 0.10);
      const { data, error } = await supabase
        .from("loads")
        .update({
          status: "Accepted",
          driver: user?.full_name || "Driver",
          driver_phone: user?.phone,
          driver_email: driverEmail || user?.email,
          accepted_at: new Date().toISOString(),
          commission,
        })
        .eq("id", booking.id)
        .eq("status", "Broadcasting")
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("This load was just accepted by another driver.");
      setAcceptedBooking(data);
    } catch (e: any) {
      setErr(e.message || "Could not accept this load — it may already be taken.");
    }
    setBusy(false);
  }

  const fare = booking.offer ?? booking.offered_fare ?? 0;
  const pickup = booking.pickup ?? booking.pickup_address;
  const dropoff = booking.dropoff ?? booking.dropoff_address;
  const km = booking.km ?? booking.distance_km;
  const cargo = booking.load ?? booking.cargo_description ?? booking.goods_description ?? "General cargo";

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-end" onClick={close}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#C9A05A]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              {notification ? "New load for you" : "Load offer"}
            </span>
          </div>
          {close && <button onClick={close}><X className="h-5 w-5 text-[#9CA3AF]" /></button>}
        </div>

        <p className="text-2xl font-extrabold text-[#3D2B0E] tabular-nums">P{fare}</p>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2 text-sm"><MapPin className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" /><span className="text-[#3D2B0E]">{pickup}</span></div>
          <div className="flex gap-2 text-sm"><MapPin className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5" /><span className="text-[#3D2B0E]">{dropoff}</span></div>
        </div>
        <p className="text-xs text-[#6B7280] mt-3">{km}km · {cargo}</p>

        {err && <p className="mt-3 text-sm text-[#DC2626] bg-[#FEF2F2] border border-red-200 rounded-xl p-3">{err}</p>}

        <div className="flex gap-2 mt-5">
          {notification && (
            <button onClick={close} className="h-12 px-4 rounded-xl border border-[#E5E7EB] font-bold text-[#6B7280]">
              Skip
            </button>
          )}
          <button onClick={accept} disabled={busy}
            className="flex-1 h-12 rounded-xl bg-[#C9A05A] text-white font-bold disabled:opacity-50">
            {busy ? "Accepting…" : "Accept load"}
          </button>
        </div>
      </div>
    </div>
  );
}
