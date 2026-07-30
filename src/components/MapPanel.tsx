import { MapPin, Navigation } from "lucide-react";

export default function MapPanel({ title = "Route", points = [], height = 200 }: {
  title?: string; points?: { label: string; sub?: string; color?: string }[]; height?: number | string;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
      <div
        className="relative flex items-center justify-center"
        style={{
          height,
          background:
            "repeating-linear-gradient(45deg,#F9FAFB 0 12px,#F3F4F6 12px 24px)",
        }}
      >
        <div className="flex items-center gap-2 text-[#9CA3AF]">
          <Navigation className="h-4 w-4" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
      </div>
      {points.length > 0 && (
        <div className="p-3 space-y-2 border-t border-[#E5E7EB]">
          {points.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: p.color || "#C9A05A" }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#3D2B0E] truncate">{p.label}</p>
                {p.sub && <p className="text-xs text-[#6B7280]">{p.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
