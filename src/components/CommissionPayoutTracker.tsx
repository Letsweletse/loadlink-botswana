import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function CommissionPayoutTracker() {
  const [reqs, setReqs] = useState<any[]>([]);
  useEffect(() => { base44.entities.PaymentRequest.list("-created_at", 100).then(setReqs); }, []);

  async function act(id: string, status: string) {
    try {
      await base44.entities.PaymentRequest.update(id, { status });
      setReqs(r => r.map(x => (x.id === id ? { ...x, status } : x)));
    } catch (e: any) { console.warn(e.message); }
  }

  if (!reqs.length) return <p className="text-sm text-[#9CA3AF] py-6 text-center">No payment requests</p>;

  return (
    <div className="space-y-2">
      {reqs.map(r => (
        <div key={r.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-extrabold text-[#3D2B0E] tabular-nums">P{Number(r.amount).toFixed(2)}</p>
            <p className="text-xs text-[#6B7280]">{r.phone} · {r.provider}</p>
          </div>
          {r.status === "pending" ? (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => act(r.id, "approved")} className="text-xs font-bold px-3 py-2 rounded-lg bg-[#16A34A] text-white">Approve</button>
              <button onClick={() => act(r.id, "rejected")} className="text-xs font-bold px-3 py-2 rounded-lg bg-[#FEF2F2] text-[#DC2626]">Reject</button>
            </div>
          ) : (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${r.status === "approved" ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>{r.status}</span>
          )}
        </div>
      ))}
    </div>
  );
}
