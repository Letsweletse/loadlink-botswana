export default function VehicleDetailModal({ open = true, onClose, vehicle }: any) {
  if (!open || !vehicle) return null;
  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <p className="font-extrabold text-[#3D2B0E] text-lg">{vehicle.name}</p>
        <p className="text-xs text-[#6B7280] mb-4">{vehicle.plate}</p>
        <div className="space-y-2 text-sm">
          {[["Category", vehicle.category], ["Capacity", `${vehicle.capacity_tonnes || 0} t`],
            ["Area", vehicle.area || "—"], ["Status", vehicle.status],
            ["Wallet", `P${Number(vehicle.wallet || 0).toFixed(2)}`], ["Rating", vehicle.rating]].map(([l, v]) => (
            <div key={l as string} className="flex justify-between gap-4">
              <span className="text-[#6B7280]">{l}</span><span className="text-[#3D2B0E] font-semibold">{v as any}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full h-12 rounded-xl bg-[#3D2B0E] text-white font-bold">Close</button>
      </div>
    </div>
  );
}
