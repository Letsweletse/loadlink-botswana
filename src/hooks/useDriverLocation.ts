import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

/**
 * Explicit GPS-sharing toggle for drivers (matches the Base44 "Share GPS" UI):
 *   const { tracking, startTracking, stopTracking, error } = useDriverLocation(vehicleId)
 * Writes to trucks.last_lat/lng/last_seen, throttled to one write per ~20s.
 */
export default function useDriverLocation(vehicleId?: string) {
  const { user } = useAuth();
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState("");
  const watchId = useRef<number | null>(null);
  const lastPush = useRef(0);

  const stopTracking = useCallback(() => {
    if (watchId.current != null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    setError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("GPS isn't available on this device.");
      return;
    }
    if (!vehicleId) {
      setError("Register a vehicle first.");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        const now = Date.now();
        if (!supabase || now - lastPush.current < 20000) return;
        lastPush.current = now;
        try {
          await supabase.from("trucks")
            .update({ last_lat: lat, last_lng: lng, last_seen: new Date().toISOString(), online: true })
            .eq("id", vehicleId);
        } catch { /* non-fatal, keep watching */ }
      },
      (err) => setError(err.message || "Couldn't get your location."),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    setTracking(true);
  }, [vehicleId]);

  // stop cleanly if the component unmounts (page nav, sign out) while sharing
  useEffect(() => () => stopTracking(), [stopTracking]);

  // if the driver signs out while tracking, stop pushing their location
  useEffect(() => { if (!user) stopTracking(); }, [user, stopTracking]);

  return { tracking, startTracking, stopTracking, error };
}
