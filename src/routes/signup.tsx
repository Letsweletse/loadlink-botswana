import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Panel, PrimaryButton } from "@/components/AppShell";
import { MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({ role: (s.role as "client" | "driver") ?? "client" }),
  component: SignUp,
});

function SignUp() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("+267 ");
  const [name, setName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
      toast("Code sent on WhatsApp", { description: phone });
      return;
    }
    localStorage.setItem("vanlink_user", JSON.stringify({ phone, name, role }));
    toast.success("Welcome to Van-Link");
    navigate({ to: role === "driver" ? "/driver" : "/client" });
  };

  return (
    <AppShell title="Sign up">
      <div className="space-y-4">
        <div className="vl-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-foreground/70">Verify your number on WhatsApp to continue.</p>
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
          <Field label="Full name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kago Mokoena"
              className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-sm text-card-foreground outline-none focus:border-primary"
            />
          </Field>
          <Field label="WhatsApp number">
            <div className="flex items-center gap-2 rounded-xl border border-input bg-secondary px-3 py-3 focus-within:border-primary">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent text-sm text-card-foreground outline-none"
              />
            </div>
          </Field>
          {otpSent && (
            <Field label="6-digit code (sent via WhatsApp)">
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
          <PrimaryButton type="submit">
            <MessageCircle className="-ml-1 mr-1 inline h-4 w-4" />
            {otpSent ? "Verify & continue" : "Send WhatsApp code"}
          </PrimaryButton>
          </form>
        </Panel>

        <p className="text-center text-xs text-foreground/60">
          By continuing you agree to Van-Link's terms and Botswana transport regulations.
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