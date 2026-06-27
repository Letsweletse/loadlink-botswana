import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles.css";

const root = document.getElementById("root");

function cleanupStaleAppCaches() {
  if (!import.meta.env.PROD) return;

  window.addEventListener("load", () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            if (registration.scope.startsWith(window.location.origin)) {
              registration.update().catch(() => null);
            }
          });
        })
        .catch(() => null);
    }

    if ("caches" in window) {
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("vanlink-pwa-"))
              .map((key) => caches.delete(key)),
          ),
        )
        .catch(() => null);
    }
  });
}

cleanupStaleAppCaches();

if (root) {
  const router = getRouter();
  createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
