import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { User, MessageCircle, Truck, ShieldCheck, LogOut, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/account")({
  component: Account,
});

function Account() {
  const raw = typeof window !== "undefined" ? localStorage.getItem("vanlink_user") : null;
  const user = raw ? (JSON.parse(raw) as { name: string; phone: string; role: string }) : null;

  return (
    <AppShell title="Account">
      <div className="px-5 pt-5 space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--gradient-primary)" }}>
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">{user?.name ?? "Guest"}</p>
            <p className="text-xs text-muted-foreground">{user?.phone ?? "Not signed in"}</p>
          </div>
          {!user && (
            <Link to="/signup" search={{ role: "client" }} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Sign in</Link>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Item icon={Truck} label="My trips" to="/track" />
          <Item icon={ShieldCheck} label="Driver verification" to="/driver" />
          <Item icon={MessageCircle} label="WhatsApp support" href="https://wa.me/" />
          <Item icon={LogOut} label="Sign out" />
        </div>

        <p className="text-center text-[11px] text-muted-foreground">Van-Link · Botswana & SACU · v0.1</p>
      </div>
    </AppShell>
  );
}

function Item({ icon: Icon, label, to, href }: { icon: typeof User; label: string; to?: string; href?: string }) {
  const inner = (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0">
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1 text-sm text-ink">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  if (href) return <a href={href}>{inner}</a>;
  return <button className="w-full text-left">{inner}</button>;
}