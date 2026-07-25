import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateDriverLocation } from "@/lib/supabase";

const MIN_SEND_INTERVAL_MS = 12000;

// Watches the driver's GPS position while `enabled` (an accepted/in-transit
// load) and pushes throttled updates to Supabase. Uses watchPosition (not a
// plain interval) so updates are tied to actual movement, but writes are
// throttled to ~12s so a fast GPS callback rate doesn't spam the database.
export function useDriverLocationTracking(loadId: string | null | undefined, enabled: boolean) {
  const lastSentAtRef = useRef(0);
  const deniedNoticeShownRef = useRef(false);

  useEffect(() => {
    if (!enabled || !loadId) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSentAtRef.current < MIN_SEND_INTERVAL_MS) return;
        lastSentAtRef.current = now;
        void updateDriverLocation(loadId, position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED && !deniedNoticeShownRef.current) {
          deniedNoticeShownRef.current = true;
          toast.error("Location sharing is off", {
            description: "Allow location access so customers can see your live position.",
          });
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [loadId, enabled]);
}
