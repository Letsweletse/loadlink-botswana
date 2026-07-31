import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Copy, Check, ShieldCheck } from "lucide-react";

const PAY_TO_NUMBER = "75111891";
const PROVIDER = "orange_money";

type Props = {
  open?: boolean;
  booking: any;
  onDone?: () => void;
};

/** Shown immediately after a driver accepts a load. Commission must be
 *  paid to the platform number before the acceptance is confirmed by
 *  admin — mirrors the existing vehicle-activation-deposit flow. */
export default function LoadPaymentModal({ open = true, booking, onDone }: Props) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");

  if (!open || !booking) return null;

  const commission = Number(booking.commission ?? Math.round(Number(booking.offer ?? booking.offered_fare ?? 0) * 0.1));

  function copyNumber() {
    navigator.clipboard?.writeText(PAY_TO_NUMBER).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function confirmPaid() {
    setSubmitting(true); setErr("");
    try {
      await base44.entities.PaymentRequest.create({
        phone: user?.phone,
        amount: commission,
        provider: PROVIDER,
        pay_to_number: PAY_TO_NUMBER,
        status: "pending",
        load_id: booking.id,
        notes: `Load commission — ${booking.pickup ?? booking.pickup_address} to ${booking.dropoff ?? booking.dropoff_address} · pending manual verification`,
      });
      setSubmitted(true);
    } catch (e: any) {
      setErr(e.message || "Couldn't submit your payment confirmation. Try again.");
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[999] bg-black/50 flex items-end">
        <div className="bg-white w-full rounded-t-3xl p-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-7 w-7 text-[#16A34A]" />
          </div>
          <p className="font-extrabold text-[#3D2B0E] text-lg">Payment submitted</p>
          <p className="text-sm text-[#6B7280] mt-2 leading-6">
            We'll confirm your P{commission} payment shortly. Your load stays reserved while it's reviewed.
          </p>
          <button onClick={onDone}
            className="mt-6 w-full h-12 rounded-xl bg-[#C9A05A] text-white font-bold">
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6">
        <p className="font-extrabold text-[#3D2B0E] text-lg">Load accepted 🎉</p>
        <p className="text-sm text-[#6B7280] mt-1">
          Pay your platform commission to confirm this booking.
        </p>

        <div className="mt-4 bg-[#FFF8EC] border border-[#E8D5B7] rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#B08A45]">Commission due</p>
          <p className="text-3xl font-extrabold text-[#3D2B0E] tabular-nums mt-1">P{commission}</p>
        </div>

        <div className="mt-3 bg-white border border-[#E5E7EB] rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">Pay via Orange Money to</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-extrabold text-[#3D2B0E] tabular-nums">{PAY_TO_NUMBER}</p>
            <button onClick={copyNumber} className="h-9 px-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center gap-1.5 text-xs font-bold text-[#6B7280]">
              {copied ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <p className="text-xs text-[#9CA3AF] mt-3 leading-5">
          Dial *145# or use the Orange Money app to send P{commission} to {PAY_TO_NUMBER}.
          Once sent, tap "I've paid" below — an admin will verify and confirm your booking.
        </p>

        {err && <p className="mt-3 text-sm text-[#DC2626] bg-[#FEF2F2] border border-red-200 rounded-xl p-3">{err}</p>}

        <button onClick={confirmPaid} disabled={submitting}
          className="mt-5 w-full h-12 rounded-xl bg-[#C9A05A] text-white font-bold disabled:opacity-50">
          {submitting ? "Submitting…" : "I've paid"}
        </button>
      </div>
    </div>
  );
}
