import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { geocodeAddress, isMapboxConfigured, MAPBOX_TOKEN } from "@/lib/mapbox";
import type mapboxgl from "mapbox-gl";

type TrackingMapProps = {
  pickup: string;
  dropoff: string;
  driverLat?: number | null;
  driverLng?: number | null;
};

// Gaborone — default center before pickup/dropoff resolve.
const DEFAULT_CENTER: [number, number] = [25.9231, -24.6282];

function makeDriverMarkerElement() {
  const el = document.createElement("div");
  el.style.width = "18px";
  el.style.height = "18px";
  el.style.borderRadius = "9999px";
  el.style.background = "#2563eb";
  el.style.border = "3px solid white";
  el.style.boxShadow = "0 0 0 4px rgba(37,99,235,0.35), 0 2px 8px rgba(0,0,0,0.35)";
  return el;
}

export function TrackingMap({ pickup, dropoff, driverLat, driverLng }: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const glRef = useRef<typeof mapboxgl | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  // Dynamically load mapbox-gl (JS + CSS) only once this component mounts,
  // i.e. only on /track — keeps the SDK out of every other route's bundle.
  useEffect(() => {
    if (!isMapboxConfigured) {
      setUnavailable(true);
      return;
    }

    let cancelled = false;

    async function init() {
      const [mod] = await Promise.all([
        import("mapbox-gl"),
        import("mapbox-gl/dist/mapbox-gl.css"),
      ]);
      if (cancelled || !containerRef.current) return;
      const gl = mod.default;
      gl.accessToken = MAPBOX_TOKEN;
      const map = new gl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: DEFAULT_CENTER,
        zoom: 12,
      });
      map.addControl(new gl.NavigationControl({ showCompass: false }), "top-right");
      glRef.current = gl;
      mapRef.current = map;
      setReady(true);
    }

    void init().catch((error) => {
      console.warn("Could not load the tracking map", error);
      if (!cancelled) setUnavailable(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      driverMarkerRef.current = null;
    };
  }, []);

  // Pickup/dropoff pins + initial framing. Addresses don't change mid-trip
  // in practice, but this re-runs safely if they do.
  useEffect(() => {
    if (!ready || !mapRef.current || !glRef.current) return;
    const gl = glRef.current;
    const map = mapRef.current;
    let cancelled = false;

    async function placePins() {
      const [pickupPoint, dropoffPoint] = await Promise.all([
        geocodeAddress(pickup),
        geocodeAddress(dropoff),
      ]);
      if (cancelled) return;

      pickupMarkerRef.current?.remove();
      dropoffMarkerRef.current?.remove();

      const bounds = new gl.LngLatBounds();
      let hasPoint = false;

      if (pickupPoint) {
        pickupMarkerRef.current = new gl.Marker({ color: "#16a34a" })
          .setLngLat([pickupPoint.lng, pickupPoint.lat])
          .setPopup(new gl.Popup({ offset: 16 }).setText(pickup))
          .addTo(map);
        bounds.extend([pickupPoint.lng, pickupPoint.lat]);
        hasPoint = true;
      }

      if (dropoffPoint) {
        dropoffMarkerRef.current = new gl.Marker({ color: "#dc2626" })
          .setLngLat([dropoffPoint.lng, dropoffPoint.lat])
          .setPopup(new gl.Popup({ offset: 16 }).setText(dropoff))
          .addTo(map);
        bounds.extend([dropoffPoint.lng, dropoffPoint.lat]);
        hasPoint = true;
      }

      if (hasPoint) map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
    }

    void placePins();
    return () => {
      cancelled = true;
    };
  }, [ready, pickup, dropoff]);

  // Live driver marker: moves the existing marker instead of recreating it.
  useEffect(() => {
    if (!ready || !mapRef.current || !glRef.current) return;
    if (driverLat == null || driverLng == null) return;
    const gl = glRef.current;
    const map = mapRef.current;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([driverLng, driverLat]);
    } else {
      driverMarkerRef.current = new gl.Marker({ element: makeDriverMarkerElement() })
        .setLngLat([driverLng, driverLat])
        .addTo(map);
      map.panTo([driverLng, driverLat]);
    }
  }, [ready, driverLat, driverLng]);

  if (unavailable) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary text-center">
        <MapPin className="h-6 w-6 text-muted-foreground" />
        <p className="px-4 text-xs text-muted-foreground">Map unavailable right now.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {ready && (driverLat == null || driverLng == null) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[1] flex justify-center">
          <span className="rounded-full bg-ink/90 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[var(--shadow-elegant)]">
            Waiting for driver's location…
          </span>
        </div>
      )}
    </div>
  );
}
