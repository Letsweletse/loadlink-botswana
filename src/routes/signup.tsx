import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Panel, PrimaryButton } from "@/components/AppShell";
import { IdCard, Mail, MessageCircle, Phone, ShieldCheck, Truck, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { upsertProfile } from "@/lib/supabase";
import { safeStorageSet } from "@/lib/safe-storage";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: (s.role as "client" | "driver") ?? "client",
  }),
  component: SignUp,
});

function SignUp() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("+267 ");
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [saving, setSaving] = useState(false);

  const [truckSize, setTruckSize] = useState("mini");
  const [plateNumber, setPlateNumber] = useState("");
  const [licenceDiscExpiry, setLicenceDiscExpiry] = useState("");
  const [baPermit, setBaPermit] = useState("pending");
  const [licenceCode, setLicenceCode] = useState("");
  const [licenceNumber, setLicenceNumber] = useState("");

  const isDriver = role === "driver";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
      toast("Verification code sent", { description: `WhatsApp/Gmail check for ${phone}` });
      return;
    }

    setSaving(true);
    try {
      const normalizedRole = isDriver ? "driver" : "customer";
      await upsertProfile({ name, phone, role: normalizedRole });

      const expandedPayload = {
        name,
        idNumber,
        phone,
        email,
        role,
        verifiedAt: new Date().toISOString(),
        driver: isDriver
          ? {
              truckSize,
              plateNumber,
              licenceDiscExpiry,
              baPermit,
              licenceCode,
              licenceNumber,
            }
          : null,
      };

      safeStorageSet("vanlink_user", JSON.stringify(expandedPayload));
      toast.success("Registration saved successfully");
      navigate({ to: isDriver ? "/driver" : "/client" });
    } catch (error) {
      console.error(error);
      toast.error("Could not create account", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Sign up">
      <div className="space-y-4 pb-6">
        <div className="vl-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {isDriver ? <Truck className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            {isDriver ? "Driver onboarding" : "Client onboarding"}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Create your LoadLink account</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Register with your ID, WhatsApp number and Gmail so LoadLink can verify clients and
            drivers properly.
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

        <Panel>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Full names">
              <IconInput icon={User}>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kago Mokoena"
                  className="input-mobile"
                />
              </IconInput>
            </Field>

            <Field label="Omang / ID number">
              <IconInput icon={IdCard}>
                <input
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Enter ID number"
                  className="input-mobile"
                />
              </IconInput>
            </Field>

            <Field label="Cellphone / WhatsApp number">
              <IconInput icon={Phone}>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-mobile"
                />
              </IconInput>
            </Field>

            <Field label="Gmail / email address">
              <IconInput icon={Mail}>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="input-mobile"
                />
              </IconInput>
            </Field>

            {isDriver && (
              <div className="space-y-4 rounded-2xl bg-secondary p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <h2 className="text-sm font-bold text-card-foreground">
                    Driver and truck verification
                  </h2>
                </div>

                <Field label="Truck size">
                  <select
                    required
                    value={truckSize}
                    onChange={(e) => setTruckSize(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
                  >
                    <option value="mini">Mini van / under 2 tons</option>
                    <option value="medium">Medium truck / 2–5 tons</option>
                    <option value="big">Big truck / 5+ tons</option>
                  </select>
                </Field>

                <Field label="Vehicle plate number">
                  <input
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. B123ABC"
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
                  />
                </Field>

                <Field label="Licence disc expiry date">
                  <input
                    required
                    type="date"
                    value={licenceDiscExpiry}
                    onChange={(e) => setLicenceDiscExpiry(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
                  />
                </Field>

                <Field label="BA permit status">
                  <select
                    required
                    value={baPermit}
                    onChange={(e) => setBaPermit(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
                  >
                    <option value="valid">Valid BA permit</option>
                    <option value="pending">Application pending</option>
                    <option value="not_available">Not available yet</option>
                  </select>
                </Field>

                <Field label="Botswana licence code">
                  <input
                    required
                    value={licenceCode}
                    onChange={(e) => setLicenceCode(e.target.value.toUpperCase())}
                    placeholder="e.g. B, C1, C, EC"
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
                  />
                </Field>

                <Field label="Driver licence number">
                  <input
                    required
                    value={licenceNumber}
                    onChange={(e) => setLicenceNumber(e.target.value)}
                    placeholder="Enter licence number"
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
                  />
                </Field>
              </div>
            )}

            {otpSent && (
              <Field label="6-digit verification code">
                <input
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-center text-lg tracking-[0.4em] text-card-foreground outline-none focus:border-primary"
                />
              </Field>
            )}

            <PrimaryButton type="submit" disabled={saving}>
              <MessageCircle className="-ml-1 mr-1 inline h-4 w-4" />
              {saving ? "Saving..." : otpSent ? "Verify and continue" : "Send verification code"}
            </PrimaryButton>
          </form>
        </Panel>

        <p className="text-center text-xs text-foreground/60">
          Driver details are captured for onboarding review. Full document upload and permanent
          driver verification will be connected next.
        </p>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
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
