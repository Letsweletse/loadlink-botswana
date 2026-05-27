import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Truck, MapPin, User, Package } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/vanlink-logo.jpeg";

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { location } = useRouterState();
  const path = location.pathname;

  const tabs = [
    { to: "/", label: "Home", icon: Home },
    { to: "/client", label: "Book", icon: Package },
    { to: "/track", label: "Track", icon: MapPin },
    { to: "/driver", label: "Drive", icon: Truck },
    { to: "/account", label: "Me", icon: User },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Van-Link" className="h-9 w-9 rounded-lg object-cover" />
          <span className="text-base font-bold tracking-tight text-ink">
            <span className="text-primary">Van</span>-Link
          </span>
        </Link>
        {title && <span className="ml-auto text-sm font-medium text-muted-foreground">{title}</span>}
      </header>
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-background/95 backdrop-blur">
        <ul className="grid grid-cols-5">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = path === t.to || (t.to !== "/" && path.startsWith(t.to));
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}