export default function RatingModal({ open, onClose, bookingId }: any) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 999 }}>
      <div style={{ background: "#fff", width: "100%", borderRadius: "20px 20px 0 0", padding: 24 }}>
        <p style={{ fontWeight: 700, marginBottom: 16 }}>Rate this trip</p>
        <button onClick={onClose} style={{ width: "100%", padding: 14, background: "#F97316", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700 }}>Submit Rating</button>
      </div>
    </div>
  );
}
