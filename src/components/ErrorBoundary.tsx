import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unexpected app error",
    };
  }

  componentDidCatch(error: unknown) {
    console.error("LoadLink runtime error", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main style={{ minHeight: "100vh", background: "#071426", color: "white", padding: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
        <section style={{ maxWidth: 520, margin: "40px auto", background: "white", color: "#111827", borderRadius: 16, padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,.25)" }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#0b73d9", letterSpacing: ".08em", textTransform: "uppercase" }}>LoadLink recovered</p>
          <h1 style={{ margin: "8px 0", fontSize: 24, lineHeight: 1.1 }}>The app hit a temporary issue.</h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Refresh once. If it keeps happening, the app will show this safe screen instead of crashing blank.</p>
          {this.state.message && <p style={{ marginTop: 12, padding: 10, borderRadius: 10, background: "#f1f5f9", color: "#334155", fontSize: 12 }}>{this.state.message}</p>}
          <button onClick={() => window.location.assign("/")} style={{ width: "100%", marginTop: 16, border: 0, borderRadius: 12, padding: 12, background: "linear-gradient(135deg,#0b73d9,#2d9ff0)", color: "white", fontWeight: 800 }}>Reload app</button>
        </section>
      </main>
    );
  }
}
