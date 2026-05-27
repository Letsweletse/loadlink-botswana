import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TRUCK_TIERS } from "@/lib/vanlink";
import { Truck, MapPin, ShieldCheck, MessageCircle, ArrowRight } from "lucide-react";
import logo from "@/assets/vanlink-logo.jpeg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <section className="relative overflow-hidden px-5 pb-8 pt-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="" className="h-14 w-14 rounded-xl bg-white object-cover p-1 shadow-[var(--shadow-elegant)]" />
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">Move anything,<br/>anywhere in SACU.</h1>
          </div>
        </div>
        <p className="mt-3 text-sm text-primary-foreground/85">
          On-demand vans & trucks across Botswana and SACU. Live tracking, transparent fares, WhatsApp sign-in.
        </p>
        <div className="mt-5 flex gap-2">
          <Link to="/client" className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-primary shadow-[var(--shadow-elegant)]">
            Book a Truck
          </Link>
          <Link to="/driver" className="flex-1 rounded-xl border border-white/40 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white backdrop-blur">
            Drive & Earn
          </Link>
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-primary-foreground/80">
          <MessageCircle className="h-4 w-4" /> Sign in with WhatsApp — no passwords.
        </div>
      </section>

      <section className="px-5 pt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Choose a size</h2>
        <div className="space-y-3">
          {(Object.keys(TRUCK_TIERS) as Array<keyof typeof TRUCK_TIERS>).map((k) => {
            const t = TRUCK_TIERS[k];
            return (
              <Link
                key={k}
                to="/client"
                search={{ size: k }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:border-primary"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{t.label}</p>
                    <p className="text-sm font-bold text-primary">P{t.baseFare}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.capacity} · {t.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-5 pt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">How it works</h2>
        <ol className="space-y-3 text-sm">
          <Step n={1} icon={MapPin} title="Set pick-up & drop-off" body="Add stops anywhere in Botswana or across the SACU border." />
          <Step n={2} icon={Truck} title="We broadcast to nearby trucks" body="Drivers in the vicinity accept your fare in seconds." />
          <Step n={3} icon={ShieldCheck} title="Track live until delivered" body="GPS tracking for you and admin. 10% goes to Van-Link, the rest to your driver." />
        </ol>
      </section>

      <section className="mx-5 mt-8 rounded-2xl border border-border bg-secondary p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">For drivers</p>
        <p className="mt-1 text-sm text-ink">Top up from P50 to stay active and start accepting loads today.</p>
        <Link to="/driver" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          Register your truck <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </AppShell>
  );
}

function Step({ n, icon: Icon, title, body }: { n: number; icon: typeof MapPin; title: string; body: string }) {
  return (
    <li className="flex gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{n}</div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Icon className="h-4 w-4 text-primary" />{title}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}
