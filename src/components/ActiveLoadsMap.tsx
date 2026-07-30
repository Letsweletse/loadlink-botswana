import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import MapPanel from "./MapPanel";

export default function ActiveLoadsMap() {
  const [loads, setLoads] = useState<any[]>([]);
  useEffect(() => {
    base44.entities.Booking.list("-created_at", 50).then((r: any[]) =>
      setLoads(r.filter(b => !["delivered", "completed"].includes(b.status))));
  }, []);
  return (
    <MapPanel title={`Active loads · ${loads.length}`} height={180}
      points={loads.slice(0, 4).map(l => ({ label: `${l.pickup} → ${l.dropoff}`, sub: `P${l.offer} · ${l.status}` }))} />
  );
}
