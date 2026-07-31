import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "vanlink_install_dismissed";

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === "1");

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    function onPrompt(e: any) {
      e.preventDefault();
      setDeferred(e);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari never fires beforeinstallprompt -- show manual instructions instead
    const t = setTimeout(() => {
      if (isIos() && !isStandalone()) setShowIosHint(true);
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(t);
    };
  }, [dismissed]);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (dismissed || isStandalone()) return null;
  if (!deferred && !showIosHint) return null;

  return (
    <div className="fixed bottom-20 inset-x-0 z-50 px-4 pointer-events-none">
      <div className="max-w-lg mx-auto bg-[#3D2B0E] text-white rounded-2xl shadow-xl p-4 flex items-center gap-3 pointer-events-auto">
        <img src="/icon-192.png" alt="" className="h-11 w-11 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Install Van-Link</p>
          {showIosHint && !deferred ? (
            <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1">
              Tap <Share className="h-3 w-3 inline" /> then "Add to Home Screen"
            </p>
          ) : (
            <p className="text-xs text-white/70 mt-0.5">Faster access, works like an app</p>
          )}
        </div>
        {deferred && (
          <button onClick={install}
            className="h-9 px-3 rounded-lg bg-[#C9A05A] text-[#3D2B0E] text-xs font-bold flex items-center gap-1.5 shrink-0">
            <Download className="h-3.5 w-3.5" /> Install
          </button>
        )}
        <button onClick={dismiss} className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
