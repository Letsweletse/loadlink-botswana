import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; clearing: boolean };

async function clearCachedApp() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  window.location.assign("/");
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, clearing: false };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("LoadLink runtime error", error);
  }

  private resetApp = async () => {
    this.setState({ clearing: true });
    await clearCachedApp().catch((error) => {
      console.warn("Could not clear cached Van-Link app", error);
      window.location.assign("/");
    });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#071426",
          color: "white",
          padding: 20,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <section
          style={{
            maxWidth: 520,
            margin: "40px auto",
            background: "#fdfcfa",
            color: "#111827",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 20px 50px rgba(0,0,0,.25)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#46321e",
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            LoadLink
          </p>
          <h1 style={{ margin: "8px 0", fontSize: 24, lineHeight: 1.1 }}>
            We could not load this screen.
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Please refresh or reset the cached app. Your request may still be saved.
          </p>
          <button
            onClick={this.resetApp}
            disabled={this.state.clearing}
            style={{
              width: "100%",
              marginTop: 16,
              border: 0,
              borderRadius: 12,
              padding: 12,
              background: "linear-gradient(135deg,#c89a63,#e0c296)",
              color: "#46321e",
              fontWeight: 800,
            }}
          >
            {this.state.clearing ? "Resetting..." : "Reset app and reload"}
          </button>
        </section>
      </main>
    );
  }
}
