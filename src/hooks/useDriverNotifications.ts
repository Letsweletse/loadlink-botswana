import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export default function useDriverNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingNotification, setPendingNotification] = useState<any | null>(null);

  async function load() {
    if (!user?.id) return;
    const rows = await base44.entities.Notification.filter({ user_id: user.id }, "-created_at", 50);
    setNotifications(rows);
    const nextUnread = rows.find((n: any) => !n.read && n.type === "new_load");
    if (nextUnread) setPendingNotification((cur: any) => cur || nextUnread);
  }
  useEffect(() => { load(); }, [user?.id]);

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
    await base44.entities.Notification.update(id, { read: true });
    setNotifications(n => n.map(x => (x.id === id ? { ...x, read: true } : x)));
  }

  async function dismissNotification() {
    if (pendingNotification?.id) await markRead(pendingNotification.id);
    setPendingNotification(null);
  }

  return { notifications, unread, markRead, reload: load, pendingNotification, dismissNotification };
}
