const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

export const isMapboxConfigured = Boolean(mapboxToken);
export const MAPBOX_TOKEN = mapboxToken;

// Gaborone, used to bias geocoding results toward Botswana.
const PROXIMITY_LNG = 25.9231;
const PROXIMITY_LAT = -24.6282;
const REQUEST_TIMEOUT_MS = 8000;

export type LatLng = { lat: number; lng: number };

const geocodeCache = new Map<string, LatLng | null>();

const LAT_LNG_PATTERN = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

function parseLatLng(value: string): LatLng | null {
  const match = value.match(LAT_LNG_PATTERN);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Resolves a free-text address (or an already-coordinate "lat,lng" string, as
// produced by the client "use current location" button) to a point. Results
// are cached per normalized query so polling/re-renders don't re-geocode.
export async function geocodeAddress(query: string): Promise<LatLng | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const direct = parseLatLng(trimmed);
  if (direct) return direct;

  if (!isMapboxConfigured) return null;

  const cacheKey = trimmed.toLowerCase();
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey) ?? null;

  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json` +
      `?access_token=${mapboxToken}&country=bw&proximity=${PROXIMITY_LNG},${PROXIMITY_LAT}&limit=1`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);
    const data = await response.json();
    const feature = data?.features?.[0];
    const center = feature?.center as [number, number] | undefined;
    const result = center ? { lat: center[1], lng: center[0] } : null;
    geocodeCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn("Could not geocode address", trimmed, error);
    geocodeCache.set(cacheKey, null);
    return null;
  }
}

// Real driving distance (km) between two points via the Directions API.
// Returns null (never throws) on no-route or network failure so callers can
// fall back gracefully.
export async function getDrivingDistanceKm(origin: LatLng, dest: LatLng): Promise<number | null> {
  if (!isMapboxConfigured) return null;

  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}` +
      `?access_token=${mapboxToken}&overview=false&alternatives=false`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`Directions failed: ${response.status}`);
    const data = await response.json();
    const meters = data?.routes?.[0]?.distance;
    if (typeof meters !== "number") return null;
    return Math.round((meters / 1000) * 10) / 10;
  } catch (error) {
    console.warn("Could not calculate driving distance", error);
    return null;
  }
}
