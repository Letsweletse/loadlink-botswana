import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { MapPin, Phone, MessageCircle, Navigation } from "lucide-react";

export const Route = createFileRoute("/track")({
  component: Track,
});

function Track() {
  const trip = typeof window !== "undefined" ? localStorage.getItem("vanlink_trip") : null;
  const t = trip ? (JSON.parse(trip) as { pickup: string; drop: string; fare: number; distance: number }) : null;

  return (
    <AppShell title="Live tracking">
      <div className="space-y-4">
        <div
          className="relative h-64 w-full overflow-hidden rounded-2xl shadow-[var(--shadow-card)] vl-fade-in"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, oklch(0.88 0.06 250) 0, transparent 50%), radial-gradient(circle at 70% 60%, oklch(0.84 0.07 240) 0, transparent 55%), linear-gradient(180deg, oklch(0.95 0.02 240), oklch(0.90 0.03 240))",
          }}
        >
          <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 400 300" preserveAspectRatio="none">
            <path d="M20 260 Q 120 180 180 200 T 380 60" stroke="oklch(0.60 0.21 255)" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="2 8" />
          </svg>
          <div className="absolute left-[12%] top-[78%] flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-success text-white shadow">
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <div className="absolute left-[88%] top-[18%] flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow">
            <Navigation className="h-3.5 w-3.5" />
          </div>
          <div className="absolute left-[48%] top-[48%] -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-full bg-ink px-3 py-1 text-[10px] font-semibold text-white shadow-[var(--shadow-elegant)]">Driver · 3 min</div>
          </div>
          <p className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">Map preview · OpenStreetMap-compatible</p>
        </div>

          {!t ? (
            <Panel className="text-center">
              <p className="text-sm font-semibold text-card-foreground">No active trip</p>
              <p className="mt-1 text-xs text-muted-foreground">Book a truck to see live tracking.</p>
              <Link to="/client" className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Book now</Link>
            </Panel>
          ) : (
            <>
              <Panel>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">KM</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-card-foreground">Kago M. · B 472 GHK</p>
                    <p className="text-xs text-muted-foreground">Toyota Hilux · 4.9 ★</p>
                  </div>
                  <a href="tel:" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-ink"><Phone className="h-4 w-4" /></a>
                  <a href="https://wa.me/" className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-white"><MessageCircle className="h-4 w-4" /></a>
                </div>
              </Panel>

              <Panel className="space-y-3 text-sm">
                <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-success" /><span className="flex-1 text-card-foreground">{t.pickup}</span></div>
                <div className="ml-2 h-4 border-l-2 border-dashed border-border" />
                <div className="flex items-center gap-3"><Navigation className="h-4 w-4 text-primary" /><span className="flex-1 text-card-foreground">{t.drop}</span></div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>{t.distance} km · ETA 18 min</span>
                  <span className="text-base font-bold text-primary">P{t.fare}</span>
                </div>
              </Panel>
            </>
          )}
      </div>
    </AppShell>
  );
}