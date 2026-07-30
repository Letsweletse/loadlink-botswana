import { Link } from "@tanstack/react-router";
import { MapPin, Package } from "lucide-react";
import { getStatusColor, getStatusLabel } from "@/lib/fareUtils";

export default function BookingCard({ booking, onClick }: any) {
  if (!booking) return null;
  const color = getStatusColor(booking.status);
  const body = (
    <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] hover:border-[#F97316]/40 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ color, background: color + "1A" }}>
          {getStatusLabel(booking.status)}
        </span>
        <span className="text-sm font-extrabold text-[#0F0F0F] tabular-nums">P{booking.offer}</span>
      </div>
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-[#0F0F0F]">
          <MapPin className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
          <span className="truncate">{booking.pickup}</span>
        </p>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-[#0F0F0F]">
          <MapPin className="h-3.5 w-3.5 text-[#DC2626] shrink-0" />
          <span className="truncate">{booking.dropoff}</span>
        </p>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-2">
        <Package className="h-3 w-3" />{booking.km}km · {booking.load || booking.cargo_description || "General cargo"}
      </p>
    </div>
  );
  if (onClick) return <button onClick={() => onClick(booking)} className="w-full text-left">{body}</button>;
  return <Link to="/booking/$id" params={{ id: String(booking.id) }} className="block">{body}</Link>;
}
