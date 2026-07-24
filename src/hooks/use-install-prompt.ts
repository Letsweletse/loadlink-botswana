import { useCallback, useEffect, useState } from "react";
import { safeStorageGet, safeStorageSet } from "@/lib/safe-storage";

const DISMISS_KEY = "vanlink_install_dismissed_until";
const INSTALLED_KEY = "vanlink_install_completed";
const VISIT_COUNT_KEY = "vanlink_visit_count";
const SNOOZE_DAYS = 14;
const FIRST_VISIT_DELAY_MS = 20000;
const RETURNING_VISIT_DELAY_MS = 3000;
const MIN_VISITS_FOR_FAST_REVEAL = 2;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone);
}

function isIOSSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}

function isDismissed() {
  const until = Number(safeStorageGet(DISMISS_KEY) || "0");
  return until > Date.now();
}

function snooze() {
  safeStorageSet(DISMISS_KEY, String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000));
}

export type InstallPlatform = "android" | "ios";

export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || safeStorageGet(INSTALLED_KEY) === "1" || isDismissed()) return;

    const visits = Number(safeStorageGet(VISIT_COUNT_KEY) || "0") + 1;
    safeStorageSet(VISIT_COUNT_KEY, String(visits));
    const revealDelay =
      visits >= MIN_VISITS_FOR_FAST_REVEAL ? RETURNING_VISIT_DELAY_MS : FIRST_VISIT_DELAY_MS;

    let revealTimer: ReturnType<typeof setTimeout> | undefined;

    function reveal(detectedPlatform: InstallPlatform) {
      setPlatform(detectedPlatform);
      revealTimer = setTimeout(() => setVisible(true), revealDelay);
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
      reveal("android");
    }

    function onAppInstalled() {
      safeStorageSet(INSTALLED_KEY, "1");
      setVisible(false);
      setDeferredEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // iOS Safari never fires beforeinstallprompt; show manual instructions instead.
    if (isIOSSafari()) reveal("ios");

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      if (revealTimer) clearTimeout(revealTimer);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredEvent) return;
    setVisible(false);
    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    setDeferredEvent(null);
    if (choice.outcome === "accepted") {
      safeStorageSet(INSTALLED_KEY, "1");
    } else {
      snooze();
    }
  }, [deferredEvent]);

  const dismiss = useCallback(() => {
    snooze();
    setVisible(false);
  }, []);

  return { visible: visible && (platform === "ios" || Boolean(deferredEvent)), platform, install, dismiss };
}
