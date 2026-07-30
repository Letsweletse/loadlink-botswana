import { AlertTriangle } from "lucide-react";

export default function ExpiryAlerts({ vehicle }: { vehicle?: any }) {
  if (!vehicle) return null;
  const missing: string[] = [];
  if (!vehicle.licence) missing.push("Driver's licence");
  if (!vehicle.disc) missing.push("Vehicle disc");
  if (!vehicle.permit) missing.push("Operator permit");
  if (!missing.length) return null;

  return (
    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 flex gap-3">
      <AlertTriangle className="h-5 w-5 text-[#D97706] shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-[#92400E] text-sm">Documents missing</p>
        <p className="text-xs text-[#B45309] mt-1">{missing.join(", ")} — add these to get approved for loads.</p>
      </div>
    </div>
  );
}
