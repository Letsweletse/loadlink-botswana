import { Link, useNavigate } from "@tanstack/react-router";
import { Truck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase, isSupabaseConfigured, upsertProfile } from "@/lib/supabase";
import { safeStorageGet, safeStorageSet, safeJsonParse } from "@/lib/safe-storage";

type SignupRole = "client" | "driver";
const PROFILE_KEY = "vanlink_profile";

function normalizePhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("267") && digits.length === 11) return `+${digits}`;
  if (digits.length === 8) return `+267${digits}`;
  return String(value || "").trim();
}

export function SignupMagic({ role }: { role: SignupRole }) {
  const navigate = useNavigate();
  const profileRole = role === "driver" ? "driver" : "customer";
  const dashboardPath = role === "driver" ? "/driver" : "/client";

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void navigate({ to: dashboardPath });
      else setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN" || !session?.user) return;
      const u = session.user;
      const name = u.user_metadata?.full_name || u.user_metadata?.name || "";
      const savedEmail = u.email || "";
      const savedPhone = safeJsonParse<{ phone?: string } | null>(
        safeStorageGet(PROFILE_KEY), null
      )?.phone || "";
      safeStorageSet(PROFILE_KEY, JSON.stringify({ name, email: savedEmail, phone: savedPhone, role: profileRole }));
      await upsertProfile({ name, phone: savedPhone, email: savedEmail, role: profileRole }).catch(() => null);
      toast.success(`Welcome to Van-Link${name ? ", " + name.split(" ")[0] : ""}!`);
      void navigate({ to: dashboardPath });
    });
    return () => listener.subscription.unsubscribe();
  }, [dashboardPath, navigate, profileRole]);

  async function signInGoogle() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/signup?role=${role}`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) { toast.error("Google sign-in failed"); setBusy(false); }
  }

  async function sendMagicLink() {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) { toast.error("Enter a valid email"); return; }
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/signup?role=${role}`,
        data: { role: profileRole },
      },
    });
    if (error) { toast.error(error.message); setBusy(false); return; }
    const cleanPhone = normalizePhone(phone);
    safeStorageSet(PROFILE_KEY, JSON.stringify({ email: clean, phone: cleanPhone, role: profileRole }));
    setEmailSent(true);
    setBusy(false);
    toast.success("Check your email — link sent!");
  }

  if (!ready) {
    return (
      <AppShell title="Van-Link">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Van-Link">
      <div className="flex min-h-[90vh] flex-col justify-center gap-4 pb-8 pt-2">

        {/* Logo */}
        <div className="text-center mb-2">
          <img src="/icon-512.png" alt="Van-Link" className="mx-auto h-20 w-20 rounded-2xl shadow-lg" />
          <h1 className="mt-3 text-2xl font-black text-card-foreground">Van-Link</h1>
          <p className="text-sm text-muted-foreground">On-demand logistics · Botswana</p>
        </div>

        {/* Role picker */}
        <div className="flex rounded-2xl bg-card p-1 shadow-[var(--shadow-card)]">
          {(["client", "driver"] as const).map((r) => (
            <Link key={r} to="/signup" search={{ role: r }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                role === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {r === "driver" ? <Truck className="h-4 w-4" /> : <User className="h-4 w-4" />}
              {r === "client" ? "Client" : "Driver"}
            </Link>
          ))}
        </div>

        {/* Sign in card */}
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] space-y-4">

          {/* Google */}
          <button onClick={signInGoogle} disabled={busy || !isSupabaseConfigured}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-input bg-background py-4 text-sm font-bold text-card-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {!emailSent ? (
            <div className="space-y-3">
              {/* Email */}
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-mobile w-full rounded-2xl border border-input bg-secondary px-4 py-3 text-base"
              />

              {/* Phone */}
              <div className="flex gap-2">
                <div className="flex items-center rounded-2xl border border-input bg-secondary px-4 text-sm font-bold text-card-foreground whitespace-nowrap">
                  🇧🇼 +267
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="75 123 456"
                  className="input-mobile flex-1 rounded-2xl border border-input bg-secondary px-4 py-3 text-base"
                />
              </div>

              <button
                onClick={sendMagicLink}
                disabled={busy || !email.includes("@")}
                className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-50 transition active:scale-[0.98]"
              >
                {busy ? "Sending…" : "Send login link"}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-green-200 bg-green-50 dark:bg-green-950/20 p-5 text-center space-y-2">
              <p className="text-3xl">📬</p>
              <p className="font-black text-card-foreground">Check your email</p>
              <p className="text-sm text-muted-foreground">Tap the link in <strong>{email}</strong> to sign in instantly.</p>
              <button onClick={() => { setEmailSent(false); setEmail(""); setPhone(""); }}
                className="text-xs text-muted-foreground underline pt-1 block mx-auto"
              >
                Use different email
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
