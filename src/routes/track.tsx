import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { MapPin, Phone, MessageCircle, Navigation, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchLoad, type LoadRecord } from "@/lib/supabase";

export const Route = createFileRoute("/track")({ component: Track });

const ACTIVE_STATUSES = new Set(["Broadcasting", "Accepted", "In transit"]);
const POLL_INTERVAL_MS = 4000;

function mapsSearchUrl(value: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

function mapsDirectionsUrl(pickup: string, dropoff: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}`;
}

function mapsDirectionsEmbedUrl(pickup: string, dropoff: string) {
  return `https://maps.google.com/maps?saddr=${encodeURIComponent(pickup)}&daddr=${encodeURIComponent(dropoff)}&output=embed`;
}

function safeStorageGet(key: string) {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageRemove(key: string) {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  } catch {
    return;
  }
}

function LiveTrackingBadge() {
  return (
    <div
      className="absolute right-3 top-3 inline-flex animate-pulse items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white"
      style={{
        background: "linear-gradient(135deg, #7f1d1d, #dc2626)",
        borderColor: "rgba(252,165,165,.9)",
        boxShadow: "0 0 0 1px rgba(255,255,255,.12), 0 0 22px rgba(239,68,68,.95)",
      }}
    >
      <span
        className="h-2 w-2 rounded-full bg-red-300"
        style={{ boxShadow: "0 0 10px rgba(252,165,165,1)" }}
      />
      LIVE TRACKING
    </div>
  );
}

function Track() {
  const [load, setLoad] = useState<LoadRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadTrip();
  }, []);

  // Keep the customer's status in sync with driver acceptance without a
  // manual refresh. Self-schedules with setTimeout (not setInterval) so a
  // slow poll on a bad mobile connection can't pile requests up, and pauses
  // while the tab is backgrounded to avoid burning battery/data for nothing.
  useEffect(() => {
    if (!load || !ACTIVE_STATUSES.has(load.status)) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function scheduleNext() {
      timer = setTimeout(async () => {
        if (cancelled) return;
        if (typeof document !== "undefined" && document.hidden) {
          scheduleNext();
          return;
        }
        await loadTrip({ silent: true });
        if (!cancelled) scheduleNext();
      }, POLL_INTERVAL_MS);
    }

    scheduleNext();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // Deliberately keyed on load?.status, not the whole `load` object: loadTrip
    // re-reads storage/network itself rather than closing over `load`, and the
    // object gets a new reference on every poll, which would restart this timer
    // chain each tick instead of letting it run continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load?.status]);

  async function loadTrip(options: { silent?: boolean } = {}) {
    if (!options.silent) setLoading(true);
    let cached: {
      id?: string;
      pickup?: string;
      drop?: string;
      dropoff?: string;
      fare?: number;
      offer?: number;
      distance?: number;
      km?: number;
    } | null = null;
    try {
      const raw = safeStorageGet("vanlink_trip");
      cached = raw ? JSON.parse(raw) : null;
    } catch {
      safeStorageRemove("vanlink_trip");
    }

    if (!cached?.id) {
      if (!options.silent) setLoading(false);
      return;
    }

    const fallback = {
      id: cached.id,
      customer: "Customer",
      phone: "",
      pickup: cached.pickup || "Pickup",
      dropoff: cached.dropoff || cached.drop || "Drop-off",
      category: "mini",
      km: Number(cached.km || cached.distance || 0),
      offer: Number(cached.offer || cached.fare || 0),
      status: "Broadcasting",
    } as LoadRecord;

    try {
      const fresh = await fetchLoad(cached.id);
      setLoad(fresh || fallback);
    } catch {
      if (!options.silent) setLoad(fallback);
    } finally {
      if (!options.silent) setLoading(false);
    }
  }

  const routeUrl = load ? mapsDirectionsUrl(load.pickup, load.dropoff) : "#";

  return (
    <AppShell title="Live tracking">
      <div className="space-y-4">
        <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] vl-fade-in">
          <iframe
            title={load ? "Trip route map" : "VanLink Botswana map"}
            src={
              load
                ? mapsDirectionsEmbedUrl(load.pickup, load.dropoff)
                : "https://maps.google.com/maps?q=Gaborone%20Botswana&output=embed"
            }
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold text-white shadow-[var(--shadow-elegant)]">
            {load?.status || "Waiting"}
          </div>
          <LiveTrackingBadge />
          <button
            type="button"
            onClick={() => void loadTrip()}
            className="absolute right-3 top-14 flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-ink shadow-[var(--shadow-card)]"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          {load && (
            <a
              href={routeUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
            >
              Open route <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {loading ? (
          <Panel className="text-center text-sm text-muted-foreground">Loading trip...</Panel>
        ) : !load ? (
          <Panel className="text-center">
            <p className="text-sm font-semibold text-card-foreground">No active trip</p>
            <p className="mt-1 text-xs text-muted-foreground">Book a truck to see live tracking.</p>
            <Link
              to="/client"
              className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Book now
            </Link>
          </Panel>
        ) : (
          <>
            <Panel>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                  LL
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-card-foreground">
                    {load.driver || "Broadcasting to nearby drivers"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {load.driver_phone || "Driver will appear after acceptance"}
                  </p>
                </div>
                <a
                  href={`tel:${load.driver_phone || ""}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-ink"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <a
                  href={`https://wa.me/${String(load.driver_phone || "").replace(/\D/g, "")}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-white"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            </Panel>
            <Panel className="space-y-3 text-sm">
              <a
                href={mapsSearchUrl(load.pickup)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3"
              >
                <MapPin className="h-4 w-4 text-success" />
                <span className="flex-1 text-card-foreground underline underline-offset-2">
                  {load.pickup}
                </span>
              </a>
              <div className="ml-2 h-4 border-l-2 border-dashed border-border" />
              <a
                href={mapsSearchUrl(load.dropoff)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3"
              >
                <Navigation className="h-4 w-4 text-primary" />
                <span className="flex-1 text-card-foreground underline underline-offset-2">
                  {load.dropoff}
                </span>
              </a>
              <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>
                  {load.km} km · {load.id}
                </span>
                <span className="text-base font-bold text-primary">P{load.offer}</span>
              </div>
            </Panel>
          </>
        )}
      </div>
    </AppShell>
  );
}
