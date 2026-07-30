import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Star } from "lucide-react";

export default function RatingModal({ open = true, onClose, booking }: any) {
  const { user } = useAuth();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  async function submit() {
    setBusy(true);
    try {
      await base44.entities.Rating.create({
        load_id: booking?.id ?? null,
        rater_user_id: user?.id ?? null,
        driver_phone: booking?.driver_phone ?? null,
        stars, comment: comment.trim() || null,
      });
      onClose?.();
    } catch (e: any) { console.warn(e.message); }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <p className="font-extrabold text-[#0F0F0F] text-lg mb-1">Rate your trip</p>
        <p className="text-sm text-[#6B7280] mb-4">{booking?.driver || "Your driver"}</p>
        <div className="flex gap-2 mb-4">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setStars(n)}>
              <Star className={`h-9 w-9 ${n <= stars ? "fill-[#F97316] text-[#F97316]" : "text-[#E5E7EB]"}`} />
            </button>
          ))}
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Add a comment (optional)" rows={3}
          className="w-full rounded-xl border border-[#E5E7EB] p-3 text-sm outline-none focus:border-[#F97316] mb-4" />
        <button onClick={submit} disabled={busy}
          className="w-full h-12 rounded-xl bg-[#F97316] text-white font-bold disabled:opacity-50">
          {busy ? "Submitting…" : "Submit rating"}
        </button>
      </div>
    </div>
  );
}
