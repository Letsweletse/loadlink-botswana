import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { TRUCK_TIERS, type TruckSize } from "@/lib/vanlink";
import { Truck, Wallet, BadgeCheck, FileText, AlertCircle, RefreshCw, MapPin, Navigation, CheckCircle2, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  acceptLoad,
  createTruck,
  createWalletTransaction,
  fetchOpenLoads,
  fetchTrucksByPhone,
  fetchWalletTransactions,
  localUser,
  updateTruck,
  type LoadRecord,
  type TruckRecord,
  type WalletTransaction,
} from "@/lib/supabase";

export const Route = createFileRoute("/driver")({ component: DriverHub });

function mapsDirectionsUrl(pickup: string, dropoff: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}`;
}

function DriverHub() {
  const user = localUser();
  const [size, setSize] = useState<TruckSize>("medium");
  const [plate, setPlate] = useState("");
  const [licenceExpiry, setLicenceExpiry] = useState("");
  const [baPermit, setBaPermit] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [active, setActive] = useState(true);
  const [truck, setTruck] = useState<TruckRecord | null>(null);
  const [wallet, setWallet] = useState<WalletTransaction[]>([]);
  const [openLoads, setOpenLoads] = useState<LoadRecord[]>([]);
  const [acceptedLoad, setAcceptedLoad] = useState<LoadRecord | null>(null);
  const [loadingLoads, setLoadingLoads] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [quickName, setQuickName] = useState(user?.name || "LoadLink driver");
  const [quickPhone, setQuickPhone] = useState(user?.phone || "+267 ");
  const tier = TRUCK_TIERS[size];

  useEffect(() => { void loadDriverData(); }, []);
  useEffect(() => { void loadBroadcasts(size); }, [size]);

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
        setActive(latest.online !== false);
        await loadBroadcasts(latest.category);
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not load driver profile", { description: "Please refresh and try again." });
    }
  }

  async function loadBroadcasts(category = size) {
    setLoadingLoads(true);
    try {
      const loads = await fetchOpenLoads(category);
      setOpenLoads(loads.filter((load) => load.status === "Broadcasting" && !load.driver_phone));
    } catch (error) {
      console.error(error);
      toast.error("Could not load broadcasts", { description: "Tap refresh again." });
    } finally {
      setLoadingLoads(false);
    }
  }

  const balance = useMemo(() => wallet.reduce((sum, tx) => sum + Number(tx.amount || 0), 0), [wallet]);

  async function topUp() {
    const phone = user?.phone || quickPhone;
    if (!phone.trim()) {
      toast.error("Add phone first", { description: "Enter your WhatsApp number before topping up." });
      return;
    }
    try {
      const tx = await createWalletTransaction({ phone, type: "deposit", amount: tier.deposit, note: `${tier.label} activation deposit` });
      setWallet((rows) => [tx, ...rows]);
      toast.success(`Top-up recorded · P${tier.deposit}`);
    } catch (error) {
      console.error(error);
      toast.error("Could not record top-up", { description: "Please try again in a moment." });
    }
  }

  async function toggleActive() {
    const next = !active;
    setActive(next);
    if (!truck?.id) {
      toast(next ? "You're active for soft launch" : "You're offline");
      return;
    }
    try {
      const updated = await updateTruck(truck.id, { online: next, status: next ? "Active" : "Offline" });
      setTruck(updated);
      toast(updated.online ? "You're now active" : "You're offline");
      if (updated.online) void loadBroadcasts(updated.category);
    } catch (error) {
      console.error(error);
      toast.error("Could not update availability", { description: "Please try again." });
    }
  }

  async function saveTruck() {
    const phone = user?.phone || quickPhone;
    if (!phone.trim()) {
      toast.error("Add phone first", { description: "Enter your WhatsApp number before saving a truck." });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: quickName || user?.name || "LoadLink driver",
        phone,
        owner_phone: phone,
        category: size,
        plate: plate || "SOFT-LAUNCH",
        area: "Botswana",
        licence: driverCode || "Pending",
        disc: licenceExpiry,
        permit: baPermit,
        wallet: balance,
        online: active,
        status: active ? "Active" : "Pending review",
      };
      const saved = truck?.id ? await updateTruck(truck.id, payload) : await createTruck(payload);
      setTruck(saved);
      toast.success("Truck saved");
      await loadBroadcasts(saved.category);
    } catch (error) {
      console.error(error);
      toast.error("Could not save truck", { description: "Please check your details and try again." });
    } finally {
      setSaving(false);
    }
  }

  async function acceptBroadcast(load: LoadRecord) {
    const driverName = quickName || user?.name || truck?.name || "LoadLink driver";
    const driverPhone = quickPhone || user?.phone || truck?.phone || "";
    if (!driverPhone.trim()) {
      toast.error("Driver phone needed", { description: "Enter your WhatsApp number first." });
      return;
    }

    setAcceptingId(load.id);
    try {
      const accepted = await acceptLoad(load, { name: driverName, phone: driverPhone });
      setAcceptedLoad(accepted);
      setOpenLoads((rows) => rows.filter((row) => row.id !== accepted.id));
      toast.success("Load accepted and pinned", { description: `${accepted.pickup} to ${accepted.dropoff}` });
    } catch (error) {
      console.error(error);
      toast.error("Could not accept load", { description: "Refresh broadcasts and try again." });
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <AppShell title="Driver hub">
      <div className="space-y-4">
        <Panel className="space-y-3">
          <div>
            <p className="text-sm font-bold text-card-foreground">Quick driver access</p>
            <p className="text-xs text-muted-foreground">Accept loads fast now. Full verification can happen later.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="Driver name" value={quickName} onChange={setQuickName} placeholder="Your name" />
            <Input label="WhatsApp phone" value={quickPhone} onChange={setQuickPhone} placeholder="+267 7xxxxxxx" />
          </div>
        </Panel>

        {acceptedLoad && (
          <Panel className="border border-success/30 bg-success/10">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success text-white shadow-[var(--shadow-card)]">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-card-foreground">Accepted load pinned</p>
                <p className="mt-1 text-xs text-muted-foreground">{acceptedLoad.pickup} → {acceptedLoad.dropoff}</p>
                <p className="mt-1 text-sm font-bold text-primary">P{acceptedLoad.offer} · {acceptedLoad.km} km</p>
                <a href={mapsDirectionsUrl(acceptedLoad.pickup, acceptedLoad.dropoff)} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Open pinned route</a>
              </div>
            </div>
          </Panel>
        )}

        <div className="rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-elegant)] vl-fade-in" style={{ background: "var(--gradient-primary)" }}>
          <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-primary-foreground/80">Wallet balance</p><p className="mt-1 text-3xl font-extrabold">P{balance.toFixed(2)}</p></div><Wallet className="h-8 w-8 text-white/80" /></div>
          <button onClick={topUp} className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-primary">Top up from P{tier.deposit} to go active</button>
          <div className="mt-3 flex items-center gap-2 text-xs text-primary-foreground/85"><BadgeCheck className="h-4 w-4" /> Van-Link keeps 10% per completed load.</div>
        </div>

        <Panel className="flex items-center justify-between">
          <div><p className="text-sm font-semibold text-card-foreground">Availability</p><p className="text-xs text-muted-foreground">{active ? "You can accept live broadcasts" : "Switch on to accept broadcasts"}</p></div>
          <button onClick={toggleActive} className={`relative h-7 w-12 rounded-full transition ${active ? "bg-success" : "bg-muted"}`}><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${active ? "left-5" : "left-0.5"}`} /></button>
        </Panel>

        <Panel className="space-y-3">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-card-foreground">Broadcast load board</p><p className="text-xs text-muted-foreground">Showing open {tier.label.toLowerCase()} requests.</p></div><button onClick={() => void loadBroadcasts(size)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-card-foreground"><RefreshCw className={`h-3.5 w-3.5 ${loadingLoads ? "animate-spin" : ""}`} /> Refresh</button></div>
          {!active && <div className="rounded-xl bg-warning/10 p-3 text-xs text-muted-foreground">Go active to accept requests. You can still preview broadcasts.</div>}
          {loadingLoads ? <div className="rounded-xl bg-secondary p-4 text-center text-sm text-muted-foreground">Loading broadcasts...</div> : openLoads.length === 0 ? <div className="rounded-xl bg-secondary p-4 text-center text-sm text-muted-foreground">No open broadcasts for this truck size yet.</div> : <div className="space-y-3">{openLoads.map((load) => <LoadCard key={load.id} load={load} active={active} accepting={acceptingId === load.id} onAccept={() => void acceptBroadcast(load)} />)}</div>}
        </Panel>

        <Panel>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vehicle category</p>
          <div className="grid grid-cols-3 gap-2">{(Object.keys(TRUCK_TIERS) as TruckSize[]).map((k) => { const t = TRUCK_TIERS[k]; const a = k === size; return <button key={k} onClick={() => setSize(k)} className={`flex flex-col items-center gap-1 rounded-xl border p-3 ${a ? "border-primary bg-primary/5" : "border-border bg-secondary"}`}><Truck className={`h-5 w-5 ${a ? "text-primary" : "text-muted-foreground"}`} /><span className="text-[11px] font-semibold text-card-foreground">{t.label}</span><span className="text-[10px] text-muted-foreground">P{t.deposit} min</span></button>; })}</div>
        </Panel>

        <Panel className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Register your truck</p>
          <Input label="Number plate" value={plate} onChange={setPlate} placeholder="B 123 ABC" />
          <Input label="Licence disk expiry" value={licenceExpiry} onChange={setLicenceExpiry} placeholder="YYYY-MM-DD" type="date" />
          <Input label="BA Permit number" value={baPermit} onChange={setBaPermit} placeholder="Required for SACU cross-border" />
          <Input label="Driver's licence code" value={driverCode} onChange={setDriverCode} placeholder={tier.licence} />
          <div className="flex gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground"><AlertCircle className="h-4 w-4 shrink-0 text-primary" />For {tier.label.toLowerCase()} you need <strong className="mx-1 text-card-foreground">{tier.licence}</strong> per Botswana road transport regulations.</div>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-2.5 text-sm font-semibold text-card-foreground"><FileText className="h-4 w-4" /> Upload licence disk & permit</button>
        </Panel>

        <button onClick={saveTruck} disabled={saving} className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] disabled:opacity-60" style={{ background: "var(--gradient-primary)" }}>{saving ? "Saving..." : "Save truck"}</button>
        {!user && <Link to="/signup" search={{ role: "driver" }} className="block rounded-xl bg-card py-3 text-center text-sm font-semibold text-primary shadow-[var(--shadow-card)]">Create full driver account later</Link>}
      </div>
    </AppShell>
  );
}

function LoadCard({ load, active, accepting, onAccept }: { load: LoadRecord; active: boolean; accepting: boolean; onAccept: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary p-3">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-card-foreground">P{load.offer} · {load.km} km</p><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{load.id}</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{load.status}</span></div>
      <div className="mt-3 space-y-2 text-xs text-muted-foreground"><div className="flex gap-2"><MapPin className="h-4 w-4 text-success" /><span>{load.pickup}</span></div><div className="flex gap-2"><Navigation className="h-4 w-4 text-primary" /><span>{load.dropoff}</span></div>{load.load && <div className="flex gap-2"><Truck className="h-4 w-4 text-muted-foreground" /><span>{load.load}</span></div>}{load.phone && <div className="flex gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{load.phone}</span></div>}</div>
      <div className="mt-3 grid grid-cols-2 gap-2"><a href={mapsDirectionsUrl(load.pickup, load.dropoff)} target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-card py-2 text-center text-xs font-semibold text-card-foreground">Open route</a><button onClick={onAccept} disabled={!active || accepting} className="flex items-center justify-center gap-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" /> {accepting ? "Accepting..." : "Accept load"}</button></div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-card-foreground outline-none focus:border-primary" /></label>;
}
