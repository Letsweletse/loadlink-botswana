import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TRUCK_TIERS, type TruckSize } from "@/lib/vanlink";
import { Truck, Wallet, BadgeCheck, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/driver")({
  component: DriverHub,
});

function DriverHub() {
  const [size, setSize] = useState<TruckSize>("medium");
  const [plate, setPlate] = useState("");
  const [licenceExpiry, setLicenceExpiry] = useState("");
  const [baPermit, setBaPermit] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [active, setActive] = useState(false);
  const tier = TRUCK_TIERS[size];

  return (
    <AppShell title="Driver hub">
      <div className="px-5 pt-5 space-y-5">
        <div className="rounded-2xl p-5 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary-foreground/80">Wallet balance</p>
              <p className="mt-1 text-3xl font-extrabold">P0.00</p>
            </div>
            <Wallet className="h-8 w-8 text-white/80" />
          </div>
          <button className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-primary">
            Top up from P{tier.deposit} to go active
          </button>
          <div className="mt-3 flex items-center gap-2 text-xs text-primary-foreground/85">
            <BadgeCheck className="h-4 w-4" /> Van-Link keeps 10% per completed load.
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="text-sm font-semibold text-ink">Availability</p>
            <p className="text-xs text-muted-foreground">{active ? "You'll receive load broadcasts" : "Top up to go active"}</p>
          </div>
          <button
            onClick={() => setActive((a) => !a)}
            className={`relative h-7 w-12 rounded-full transition ${active ? "bg-success" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${active ? "left-5" : "left-0.5"}`} />
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vehicle category</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TRUCK_TIERS) as TruckSize[]).map((k) => {
              const t = TRUCK_TIERS[k];
              const a = k === size;
              return (
                <button
                  key={k}
                  onClick={() => setSize(k)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 ${a ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <Truck className={`h-5 w-5 ${a ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-[11px] font-semibold text-ink">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground">P{t.deposit} min</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Register your truck</p>
          <Input label="Number plate" value={plate} onChange={setPlate} placeholder="B 123 ABC" />
          <Input label="Licence disk expiry" value={licenceExpiry} onChange={setLicenceExpiry} placeholder="YYYY-MM-DD" type="date" />
          <Input label="BA Permit number" value={baPermit} onChange={setBaPermit} placeholder="Required for SACU cross-border" />
          <Input label="Driver's licence code" value={driverCode} onChange={setDriverCode} placeholder={tier.licence} />

          <div className="flex gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
            For {tier.label.toLowerCase()} you need <strong className="mx-1 text-ink">{tier.licence}</strong> per Botswana road transport regulations.
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-ink">
            <FileText className="h-4 w-4" /> Upload licence disk & permit
          </button>
        </div>

        <Link to="/signup" search={{ role: "driver" }} className="block rounded-xl bg-ink py-3 text-center text-sm font-semibold text-white">
          Save & verify on WhatsApp
        </Link>
      </div>
    </AppShell>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}