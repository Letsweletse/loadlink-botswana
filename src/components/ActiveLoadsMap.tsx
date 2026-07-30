import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import TrackingMap, { type MapMarker } from "./TrackingMap";
import { geocode } from "@/lib/mapbox";

export default function ActiveLoadsMap({ height = 200 }: { height?: number }) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      const all = await base44.entities.Booking.list("-created_at", 50);
      const active = all.filter((b: any) => !["delivered", "completed"].includes(b.status));
      setCount(active.length);
      const out: MapMarker[] = [];
      for (const b of active.slice(0, 12)) {
        let c = b.pickup_lat && b.pickup_lng ? { lat: b.pickup_lat, lng: b.pickup_lng } : await geocode(b.pickup);
        if (c) out.push({ ...c, color: "#F97316", label: `${b.pickup} → ${b.dropoff}`, sub: `P${b.offer} · ${b.status}` });
      }
      setMarkers(out);
    })();
  }, []);

  return <TrackingMap title={`Active loads · ${count}`} markers={markers} showRoute={false} height={height} />;
}
