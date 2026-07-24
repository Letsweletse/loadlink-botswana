import { Download, Share, SquarePlus, X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallPrompt() {
  const { visible, platform, install, dismiss } = useInstallPrompt();

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install VanLink"
      className="fixed inset-x-0 bottom-20 z-40 mx-auto w-full max-w-[520px] px-4 sm:bottom-4"
    >
      <div className="vl-slide-up flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-[var(--shadow-elegant)]">
        <img
          src="/icons/icon-192.png"
          alt=""
          className="h-11 w-11 flex-shrink-0 rounded-xl border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Install VanLink</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {platform === "ios"
              ? "Add VanLink to your Home Screen for one-tap, full-screen access."
              : "Add VanLink to your home screen for faster bookings and offline access."}
          </p>

          {platform === "ios" ? (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-medium text-card-foreground">
              Tap <Share className="h-3.5 w-3.5" /> then
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5">
                <SquarePlus className="h-3.5 w-3.5" /> Add to Home Screen
              </span>
            </p>
          ) : (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={install}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                <Download className="h-3.5 w-3.5" /> Install
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                Not now
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
