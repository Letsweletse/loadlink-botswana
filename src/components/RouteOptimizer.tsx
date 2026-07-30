import { useEffect, useState } from "react";
import TrackingMap, { type MapMarker } from "./TrackingMap";
import { geocode } from "@/lib/mapbox";

export default function RouteOptimizer({ stops = [], height = 180 }: { stops?: any[]; height?: number }) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const list = (stops || []).filter(Boolean);

  useEffect(() => {
    (async () => {
      const out: MapMarker[] = [];
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const text = typeof s === "string" ? s : s.address || s.label || "";
        const c = await geocode(text);
        if (c) out.push({ ...c, label: text, sub: i === 0 ? "Start" : i === list.length - 1 ? "End" : `Stop ${i}` });
      }
      setMarkers(out);
    })();
  }, [JSON.stringify(list)]);

  return <TrackingMap title={list.length ? `Route · ${list.length} stops` : "Route"} markers={markers} showRoute={false} height={height} />;
}
