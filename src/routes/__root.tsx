import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/InstallPrompt";

// Real capability check, not a crash detector: matches the JS the build
// actually ships (vite.config.ts build.target = es2018) plus the runtime
// APIs the app calls (fetch, Promise). A missing feature here means the
// bundle genuinely cannot run, unlike an arbitrary uncaught app error.
const BROWSER_CAPABILITY_CHECK_SCRIPT = `(function () {
  function supportsSyntax() {
    try {
      new Function("async function* g(){yield 1} const {a,...b}=({}); return true;")();
      return true;
    } catch (e) {
      return false;
    }
  }

  var supported =
    "Promise" in window &&
    "fetch" in window &&
    "Symbol" in window &&
    typeof Array.prototype.includes === "function" &&
    typeof Object.assign === "function" &&
    supportsSyntax();

  if (!supported) {
    window.__vlUnsupportedBrowser = true;
    document.write(
      "<style>#root,#app-startup-error{display:none!important}" +
        "#legacy-browser{display:block!important}</style>"
    );
  }
})();`;

// Safety net for the case a script/error listener can't catch: the module
// script itself never finishes (dropped mobile connection, 404 after a
// deploy) and #root simply stays empty forever. Deliberately not labeled
// as a browser problem, since on a capable browser it almost never is one.
const APP_STARTUP_WATCHDOG_SCRIPT = `if (!window.__vlUnsupportedBrowser) {
  window.setTimeout(function () {
    var root = document.getElementById("root");
    var startupError = document.getElementById("app-startup-error");
    if (startupError && (!root || !root.innerHTML || root.innerHTML.trim() === "")) {
      startupError.style.display = "block";
    }
  }, 12000);
}

document.addEventListener("DOMContentLoaded", function () {
  var retry = document.getElementById("app-startup-retry");
  if (!retry) return;
  retry.addEventListener("click", function () {
    retry.disabled = true;
    retry.textContent = "Reloading...";
    Promise.resolve()
      .then(function () {
        if (!("serviceWorker" in navigator)) return;
        return navigator.serviceWorker.getRegistrations().then(function (regs) {
          return Promise.all(regs.map(function (r) { return r.unregister(); }));
        });
      })
      .then(function () {
        if (!("caches" in window)) return;
        return caches.keys().then(function (keys) {
          return Promise.all(keys.map(function (k) { return caches.delete(k); }));
        });
      })
      .catch(function () {})
      .then(function () {
        window.location.reload();
      });
  });
});`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover" },
      { title: "Van-Link — On-demand Logistics in Botswana & SACU" },
      { name: "description", content: "Book vans and trucks on demand across Botswana and SACU. Live tracking, transparent fares, WhatsApp sign-in." },
      { name: "theme-color", content: "#D2AA78" },
      { name: "application-name", content: "VanLink" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "VanLink" },
      { property: "og:title", content: "Van-Link — On-demand Logistics" },
      { property: "og:description", content: "Book vans and trucks on demand across Botswana and SACU." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/icons/favicon-16.png" },
      { rel: "shortcut icon", href: "/icons/favicon-32.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/icons/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: BROWSER_CAPABILITY_CHECK_SCRIPT }} />
      </head>
      <body>
        {children}
        <div
          id="legacy-browser"
          style={{
            display: "none",
            minHeight: "100vh",
            padding: 24,
            fontFamily: "Arial, sans-serif",
            background: "#071426",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              maxWidth: 520,
              margin: "40px auto",
              padding: 20,
              borderRadius: 16,
              background: "#fdfcfa",
              color: "#111827",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 12,
                fontWeight: 800,
                color: "#46321e",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              VanLink
            </p>
            <h1 style={{ margin: "0 0 10px", fontSize: 24, lineHeight: 1.1 }}>
              Please update your browser
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
              This phone browser is too old to run the VanLink app. Please update Chrome, Safari,
              or Android System WebView, then open vanlink.co.bw again.
            </p>
          </div>
        </div>
        <div
          id="app-startup-error"
          style={{
            display: "none",
            minHeight: "100vh",
            padding: 24,
            fontFamily: "Arial, sans-serif",
            background: "#071426",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              maxWidth: 520,
              margin: "40px auto",
              padding: 20,
              borderRadius: 16,
              background: "#fdfcfa",
              color: "#111827",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 12,
                fontWeight: 800,
                color: "#46321e",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              VanLink
            </p>
            <h1 style={{ margin: "0 0 10px", fontSize: 24, lineHeight: 1.1 }}>
              This is taking longer than it should
            </h1>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
              The app didn't finish loading, likely a slow or interrupted connection. Tap below to
              clear any stale cached files and try again.
            </p>
            <button
              id="app-startup-retry"
              style={{
                width: "100%",
                border: 0,
                borderRadius: 12,
                padding: 12,
                background: "linear-gradient(135deg, #c89a63, #e0c296)",
                color: "#46321e",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              Reload app
            </button>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: APP_STARTUP_WATCHDOG_SCRIPT }} />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div id="root">
        <Outlet />
      </div>
      <Toaster position="bottom-center" />
      <InstallPrompt />
    </QueryClientProvider>
  );
}
