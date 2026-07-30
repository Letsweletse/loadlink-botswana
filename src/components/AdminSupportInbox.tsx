import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function AdminSupportInbox() {
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => { base44.entities.SupportTicket.list("-created_at", 100).then(setTickets); }, []);

  async function setStatus(id: string, status: string) {
    await base44.entities.SupportTicket.update(id, { status });
    setTickets(t => t.map(x => (x.id === id ? { ...x, status } : x)));
  }

  if (!tickets.length) return <p className="text-sm text-[#9CA3AF] py-6 text-center">No support tickets</p>;

  return (
    <div className="space-y-2">
      {tickets.map(t => (
        <div key={t.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-[#0F0F0F] truncate">{t.subject || "(no subject)"}</p>
              <p className="text-sm text-[#6B7280] mt-0.5 line-clamp-2">{t.message}</p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">{t.email || t.phone || "anonymous"}</p>
            </div>
            <select value={t.status} onChange={e => setStatus(t.id, e.target.value)}
              className="text-xs border border-[#E5E7EB] rounded-lg px-2 py-1 shrink-0">
              {["open","in_progress","resolved","closed"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
