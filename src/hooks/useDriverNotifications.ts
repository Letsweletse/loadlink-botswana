import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export default function useDriverNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  async function load() {
    if (!user?.id) return;
    setNotifications(await base44.entities.Notification.filter({ user_id: user.id }, "-created_at", 50));
  }
  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    const ch = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (p: any) => setNotifications(n => [p.new, ...n]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const unread = notifications.filter(n => !n.read).length;
  async function markRead(id: string) {
    await base44.entities.Notification.update(id, { read: true });
    setNotifications(n => n.map(x => (x.id === id ? { ...x, read: true } : x)));
  }
  return { notifications, unread, markRead, reload: load };
}
