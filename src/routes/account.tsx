import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { User, MessageCircle, Truck, ShieldCheck, LogOut, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/account")({
  component: Account,
});

function Account() {
  const raw = typeof window !== "undefined" ? localStorage.getItem("vanlink_user") : null;
  const user = raw ? (JSON.parse(raw) as { name: string; phone: string; role: string }) : null;

  return (
    <AppShell title="Account">
      <div className="space-y-4">
        <Panel className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--gradient-primary)" }}>
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-card-foreground">{user?.name ?? "Guest"}</p>
            <p className="text-xs text-muted-foreground">{user?.phone ?? "Not signed in"}</p>
          </div>
          {!user && (
            <Link to="/signup" search={{ role: "client" }} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Sign in</Link>
          )}
        </Panel>

        <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] vl-fade-in">
          <Item icon={Truck} label="My trips" to="/track" />
          <Item icon={ShieldCheck} label="Driver verification" to="/driver" />
          <Item icon={MessageCircle} label="WhatsApp support" href="https://wa.me/" />
          <Item icon={LogOut} label="Sign out" />
        </div>

        <p className="text-center text-[11px] text-foreground/60">Van-Link · Botswana & SACU · v0.1</p>
      </div>
    </AppShell>
  );
}

function Item({ icon: Icon, label, to, href }: { icon: typeof User; label: string; to?: string; href?: string }) {
  const inner = (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-card-foreground last:border-b-0">
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1 text-sm">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  if (href) return <a href={href}>{inner}</a>;
  return <button className="w-full text-left">{inner}</button>;
}