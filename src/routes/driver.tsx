import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { TRUCK_TIERS, type TruckSize } from "@/lib/vanlink";
import { Truck, Wallet, BadgeCheck, FileText, AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createTruck, createWalletTransaction, fetchTrucksByPhone, fetchWalletTransactions, localUser, updateTruck, type TruckRecord, type WalletTransaction } from "@/lib/supabase";

export const Route = createFileRoute("/driver")({
  component: DriverHub,
});

function DriverHub() {
  const user = localUser();
  const [size, setSize] = useState<TruckSize>("medium");
  const [plate, setPlate] = useState("");
  const [licenceExpiry, setLicenceExpiry] = useState("");
  const [baPermit, setBaPermit] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [active, setActive] = useState(false);
  const [truck, setTruck] = useState<TruckRecord | null>(null);
  const [wallet, setWallet] = useState<WalletTransaction[]>([]);
  const [saving, setSaving] = useState(false);
  const tier = TRUCK_TIERS[size];

  useEffect(() => {
    void loadDriverData();
  }, []);

  async function loadDriverData() {
    if (!user?.phone) return;
    try {
      const [trucks, txs] = await Promise.all([fetchTrucksByPhone(user.phone), fetchWalletTransactions(user.phone)]);
      const latest = trucks[0] || null;
      setTruck(latest);
      setWallet(txs);
      if (latest) {
        setSize(latest.category);
        setPlate(latest.plate || "");
        setLicenceExpiry(latest.disc || "");
        setBaPermit(latest.permit || "");
        setDriverCode(latest.licence || "");
        setActive(Boolean(latest.online));
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not load driver profile");
    }
  }

  const balance = useMemo(() => wallet.reduce((sum, tx) => sum + Number(tx.amount || 0), 0), [wallet]);

  async function topUp() {
    if (!user?.phone) {
      toast.error("Sign up first", { description: "Create a driver profile before topping up." });
      return;
    }
    try {
      const tx = await createWalletTransaction({ phone: user.phone, type: "deposit", amount: tier.deposit, note: `${tier.label} activation deposit` });
      setWallet((rows) => [tx, ...rows]);
      toast.success(`Top-up recorded · P${tier.deposit}`);
    } catch (error) {
      console.error(error);
      toast.error("Could not record top-up", { description: "Check wallet_transactions table and RLS policies." });
    }
  }

  async function toggleActive() {
    const next = !active;
    if (!truck?.id) {
      setActive(next);
      toast("Save your truck first");
      return;
    }
    try {
      const updated = await updateTruck(truck.id, { online: next, status: next ? "Active" : "Offline" });
      setTruck(updated);
      setActive(Boolean(updated.online));
      toast(updated.online ? "You're now active" : "You're offline");
    } catch (error) {
      console.error(error);
      toast.error("Could not update availability");
    }
  }

  async function saveTruck() {
    if (!user?.phone) {
      toast.error("Sign up first", { description: "Create a driver account before saving a truck." });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: user.name || "LoadLink driver",
        phone: user.phone,
        owner_phone: user.phone,
        category: size,
        plate,
        area: "Botswana",
        licence: driverCode,
        disc: licenceExpiry,
        permit: baPermit,
        wallet: balance,
        online: active,
        status: active ? "Active" : "Pending review",
      };
      const saved = truck?.id ? await updateTruck(truck.id, payload) : await createTruck(payload);
      setTruck(saved);
      toast.success("Truck saved for verification");
    } catch (error) {
      console.error(error);
      toast.error("Could not save truck", { description: "Check trucks table and RLS policies." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Driver hub">
      <div className="space-y-4">
        <div className="rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-elegant)] vl-fade-in" style={{ background: "var(--gradient-primary)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary-foreground/80">Wallet balance</p>
              <p className="mt-1 text-3xl font-extrabold">P{balance.toFixed(2)}</p>
            </div>
            <Wallet className="h-8 w-8 text-white/80" />
          </div>
          <button onClick={topUp} className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-primary">
            Top up from P{tier.deposit} to go active
          </button>
          <div className="mt-3 flex items-center gap-2 text-xs text-primary-foreground/85">
            <BadgeCheck className="h-4 w-4" /> Van-Link keeps 10% per completed load.
          </div>
        </div>

        <Panel className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-card-foreground">Availability</p>
            <p className="text-xs text-muted-foreground">{active ? "You'll receive load broadcasts" : "Top up and go active"}</p>
          </div>
          <button onClick={toggleActive} className={`relative h-7 w-12 rounded-full transition ${active ? "bg-success" : "bg-muted"}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${active ? "left-5" : "left-0.5"}`} />
          </button>
        </Panel>

        <Panel>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vehicle category</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TRUCK_TIERS) as TruckSize[]).map((k) => {
              const t = TRUCK_TIERS[k];
              const a = k === size;
              return (
                <button key={k} onClick={() => setSize(k)} className={`flex flex-col items-center gap-1 rounded-xl border p-3 ${a ? "border-primary bg-primary/5" : "border-border bg-secondary"}`}>
                  <Truck className={`h-5 w-5 ${a ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-[11px] font-semibold text-card-foreground">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground">P{t.deposit} min</span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Register your truck</p>
          <Input label="Number plate" value={plate} onChange={setPlate} placeholder="B 123 ABC" />
          <Input label="Licence disk expiry" value={licenceExpiry} onChange={setLicenceExpiry} placeholder="YYYY-MM-DD" type="date" />
          <Input label="BA Permit number" value={baPermit} onChange={setBaPermit} placeholder="Required for SACU cross-border" />
          <Input label="Driver's licence code" value={driverCode} onChange={setDriverCode} placeholder={tier.licence} />

          <div className="flex gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
            For {tier.label.toLowerCase()} you need <strong className="mx-1 text-card-foreground">{tier.licence}</strong> per Botswana road transport regulations.
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-2.5 text-sm font-semibold text-card-foreground">
            <FileText className="h-4 w-4" /> Upload licence disk & permit
          </button>
        </Panel>

        <button onClick={saveTruck} disabled={saving || !plate || !driverCode} className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] disabled:opacity-60" style={{ background: "var(--gradient-primary)" }}>
          {saving ? "Saving..." : "Save & verify truck"}
        </button>

        {!user && (
          <Link to="/signup" search={{ role: "driver" }} className="block rounded-xl bg-card py-3 text-center text-sm font-semibold text-primary shadow-[var(--shadow-card)]">
            Create driver account first
          </Link>
        )}
      </div>
    </AppShell>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-card-foreground outline-none focus:border-primary" />
    </label>
  );
}
