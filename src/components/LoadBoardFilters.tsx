export default function LoadBoardFilters({ onFilter }: { onFilter?: (f: any) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "8px 0" }}>
      {["All", "Broadcasting", "Nearby"].map(f => (
        <button key={f} onClick={() => onFilter?.(f)} style={{ padding: "6px 16px", borderRadius: 99, border: "1px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{f}</button>
      ))}
    </div>
  );
}
