import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { signInWithGoogle } from "@/lib/auth";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.4 0 6.4 1.17 8.8 3.46l6.55-6.55C35.1 2.6 29.9 0 24 0 14.6 0 6.5 5.4 2.55 13.24l7.63 5.92C12.05 13.1 17.55 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.6c-.55 2.9-2.2 5.36-4.68 7.02l7.35 5.7C43.4 37.6 46.5 31.6 46.5 24.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.18 19.16c-.5 1.5-.8 3.1-.8 4.84s.3 3.34.8 4.84l-7.63 5.92C.98 32.1 0 28.4 0 24s.98-8.1 2.55-11.76l7.63 5.92z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.95-2.15 15.94-5.86l-7.35-5.7c-2.05 1.37-4.7 2.17-8.59 2.17-6.45 0-11.95-3.6-13.82-8.66l-7.63 5.92C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

export function GoogleSignInButton({ role }: { role: "client" | "driver" }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await signInWithGoogle(role);
    } catch (error) {
      toast.error("Could not continue with Google", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-card py-3 text-sm font-bold text-card-foreground shadow-[var(--shadow-soft)] transition disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
      {loading ? "Redirecting..." : "Continue with Google"}
    </button>
  );
}
