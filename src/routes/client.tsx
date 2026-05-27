import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TRUCK_TIERS, estimateFare, type TruckSize } from "@/lib/vanlink";
import { MapPin, Navigation, Plus, Minus, Truck } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/client")({
  validateSearch: (s: Record<string, unknown>) => ({ size: (s.size as TruckSize) ?? "mini" }),
  component: ClientBooking,
});

function ClientBooking() {
  const { size: initial } = Route.useSearch();
  const navigate = useNavigate();
  const [size, setSize] = useState<TruckSize>(initial);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [distance, setDistance] = useState(8);
  const [bump, setBump] = useState(0);

  const tier = TRUCK_TIERS[size];
  const baseEstimate = useMemo(() => estimateFare(size, distance), [size, distance]);
  const fare = baseEstimate + bump;

  const broadcast = () => {
    localStorage.setItem("vanlink_trip", JSON.stringify({ size, pickup, drop, distance, fare }));
    navigate({ to: "/track" });
  };

  return (
    <AppShell title="Book a trip">
      <div className="px-5 pt-5 space-y-5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] space-y-3">
          <Row icon={<MapPin className="h-4 w-4 text-primary" />} label="Pick-up">
            <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Game City, Gaborone" className="w-full bg-transparent text-sm outline-none" />
          </Row>
          <div className="h-px bg-border" />
          <Row icon={<Navigation className="h-4 w-4 text-primary" />} label="Drop-off">
            <input value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="e.g. Mogoditshane plot 1234" className="w-full bg-transparent text-sm outline-none" />
          </Row>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Truck size</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TRUCK_TIERS) as TruckSize[]).map((k) => {
              const t = TRUCK_TIERS[k];
              const active = k === size;
              return (
                <button
                  key={k}
                  onClick={() => setSize(k)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${
                    active ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <Truck className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-[11px] font-semibold leading-tight text-ink">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground">{t.capacity}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Distance</p>
            <span className="text-sm font-semibold text-ink">{distance} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={120}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="mt-3 w-full accent-[oklch(0.62_0.20_255)]"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Base fare covers up to 12 km. Beyond that: P{tier.perKm}/km.</p>
        </div>

        <div className="rounded-2xl p-5 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <p className="text-xs uppercase tracking-wider text-primary-foreground/80">Recommended fare</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold">P{fare}</span>
            <span className="text-sm text-primary-foreground/80">incl. 10% commission</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button onClick={() => setBump((b) => Math.max(0, b - 50))} className="rounded-lg bg-white/15 p-2"><Minus className="h-4 w-4" /></button>
            <div className="flex-1 text-center text-xs text-primary-foreground/85">
              {bump > 0 ? `Boosted by P${bump}` : "Increase fare if no driver accepts"}
            </div>
            <button onClick={() => setBump((b) => b + 50)} className="rounded-lg bg-white/15 p-2"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <button
          onClick={broadcast}
          disabled={!pickup || !drop}
          className="w-full rounded-xl bg-ink px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Broadcast to nearby drivers
        </button>
      </div>
    </AppShell>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
}