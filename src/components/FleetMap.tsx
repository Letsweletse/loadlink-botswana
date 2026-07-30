import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import MapPanel from "./MapPanel";

export default function FleetMap() {
  const [trucks, setTrucks] = useState<any[]>([]);
  useEffect(() => { base44.entities.Vehicle.list("-created_at", 20).then(setTrucks); }, []);
  return (
    <MapPanel title={`Fleet · ${trucks.length} vehicles`} height={180}
      points={trucks.slice(0, 4).map(t => ({
        label: `${t.name} (${t.plate})`,
        sub: `${t.area || "Botswana"} · ${t.online ? "online" : "offline"}`,
        color: t.online ? "#16A34A" : "#9CA3AF",
      }))} />
  );
}
