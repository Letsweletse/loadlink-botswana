import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Panel, PrimaryButton } from "@/components/AppShell";
import { ArrowRight, MapPin, ShieldCheck, Truck, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type TruckCategory = {
  name: string;
  capacity: string;
  baseFare: string;
  deposit: string;
  note: string;
};

const truckCategories: TruckCategory[] = [
  {
    name: "Mini Van",
    capacity: "Under 2 tons",
    baseFare: "P250 / first 12 km",
    deposit: "P100 active deposit",
    note: "Small goods, stock, parcels and town deliveries.",
  },
  {
    name: "Medium Truck",
    capacity: "2–5 tons",
    baseFare: "P450 / first 12 km",
    deposit: "P150 active deposit",
    note: "Retail stock, appliances, office moves and materials.",
  },
  {
    name: "Heavy Truck",
    capacity: "5+ tons",
    baseFare: "P750 / first 12 km",
    deposit: "P250 active deposit",
    note: "Bulk loads, commercial jobs and long-distance work.",
  },
];

function Index() {
  const navigate = useNavigate();

  return (
    <AppShell title="LoadLink Botswana">
      <div className="space-y-5 pb-6">
        <section className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] vl-fade-in">
          <div className="absolute inset-x-0 top-0 h-1 bg-[var(--gradient-primary)]" />
          <div className="space-y-6">
            <div className="inline-flex rounded-md border border-border bg-secondary px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              LoadLink Botswana
            </div>

            <div>
              <h1 className="text-[2rem] font-black leading-[1.05] tracking-[-0.04em] text-card-foreground sm:text-5xl">
                Book a truck or get transport jobs faster.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
                VanLink connects clients with available van and truck drivers for structured, trackable transport requests across Botswana.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate({ to: "/signup", search: { role: "client" } })}
                className="group rounded-lg border border-primary bg-primary px-4 py-4 text-left text-primary-foreground shadow-[var(--shadow-elegant)] transition-all duration-200 hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-between text-sm font-black">
                  I need a truck <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-1 block text-xs leading-5 text-primary-foreground/75">Book vans and trucks for moving goods.</span>
              </button>

              <button
                onClick={() => navigate({ to: "/signup", search: { role: "driver" } })}
                className="group rounded-lg border border-border bg-secondary px-4 py-4 text-left text-card-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30"
              >
                <span className="flex items-center justify-between text-sm font-black">
                  I drive a truck <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">Register and receive transport requests.</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
              <HeroMetric label="12 km" value="base fare" />
              <HeroMetric label="Drivers" value="verified" />
              <HeroMetric label="Fast" value="matching" />
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Truck categories</p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-foreground">Simple fares for the first 12 km</h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {truckCategories.map((category) => (
              <TruckCategoryCard key={category.name} category={category} />
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <Panel className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-secondary text-primary">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-black tracking-[-0.02em] text-card-foreground">For clients</h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Register, describe your load, choose truck size and let LoadLink help you connect with available drivers.
            </p>
            <PrimaryButton onClick={() => navigate({ to: "/signup", search: { role: "client" } })}>
              Register as client
            </PrimaryButton>
          </Panel>

          <Panel className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-secondary text-primary">
                <Wallet className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-black tracking-[-0.02em] text-card-foreground">For drivers</h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Submit your truck details, licence information and permit status so clients can find verified transport.
            </p>
            <PrimaryButton onClick={() => navigate({ to: "/signup", search: { role: "driver" } })}>
              Register as driver
            </PrimaryButton>
          </Panel>
        </section>
      </div>
    </AppShell>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary p-3">
      <p className="text-sm font-black text-card-foreground">{label}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{value}</p>
    </div>
  );
}

function TruckCategoryCard({ category }: { category: TruckCategory }) {
  return (
    <article className="rounded-xl border border-border bg-card text-card-foreground shadow-[var(--shadow-card)] vl-fade-in">
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black tracking-[-0.02em]">{category.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{category.capacity}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-primary">
            <Truck className="h-4 w-4" />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Base fare</p>
          <p className="text-xl font-black tracking-[-0.03em] text-card-foreground">{category.baseFare}</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{category.note}</p>
        <div className="inline-flex rounded-md border border-border bg-card px-3 py-1.5 text-xs font-black text-card-foreground">
          {category.deposit}
        </div>
      </div>
    </article>
  );
}
