import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, X } from "lucide-react";

const DOC_ROWS: { key: string; label: string; imgKey?: string }[] = [
  { key: "driver_license_number", label: "Driving licence #" },
  { key: "driver_license_code", label: "Licence code" },
  { key: "driver_license_expiry", label: "Licence expiry", imgKey: "driver_license_image" },
  { key: "ba_permit_number", label: "BA permit #" },
  { key: "ba_permit_expiry", label: "BA permit expiry", imgKey: "ba_permit_image" },
  { key: "fitness_certificate_expiry", label: "Fitness cert. expiry", imgKey: "fitness_certificate_image" },
  { key: "insurance_expiry", label: "Insurance expiry", imgKey: "insurance_image" },
  { key: "prdp_expiry", label: "PrDP expiry", imgKey: "prdp_image" },
];

export default function VehicleDetailModal({ open = true, onClose, vehicle, onUpdated }: any) {
  const [busy, setBusy] = useState(false);
  if (!open || !vehicle) return null;

  async function setStatus(status: string) {
    setBusy(true);
    try {
      const updated = await base44.entities.Vehicle.update(vehicle.id, { status });
      onUpdated?.(updated);
    } catch (e) { console.warn(e); }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full max-h-[85vh] overflow-y-auto rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="font-extrabold text-[#3D2B0E] text-lg">{vehicle.number_plate || vehicle.plate}</p>
            <p className="text-sm text-[#6B7280]">{vehicle.driver_email || vehicle.phone}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-[#9CA3AF]" /></button>
        </div>

        <span className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full ${
          vehicle.status === "approved" ? "bg-[#F0FDF4] text-[#16A34A]"
          : vehicle.status === "suspended" ? "bg-[#FEF2F2] text-red-600"
          : "bg-[#FFFBEB] text-[#D97706]"
        }`}>{vehicle.status}</span>

        <div className="mt-4 space-y-2 text-sm">
          <Row l="Make / model" v={vehicle.make_model || "—"} />
          <Row l="Category" v={vehicle.category} />
          <Row l="Area" v={vehicle.area || "—"} />
          <Row l="Deposit balance" v={`P${Number(vehicle.deposit_balance || 0).toFixed(2)}`} />
          <Row l="Wallet" v={`P${Number(vehicle.wallet || 0).toFixed(2)}`} />
        </div>

        {(vehicle.vehicle_photo_front || vehicle.vehicle_photo_side || vehicle.driver_photo) && (
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[vehicle.vehicle_photo_front, vehicle.vehicle_photo_side, vehicle.driver_photo].filter(Boolean).map((src, i) => (
              <img key={i} src={src} className="h-20 w-20 rounded-xl object-cover shrink-0 border border-[#E5E7EB]" />
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[#E8D5B7] space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#B08A45] mb-1">Compliance</p>
          {DOC_ROWS.map(d => (
            <div key={d.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[#6B7280]">{d.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[#3D2B0E] font-semibold">{vehicle[d.key] || "—"}</span>
                {d.imgKey && vehicle[d.imgKey] && (
                  <a href={vehicle[d.imgKey]} target="_blank" rel="noreferrer">
                    <img src={vehicle[d.imgKey]} className="h-8 w-8 rounded-lg object-cover border border-[#E5E7EB]" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          {vehicle.status !== "approved" && (
            <button onClick={() => setStatus("approved")} disabled={busy}
              className="flex-1 h-11 rounded-xl bg-[#16A34A] text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
              <CheckCircle className="h-4 w-4" /> Approve
            </button>
          )}
          {vehicle.status !== "suspended" && (
            <button onClick={() => setStatus("suspended")} disabled={busy}
              className="flex-1 h-11 rounded-xl border border-red-200 text-red-600 font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Suspend
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function Row({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between gap-4"><span className="text-[#6B7280]">{l}</span><span className="text-[#3D2B0E] font-semibold text-right">{v}</span></div>;
}
