export default function DriverSummary({ stats }: { stats?: any }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1px solid #E5E7EB" }}>
      <p style={{ fontWeight: 700, marginBottom: 12 }}>Your Summary</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[["Trips", stats?.trips ?? 0], ["Earned", `P${stats?.earned ?? 0}`], ["Rating", stats?.rating ?? "—"], ["Online", stats?.hours ?? "0h"]].map(([l, v]) => (
          <div key={l as string} style={{ background: "#F9FAFB", borderRadius: 12, padding: 12 }}>
            <p style={{ fontSize: 11, color: "#6B7280", margin: "0 0 4px" }}>{l}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#0F0F0F", margin: 0 }}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
