import MapPanel from "./MapPanel";
export default function RouteOptimizer({ stops = [] }: { stops?: any[] }) {
  const list = (stops || []).filter(Boolean);
  return (
    <MapPanel title={list.length ? `Optimised route · ${list.length} stops` : "Route"} height={160}
      points={list.map((s: any, i: number) => ({
        label: typeof s === "string" ? s : s.address || s.label || `Stop ${i + 1}`,
        sub: i === 0 ? "Start" : i === list.length - 1 ? "End" : `Stop ${i}`,
      }))} />
  );
}
