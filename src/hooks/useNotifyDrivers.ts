import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";

const CAT_DB: Record<string, string> = { under_2ton: "mini", medium_7ton: "medium", big_over_7ton: "big" };

export async function notifyMatchingDrivers(booking: any) {
  if (!supabase || !booking) return;
  try {
    const cat = CAT_DB[booking.category] || booking.category;
    const { data: trucks } = await supabase.from("trucks").select("phone").eq("category", cat).eq("online", true);
    const { data: profs } = await supabase.from("profiles").select("user_id,phone").eq("role", "driver");
    const phones = new Set((trucks ?? []).map((t: any) => t.phone));
    const targets = (profs ?? []).filter((p: any) => phones.size === 0 || phones.has(p.phone));
    await Promise.all(targets.slice(0, 100).map((p: any) =>
      base44.entities.Notification.create({
        user_id: p.user_id, phone: p.phone, type: "new_load", load_id: booking.id,
        title: "New load available",
        body: `${booking.pickup} → ${booking.dropoff} · P${booking.offer}`,
      }).catch(() => null)
    ));
  } catch (e) { console.warn("notifyMatchingDrivers", e); }
}
export default notifyMatchingDrivers;
