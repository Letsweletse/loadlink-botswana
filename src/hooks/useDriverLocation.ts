import { useState, useEffect } from "react";
export default function useDriverLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(p => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }));
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return location;
}
