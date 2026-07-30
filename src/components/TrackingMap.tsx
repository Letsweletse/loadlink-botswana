import { useEffect, useRef, useState } from "react";
import { MAPBOX_TOKEN, hasMapbox, ensureMapboxCss, BW_CENTER, geocode, getRoute, type Coord } from "@/lib/mapbox";
import MapPanel from "./MapPanel";

export type MapMarker = { lng: number; lat: number; color?: string; label?: string; sub?: string };

type Props = {
  markers?: MapMarker[];
  from?: Coord | null;
  to?: Coord | null;
  fromLabel?: string;
  toLabel?: string;
  height?: number | string;
  showRoute?: boolean;
  title?: string;
};

export default function TrackingMap({
  markers = [], from = null, to = null,
  fromLabel = "Pickup", toLabel = "Dropoff",
  height = 220, showRoute = true, title = "Route",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);
  const [info, setInfo] = useState<{ km: number; minutes: number } | null>(null);

  useEffect(() => {
    if (!hasMapbox() || !ref.current) return;
    let cancelled = false;
    let markerObjs: any[] = [];

    (async () => {
      try {
        ensureMapboxCss();
        const mod: any = await import("mapbox-gl");
        const mapboxgl = mod.default ?? mod;
        if (cancelled || !ref.current) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const pts: MapMarker[] = [...markers];
        if (from) pts.push({ ...from, color: "#16A34A", label: fromLabel });
        if (to) pts.push({ ...to, color: "#DC2626", label: toLabel });

        const map = new mapboxgl.Map({
          container: ref.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: pts.length ? [pts[0].lng, pts[0].lat] : BW_CENTER,
          zoom: pts.length ? 11 : 5,
          attributionControl: false,
        });
        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        map.on("error", () => setFailed(true));

        map.on("load", async () => {
          if (cancelled) return;

          markerObjs = pts.map(p => {
            const el = document.createElement("div");
            el.style.cssText =
              `width:16px;height:16px;border-radius:50%;border:3px solid #fff;` +
              `background:${p.color || "#C9A05A"};box-shadow:0 1px 4px rgba(0,0,0,.35)`;
            const m = new mapboxgl.Marker({ element: el }).setLngLat([p.lng, p.lat]);
            if (p.label) m.setPopup(new mapboxgl.Popup({ offset: 14, closeButton: false })
              .setHTML(`<strong style="font-size:12px">${p.label}</strong>${p.sub ? `<br><span style="font-size:11px;color:#6B7280">${p.sub}</span>` : ""}`));
            return m.addTo(map);
          });

          if (pts.length > 1) {
            const b = new mapboxgl.LngLatBounds();
            pts.forEach(p => b.extend([p.lng, p.lat]));
            map.fitBounds(b, { padding: 56, maxZoom: 13, duration: 0 });
          }

          if (showRoute && from && to) {
            const r = await getRoute(from, to);
            if (cancelled || !r) return;
            setInfo({ km: r.km, minutes: r.minutes });
            if (map.getSource("route")) return;
            map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: r.geometry } });
            map.addLayer({
              id: "route", type: "line", source: "route",
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": "#C9A05A", "line-width": 4, "line-opacity": 0.9 },
            });
          }
        });
      } catch (e) {
        console.warn("[TrackingMap]", e);
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      markerObjs.forEach(m => m.remove());
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [JSON.stringify(markers), from?.lat, from?.lng, to?.lat, to?.lng, showRoute]);

  if (!hasMapbox() || failed) {
    const pts = [
      ...(from ? [{ label: fromLabel, sub: "Pickup", color: "#16A34A" }] : []),
      ...(to ? [{ label: toLabel, sub: "Dropoff", color: "#DC2626" }] : []),
      ...markers.map(m => ({ label: m.label || "Point", sub: m.sub, color: m.color })),
    ];
    return <MapPanel title={title} height={height} points={pts} />;
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white">
      <div ref={ref} style={{ height }} />
      {info && (
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[#E5E7EB] text-xs">
          <span className="font-bold text-[#3D2B0E] tabular-nums">{info.km} km</span>
          <span className="text-[#6B7280]">~{info.minutes} min drive</span>
        </div>
      )}
    </div>
  );
}
