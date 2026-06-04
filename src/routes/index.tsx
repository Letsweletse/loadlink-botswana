import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Panel, PrimaryButton } from "@/components/AppShell";
import { ArrowRight, BadgeCheck, Clock, MapPin, ShieldCheck, Truck, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type TruckCategory = {
  name: string;
  capacity: string;
  baseFare: string;
  deposit: string;
  note: string;
  tone: string;
};

const truckCategories: TruckCategory[] = [
  {
    name: "Mini Van",
    capacity: "Under 2 tons",
    baseFare: "P250 / first 12 km",
    deposit: "P100 active deposit",
    note: "Best for boxes, stock, small furniture and quick town deliveries.",
    tone: "from-sky-400 to-cyan-300",
  },
  {
    name: "Medium Truck",
    capacity: "2–5 tons",
    baseFare: "P450 / first 12 km",
    deposit: "P150 active deposit",
    note: "For shop stock, appliances, office moves and building material runs.",
    tone: "from-emerald-400 to-lime-300",
  },
  {
    name: "Big Truck",
    capacity: "5+ tons",
    baseFare: "P750 / first 12 km",
    deposit: "P250 active deposit",
    note: "Heavy loads, long-distance jobs and bulk commercial transport.",
    tone: "from-orange-400 to-amber-300",
  },
];

const benefits = [
  "Verified driver onboarding",
  "WhatsApp-first booking flow",
  "Built for Botswana transport jobs",
  "Clients and drivers start separately",
];

function Index() {
  const navigate = useNavigate();

  return (
    <AppShell title="LoadLink Botswana">
      <div className="space-y-6 pb-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.26),transparent_34%),linear-gradient(145deg,#07152f,#0b1024_50%,#101827)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] vl-fade-in">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute -bottom-16 left-8 h-44 w-44 rounded-full bg-success/20 blur-3xl" />

          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
              <Truck className="h-3.5 w-3.5 text-cyan-200" /> LoadLink Botswana
            </div>

            <div>
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                Book a truck or get transport jobs faster.
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/72">
                A mobile-first logistics platform connecting clients who need loads moved with verified van and truck drivers in Botswana.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate({ to: "/signup", search: { role: "client" } })}
                className="rounded-2xl bg-white px-4 py-4 text-left text-ink shadow-xl transition hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-between text-sm font-bold">
                  I need a truck <ArrowRight className="h-4 w-4" />
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">Book vans and trucks for moving goods.</span>
              </button>

              <button
                onClick={() => navigate({ to: "/signup", search: { role: "driver" } })}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-left text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                <span className="flex items-center justify-between text-sm font-bold">
                  I drive a truck <ArrowRight className="h-4 w-4" />
                </span>
                <span className="mt-1 block text-xs text-white/65">Register and receive transport requests.</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <HeroMini icon={MapPin} label="12 km" value="base fare" />
              <HeroMini icon={ShieldCheck} label="Drivers" value="verified" />
              <HeroMini icon={Clock} label="Fast" value="matching" />
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-glow">Truck categories</p>
              <h2 className="mt-1 text-xl font-extrabold text-foreground">Simple fares for the first 12 km</h2>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">Mobile ready</span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {truckCategories.map((category, index) => (
              <TruckCategoryCard key={category.name} category={category} showMiniVan={index === 0} />
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <Panel className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-card-foreground">For clients</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Register, describe your load, choose truck size and let LoadLink help you connect with available drivers.
            </p>
            <PrimaryButton onClick={() => navigate({ to: "/signup", search: { role: "client" } })}>
              Register as client
            </PrimaryButton>
          </Panel>

          <Panel className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-card-foreground">For drivers</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Submit your truck details, licence information and permit status so clients can find verified transport.
            </p>
            <PrimaryButton onClick={() => navigate({ to: "/signup", search: { role: "driver" } })}>
              Register as driver
            </PrimaryButton>
          </Panel>
        </section>

        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-bold text-white">Why this works</h3>
          <div className="mt-3 grid gap-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-white/72">
                <BadgeCheck className="h-4 w-4 text-success" /> {benefit}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function HeroMini({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white">
      <Icon className="mx-auto h-4 w-4 text-cyan-200" />
      <p className="mt-1 text-sm font-extrabold">{label}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/55">{value}</p>
    </div>
  );
}

function TruckCategoryCard({ category, showMiniVan }: { category: TruckCategory; showMiniVan?: boolean }) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-card text-card-foreground shadow-[var(--shadow-card)] vl-fade-in">
      <div className={`h-2 bg-gradient-to-r ${category.tone}`} />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold">{category.name}</h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category.capacity}</p>
          </div>
          {showMiniVan ? <MiniVanIllustration /> : <Truck className="h-9 w-9 text-primary" />}
        </div>
        <div className="rounded-2xl bg-secondary p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Base fare</p>
          <p className="text-xl font-black text-card-foreground">{category.baseFare}</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{category.note}</p>
        <div className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
          {category.deposit}
        </div>
      </div>
    </article>
  );
}

function MiniVanIllustration() {
  return (
    <div className="relative h-10 w-16 rounded-xl bg-sky-100 p-1">
      <div className="absolute left-2 top-2 h-4 w-9 rounded-md bg-sky-400" />
      <div className="absolute right-2 top-3 h-3 w-3 rounded-sm bg-cyan-200" />
      <div className="absolute bottom-1 left-3 h-3 w-3 rounded-full bg-slate-700" />
      <div className="absolute bottom-1 right-3 h-3 w-3 rounded-full bg-slate-700" />
    </div>
  );
}
