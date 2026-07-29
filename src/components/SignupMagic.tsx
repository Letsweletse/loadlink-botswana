import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase, isSupabaseConfigured, upsertProfile } from "@/lib/supabase";
import { safeStorageGet, safeStorageSet, safeJsonParse } from "@/lib/safe-storage";

type SignupRole = "client" | "driver";
const PROFILE_KEY = "vanlink_profile";

const BG = "#fdf8f2";
const DARK = "#1e1208";
const BROWN = "#3d2b0e";
const TAN = "#c9a05a";
const MID = "#b09060";
const LINE = "#e8d5b7";
const DIM = "#c8a878";

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
      const savedPhone = safeJsonParse<{ phone?: string } | null>(safeStorageGet(PROFILE_KEY), null)?.phone || "";
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
    safeStorageSet(PROFILE_KEY, JSON.stringify({ email: clean, phone: normalizePhone(phone), role: profileRole }));
    setEmailSent(true);
    setBusy(false);
    toast.success("Check your email!");
  }

  const inp: React.CSSProperties = {
    background: "transparent", border: "none", outline: "none",
    color: DARK, fontSize: 15, width: "100%", fontFamily: "inherit", padding: 0,
  };

  if (!ready) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes vl-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 26, height: 26, borderRadius: "50%", border: `2.5px solid ${TAN}`, borderTopColor: "transparent", animation: "vl-spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "52px 28px 40px", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif" }}>

      {/* Logo + brand */}
      <div style={{ marginBottom: 48 }}>
        <img
          src="/icon-512.png"
          alt="Van-Link"
          style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16, display: "block", objectFit: "cover" }}
        />
        <p style={{ color: DARK, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Van-Link</p>
        <p style={{ color: MID, fontSize: 12, marginTop: 5, letterSpacing: "0.04em" }}>LOGISTICS · BOTSWANA</p>
      </div>

      {/* Role tabs */}
      <div style={{ display: "flex", borderBottom: `1.5px solid ${LINE}`, marginBottom: 36 }}>
        {(["client", "driver"] as const).map((r) => (
          <Link key={r} to="/signup" search={{ role: r }} style={{
            flex: 1, paddingBottom: 12, textAlign: "center", textDecoration: "none",
            borderBottom: role === r ? `2px solid ${BROWN}` : "2px solid transparent",
            marginBottom: -1.5,
          }}>
            <span style={{ color: role === r ? BROWN : DIM, fontSize: 13, fontWeight: role === r ? 700 : 400 }}>
              {r === "client" ? "Client" : "Driver"}
            </span>
          </Link>
        ))}
      </div>

      {!emailSent ? (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>

          {/* Google */}
          <button onClick={signInGoogle} disabled={busy || !isSupabaseConfigured} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "18px 0",
            borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`,
            background: "none", border: "none", borderBottom: `1px solid ${LINE}`,
            borderTop: `1px solid ${LINE}`, cursor: "pointer", width: "100%",
            opacity: busy ? 0.6 : 1,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span style={{ color: DARK, fontSize: 15, fontWeight: 500, flex: 1, textAlign: "left" }}>Continue with Google</span>
            <span style={{ color: LINE, fontSize: 20, lineHeight: 1 }}>›</span>
          </button>

          {/* Email */}
          <div style={{ padding: "20px 0", borderBottom: `1px solid ${LINE}` }}>
            <p style={{ color: MID, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Email</p>
            <input
              type="email" inputMode="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMagicLink()}
              placeholder="your@email.com"
              style={inp}
            />
          </div>

          {/* Phone */}
          <div style={{ padding: "20px 0", borderBottom: `1px solid ${LINE}` }}>
            <p style={{ color: MID, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Phone</p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ color: BROWN, fontSize: 15, fontWeight: 600, flexShrink: 0 }}>🇧🇼 +267</span>
              <input
                type="tel" inputMode="numeric" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="75 123 456"
                style={inp}
              />
            </div>
          </div>

          {/* CTA */}
          <button onClick={sendMagicLink} disabled={busy || !email.includes("@")} style={{
            marginTop: "auto", paddingTop: 0,
            marginTop: 40,
            background: BROWN, border: "none", borderRadius: 14,
            padding: "17px", color: BG, fontSize: 15, fontWeight: 800,
            cursor: busy || !email.includes("@") ? "not-allowed" : "pointer",
            opacity: busy || !email.includes("@") ? 0.4 : 1,
            fontFamily: "inherit",
          }}>
            {busy ? "Sending…" : "Send login link"}
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, paddingTop: 12 }}>
          <p style={{ fontSize: 44 }}>📬</p>
          <p style={{ color: DARK, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Check your email</p>
          <p style={{ color: MID, fontSize: 14, lineHeight: 1.7 }}>
            Tap the link sent to <span style={{ color: BROWN, fontWeight: 700 }}>{email}</span> to sign in instantly.
          </p>
          <button onClick={() => { setEmailSent(false); setEmail(""); setPhone(""); }} style={{
            background: "none", border: "none", color: MID, fontSize: 13,
            cursor: "pointer", marginTop: 8, textAlign: "left", padding: 0, fontFamily: "inherit",
          }}>
            ← Different email
          </button>
        </div>
      )}
    </div>
  );
}
