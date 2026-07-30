import { getStatusColor, getStatusLabel } from "@/lib/fareUtils";
export default function BookingCard({ booking }: { booking: any }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1px solid #E5E7EB", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: getStatusColor(booking.status), background: getStatusColor(booking.status) + "20", padding: "2px 8px", borderRadius: 99 }}>{getStatusLabel(booking.status)}</span>
        <span style={{ fontSize: 12, color: "#6B7280" }}>P{booking.offer}</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#0F0F0F", margin: "0 0 4px" }}>{booking.pickup} → {booking.dropoff}</p>
      <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{booking.category} · {booking.km}km</p>
    </div>
  );
}
