import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

async function clearAppCaches() {
  try {
    if (!("caches" in window)) return;
    const keys = await window.caches.keys();
    await Promise.all(keys.filter((key) => key.toLowerCase().includes("vanlink")).map((key) => window.caches.delete(key)));
  } catch {
    // Some browsers block cache access.
  }
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("LoadLink runtime error", error);
  }

  async hardRefresh() {
    await clearAppCaches();
    window.location.assign("/");
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main style={{ minHeight: "100vh", background: "#071426", color: "white", padding: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
        <section style={{ maxWidth: 520, margin: "40px auto", background: "white", color: "#111827", borderRadius: 16, padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,.25)" }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#0b73d9", letterSpacing: ".08em", textTransform: "uppercase" }}>LoadLink</p>
          <h1 style={{ margin: "8px 0", fontSize: 24, lineHeight: 1.1 }}>This device loaded an old app file.</h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Tap the button below to refresh the app and continue. This helps phones in Gaborone, Jwaneng, Kanye or anywhere load the latest public version.</p>
          <button onClick={() => void this.hardRefresh()} style={{ width: "100%", marginTop: 16, border: 0, borderRadius: 12, padding: 12, background: "linear-gradient(135deg,#0b73d9,#2d9ff0)", color: "white", fontWeight: 800 }}>Reload latest app</button>
        </section>
      </main>
    );
  }
}
