import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

/**
 * Watches the driver's GPS and pushes it to trucks.last_lat/last_lng
 * (throttled to one write per ~30s) so fleet + tracking maps stay live.
 */
export default function useDriverLocation(enabled = true) {
  const { user } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string>("");
  const lastPush = useRef(0);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setLocation({ lat, lng });

        const now = Date.now();
        if (!supabase || !user?.phone || now - lastPush.current < 30000) return;
        lastPush.current = now;
        try {
          await supabase.from("trucks")
            .update({ last_lat: lat, last_lng: lng, last_seen: new Date().toISOString() })
            .eq("phone", user.phone);
        } catch (e) { /* non-fatal */ }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [enabled, user?.phone]);

  return { location, error };
}
