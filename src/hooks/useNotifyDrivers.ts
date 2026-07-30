import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";

const CAT_DB: Record<string, string> = {
  under_2ton: "mini", medium_7ton: "medium", big_over_7ton: "big", plant_machinery: "plant",
};

/** Notifies every approved driver whose vehicle matches the load's category.
 *  Fires a `new_load` Notification row per driver, which the realtime
 *  subscription in useDriverNotifications turns into the accept popup. */
export async function notifyMatchingDrivers(booking: any) {
  if (!supabase || !booking?.id) return;
  try {
    const cat = CAT_DB[booking.category] || booking.category;

    const { data: trucks, error: truckErr } = await supabase
      .from("trucks")
      .select("phone, driver_email")
      .eq("category", cat)
      .eq("status", "approved");
    if (truckErr) { console.warn("notifyMatchingDrivers: trucks query", truckErr.message); return; }
    if (!trucks?.length) return; // no approved vehicle of this category yet — nobody to notify

    const phones = new Set(trucks.map(t => t.phone).filter(Boolean));
    const emails = new Set(trucks.map(t => t.driver_email).filter(Boolean));

    const { data: profs, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, phone, email")
      .eq("role", "driver");
    if (profErr) { console.warn("notifyMatchingDrivers: profiles query", profErr.message); return; }

    const targets = (profs ?? []).filter(p => phones.has(p.phone) || (p.email && emails.has(p.email)));
    if (!targets.length) return;

    const fare = booking.offer ?? booking.offered_fare ?? 0;
    const pickup = booking.pickup ?? booking.pickup_address ?? "";
    const dropoff = booking.dropoff ?? booking.dropoff_address ?? "";

    await Promise.all(
      targets.slice(0, 200).map(p =>
        base44.entities.Notification.create({
          user_id: p.user_id,
          phone: p.phone,
          type: "new_load",
          load_id: booking.id,
          title: "New load available",
          body: `${pickup} → ${dropoff} · P${fare}`,
        }).catch(() => null)
      )
    );
  } catch (e) {
    console.warn("notifyMatchingDrivers failed (non-fatal — booking still created)", e);
  }
}
export default notifyMatchingDrivers;
