import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Truck, MapPin, User, Package } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/vanlink-logo.jpeg";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/client", label: "Book", icon: Package },
  { to: "/track", label: "Track", icon: MapPin },
  { to: "/driver", label: "Drive", icon: Truck },
  { to: "/account", label: "Me", icon: User },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { location } = useRouterState();
  const path = location.pathname;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[760px] flex-col">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 border-b border-[var(--color-border-on-navy)] bg-background/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Van-Link" className="h-9 w-9 rounded-lg bg-white object-cover p-0.5" />
              <span className="text-base font-bold tracking-tight text-foreground">
                <span className="text-primary-glow">Van</span>-Link
              </span>
            </Link>
            {title && <span className="ml-auto text-xs font-medium uppercase tracking-wider text-foreground/60">{title}</span>}
          </div>
          {/* Inline nav row — fits on mobile */}
          <nav className="hidden px-4 pb-3 sm:block">
            <ul className="grid grid-cols-5 gap-1.5">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = path === t.to || (t.to !== "/" && path.startsWith(t.to));
                return (
                  <li key={t.to}>
                    <Link
                      to={t.to}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {t.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="flex-1 px-4 pb-28 pt-4 sm:px-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[760px] border-t border-[var(--color-border-on-navy)] bg-background/95 backdrop-blur sm:hidden">
          <ul className="grid grid-cols-5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = path === t.to || (t.to !== "/" && path.startsWith(t.to));
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                      active ? "text-primary-glow" : "text-foreground/60"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition`} />
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

/* Reusable panel — white card on navy bg */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-card p-4 text-card-foreground shadow-[var(--shadow-card)] vl-fade-in ${className}`}>
      {children}
    </section>
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
          : "bg-chip text-chip-foreground hover:brightness-95"
      }`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition active:scale-[0.99] disabled:opacity-40 ${rest.className ?? ""}`}
      style={{ background: "var(--gradient-primary)" }}
    >
      {children}
    </button>
  );
}