import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Panel, Chip, PrimaryButton } from "@/components/AppShell";
import { BottomSheet } from "@/components/BottomSheet";
import { Search, Truck, MapPin, Plus, Clock, CheckCircle2, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

type Trip = {
  id: string;
  from: string;
  to: string;
  size: "mini" | "medium" | "big";
  status: "active" | "pending" | "completed";
  fare: number;
  when: string;
};

const TRIPS: Trip[] = [
  { id: "VL-2841", from: "Game City",   to: "Mogoditshane",      size: "mini",   status: "active",    fare: 320,  when: "Now"     },
  { id: "VL-2840", from: "Riverwalk",   to: "Tlokweng plot 482", size: "medium", status: "pending",   fare: 780,  when: "2m ago"  },
  { id: "VL-2837", from: "Phakalane",   to: "Francistown CBD",   size: "big",    status: "active",    fare: 4200, when: "5m ago"  },
  { id: "VL-2830", from: "Block 6",     to: "Lobatse",           size: "medium", status: "completed", fare: 1240, when: "Today"   },
  { id: "VL-2828", from: "Airport Jct", to: "Molepolole",        size: "mini",   status: "completed", fare: 410,  when: "Today"   },
];

const FILTERS = ["All", "Active", "Pending", "Completed", "Mini", "Medium", "Big"] as const;

function Index() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [selected, setSelected] = useState<Trip | null>(null);

  const results = useMemo(() => {
    return TRIPS.filter((t) => {
      const q = query.trim().toLowerCase();
      if (q && !`${t.id} ${t.from} ${t.to}`.toLowerCase().includes(q)) return false;
      if (filter === "All") return true;
      if (["Active", "Pending", "Completed"].includes(filter)) return t.status === filter.toLowerCase();
      return t.size === filter.toLowerCase();
    });
  }, [query, filter]);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-4">
        {/* Status + heading */}
        <div className="vl-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-2.5 py-1 text-[11px] font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> 142 drivers online
          </span>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight text-foreground">
            Move anything,<br /> anywhere in SACU.
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Vans & trucks on demand. Live tracking, transparent fares.
          </p>
        </div>

        {/* 3 stat cards */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Active" value="2" tone="primary" />
          <StatCard label="Pending" value="1" tone="warn" />
          <StatCard label="Completed" value="14" tone="success" />
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <PrimaryButton onClick={() => navigate({ to: "/client" })}>
            <Plus className="-ml-1 mr-1 inline h-4 w-4" /> New booking
          </PrimaryButton>
          <button
            onClick={() => navigate({ to: "/driver" })}
            className="rounded-xl border border-[var(--color-border-on-navy)] bg-white/5 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-white/10"
          >
            Drive
          </button>
        </div>

        {/* Sticky search & filter */}
        <div className="sticky top-[60px] z-10 -mx-4 bg-background/85 px-4 pt-2 pb-3 backdrop-blur sm:top-[110px]">
          <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 shadow-[var(--shadow-card)]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trips, places, IDs…"
              className="w-full bg-transparent text-sm text-card-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <Chip key={f} active={f === filter} onClick={() => setFilter(f)}>
                {f}
              </Chip>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-foreground/60">{results.length} results</p>
        </div>

        {/* Result cards */}
        <div className="space-y-2.5">
          {results.map((t) => (
            <TripCard key={t.id} trip={t} onOpen={() => setSelected(t)} />
          ))}
          {results.length === 0 && (
            <Panel className="text-center text-sm text-muted-foreground">No trips match your filters.</Panel>
          )}
        </div>
      </div>

      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title={selected ? `Trip ${selected.id}` : ""}>
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl bg-secondary p-3 text-sm">
              <Row icon={<MapPin className="h-4 w-4 text-success" />} label="Pick-up" value={selected.from} />
              <div className="ml-2 my-1 h-3 border-l-2 border-dashed border-border" />
              <Row icon={<MapPin className="h-4 w-4 text-primary" />} label="Drop-off" value={selected.to} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Mini label="Size" value={selected.size} />
              <Mini label="Fare" value={`P${selected.fare}`} />
              <Mini label="Status" value={selected.status} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  toast.success(`Driver notified for ${selected.id}`);
                  setSelected(null);
                }}
                className="flex-1 rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-white"
              >
                <MessageCircle className="-ml-1 mr-1 inline h-4 w-4" /> Message driver
              </button>
              <button
                onClick={() => {
                  navigate({ to: "/track" });
                  setSelected(null);
                }}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Track live
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </AppShell>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "primary" | "warn" | "success" }) {
  const dot =
    tone === "primary" ? "bg-primary" : tone === "warn" ? "bg-amber-400" : "bg-success";
  const Icon = tone === "primary" ? Truck : tone === "warn" ? Clock : CheckCircle2;
  return (
    <div className="rounded-xl bg-card p-3 shadow-[var(--shadow-card)] vl-fade-in">
      <div className="flex items-center justify-between">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className="mt-1 text-2xl font-extrabold text-card-foreground">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function TripCard({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  const statusTone =
    trip.status === "active"
      ? "bg-primary/15 text-primary"
      : trip.status === "pending"
      ? "bg-amber-100 text-amber-700"
      : "bg-success/15 text-success";
  return (
    <article className="rounded-xl bg-card p-3.5 text-card-foreground shadow-[var(--shadow-card)] vl-fade-in">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{trip.from} → {trip.to}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{trip.id} · {trip.when} · {trip.size}</p>
        </div>
        <div className="text-right">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusTone}`}>
            {trip.status}
          </span>
          <p className="mt-1 text-sm font-bold">P{trip.fare}</p>
        </div>
      </header>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onOpen}
          className="flex-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"
        >
          Details
        </button>
        <button
          onClick={() => toast("Tracking opened", { description: trip.id })}
          className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Track
        </button>
      </div>
    </article>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-card-foreground">{value}</p>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold capitalize text-card-foreground">{value}</p>
    </div>
  );
}
