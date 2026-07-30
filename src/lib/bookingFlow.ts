import { base44 } from "@/api/base44Client";

export type UiStatus = "broadcasting" | "accepted" | "picked_up" | "in_transit" | "delivered" | "completed";

const NEXT: Record<UiStatus, UiStatus | null> = {
  broadcasting: "accepted",
  accepted: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
  delivered: "completed",
  completed: null,
};

export function nextStatus(current: string): UiStatus | null {
  return NEXT[(current || "").toLowerCase() as UiStatus] ?? null;
}

export function nextStatusLabel(current: string): string {
  const n = nextStatus(current);
  const labels: Record<string, string> = {
    picked_up: "Mark picked up",
    in_transit: "Start trip",
    delivered: "Mark delivered",
    completed: "Complete & settle",
  };
  return n ? labels[n] || `Mark ${n}` : "Trip complete";
}

/** Advances a booking to its next stage, stamping the right timestamp
 *  and, on delivery, locking in the final fare. */
export async function advanceBooking(booking: any) {
  const n = nextStatus(booking.status);
  if (!n) return booking;

  const patch: Record<string, any> = { status: n };
  const now = new Date().toISOString();
  if (n === "picked_up") patch.picked_up_at = now;
  if (n === "delivered") {
    patch.delivered_at = now;
    patch.final_fare = booking.final_fare ?? booking.offered_fare ?? booking.offer;
  }
  return base44.entities.Booking.update(booking.id, patch);
}
