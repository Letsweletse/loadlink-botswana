import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { TRUCK_TIERS, type TruckSize } from "@/lib/vanlink";
import { ORANGE_MONEY_PAY_TO_NUMBER, orangeMoneyPaymentPrompt } from "@/lib/payments";
import {
  Truck,
  Wallet,
  BadgeCheck,
  FileText,
  AlertCircle,
  UploadCloud,
  MapPin,
  Navigation,
  PackageSearch,
  Check,
  Loader2,
  RefreshCw,
  Radio,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  acceptLoad,
  createPaymentRequest,
  createTruck,
  fetchActiveLoadForDriver,
  fetchOpenLoads,
  fetchTrucksByPhone,
  fetchWalletTransactions,
  InsufficientWalletBalanceError,
  isSupabaseConfigured,
  LoadAlreadyTakenError,
  localUser,
  supabase,
  updateTruck,
  TRUCK_DOCUMENT_LABELS as DOC_LABELS,
  type TruckDocumentKind as DriverDocumentKind,
  type LoadRecord,
  type TruckRecord,
  type WalletTransaction,
} from "@/lib/supabase";
import { safeJsonParse, safeStorageGet, safeStorageSet } from "@/lib/safe-storage";
import { useDriverLocationTracking } from "@/hooks/use-driver-location-tracking";

export const Route = createFileRoute("/driver")({
  component: DriverHub,
});

type DriverDocument = {
  kind: DriverDocumentKind;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  status: "uploaded" | "saved_on_device";
  storagePath?: string;
  error?: string;
};

function documentsKey(phone?: string | null) {
  return `vanlink_driver_documents_${String(phone || "guest").replace(/\W/g, "")}`;
}

function cleanFileName(value: string) {
  return String(value || "document")
    .replace(/[^a-z0-9._-]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function DriverHub() {
  const user = localUser();
  const [size, setSize] = useState<TruckSize>("medium");
  const [plate, setPlate] = useState("");
  const [licenceExpiry, setLicenceExpiry] = useState("");
  const [baPermit, setBaPermit] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [area, setArea] = useState("");
  const [capacityTonnes, setCapacityTonnes] = useState("");
  const [active, setActive] = useState(false);
  const [truck, setTruck] = useState<TruckRecord | null>(null);
  const [wallet, setWallet] = useState<WalletTransaction[]>([]);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [uploadingKind, setUploadingKind] = useState<DriverDocumentKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [openLoads, setOpenLoads] = useState<LoadRecord[]>([]);
  const [loadingOpenLoads, setLoadingOpenLoads] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [activeLoad, setActiveLoad] = useState<LoadRecord | null>(null);
  const tier = TRUCK_TIERS[size];

  const loadActiveLoad = useCallback(async () => {
    if (!user?.phone) {
      setActiveLoad(null);
      return;
    }
    const load = await fetchActiveLoadForDriver(user.phone);
    setActiveLoad(load);
  }, [user?.phone]);

  useEffect(() => {
    void loadActiveLoad();
  }, [loadActiveLoad]);

  // Re-check periodically so the "sharing location" state clears itself once
  // the load is completed/cancelled elsewhere (e.g. by the admin or customer).
  useEffect(() => {
    if (!activeLoad) return;
    const timer = setInterval(() => void loadActiveLoad(), 20000);
    return () => clearInterval(timer);
  }, [activeLoad, loadActiveLoad]);

  useDriverLocationTracking(
    activeLoad?.id,
    Boolean(activeLoad && ["Accepted", "In transit"].includes(activeLoad.status)),
  );

  const loadOpenLoads = useCallback(async () => {
    setLoadingOpenLoads(true);
    try {
      const loads = await fetchOpenLoads({
        category: truck?.category,
        capacity_tonnes: truck?.capacity_tonnes,
        area: truck?.area,
      });
      setOpenLoads(loads.filter((load) => load.status === "Broadcasting"));
    } catch (error) {
      console.error(error);
      toast.error("Could not load available loads", {
        description: "Please refresh and try again.",
      });
    } finally {
      setLoadingOpenLoads(false);
    }
  }, [truck?.category, truck?.capacity_tonnes, truck?.area]);

  useEffect(() => {
    void loadOpenLoads();
  }, [loadOpenLoads]);

  async function accept(load: LoadRecord) {
    if (!user?.phone) {
      toast.error("Sign up first", {
        description: "Create a driver account before accepting loads.",
      });
      return;
    }
    setAcceptingId(load.id);
    try {
      await acceptLoad(load, { name: user.name || "Driver", phone: user.phone });
      toast.success(`Accepted ${load.id}`, {
        description: "Contact the customer to confirm pick-up.",
      });
      setOpenLoads((prev) => prev.filter((item) => item.id !== load.id));
      void loadDriverData();
      void loadActiveLoad();
    } catch (error) {
      if (error instanceof LoadAlreadyTakenError) {
        toast.error("Someone already took this load", {
          description: "It's no longer available.",
        });
        setOpenLoads((prev) => prev.filter((item) => item.id !== load.id));
      } else if (error instanceof InsufficientWalletBalanceError) {
        toast.error("Wallet balance too low", {
          description: "Top up before accepting this load.",
        });
      } else {
        console.error(error);
        toast.error("Could not accept load", { description: "Please try again." });
      }
    } finally {
      setAcceptingId(null);
    }
  }

  const loadDriverData = useCallback(async () => {
    if (!user?.phone) return;
    try {
      const [trucks, txs] = await Promise.all([
        fetchTrucksByPhone(user.phone),
        fetchWalletTransactions(user.phone),
      ]);
      const latest = trucks[0] || null;
      setTruck(latest);
      setWallet(txs);
      if (latest) {
        setSize(latest.category);
        setPlate(latest.plate || "");
        setLicenceExpiry(latest.disc || "");
        setBaPermit(latest.permit || "");
        setDriverCode(latest.licence || "");
        setArea(latest.area || "");
        setCapacityTonnes(latest.capacity_tonnes != null ? String(latest.capacity_tonnes) : "");
        setActive(Boolean(latest.online));
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not load driver profile", {
        description: "Please refresh and try again.",
      });
    }
  }, [user?.phone]);

  useEffect(() => {
    void loadDriverData();
  }, [loadDriverData]);

  useEffect(() => {
    const saved = safeJsonParse<DriverDocument[]>(safeStorageGet(documentsKey(user?.phone)), []);
    setDocuments(saved);
  }, [user?.phone]);

  const balance = useMemo(
    () => wallet.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    [wallet],
  );

  async function uploadDriverDocument(kind: DriverDocumentKind, file?: File | null) {
    if (!file) return;

    if (!user?.phone) {
      toast.error("Sign up first", {
        description: "Create a driver profile before uploading documents.",
      });
      return;
    }

    setUploadingKind(kind);
    const uploadedAt = new Date().toISOString();
    const meta: DriverDocument = {
      kind,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      uploadedAt,
      status: "saved_on_device",
    };

    try {
      if (isSupabaseConfigured && supabase) {
        const folder = user.phone.replace(/\D/g, "") || "driver";
        const path = `${folder}/${kind}-${Date.now()}-${cleanFileName(file.name)}`;
        const { error } = await supabase.storage.from("driver-documents").upload(path, file, {
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });

        if (error) throw error;
        meta.status = "uploaded";
        meta.storagePath = path;
      }
    } catch (error) {
      meta.error = error instanceof Error ? error.message : "Could not upload to storage";
      console.warn("Document stored locally until storage is ready", error);
    } finally {
      const next = [meta, ...documents.filter((doc) => doc.kind !== kind)];
      setDocuments(next);
      safeStorageSet(documentsKey(user.phone), JSON.stringify(next));
      setUploadingKind(null);

      if (meta.status === "uploaded") {
        toast.success(`${DOC_LABELS[kind]} uploaded`);
      } else {
        toast(`${DOC_LABELS[kind]} selected`, {
          description: meta.error
            ? "Saved on this phone. Supabase storage bucket/permission must be checked."
            : "Saved on this phone for onboarding review.",
        });
      }
    }
  }

  async function topUp() {
    if (!user?.phone) {
      toast.error("Sign up first", { description: "Create a driver profile before topping up." });
      return;
    }

    const confirmed =
      typeof window !== "undefined" &&
      window.confirm(orangeMoneyPaymentPrompt(tier.deposit, `${user.phone} · ${tier.label}`));

    if (!confirmed) {
      toast("Orange Money payment not recorded", {
        description: `When ready, pay P${tier.deposit} to ${ORANGE_MONEY_PAY_TO_NUMBER}.`,
      });
      return;
    }

    try {
      await createPaymentRequest({
        phone: user.phone,
        amount: tier.deposit,
        provider: "orange_money",
        pay_to_number: ORANGE_MONEY_PAY_TO_NUMBER,
        status: "pending",
        notes: `${tier.label} activation deposit · pending manual verification`,
      });
      toast.success("Orange Money payment request saved", {
        description: `Pay P${tier.deposit} to ${ORANGE_MONEY_PAY_TO_NUMBER}. Admin must verify before wallet credit.`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Could not save payment request", {
        description: "Please try again in a moment.",
      });
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
      const updated = await updateTruck(truck.id, {
        online: next,
        status: next ? "Active" : "Offline",
      });
      setTruck(updated);
      setActive(Boolean(updated.online));
      toast(updated.online ? "You're now active" : "You're offline");
    } catch (error) {
      console.error(error);
      toast.error("Could not update availability", { description: "Please try again." });
    }
  }

  async function saveTruck() {
    if (!user?.phone) {
      toast.error("Sign up first", {
        description: "Create a driver account before saving a truck.",
      });
      return;
    }
    if (!area.trim()) {
      toast.error("Operating area required", {
        description: "Enter the area you operate in before saving.",
      });
      return;
    }
    const capacity = Number(capacityTonnes);
    if (!capacityTonnes || Number.isNaN(capacity) || capacity <= 0) {
      toast.error("Truck capacity required", {
        description: "Enter how many tonnes your truck can carry.",
      });
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
        area: area.trim(),
        capacity_tonnes: capacity,
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
      toast.error("Could not save truck", {
        description: "Please check your details and try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Driver hub">
      <div className="space-y-4">
        <div
          className="rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-elegant)] vl-fade-in"
          style={{ background: "var(--gradient-primary)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary-foreground/80">
                Wallet balance
              </p>
              <p className="mt-1 text-3xl font-extrabold">P{balance.toFixed(2)}</p>
            </div>
            <Wallet className="h-8 w-8 text-white/80" />
          </div>
          <button
            onClick={topUp}
            className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-primary"
          >
            Top up from P{tier.deposit} to go active
          </button>
          <div className="mt-3 flex items-center gap-2 text-xs text-primary-foreground/85">
            <BadgeCheck className="h-4 w-4" /> Van-Link keeps 10% per completed load.
          </div>
        </div>

        {activeLoad && (
          <Panel className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-card-foreground">
                Sharing live location for {activeLoad.id}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeLoad.pickup} → {activeLoad.dropoff}
              </p>
            </div>
          </Panel>
        )}

        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Available loads{truck ? ` · ${TRUCK_TIERS[truck.category].label}` : ""}
            </p>
            <button
              type="button"
              onClick={() => void loadOpenLoads()}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary"
            >
              <RefreshCw className={`h-3 w-3 ${loadingOpenLoads ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          {loadingOpenLoads ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Loading available loads...
            </p>
          ) : openLoads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <PackageSearch className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-semibold text-card-foreground">
                No loads broadcasting right now
              </p>
              <p className="text-xs text-muted-foreground">Check back soon or tap refresh.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openLoads.map((load) => (
                <div key={load.id} className="rounded-xl border border-border bg-secondary p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {TRUCK_TIERS[load.category]?.label || load.category} · {load.id}
                    </span>
                    <span className="text-sm font-bold text-primary">P{load.offer}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-card-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-success" />
                      <span className="truncate">{load.pickup}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{load.dropoff}</span>
                    </div>
                  </div>
                  {load.load && (
                    <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{load.load}</p>
                  )}
                  {load.cargo_description && (
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {load.cargo_description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {load.km} km
                      {load.weight_tonnes != null ? ` · ${load.weight_tonnes}t` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => void accept(load)}
                      disabled={acceptingId !== null}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
                    >
                      {acceptingId === load.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-card-foreground">Availability</p>
            <p className="text-xs text-muted-foreground">
              {active ? "You'll receive load broadcasts" : "Top up and go active"}
            </p>
          </div>
          <button
            onClick={toggleActive}
            className={`relative h-7 w-12 rounded-full transition ${active ? "bg-success" : "bg-muted"}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${active ? "left-5" : "left-0.5"}`}
            />
          </button>
        </Panel>

        <Panel>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vehicle category
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TRUCK_TIERS) as TruckSize[]).map((k) => {
              const t = TRUCK_TIERS[k];
              const a = k === size;
              return (
                <button
                  key={k}
                  onClick={() => setSize(k)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 ${a ? "border-primary bg-primary/5" : "border-border bg-secondary"}`}
                >
                  <Truck className={`h-5 w-5 ${a ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-[11px] font-semibold text-card-foreground">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground">P{t.deposit} min</span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Register your truck
          </p>
          <Input label="Number plate" value={plate} onChange={setPlate} placeholder="B 123 ABC" />
          <Input
            label="Licence disc expiry"
            value={licenceExpiry}
            onChange={setLicenceExpiry}
            placeholder="YYYY-MM-DD"
            type="date"
          />
          <Input
            label="BA Permit number"
            value={baPermit}
            onChange={setBaPermit}
            placeholder="Required for SACU cross-border"
          />
          <Input
            label="Driver's licence code"
            value={driverCode}
            onChange={setDriverCode}
            placeholder={tier.licence}
          />
          <Input
            label="Operating area"
            value={area}
            onChange={setArea}
            placeholder="e.g. Gaborone"
          />
          <Input
            label="Truck capacity (tonnes)"
            value={capacityTonnes}
            onChange={setCapacityTonnes}
            placeholder="e.g. 5"
            type="number"
          />

          <div className="flex gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
            For {tier.label.toLowerCase()} you need{" "}
            <strong className="mx-1 text-card-foreground">{tier.licence}</strong> per Botswana road
            transport regulations.
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-secondary p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Upload verification documents
            </p>
            {(Object.keys(DOC_LABELS) as DriverDocumentKind[]).map((kind) => {
              const doc = documents.find((item) => item.kind === kind);
              return (
                <label
                  key={kind}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-card px-3 py-2.5 text-sm text-card-foreground"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-semibold">
                      <FileText className="h-4 w-4 text-primary" /> {DOC_LABELS[kind]}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {doc
                        ? `${doc.fileName} · ${doc.status === "uploaded" ? "uploaded" : "selected"}`
                        : "PDF or image"}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground">
                    <UploadCloud className="h-3.5 w-3.5" />
                    {uploadingKind === kind ? "Uploading" : "Choose"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={uploadingKind !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void uploadDriverDocument(kind, file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              );
            })}
          </div>
        </Panel>

        <button
          onClick={saveTruck}
          disabled={saving || !plate || !driverCode || !area || !capacityTonnes}
          className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] disabled:opacity-60"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? "Saving..." : "Save & verify truck"}
        </button>

        {!user && (
          <Link
            to="/signup"
            search={{ role: "driver" }}
            className="block rounded-xl bg-card py-3 text-center text-sm font-semibold text-primary shadow-[var(--shadow-card)]"
          >
            Create driver account first
          </Link>
        )}
      </div>
    </AppShell>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-card-foreground outline-none focus:border-primary"
      />
    </label>
  );
}
