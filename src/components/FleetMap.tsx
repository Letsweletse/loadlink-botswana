import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import TrackingMap, { type MapMarker } from "./TrackingMap";

export default function FleetMap({ height = 200 }: { height?: number | string }) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    base44.entities.Vehicle.list("-created_at", 50).then((trucks: any[]) => {
      setCount(trucks.length);
      setMarkers(
        trucks
          .filter(t => t.last_lat && t.last_lng)
          .map(t => ({
            lat: t.last_lat, lng: t.last_lng,
            color: t.online ? "#16A34A" : "#9CA3AF",
            label: `${t.name} (${t.plate})`,
            sub: `${t.area || "Botswana"} · ${t.online ? "online" : "offline"}`,
          }))
      );
    });
  }, []);

  return <TrackingMap title={`Fleet · ${count} vehicles`} markers={markers} showRoute={false} height={height} />;
}
