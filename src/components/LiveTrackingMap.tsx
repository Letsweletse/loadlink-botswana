import { useEffect, useState } from "react";
import TrackingMap from "./TrackingMap";
import { geocode, type Coord } from "@/lib/mapbox";

export default function LiveTrackingMap({ booking, height = 220 }: any) {
  const [from, setFrom] = useState<Coord | null>(null);
  const [to, setTo] = useState<Coord | null>(null);

  useEffect(() => {
    if (!booking) return;
    if (booking.pickup_lat && booking.pickup_lng) setFrom({ lat: booking.pickup_lat, lng: booking.pickup_lng });
    else if (booking.pickup) geocode(booking.pickup).then(setFrom);

    if (booking.dropoff_lat && booking.dropoff_lng) setTo({ lat: booking.dropoff_lat, lng: booking.dropoff_lng });
    else if (booking.dropoff) geocode(booking.dropoff).then(setTo);
  }, [booking?.id, booking?.pickup, booking?.dropoff]);

  return (
    <TrackingMap
      title={booking?.status === "in_transit" ? "In transit" : "Live tracking"}
      from={from} to={to}
      fromLabel={booking?.pickup} toLabel={booking?.dropoff}
      height={height}
    />
  );
}
