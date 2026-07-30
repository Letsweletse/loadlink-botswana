import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send } from "lucide-react";

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "#DC2626", high: "#D97706", medium: "#2563EB", low: "#6B7280",
};

export default function AdminSupportInbox() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { base44.entities.SupportTicket.list("-created_at", 100).then(setTickets); }, []);

  async function setStatus(id: string, status: string) {
    await base44.entities.SupportTicket.update(id, { status });
    setTickets(t => t.map(x => (x.id === id ? { ...x, status } : x)));
  }

  async function sendReply(id: string) {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      await base44.entities.SupportTicket.update(id, { admin_reply: reply.trim(), status: "in_review" });
      setTickets(t => t.map(x => (x.id === id ? { ...x, admin_reply: reply.trim(), status: "in_review" } : x)));
      setReply(""); setOpenId(null);
    } catch (e) { console.warn(e); }
    setBusy(false);
  }

  if (!tickets.length) return <p className="text-sm text-[#9CA3AF] py-6 text-center">No support tickets</p>;

  return (
    <div className="space-y-2">
      {tickets.map(t => (
        <div key={t.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[t.priority] || "#6B7280" }} />
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: PRIORITY_COLOR[t.priority] || "#6B7280" }}>
                  {t.priority || "medium"}
                </span>
                {t.type && <span className="text-[10px] text-[#9CA3AF]">· {t.type}</span>}
              </div>
              <p className="font-bold text-[#3D2B0E] truncate">{t.subject || "(no subject)"}</p>
              <p className="text-sm text-[#6B7280] mt-0.5 line-clamp-2">{t.message}</p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">{t.email || t.phone || "anonymous"}</p>
              {t.admin_reply && (
                <div className="mt-2 bg-[#FFF8EC] border border-[#E8D5B7] rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-[#B08A45] uppercase mb-0.5">Your reply</p>
                  <p className="text-sm text-[#3D2B0E]">{t.admin_reply}</p>
                </div>
              )}
            </div>
            <select value={t.status} onChange={e => setStatus(t.id, e.target.value)}
              className="text-xs border border-[#E5E7EB] rounded-lg px-2 py-1 shrink-0">
              {["open","in_progress","in_review","resolved","closed"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {openId === t.id ? (
            <div className="flex items-center gap-2 mt-3">
              <input value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendReply(t.id)}
                placeholder="Type your reply…" autoFocus
                className="flex-1 h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#C9A05A]" />
              <button onClick={() => sendReply(t.id)} disabled={busy}
                className="h-10 w-10 rounded-lg bg-[#C9A05A] text-white flex items-center justify-center disabled:opacity-40 shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => { setOpenId(t.id); setReply(t.admin_reply || ""); }}
              className="mt-3 text-xs font-bold text-[#C9A05A]">
              {t.admin_reply ? "Edit reply" : "Reply"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
