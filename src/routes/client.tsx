import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Panel, PrimaryButton } from "@/components/AppShell";
import { TRUCK_TIERS, estimateFare, type TruckSize } from "@/lib/vanlink";
import { MapPin, Navigation, Plus, Minus, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createLoad, localUser, makeLoadId } from "@/lib/supabase";

export const Route = createFileRoute("/client")({
  validateSearch: (s: Record<string, unknown>) => ({ size: (s.size as TruckSize) ?? "mini" }),
  component: ClientBooking,
});

function ClientBooking() {
  const { size: initial } = Route.useSearch();
  const navigate = useNavigate();
  const user = localUser();
  const [size, setSize] = useState<TruckSize>(initial);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [load, setLoad] = useState("");
  const [distance, setDistance] = useState(8);
  const [bump, setBump] = useState(0);
  const [saving, setSaving] = useState(false);

  const tier = TRUCK_TIERS[size];
  const baseEstimate = useMemo(() => estimateFare(size, distance), [size, distance]);
  const fare = baseEstimate + bump;

  const broadcast = async () => {
    const id = makeLoadId();
    const payload = {
      id,
      customer: user?.name || "Walk-in customer",
      phone: user?.phone || "+267",
      pickup,
      dropoff: drop,
      category: size,
      load,
      km: distance,
      offer: fare,
      status: "Broadcasting",
      driver: null,
      driver_phone: null,
    };

    setSaving(true);
    try {
      const saved = await createLoad(payload);
      localStorage.setItem("vanlink_trip", JSON.stringify({ ...saved, drop: saved.dropoff, distance: saved.km, fare: saved.offer }));
      toast.success("Broadcast sent", { description: `${tier.label} · P${fare}` });
      navigate({ to: "/track" });
    } catch (error) {
      console.error(error);
      toast.error("Could not create booking", { description: "Check Supabase loads table and RLS policies." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Book a trip">
      <div className="space-y-4">
        {!user && (
          <Panel className="text-sm text-muted-foreground">
            You can create a booking, but signing up first saves your name and WhatsApp number correctly.
          </Panel>
        )}

        <Panel className="space-y-3">
          <Row icon={<MapPin className="h-4 w-4 text-primary" />} label="Pick-up">
            <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Game City, Gaborone" className="w-full bg-transparent text-sm outline-none" />
          </Row>
          <div className="h-px bg-border" />
          <Row icon={<Navigation className="h-4 w-4 text-primary" />} label="Drop-off">
            <input value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="e.g. Mogoditshane plot 1234" className="w-full bg-transparent text-sm outline-none" />
          </Row>
          <div className="h-px bg-border" />
          <Row icon={<Truck className="h-4 w-4 text-primary" />} label="Goods description">
            <input value={load} onChange={(e) => setLoad(e.target.value)} placeholder="e.g. Furniture, stock, building material" className="w-full bg-transparent text-sm outline-none" />
          </Row>
        </Panel>

        <Panel>
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
                    active ? "border-primary bg-primary/5" : "border-border bg-secondary"
                  }`}
                >
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
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Distance</p>
            <span className="text-sm font-semibold text-card-foreground">{distance} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={120}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="mt-3 w-full accent-[oklch(0.60_0.21_255)]"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Base fare covers up to 12 km. Beyond that: P{tier.perKm}/km.</p>
        </Panel>

        <div className="rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-elegant)] vl-fade-in" style={{ background: "var(--gradient-primary)" }}>
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

        <PrimaryButton onClick={broadcast} disabled={!pickup || !drop || saving}>
          {saving ? "Broadcasting..." : "Broadcast to nearby drivers"}
        </PrimaryButton>
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
