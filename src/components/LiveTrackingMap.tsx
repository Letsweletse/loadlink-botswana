import MapPanel from "./MapPanel";
export default function LiveTrackingMap({ booking }: any) {
  return (
    <MapPanel
      title={booking?.status === "in_transit" ? "In transit" : "Live tracking"}
      height={200}
      points={booking ? [
        { label: booking.pickup, sub: "Pickup", color: "#16A34A" },
        { label: booking.dropoff, sub: "Dropoff", color: "#DC2626" },
      ] : []}
    />
  );
}
