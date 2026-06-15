import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { MapPin, Phone, MessageCircle, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchLoad, type LoadRecord } from "@/lib/supabase";

export const Route = createFileRoute("/track")({
  component: Track,
});

function mapsSearchUrl(value: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

function mapsDirectionsUrl(pickup: string, dropoff: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}`;
}

function Track() {
  const [load, setLoad] = useState<LoadRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadTrip();
  }, []);

  async function loadTrip() {
    let cached: { id?: string; pickup?: string; drop?: string; dropoff?: string; fare?: number; offer?: number; distance?: number; km?: number } | null = null;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("vanlink_trip") : null;
      cached = raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("Invalid saved trip cleared", error);
      localStorage.removeItem("vanlink_trip");
    }

    if (!cached?.id) {
      setLoading(false);
      return;
    }
    try {
      const fresh = await fetchLoad(cached.id);
      setLoad(fresh || {
        id: cached.id,
        customer: "Customer",
        phone: "",
        pickup: cached.pickup || "Pickup",
        dropoff: cached.dropoff || cached.drop || "Drop-off",
        category: "mini",
        km: Number(cached.km || cached.distance || 0),
        offer: Number(cached.offer || cached.fare || 0),
        status: "Broadcasting",
      });
    } catch (error) {
      console.error(error);
      setLoad({
        id: cached.id,
        customer: "Customer",
        phone: "",
        pickup: cached.pickup || "Pickup",
        dropoff: cached.dropoff || cached.drop || "Drop-off",
        category: "mini",
        km: Number(cached.km || cached.distance || 0),
        offer: Number(cached.offer || cached.fare || 0),
        status: "Broadcasting",
      });
    } finally {
      setLoading(false);
    }
  }

  const routeUrl = load ? mapsDirectionsUrl(load.pickup, load.dropoff) : "#";

  return (
    <AppShell title="Live tracking">
      <div className="space-y-4">
        <div className="relative h-64 w-full overflow-hidden rounded-2xl shadow-[var(--shadow-card)] vl-fade-in">
          {load ? (
            <iframe
              title="Trip map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(`${load.pickup} to ${load.dropoff}`)}&output=embed`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 40%, oklch(0.88 0.06 250) 0, transparent 50%), radial-gradient(circle at 70% 60%, oklch(0.84 0.07 240) 0, transparent 55%), linear-gradient(180deg, oklch(0.95 0.02 240), oklch(0.90 0.03 240))",
              }}
            />
          )}
          <div className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold text-white shadow-[var(--shadow-elegant)]">{load?.status || "Waiting"}</div>
          {load && (
            <a href={routeUrl} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground shadow-[var(--shadow-card)]">
              Open route
            </a>
          )}
        </div>

        {loading ? (
          <Panel className="text-center text-sm text-muted-foreground">Loading trip...</Panel>
        ) : !load ? (
          <Panel className="text-center">
            <p className="text-sm font-semibold text-card-foreground">No active trip</p>
            <p className="mt-1 text-xs text-muted-foreground">Book a truck to see live tracking.</p>
            <Link to="/client" className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Book now</Link>
          </Panel>
        ) : (
          <>
            <Panel>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">LL</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-card-foreground">{load.driver || "Waiting for driver"}</p>
                  <p className="text-xs text-muted-foreground">{load.driver_phone || "Driver will appear after acceptance"}</p>
                </div>
                <a href={`tel:${load.driver_phone || ""}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-ink"><Phone className="h-4 w-4" /></a>
                <a href={`https://wa.me/${String(load.driver_phone || "").replace(/\D/g, "")}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-white"><MessageCircle className="h-4 w-4" /></a>
              </div>
            </Panel>

            <Panel className="space-y-3 text-sm">
              <a href={mapsSearchUrl(load.pickup)} target="_blank" rel="noreferrer" className="flex items-center gap-3"><MapPin className="h-4 w-4 text-success" /><span className="flex-1 text-card-foreground underline underline-offset-2">{load.pickup}</span></a>
              <div className="ml-2 h-4 border-l-2 border-dashed border-border" />
              <a href={mapsSearchUrl(load.dropoff)} target="_blank" rel="noreferrer" className="flex items-center gap-3"><Navigation className="h-4 w-4 text-primary" /><span className="flex-1 text-card-foreground underline underline-offset-2">{load.dropoff}</span></a>
              <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{load.km} km · {load.id}</span>
                <span className="text-base font-bold text-primary">P{load.offer}</span>
              </div>
            </Panel>
          </>
        )}
      </div>
    </AppShell>
  );
}
