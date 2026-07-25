import { Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Camera, CheckCircle2, Mail, Phone, Truck, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel, PrimaryButton } from "@/components/AppShell";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { isSupabaseConfigured, supabase, upsertProfile } from "@/lib/supabase";
import { safeJsonParse, safeStorageGet, safeStorageRemove, safeStorageSet } from "@/lib/safe-storage";

type SignupRole = "client" | "driver";
type Step = "email" | "sent" | "profile" | "done";

const PENDING_KEY = "vanlink_pending_signup";
const PROFILE_KEY = "vanlink_profile";
const USER_KEY = "vanlink_user";

type SavedProfile = {
  name: string;
  phone: string;
  email: string;
  role: "customer" | "driver";
  avatar?: string;
  verifiedAt?: string;
};

function normalizeEmail(value: string) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("267") && digits.length === 11) return `+${digits}`;
  if (digits.length === 8) return `+267${digits}`;
  return String(value || "").trim();
}

function roleLabel(role: SignupRole) {
  return role === "driver" ? "Driver" : "Client";
}

export function SignupMagic({ role }: { role: SignupRole }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+267 ");
  const [avatar, setAvatar] = useState("");

  const profileRole: SavedProfile["role"] = role === "driver" ? "driver" : "customer";
  const dashboardPath = role === "driver" ? "/driver" : "/client";

  const loadSavedProfile = useCallback(() => {
    return safeJsonParse<SavedProfile | null>(safeStorageGet(PROFILE_KEY), null);
  }, []);

  const applyProfile = useCallback((profile: SavedProfile) => {
    setEmail(profile.email || "");
    setName(profile.name || "");
    setPhone(profile.phone || "+267 ");
    setAvatar(profile.avatar || "");
  }, []);

  useEffect(() => {
    const pending = safeJsonParse<{ email?: string; role?: SignupRole } | null>(safeStorageGet(PENDING_KEY), null);
    const saved = loadSavedProfile();

    if (pending && pending.email) setEmail(pending.email);
    if (saved && saved.email) applyProfile(saved);

    if (!supabase) {
      setChecking(false);
      if (saved && saved.email) setStep("done");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const userEmail = normalizeEmail(data.session?.user?.email || pending?.email || saved?.email || "");
      if (userEmail) setEmail(userEmail);

      if (data.session?.user) {
        if (saved && saved.email === userEmail && saved.name && saved.phone) {
          applyProfile(saved);
          setStep("done");
        } else {
          setStep("profile");
        }
      } else if (pending && pending.email) {
        setStep("sent");
      }
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN") return;
      const signedEmail = normalizeEmail(session?.user?.email || email);
      if (signedEmail) setEmail(signedEmail);
      setStep("profile");
      toast.success("Email verified", { description: "Now complete your VanLink profile." });
    });

    return () => listener.subscription.unsubscribe();
  }, [applyProfile, email, loadSavedProfile]);

  async function sendMagicLink() {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      toast.error("Enter your email first");
      return;
    }

    setSaving(true);
    try {
      if (!isSupabaseConfigured || !supabase) throw new Error("Email login is not configured yet.");
      safeStorageSet(PENDING_KEY, JSON.stringify({ email: cleanEmail, role }));
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/signup?role=${role}` : undefined,
          data: { role: profileRole },
        },
      });
      if (error) throw error;
      setEmail(cleanEmail);
      setStep("sent");
      toast.success("Login link sent", { description: "Open your email and tap Sign in." });
    } catch (error) {
      toast.error("Could not send login link", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function checkLogin() {
    if (!supabase) return;
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setEmail(normalizeEmail(data.session.user.email || email));
        setStep("profile");
        return;
      }
      toast("Not signed in yet", { description: "Tap Sign in from the email, then come back here." });
    } finally {
      setSaving(false);
    }
  }

  function pickAvatar(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = normalizeEmail(email);

    if (!cleanName || !cleanPhone || !cleanEmail) {
      toast.error("Complete your profile", { description: "Name, phone and email are required." });
      return;
    }

    setSaving(true);
    try {
      const profile: SavedProfile = {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        role: profileRole,
        avatar,
        verifiedAt: new Date().toISOString(),
      };

      safeStorageSet(PROFILE_KEY, JSON.stringify(profile));
      safeStorageSet(USER_KEY, JSON.stringify({ ...profile, role, profileComplete: true }));
      safeStorageRemove(PENDING_KEY);

      await upsertProfile({ name: cleanName, phone: cleanPhone, email: cleanEmail, role: profileRole }).catch((error) => {
        console.warn("Profile will sync later", error);
      });

      setStep("done");
      toast.success("You are registered", { description: `Welcome, ${cleanName}.` });
    } finally {
      setSaving(false);
    }
  }

  async function startOver() {
    safeStorageRemove(PENDING_KEY);
    safeStorageRemove(PROFILE_KEY);
    safeStorageRemove(USER_KEY);
    if (supabase) await supabase.auth.signOut().catch(() => null);
    setName("");
    setPhone("+267 ");
    setEmail("");
    setAvatar("");
    setStep("email");
  }

  return (
    <AppShell title="Account">
      <div className="space-y-4 pb-6">
        <div
          className="vl-fade-in rounded-3xl p-5 text-white shadow-[var(--shadow-card)]"
          style={{ background: "linear-gradient(135deg, var(--ink), #2b1f13)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-lg font-black tracking-[-0.02em]">Van-Link</span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                {roleLabel(role)} account setup
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/80">
            Simple login. Verified email. One clean profile. No confusing codes.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <div
            className={`rounded-xl px-2 py-2 ${
              step === "email" || step === "sent" ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            Step 1 of 2 · Email
          </div>
          <div
            className={`rounded-xl px-2 py-2 ${
              step === "profile" || step === "done" ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            Step 2 of 2 · Profile
          </div>
        </div>

        {checking && <Panel><p className="text-sm text-muted-foreground">Checking your login...</p></Panel>}

        {!checking && step === "email" && (
          <Panel>
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-card-foreground">Start with email</h2>
              <p className="mt-1 text-sm text-muted-foreground">We will send a secure login link. Tap it once, then complete your profile.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-2xl border border-input bg-secondary px-3 py-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="input-mobile" />
              </div>
              <PrimaryButton onClick={sendMagicLink} disabled={saving}>{saving ? "Sending..." : "Email me login link"}</PrimaryButton>
              <p className="text-center text-[11px] leading-5 text-muted-foreground">
                No password needed — we'll email you a secure sign-in link.
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              <GoogleSignInButton role={role} />
            </div>
          </Panel>
        )}

        {!checking && step === "sent" && (
          <Panel className="border border-success/25 bg-success/10">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" />
              <div className="flex-1">
                <h2 className="text-lg font-extrabold text-card-foreground">Check your email</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  We sent a sign-in link to <strong>{email}</strong>. Tap <strong>Sign in</strong>. When you return here, we will ask for your profile details.
                </p>
                <div className="mt-4 space-y-2">
                  <PrimaryButton onClick={checkLogin} disabled={saving}>{saving ? "Checking..." : "I clicked the email link"}</PrimaryButton>
                  <button type="button" onClick={startOver} className="w-full rounded-xl bg-card py-3 text-sm font-bold text-card-foreground">Use different email</button>
                </div>
              </div>
            </div>
          </Panel>
        )}

        {!checking && step === "profile" && (
          <Panel>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-card-foreground">Complete your profile</h2>
                <p className="mt-1 text-sm text-muted-foreground">You are signed in. Add your name, phone and optional profile photo.</p>
              </div>

              <div className="flex flex-col items-center gap-3 rounded-2xl bg-secondary p-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-card text-3xl font-black text-primary shadow-[var(--shadow-soft)]">
                  {avatar ? <img src={avatar} alt="Profile" className="h-full w-full object-cover" /> : (name.trim().charAt(0).toUpperCase() || "V")}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-extrabold text-card-foreground shadow-[var(--shadow-soft)]">
                  <Camera className="h-4 w-4" />
                  Add profile image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</span>
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-success/25 bg-success/10 px-3 py-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-card-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    <span className="truncate">{email}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-success/15 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-success">
                    Verified
                  </span>
                </div>
              </div>

              <ProfileInput icon={User} label="Full name" value={name} onChange={setName} placeholder="e.g. Kago Mokoena" />
              <ProfileInput icon={Phone} label="WhatsApp / phone" value={phone} onChange={setPhone} placeholder="+267 75560140" />

              <div>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Account type</span>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
                      role === "client" ? "border-primary bg-primary/10" : "border-border bg-secondary opacity-50"
                    }`}
                  >
                    <User className={`h-5 w-5 ${role === "client" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-bold text-card-foreground">Customer</span>
                  </div>
                  <div
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
                      role === "driver" ? "border-primary bg-primary/10" : "border-border bg-secondary opacity-50"
                    }`}
                  >
                    <Truck className={`h-5 w-5 ${role === "driver" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-bold text-card-foreground">Driver</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-primary/15 bg-primary/10 p-3 text-xs leading-5 text-foreground/75">
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                {role === "driver" ? "After this, upload your licence, licence disc and BA permit from the driver dashboard." : "After this, you can request a truck from the client dashboard."}
              </div>

              <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile and finish"}</PrimaryButton>
            </form>
          </Panel>
        )}

        {!checking && step === "done" && (
          <Panel className="border border-success/25 bg-success/10">
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white text-3xl font-black text-primary shadow-[var(--shadow-soft)]">
                {avatar ? <img src={avatar} alt="Profile" className="h-full w-full object-cover" /> : (name.trim().charAt(0).toUpperCase() || "V")}
              </div>
              <CheckCircle2 className="mx-auto mt-4 h-8 w-8 text-success" />
              <h2 className="mt-3 text-xl font-black text-card-foreground">You are registered</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Logged in as <strong>{name || email}</strong>. Your VanLink profile is ready.
              </p>
              <div className="mt-5 space-y-2">
                <PrimaryButton onClick={() => void navigate({ to: dashboardPath })}>Go to my dashboard</PrimaryButton>
                <button type="button" onClick={startOver} className="w-full rounded-xl bg-card py-3 text-sm font-bold text-card-foreground">Sign out / switch account</button>
              </div>
            </div>
          </Panel>
        )}

        <div className="flex rounded-xl bg-card p-1 text-sm font-medium shadow-[var(--shadow-card)]">
          {(["client", "driver"] as const).map((item) => (
            <Link key={item} to="/signup" search={{ role: item }} className={`flex-1 rounded-lg px-3 py-2 text-center transition ${role === item ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {item === "client" ? "Client" : "Driver"}
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function ProfileInput({ icon: Icon, label, value, onChange, placeholder, disabled }: { icon: typeof User; label: string; value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-input bg-secondary px-3 py-3 focus-within:border-primary">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <input required value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className="input-mobile disabled:opacity-70" />
      </div>
    </label>
  );
}
