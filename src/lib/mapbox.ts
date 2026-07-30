// Mapbox helpers — token comes from VITE_MAPBOX_TOKEN.
// If absent, callers fall back to the static MapPanel.

export const MAPBOX_TOKEN: string =
  (import.meta as any).env?.VITE_MAPBOX_TOKEN || "";

export const hasMapbox = () => Boolean(MAPBOX_TOKEN);

// Botswana bounding box + centre (Gaborone)
export const BW_BBOX = "19.999,-26.907,29.375,-17.780";
export const BW_CENTER: [number, number] = [25.9089, -24.6282];

export type Coord = { lng: number; lat: number };

const geoCache = new Map<string, Coord | null>();

/** Forward-geocode a place name, biased to Botswana. */
export async function geocode(query: string): Promise<Coord | null> {
  const q = (query || "").trim();
  if (!q || !hasMapbox()) return null;
  if (geoCache.has(q)) return geoCache.get(q)!;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
      `?access_token=${MAPBOX_TOKEN}&country=bw&bbox=${BW_BBOX}&limit=1`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const f = j?.features?.[0];
    const out: Coord | null = f ? { lng: f.center[0], lat: f.center[1] } : null;
    geoCache.set(q, out);
    return out;
  } catch (e) {
    console.warn("[mapbox] geocode failed", e);
    geoCache.set(q, null);
    return null;
  }
}

/** Driving route geometry + distance(km) + duration(min). */
export async function getRoute(from: Coord, to: Coord) {
  if (!hasMapbox()) return null;
  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}` +
      `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const route = j?.routes?.[0];
    if (!route) return null;
    return {
      geometry: route.geometry,
      km: Math.round((route.distance / 1000) * 10) / 10,
      minutes: Math.round(route.duration / 60),
    };
  } catch (e) {
    console.warn("[mapbox] route failed", e);
    return null;
  }
}

/** Straight-line km (fallback when Directions unavailable). */
export function haversineKm(a: Coord, b: Coord) {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

let cssLoaded = false;
export function ensureMapboxCss() {
  if (cssLoaded || typeof document === "undefined") return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css";
  document.head.appendChild(l);
  cssLoaded = true;
}
