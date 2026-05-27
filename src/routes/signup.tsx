import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MessageCircle, Phone } from "lucide-react";
import { useState } from "react";

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
      return;
    }
    localStorage.setItem("vanlink_user", JSON.stringify({ phone, name, role }));
    navigate({ to: role === "driver" ? "/driver" : "/client" });
  };

  return (
    <AppShell title="Sign up">
      <div className="px-5 pt-6">
        <h1 className="text-2xl font-bold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Verify your number on WhatsApp to continue.</p>

        <div className="mt-5 flex rounded-xl border border-border bg-secondary p-1 text-sm font-medium">
          {(["client", "driver"] as const).map((r) => (
            <Link
              key={r}
              to="/signup"
              search={{ role: r }}
              className={`flex-1 rounded-lg px-3 py-2 text-center transition ${
                role === r ? "bg-card text-primary shadow-[var(--shadow-card)]" : "text-muted-foreground"
              }`}
            >
              {r === "client" ? "I need a truck" : "I drive a truck"}
            </Link>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Full name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kago Mokoena"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="WhatsApp number">
            <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-3 focus-within:border-primary">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
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
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-primary"
              />
            </Field>
          )}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <MessageCircle className="h-4 w-4" />
            {otpSent ? "Verify & continue" : "Send WhatsApp code"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
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