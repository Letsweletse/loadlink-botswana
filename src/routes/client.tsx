import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Panel, PrimaryButton } from "@/components/AppShell";
import { BASE_RADIUS_KM, TRUCK_TIERS, estimateFare, type TruckSize } from "@/lib/vanlink";
import { MapPin, Navigation, Plus, Minus, Truck, LocateFixed, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { createLoad, localUser, makeLoadId } from "@/lib/supabase";
import { geocodeAddress, getDrivingDistanceKm } from "@/lib/mapbox";

const DEFAULT_DISTANCE_KM = 8;
const DISTANCE_DEBOUNCE_MS = 600;

export const Route = createFileRoute("/client")({
  validateSearch: (s: Record<string, unknown>) => ({ size: (s.size as TruckSize) ?? "mini" }),
  component: ClientBooking,
});

function mapsSearchUrl(value: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
}

function mapsDirectionsUrl(pickup: string, dropoff: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}`;
}

function mapsEmbedUrl(pickup: string, dropoff: string) {
  if (pickup && dropoff) {
    return `https://maps.google.com/maps?saddr=${encodeURIComponent(pickup)}&daddr=${encodeURIComponent(dropoff)}&output=embed`;
  }

  const query = pickup || dropoff || "Gaborone Botswana";
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function safeStorageSet(key: string, value: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // Restricted mobile browsers can block localStorage.
  }
}

function ClientBooking() {
  const { size: initial } = Route.useSearch();
  const navigate = useNavigate();
  const user = localUser();
  const [size, setSize] = useState<TruckSize>(initial);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [load, setLoad] = useState("");
  const [weightTonnes, setWeightTonnes] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [distance, setDistance] = useState(DEFAULT_DISTANCE_KM);
  const [distanceStatus, setDistanceStatus] = useState<"idle" | "calculating" | "calculated" | "error">("idle");
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const tier = TRUCK_TIERS[size];
  const baseEstimate = useMemo(() => estimateFare(size, distance), [size, distance]);
  const distanceCharge = Math.max(0, baseEstimate - tier.baseFare);
  const extraKm = Math.max(0, distance - BASE_RADIUS_KM);
  const fare = baseEstimate + bump;
  const mapReady = pickup.trim().length > 0 || drop.trim().length > 0;
  const directionsReady = pickup.trim().length > 0 && drop.trim().length > 0;

  // Auto-calculate real driving distance whenever both addresses are present,
  // debounced so we don't geocode/route on every keystroke. Falls back to the
  // last known distance (never blocks booking) if Mapbox can't resolve either
  // address or find a route.
  useEffect(() => {
    if (!directionsReady) {
      setDistanceStatus("idle");
      setDistanceError(null);
      return;
    }

    let cancelled = false;
    setDistanceStatus("calculating");
    setDistanceError(null);

    const timer = setTimeout(async () => {
      const [pickupPoint, dropoffPoint] = await Promise.all([
        geocodeAddress(pickup),
        geocodeAddress(drop),
      ]);
      if (cancelled) return;

      if (!pickupPoint || !dropoffPoint) {
        setDistanceStatus("error");
        setDistanceError("Couldn't find that location — try being more specific.");
        return;
      }

      const km = await getDrivingDistanceKm(pickupPoint, dropoffPoint);
      if (cancelled) return;

      if (km == null) {
        setDistanceStatus("error");
        setDistanceError("Couldn't calculate a driving route between those locations.");
        return;
      }

      setDistance(km);
      setDistanceStatus("calculated");
    }, DISTANCE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pickup, drop, directionsReady]);

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      toast.error("Location not supported", { description: "Type your pick-up manually." });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`;
        setPickup(coords);
        setLocating(false);
        toast.success("Current location added", { description: "You can still edit the pick-up field." });
      },
      () => {
        setLocating(false);
        toast.error("Could not get your location", { description: "Allow location access or type the pick-up manually." });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  const broadcast = async () => {
    const weight = Number(weightTonnes);
    if (!weightTonnes || Number.isNaN(weight) || weight <= 0) {
      toast.error("Load weight required", { description: "Enter the weight in tonnes." });
      return;
    }
    setSaving(true);
    try {
      const saved = await createLoad({
        id: makeLoadId(),
        customer: user?.name || "Customer",
        phone: user?.phone || "+267",
        pickup,
        dropoff: drop,
        category: size,
        load,
        weight_tonnes: weight,
        cargo_description: cargoDescription.trim() || null,
        km: distance,
        offer: fare,
        status: "Broadcasting",
        driver: null,
        driver_phone: null,
      });
      safeStorageSet("vanlink_trip", JSON.stringify({ ...saved, drop: saved.dropoff, distance: saved.km, fare: saved.offer }));
      toast.success("Booking request sent", { description: `${tier.label} · P${fare}` });
      navigate({ to: "/track" });
    } catch (error) {
      console.error(error);
      toast.error("Could not create booking", { description: "Please refresh and try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Book a trip">
      <div className="space-y-4">
        {!user && <Panel className="text-sm text-muted-foreground">Sign up first to save your name and WhatsApp number for faster bookings.</Panel>}

        <Panel className="space-y-3">
          <Row icon={<MapPin className="h-4 w-4 text-primary" />} label="Pick-up">
            <div className="flex items-center gap-2">
              <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Game City, Gaborone" className="w-full bg-transparent text-sm outline-none" />
              <button type="button" onClick={useCurrentLocation} className="rounded-lg bg-primary/10 p-2 text-primary" aria-label="Use current location">
                <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </Row>
          <div className="h-px bg-border" />
          <Row icon={<Navigation className="h-4 w-4 text-primary" />} label="Drop-off">
            <input value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="e.g. Mogoditshane plot 1234" className="w-full bg-transparent text-sm outline-none" />
          </Row>
          <div className="h-px bg-border" />
          <Row icon={<Truck className="h-4 w-4 text-primary" />} label="Goods description">
            <input value={load} onChange={(e) => setLoad(e.target.value)} placeholder="e.g. Furniture, stock, building material" className="w-full bg-transparent text-sm outline-none" />
          </Row>
          <div className="h-px bg-border" />
          <Row icon={<Truck className="h-4 w-4 text-primary" />} label="Load weight (tonnes)">
            <input
              type="number"
              min="0"
              step="0.1"
              value={weightTonnes}
              onChange={(e) => setWeightTonnes(e.target.value)}
              placeholder="e.g. 2.5"
              className="w-full bg-transparent text-sm outline-none"
            />
          </Row>
          <div className="h-px bg-border" />
          <Row icon={<Truck className="h-4 w-4 text-primary" />} label="Cargo description (optional)">
            <textarea
              value={cargoDescription}
              onChange={(e) => setCargoDescription(e.target.value)}
              placeholder="Any extra detail for the driver — packaging, fragility, access notes"
              rows={2}
              className="w-full resize-none bg-transparent text-sm outline-none"
            />
          </Row>
        </Panel>

        <div className="relative h-80 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] vl-fade-in">
          <iframe
            title="Broadcast map preview"
            src={mapsEmbedUrl(pickup, drop)}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold text-white shadow-[var(--shadow-elegant)]">
            {directionsReady ? "Route preview" : mapReady ? "Location preview" : "Gaborone map"}
          </div>
          {directionsReady && (
            <a href={mapsDirectionsUrl(pickup, drop)} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground shadow-[var(--shadow-card)]">
              Open route <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <Panel>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Truck size</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TRUCK_TIERS) as TruckSize[]).map((k) => {
              const t = TRUCK_TIERS[k];
              const active = k === size;
              return (
                <button key={k} onClick={() => setSize(k)} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${active ? "border-primary bg-primary/5" : "border-border bg-secondary"}`}>
                  <Truck className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-[11px] font-semibold leading-tight text-card-foreground">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground">{t.capacity}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Driving distance</p>
            <span className="text-sm font-semibold text-card-foreground">
              {distanceStatus === "calculating" ? "Calculating…" : `${distance} km`}
            </span>
          </div>
          <p className={`mt-1 text-[11px] ${distanceStatus === "error" ? "text-amber-600" : "text-muted-foreground"}`}>
            {distanceStatus === "error"
              ? distanceError
              : directionsReady
                ? "Real driving distance via Mapbox."
                : "Enter pick-up and drop-off to calculate the distance."}
          </p>
        </Panel>

        <div className="rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-elegant)] vl-fade-in" style={{ background: "var(--gradient-primary)" }}>
          <p className="text-xs uppercase tracking-wider text-primary-foreground/80">Recommended fare</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold">P{fare}</span>
            <span className="text-sm text-primary-foreground/80">service fee included</span>
          </div>
          <div className="mt-3 space-y-1 border-t border-white/15 pt-3 text-xs text-primary-foreground/85">
            <div className="flex items-center justify-between">
              <span>Base fare (covers first {BASE_RADIUS_KM} km)</span>
              <span>P{tier.baseFare}</span>
            </div>
            {distanceCharge > 0 && (
              <div className="flex items-center justify-between">
                <span>
                  Distance charge ({extraKm.toFixed(1)} km × P{tier.perKm}/km)
                </span>
                <span>P{distanceCharge}</span>
              </div>
            )}
            {bump > 0 && (
              <div className="flex items-center justify-between">
                <span>Boost</span>
                <span>P{bump}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button onClick={() => setBump((b) => Math.max(0, b - 50))} className="rounded-lg bg-white/15 p-2"><Minus className="h-4 w-4" /></button>
            <div className="flex-1 text-center text-xs text-primary-foreground/85">{bump > 0 ? `Boosted by P${bump}` : "Increase offer for faster acceptance"}</div>
            <button onClick={() => setBump((b) => b + 50)} className="rounded-lg bg-white/15 p-2"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <PrimaryButton onClick={broadcast} disabled={!pickup || !drop || !weightTonnes || saving}>{saving ? "Broadcasting..." : "Broadcast booking to drivers"}</PrimaryButton>
      </div>
    </AppShell>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <div className="flex items-start gap-3"><div className="mt-1">{icon}</div><div className="flex-1"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>{children}</div></div>;
}
