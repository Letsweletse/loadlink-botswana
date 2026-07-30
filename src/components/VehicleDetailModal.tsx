export default function VehicleDetailModal({ open, onClose, vehicle }: any) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 999 }}>
      <div style={{ background: "#fff", width: "100%", borderRadius: "20px 20px 0 0", padding: 24 }}>
        <p style={{ fontWeight: 700, marginBottom: 8 }}>{vehicle?.make} {vehicle?.model}</p>
        <button onClick={onClose} style={{ width: "100%", padding: 14, background: "#0F0F0F", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700 }}>Close</button>
      </div>
    </div>
  );
}
