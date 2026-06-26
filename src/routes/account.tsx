import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { User, MessageCircle, Truck, ShieldCheck, LogOut, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchProfile, localUser, type ProfileRecord } from "@/lib/supabase";
import { safeStorageRemove } from "@/lib/safe-storage";

export const Route = createFileRoute("/account")({
  component: Account,
});

function Account() {
  const session = localUser();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    if (!session?.phone) return;
    try {
      const row = await fetchProfile(session.phone);
      setProfile(row);
    } catch (error) {
      console.error(error);
    }
  }

  function signOut() {
    safeStorageRemove("vanlink_user");
    safeStorageRemove("vanlink_trip");
    setProfile(null);
    toast.success("Signed out");
  }

  const name = profile?.name || session?.name || "Guest";
  const phone = profile?.phone || session?.phone || "Not signed in";
  const role = profile?.role || session?.role || "visitor";

  return (
    <AppShell title="Account">
      <div className="space-y-4">
        <Panel className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--gradient-primary)" }}
          >
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-card-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">
              {phone} · {role}
            </p>
          </div>
          {!session && (
            <Link
              to="/signup"
              search={{ role: "client" }}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Sign in
            </Link>
          )}
        </Panel>

        <div className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] vl-fade-in">
          <Item icon={Truck} label="My trips" to="/track" />
          <Item icon={ShieldCheck} label="Driver verification" to="/driver" />
          <Item icon={MessageCircle} label="WhatsApp support" href="https://wa.me/26772347712" />
          <button onClick={signOut} className="w-full text-left">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-card-foreground last:border-b-0">
              <LogOut className="h-4 w-4 text-primary" />
              <span className="flex-1 text-sm">Sign out</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </div>

        <p className="text-center text-[11px] text-foreground/60">Van-Link · Botswana & SACU</p>
      </div>
    </AppShell>
  );
}

function Item({
  icon: Icon,
  label,
  to,
  href,
}: {
  icon: typeof User;
  label: string;
  to?: string;
  href?: string;
}) {
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
