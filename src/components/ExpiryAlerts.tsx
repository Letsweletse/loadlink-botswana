import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, ShieldCheck } from "lucide-react";

const DOC_FIELDS: { key: string; label: string }[] = [
  { key: "driver_license_expiry", label: "Driver's licence" },
  { key: "ba_permit_expiry", label: "BA permit" },
  { key: "fitness_certificate_expiry", label: "Fitness certificate" },
  { key: "insurance_expiry", label: "Insurance" },
  { key: "prdp_expiry", label: "PrDP" },
];

const WARN_DAYS = 30;

function daysUntil(dateStr?: string) {
  if (!dateStr) return null;
  const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000;
  return Math.ceil(diff);
}

/** Fleet-wide view (admin): every vehicle with a document expired or
 *  expiring within 30 days. Pass a single `vehicle` to scope it to one. */
export default function ExpiryAlerts({ vehicle }: { vehicle?: any }) {
  const [vehicles, setVehicles] = useState<any[]>(vehicle ? [vehicle] : []);
  const [loaded, setLoaded] = useState(Boolean(vehicle));

  useEffect(() => {
    if (vehicle) return;
    base44.entities.Vehicle.list("-created_date", 200).then(v => { setVehicles(v); setLoaded(true); });
  }, [vehicle]);

  const flagged = vehicles
    .map(v => {
      const issues = DOC_FIELDS
        .map(f => ({ ...f, days: daysUntil(v[f.key]) }))
        .filter(f => f.days !== null && f.days <= WARN_DAYS);
      return { vehicle: v, issues };
    })
    .filter(x => x.issues.length > 0);

  if (!loaded) {
    return (
      <div className="py-8 flex justify-center">
        <div className="h-5 w-5 border-2 border-[#C9A05A]/30 border-t-[#C9A05A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!flagged.length) {
    return (
      <div className="flex items-center gap-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4">
        <ShieldCheck className="h-5 w-5 text-[#16A34A] shrink-0" />
        <p className="text-sm text-[#166534] font-medium">All vehicle documents are up to date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flagged.map(({ vehicle: v, issues }) => (
        <div key={v.id} className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#D97706] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#92400E] text-sm">{v.number_plate || v.plate} · {v.driver_email || v.phone}</p>
              <div className="mt-1.5 space-y-1">
                {issues.map(i => (
                  <p key={i.key} className="text-xs text-[#B45309]">
                    {i.label} — {i.days! < 0 ? `expired ${Math.abs(i.days!)}d ago` : `expires in ${i.days}d`}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
