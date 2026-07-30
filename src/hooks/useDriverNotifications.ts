import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

/** Safe to call unconditionally on every render (Rules of Hooks) — it
 *  no-ops internally whenever there's no signed-in user yet. */
export default function useDriverNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingNotification, setPendingNotification] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!user?.id) { setNotifications([]); setPendingNotification(null); return; }

    async function load() {
      try {
        const rows = await base44.entities.Notification.filter({ user_id: user.id }, "-created_at", 50);
        if (!mounted) return;
        setNotifications(rows);
        const nextUnread = rows.find((n: any) => !n.read && n.type === "new_load");
        if (nextUnread) setPendingNotification((cur: any) => cur || nextUnread);
      } catch (e) {
        console.error("Notification loading failed (non-fatal):", e);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (p: any) => {
          setNotifications(n => [p.new, ...n]);
          if (p.new.type === "new_load") setPendingNotification((cur: any) => cur || p.new);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const unread = notifications.filter(n => !n.read).length;

  async function markRead(id: string) {
    try {
      await base44.entities.Notification.update(id, { read: true });
      setNotifications(n => n.map(x => (x.id === id ? { ...x, read: true } : x)));
    } catch (e) { console.error("markRead failed (non-fatal):", e); }
  }

  async function dismissNotification() {
    if (pendingNotification?.id) await markRead(pendingNotification.id);
    setPendingNotification(null);
  }

  return { notifications, unread, markRead, pendingNotification, dismissNotification };
}
