import { Link, useRouterState } from "@tanstack/react-router";
import { Download, Home, Truck, MapPin, User, Package, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/client", label: "Book", icon: Package },
  { to: "/track", label: "Track", icon: MapPin },
  { to: "/driver", label: "Drive", icon: Truck },
  { to: "/account", label: "Me", icon: User },
] as const;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  const standaloneNavigator =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const standaloneMedia = window.matchMedia?.("(display-mode: standalone)").matches === true;
  return standaloneMedia || standaloneNavigator;
}

function safeStorageGet(key: string) {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // Private or restricted mobile browsers can block localStorage.
  }
}

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { location } = useRouterState();
  const path = location.pathname;
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if (isStandaloneApp() || safeStorageGet("vanlink_install_dismissed") === "true") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const timer = window.setTimeout(() => {
      if (!isStandaloneApp()) setShowInstall(true);
    }, 1800);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.clearTimeout(timer);
    };
  }, []);

  async function installApp() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") {
        setShowInstall(false);
        setInstallEvent(null);
      }
      return;
    }

    alert(
      "To install Van-Link, open your browser menu and choose Install app or Add to Home Screen.",
    );
  }

  function dismissInstall() {
    safeStorageSet("vanlink_install_dismissed", "true");
    setShowInstall(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[760px] flex-col">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 border-b border-[var(--color-border-on-navy)] bg-background/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/icon.svg"
                alt="Van-Link"
                className="h-9 w-9 rounded-lg bg-white object-cover p-0.5"
              />
              <span className="text-base font-bold tracking-tight text-foreground">
                <span className="text-primary-glow">Van</span>-Link
              </span>
            </Link>
            {title && (
              <span className="ml-auto text-xs font-medium uppercase tracking-wider text-foreground/60">
                {title}
              </span>
            )}
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

        <main className="flex-1 px-4 pb-28 pt-4 sm:px-6">
          {showInstall && !isStandaloneApp() && (
            <section className="mb-4 rounded-2xl border border-primary/20 bg-card p-4 text-card-foreground shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Download className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Install Van-Link</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add the app to your phone for faster booking and tracking.
                  </p>
                  <button
                    onClick={installApp}
                    className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Install app
                  </button>
                </div>
                <button
                  onClick={dismissInstall}
                  aria-label="Hide install prompt"
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}
          {children}
        </main>

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
    <section
      className={`rounded-2xl bg-card p-4 text-card-foreground shadow-[var(--shadow-card)] vl-fade-in ${className}`}
    >
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
