import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";

export default function CommissionPayoutTracker() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    base44.entities.PaymentRequest.list("-created_at", 100).then(r => { setReqs(r); setLoaded(true); });
  }, []);

  async function act(req: any, status: string) {
    try {
      await base44.entities.PaymentRequest.update(req.id, { status });
      setReqs(r => r.map(x => (x.id === req.id ? { ...x, status } : x)));
      // If this was a load commission payment, mark the load as paid once approved
      if (status === "approved" && req.load_id && supabase) {
        await supabase.from("loads").update({ commission_paid: true }).eq("id", req.load_id);
      }
    } catch (e: any) { console.warn(e.message); }
  }

  if (!loaded) {
    return (
      <div className="py-8 flex justify-center">
        <div className="h-5 w-5 border-2 border-[#C9A05A]/30 border-t-[#C9A05A] rounded-full animate-spin" />
      </div>
    );
  }
  if (!reqs.length) return <p className="text-sm text-[#9CA3AF] py-6 text-center">No payment requests</p>;

  const pending = reqs.filter(r => r.status === "pending");
  const resolved = reqs.filter(r => r.status !== "pending");

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#B08A45] mb-2">Pending review ({pending.length})</p>
          <div className="space-y-2">
            {pending.map(r => <ReqRow key={r.id} r={r} onAct={act} />)}
          </div>
        </div>
      )}
      {resolved.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#B08A45] mb-2">History</p>
          <div className="space-y-2">
            {resolved.map(r => <ReqRow key={r.id} r={r} onAct={act} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ReqRow({ r, onAct }: { r: any; onAct: (r: any, status: string) => void }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-extrabold text-[#3D2B0E] tabular-nums">P{Number(r.amount).toFixed(2)}</p>
          <p className="text-xs text-[#6B7280]">{r.phone} · {r.provider === "orange_money" ? "Orange Money" : r.provider} → {r.pay_to_number}</p>
          {r.notes && <p className="text-xs text-[#9CA3AF] mt-1 truncate">{r.notes}</p>}
        </div>
        {r.status === "pending" ? (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onAct(r, "approved")} className="text-xs font-bold px-3 py-2 rounded-lg bg-[#16A34A] text-white">Approve</button>
            <button onClick={() => onAct(r, "rejected")} className="text-xs font-bold px-3 py-2 rounded-lg bg-[#FEF2F2] text-[#DC2626]">Reject</button>
          </div>
        ) : (
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${r.status === "approved" ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>{r.status}</span>
        )}
      </div>
    </div>
  );
}
