import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MapPin, Package, Truck, User } from "lucide-react";
import { type ReactNode } from "react";

const HOSTED_LOGO_URL =
  "https://res.cloudinary.com/dyfecybo0/image/upload/f_auto,q_auto,w_128,h_128,c_fill/v1782459767/WhatsApp_Image_2026-05-23_at_15.51.54_mzlajs.jpg";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/client", label: "Book", icon: Package },
  { to: "/track", label: "Track", icon: MapPin },
  { to: "/driver", label: "Driver", icon: Truck },
  { to: "/account", label: "Account", icon: User },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { location } = useRouterState();
  const path = location.pathname;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[820px] flex-col">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-card/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <img
                src={HOSTED_LOGO_URL}
                alt="VanLink"
                style={{ display: "block" }}
                className="h-10 w-10 rounded-md border border-border bg-white object-cover"
              />
              <div className="leading-tight">
                <span className="block text-[15px] font-black tracking-[-0.02em] text-card-foreground">VanLink</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Botswana Logistics
                </span>
              </div>
            </Link>
            {title && (
              <span className="ml-auto rounded-full border border-border bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {title}
              </span>
            )}
          </div>
          <nav className="hidden px-6 pb-3 sm:block">
            <ul className="grid grid-cols-5 gap-2">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = path === t.to || (t.to !== "/" && path.startsWith(t.to));
                return (
                  <li key={t.to}>
                    <Link
                      to={t.to}
                      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-bold transition-all duration-200 ${
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                          : "border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-card-foreground"
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

        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[820px] border-t border-border bg-card/98 backdrop-blur-xl sm:hidden">
          <ul className="grid grid-cols-5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = path === t.to || (t.to !== "/" && path.startsWith(t.to));
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
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

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-border bg-card p-4 text-card-foreground shadow-[var(--shadow-card)] vl-fade-in ${className}`}>
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
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-md border px-3 py-2 text-xs font-bold transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary/30"
      }`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`w-full rounded-md bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-[var(--shadow-elegant)] transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-45 ${
        rest.className ?? ""
      }`}
    >
      {children}
    </button>
  );
}
