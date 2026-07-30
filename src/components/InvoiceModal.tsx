export default function InvoiceModal({ open = true, onClose, booking }: any) {
  if (!open || !booking) return null;
  const fare = Number(booking.offer || 0);
  const commission = Math.round(fare * 0.1);
  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <p className="font-extrabold text-[#0F0F0F] text-lg">Invoice</p>
        <p className="text-xs text-[#6B7280] mb-4">Ref {booking.id}</p>
        <div className="space-y-2 text-sm">
          <Row l="Route" v={`${booking.pickup} → ${booking.dropoff}`} />
          <Row l="Distance" v={`${booking.km} km`} />
          <Row l="Fare" v={`P${fare}`} />
          <Row l="Platform fee (10%)" v={`P${commission}`} />
          <div className="border-t border-[#E5E7EB] pt-2 flex justify-between font-extrabold text-[#0F0F0F]">
            <span>Driver payout</span><span className="tabular-nums">P{fare - commission}</span>
          </div>
        </div>
        <button onClick={onClose} className="mt-5 w-full h-12 rounded-xl bg-[#0F0F0F] text-white font-bold">Close</button>
      </div>
    </div>
  );
}
function Row({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between gap-4"><span className="text-[#6B7280]">{l}</span><span className="text-[#0F0F0F] font-semibold text-right">{v}</span></div>;
}
