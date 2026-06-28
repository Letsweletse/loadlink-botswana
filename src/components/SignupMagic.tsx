import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, IdCard, Mail, MessageCircle, Phone, ShieldCheck, Truck, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel, PrimaryButton } from "@/components/AppShell";
import { isSupabaseConfigured, supabase, upsertProfile } from "@/lib/supabase";
import { safeJsonParse, safeStorageGet, safeStorageRemove, safeStorageSet } from "@/lib/safe-storage";

const PENDING_KEY = "vanlink_pending_signup";

type SignupRole = "client" | "driver";

type PendingSignup = {
  name: string;
  identity: string;
  phone: string;
  email: string;
  role: SignupRole;
  driver: null | {
    truckSize: string;
    plateNumber: string;
    licenceDiscExpiry: string;
    baPermit: string;
    licenceCode: string;
    licenceNumber: string;
  };
};

function normalizePhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("267") && digits.length === 11) return `+${digits}`;
  if (digits.length === 8) return `+267${digits}`;
  return String(value || "").trim();
}

function normalizeEmail(value: string) {
  return String(value || "").trim().toLowerCase();
}

export function SignupMagic({ role }: { role: SignupRole }) {
  const navigate = useNavigate();
  const isDriver = role === "driver";
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");
  const [phone, setPhone] = useState("+267 ");
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const [truckSize, setTruckSize] = useState("mini");
  const [plateNumber, setPlateNumber] = useState("");
  const [licenceDiscExpiry, setLicenceDiscExpiry] = useState("");
  const [baPermit, setBaPermit] = useState("pending");
  const [licenceCode, setLicenceCode] = useState("");
  const [licenceNumber, setLicenceNumber] = useState("");

  function payload(): PendingSignup {
    return {
      name: name.trim(),
      identity: identity.trim(),
      phone: normalizePhone(phone),
      email: normalizeEmail(email),
      role,
      driver: isDriver
        ? {
            truckSize,
            plateNumber: plateNumber.trim().toUpperCase(),
            licenceDiscExpiry,
            baPermit,
            licenceCode: licenceCode.trim().toUpperCase(),
            licenceNumber: licenceNumber.trim(),
          }
        : null,
    };
  }

  const finish = useCallback(
    async (saved: PendingSignup) => {
      const profileRole = saved.role === "driver" ? "driver" : "customer";
      safeStorageSet(
        "vanlink_user",
        JSON.stringify({
          ...saved,
          idNumber: saved.identity,
          verifiedAt: new Date().toISOString(),
        }),
      );
      safeStorageSet(
        "vanlink_profile",
        JSON.stringify({
          name: saved.name || "VanLink user",
          phone: saved.phone,
          email: saved.email,
          role: profileRole,
        }),
      );
      await upsertProfile({ name: saved.name, phone: saved.phone, email: saved.email, role: profileRole }).catch((error) => {
        console.warn("Profile will sync when the service is available", error);
      });
      safeStorageRemove(PENDING_KEY);
      toast.success("Account verified", {
        description: saved.role === "driver" ? "Next step: upload your driver documents." : "You can now request a truck.",
      });
      void navigate({ to: saved.role === "driver" ? "/driver" : "/client" });
    },
    [navigate],
  );

  useEffect(() => {
    const pending = safeJsonParse<PendingSignup | null>(safeStorageGet(PENDING_KEY), null);
    if (pending) {
      setName(pending.name);
      setIdentity(pending.identity);
      setPhone(pending.phone);
      setEmail(pending.email);
      setLinkSent(true);
      if (pending.driver) {
        setTruckSize(pending.driver.truckSize);
        setPlateNumber(pending.driver.plateNumber);
        setLicenceDiscExpiry(pending.driver.licenceDiscExpiry);
        setBaPermit(pending.driver.baPermit);
        setLicenceCode(pending.driver.licenceCode);
        setLicenceNumber(pending.driver.licenceNumber);
      }
    }

    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const saved = safeJsonParse<PendingSignup | null>(safeStorageGet(PENDING_KEY), null);
      if (data.session?.user && saved) void finish(saved);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN") return;
      const saved = safeJsonParse<PendingSignup | null>(safeStorageGet(PENDING_KEY), null);
      if (saved) void finish(saved);
    });

    return () => listener.subscription.unsubscribe();
  }, [finish]);

  async function sendLink() {
    const saved = payload();
    if (!saved.email) {
      toast.error("Email is required", { description: "Enter a valid email address first." });
      return;
    }

    safeStorageSet(PENDING_KEY, JSON.stringify(saved));
    setSaving(true);
    try {
      if (!isSupabaseConfigured || !supabase) throw new Error("Verification service is not configured.");
      const { error } = await supabase.auth.signInWithOtp({
        email: saved.email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/signup?role=${role}` : undefined,
          data: { name: saved.name, phone: saved.phone, role: isDriver ? "driver" : "customer" },
        },
      });
      if (error) throw error;
      setPhone(saved.phone);
      setEmail(saved.email);
      setLinkSent(true);
      toast.success("Secure link sent", {
        description: `Open ${saved.email} and tap Sign in. VanLink will finish automatically.`,
      });
    } catch (error) {
      toast.error("Could not send sign-in link", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function continueAfterLink() {
    if (!supabase) return;
    setSaving(true);
    try {
      const saved = safeJsonParse<PendingSignup | null>(safeStorageGet(PENDING_KEY), null);
      const { data } = await supabase.auth.getSession();
      if (data.session?.user && saved) {
        await finish(saved);
        return;
      }
      toast("Open the email first", {
        description: "Tap the Sign in button in your email, then come back here.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (linkSent) {
      await continueAfterLink();
      return;
    }
    await sendLink();
  }

  return (
    <AppShell title="Sign up">
      <div className="space-y-4 pb-6">
        <div className="vl-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {isDriver ? <Truck className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            {isDriver ? "Driver onboarding" : "Client onboarding"}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Create your VanLink account</h1>
          <p className="mt-1 text-sm text-foreground/70">
            No code to type. Enter your details once, tap the email sign-in link, and VanLink finishes setup for you.
          </p>
        </div>

        <div className="flex rounded-xl bg-card p-1 text-sm font-medium shadow-[var(--shadow-card)]">
          {(["client", "driver"] as const).map((r) => (
            <Link
              key={r}
              to="/signup"
              search={{ role: r }}
              className={`flex-1 rounded-lg px-3 py-2 text-center transition ${
                role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {r === "client" ? "I need a truck" : "I drive a truck"}
            </Link>
          ))}
        </div>

        {linkSent && (
          <Panel className="border border-success/25 bg-success/10">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-extrabold text-card-foreground">Email sent</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Open <strong>{email}</strong>, tap <strong>Sign in</strong>, then return here. Your details are safely held on this phone.
                </p>
              </div>
            </div>
          </Panel>
        )}

        <Panel>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Full names">
              <IconInput icon={User}>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kago Mokoena" className="input-mobile" disabled={linkSent} />
              </IconInput>
            </Field>

            <Field label="Omang / ID number">
              <IconInput icon={IdCard}>
                <input required value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="Enter ID number" className="input-mobile" disabled={linkSent} />
              </IconInput>
            </Field>

            <Field label="Cellphone / WhatsApp number">
              <IconInput icon={Phone}>
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="input-mobile" disabled={linkSent} />
              </IconInput>
            </Field>

            <Field label="Email address">
              <IconInput icon={Mail}>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" className="input-mobile" disabled={linkSent} />
              </IconInput>
            </Field>

            {isDriver && (
              <div className="space-y-4 rounded-2xl bg-secondary p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <h2 className="text-sm font-bold text-card-foreground">Driver and truck verification</h2>
                </div>
                <SelectField label="Truck size" value={truckSize} onChange={setTruckSize} disabled={linkSent} />
                <TextField label="Vehicle plate number" value={plateNumber} onChange={(v) => setPlateNumber(v.toUpperCase())} placeholder="e.g. B123ABC" disabled={linkSent} />
                <DateField label="Licence disc expiry date" value={licenceDiscExpiry} onChange={setLicenceDiscExpiry} disabled={linkSent} />
                <PermitField value={baPermit} onChange={setBaPermit} disabled={linkSent} />
                <TextField label="Botswana licence code" value={licenceCode} onChange={(v) => setLicenceCode(v.toUpperCase())} placeholder="e.g. B, C1, C, EC" disabled={linkSent} />
                <TextField label="Driver licence number" value={licenceNumber} onChange={setLicenceNumber} placeholder="Enter licence number" disabled={linkSent} />
              </div>
            )}

            <PrimaryButton type="submit" disabled={saving}>
              <MessageCircle className="-ml-1 mr-1 inline h-4 w-4" />
              {saving ? "Please wait..." : linkSent ? "I clicked the email link — continue" : "Email me secure sign-in link"}
            </PrimaryButton>

            {linkSent && (
              <button
                type="button"
                onClick={() => {
                  safeStorageRemove(PENDING_KEY);
                  setLinkSent(false);
                }}
                className="w-full rounded-xl bg-secondary py-3 text-sm font-semibold text-card-foreground"
              >
                Use a different email
              </button>
            )}
          </form>
        </Panel>

        <p className="text-center text-xs text-foreground/60">
          Drivers can upload licence, licence disc and BA permit documents after email verification.
        </p>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function IconInput({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-input bg-secondary px-3 py-3 focus-within:border-primary">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, disabled }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <Field label={label}>
      <input required value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary" />
    </Field>
  );
}

function DateField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <Field label={label}>
      <input required type="date" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary" />
    </Field>
  );
}

function SelectField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <Field label={label}>
      <select required value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary">
        <option value="mini">Mini van / under 2 tons</option>
        <option value="medium">Medium truck / 2–5 tons</option>
        <option value="big">Big truck / 5+ tons</option>
      </select>
    </Field>
  );
}

function PermitField({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <Field label="BA permit status">
      <select required value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary">
        <option value="valid">Valid BA permit</option>
        <option value="pending">Application pending</option>
        <option value="not_available">Not available yet</option>
      </select>
    </Field>
  );
}
