import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Send } from "lucide-react";

export default function BookingChat({ bookingId, loadId }: { bookingId?: string; loadId?: string }) {
  const id = loadId || bookingId;
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    if (!id) return;
    setMsgs(await base44.entities.Message.filter({ load_id: id }, "created_at", 200));
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!supabase || !id) return;
    const ch = supabase.channel(`msgs-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `load_id=eq.${id}` },
        (p: any) => setMsgs(m => [...m, p.new]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    const body = text.trim();
    if (!body || !id) return;
    setBusy(true);
    try {
      await base44.entities.Message.create({
        load_id: id,
        sender_user_id: user?.id ?? null,
        sender_name: user?.full_name || "You",
        body,
      });
      setText("");
    } catch (e: any) { console.warn(e.message); }
    setBusy(false);
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E5E7EB]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Messages</p>
      </div>
      <div className="max-h-64 overflow-y-auto p-3 space-y-2">
        {msgs.length === 0 && <p className="text-sm text-[#9CA3AF] text-center py-6">No messages yet</p>}
        {msgs.map((m) => {
          const mine = m.sender_user_id && m.sender_user_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-[#C9A05A] text-white" : "bg-[#F9FAFB] text-[#3D2B0E] border border-[#E5E7EB]"}`}>
                {!mine && <p className="text-[10px] font-semibold opacity-60 mb-0.5">{m.sender_name || "User"}</p>}
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-[#E5E7EB]">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="flex-1 h-11 px-3 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#C9A05A]" />
        <button onClick={send} disabled={busy || !text.trim()}
          className="h-11 w-11 rounded-xl bg-[#C9A05A] text-white flex items-center justify-center disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
