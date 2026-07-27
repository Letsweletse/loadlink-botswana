import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  cancelLoadAsAdmin,
  completeLoad,
  fetchLoads,
  fetchPaymentRequests,
  fetchProfile,
  fetchTruckDocuments,
  fetchTrucks,
  localUser,
  reviewTruckRegistration,
  verifyPaymentRequest,
  TRUCK_DOCUMENT_LABELS,
  type LoadRecord,
  type PaymentRequestRecord,
  type TruckDocumentKind,
  type TruckRecord,
} from "@/lib/supabase";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Truck as TruckIcon,
  X,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

const ACTIVE_LOAD_STATUSES = new Set(["Accepted", "In transit"]);
const PENDING_TRUCK_STATUS = "Pending review";
const DOC_KINDS = Object.keys(TRUCK_DOCUMENT_LABELS) as TruckDocumentKind[];

function DocThumb({ url, label }: { url?: string; label: string }) {
  const [enlarged, setEnlarged] = useState(false);

  if (!url) {
    return (
      <div className="flex h-20 flex-col items-center justify-center rounded-lg bg-card p-2 text-center">
        <AlertCircle className="mb-1 h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[9px] text-muted-foreground">{label}</p>
        <p className="text-[9px] text-destructive">Not uploaded</p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setEnlarged(true)}
        className="group relative h-20 w-full overflow-hidden rounded-lg bg-card"
      >
        <img src={url} alt={label} className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Eye className="h-4 w-4 text-white" />
        </div>
      </button>
      {enlarged && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setEnlarged(false)}
        >
          <img src={url} alt={label} className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </>
  );
}

function AdminDashboard() {
  const user = localUser();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loads, setLoads] = useState<LoadRecord[]>([]);
  const [trucks, setTrucks] = useState<TruckRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedTruckId, setExpandedTruckId] = useState<string | null>(null);
  const [truckDocs, setTruckDocs] = useState<
    Record<string, Partial<Record<TruckDocumentKind, string>>>
  >({});
  const [docsLoadingId, setDocsLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkRole() {
      if (!user?.phone) {
        setCheckingRole(false);
        return;
      }
      try {
        const profile = await fetchProfile(user.phone);
        setIsAdmin(profile?.role === "admin");
      } catch (error) {
        console.error(error);
      } finally {
        setCheckingRole(false);
      }
    }
    void checkRole();
  }, [user?.phone]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [loadsData, trucksData, paymentsData] = await Promise.all([
        fetchLoads(),
        fetchTrucks(),
        fetchPaymentRequests().catch(() => []),
      ]);
      setLoads(loadsData);
      setTrucks(trucksData);
      setPayments(paymentsData);
    } catch (error) {
      console.error(error);
      toast.error("Could not load admin data", { description: "Please refresh and try again." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void loadAll();
  }, [isAdmin, loadAll]);

  async function markComplete(load: LoadRecord) {
    setBusyId(load.id);
    try {
      await completeLoad(load);
      toast.success(`${load.id} marked completed`);
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error("Could not complete load", { description: "Please try again." });
    } finally {
      setBusyId(null);
    }
  }

  async function cancelLoad(load: LoadRecord) {
    setBusyId(load.id);
    try {
      await cancelLoadAsAdmin(load.id);
      toast.success(`${load.id} cancelled`, {
        description: load.driver_phone ? "Driver's load fee was refunded." : undefined,
      });
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error("Could not cancel load", { description: "Please try again." });
    } finally {
      setBusyId(null);
    }
  }

  async function toggleTruckDocs(truck: TruckRecord) {
    if (!truck.id) return;
    const next = expandedTruckId === truck.id ? null : truck.id;
    setExpandedTruckId(next);
    if (next && !truckDocs[truck.id]) {
      setDocsLoadingId(truck.id);
      try {
        const docs = await fetchTruckDocuments(truck.phone);
        setTruckDocs((prev) => ({ ...prev, [truck.id as string]: docs }));
      } finally {
        setDocsLoadingId(null);
      }
    }
  }

  async function reviewTruck(truck: TruckRecord, approve: boolean) {
    if (!truck.id) return;
    setBusyId(truck.id);
    try {
      await reviewTruckRegistration(truck.id, approve);
      toast.success(approve ? "Registration approved" : "Registration rejected");
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error("Could not update registration", { description: "Please try again." });
    } finally {
      setBusyId(null);
    }
  }

  async function verifyPayment(request: PaymentRequestRecord) {
    if (!request.id) return;
    setBusyId(request.id);
    try {
      await verifyPaymentRequest(request.id);
      toast.success("Payment verified", { description: "Wallet credited." });
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error("Could not verify payment", { description: "Please try again." });
    } finally {
      setBusyId(null);
    }
  }

  if (checkingRole) {
    return (
      <AppShell title="Admin">
        <Panel className="text-center text-sm text-muted-foreground">Checking access...</Panel>
      </AppShell>
    );
  }

  if (!user || !isAdmin) {
    return (
      <AppShell title="Admin">
        <Panel className="flex flex-col items-center gap-3 py-8 text-center">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Admin access only</p>
          <p className="text-xs text-muted-foreground">
            This screen is restricted to VanLink admin accounts.
          </p>
          {!user && (
            <Link
              to="/signup"
              search={{ role: "client" }}
              className="mt-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Sign in
            </Link>
          )}
        </Panel>
      </AppShell>
    );
  }

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const pendingTrucks = trucks.filter((t) => t.status === PENDING_TRUCK_STATUS);
  const otherTrucks = trucks.filter((t) => t.status !== PENDING_TRUCK_STATUS);

  return (
    <AppShell title="Admin">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard
            label="Broadcasting"
            value={loads.filter((l) => l.status === "Broadcasting").length}
          />
          <StatCard
            label="Active"
            value={loads.filter((l) => ACTIVE_LOAD_STATUSES.has(l.status)).length}
          />
          <StatCard label="Pending pay" value={pendingPayments.length} />
          <StatCard label="Pending regs" value={pendingTrucks.length} />
        </div>

        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Loads ({loads.length})
            </p>
            <button
              type="button"
              onClick={() => void loadAll()}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          <div className="space-y-2">
            {loads.map((load) => (
              <div
                key={load.id}
                className="rounded-xl border border-border bg-secondary p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-card-foreground">{load.id}</span>
                  <span className="rounded-full bg-card px-2 py-0.5 font-semibold text-muted-foreground">
                    {load.status}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {load.customer} ({load.phone}) &rarr; {load.pickup} to {load.dropoff}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  P{load.offer} ·{" "}
                  {load.driver ? `${load.driver} (${load.driver_phone})` : "unassigned"}
                </p>
                {ACTIVE_LOAD_STATUSES.has(load.status) && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === load.id}
                      onClick={() => void markComplete(load)}
                      className="inline-flex items-center gap-1 rounded-lg bg-success px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      {busyId === load.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Mark complete
                    </button>
                    <button
                      type="button"
                      disabled={busyId === load.id}
                      onClick={() => void cancelLoad(load)}
                      className="inline-flex items-center gap-1 rounded-lg bg-destructive px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      <X className="h-3 w-3" /> Cancel & refund
                    </button>
                  </div>
                )}
              </div>
            ))}
            {loads.length === 0 && !loading && (
              <p className="py-4 text-center text-xs text-muted-foreground">No loads yet.</p>
            )}
          </div>
        </Panel>

        <Panel>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pending Orange Money payments ({pendingPayments.length})
          </p>
          <div className="space-y-2">
            {pendingPayments.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-border bg-secondary p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-card-foreground">{request.phone}</span>
                  <span className="font-bold text-primary">P{request.amount}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{request.notes}</p>
                <button
                  type="button"
                  disabled={busyId === request.id}
                  onClick={() => void verifyPayment(request)}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-60"
                >
                  {busyId === request.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <BadgeCheck className="h-3 w-3" />
                  )}
                  Verify & credit wallet
                </button>
              </div>
            ))}
            {pendingPayments.length === 0 && !loading && (
              <p className="py-4 text-center text-xs text-muted-foreground">No pending payments.</p>
            )}
          </div>
        </Panel>

        <Panel>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pending driver registrations ({pendingTrucks.length})
          </p>
          <div className="space-y-2">
            {pendingTrucks.map((truck) => {
              const docs = truck.id ? truckDocs[truck.id] : undefined;
              const expanded = truck.id === expandedTruckId;
              return (
                <div
                  key={truck.id}
                  className="rounded-xl border border-border bg-secondary p-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <TruckIcon className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-card-foreground">
                        {truck.name} · {truck.plate}
                      </p>
                      <p className="text-muted-foreground">
                        {truck.phone} · {truck.category}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-card px-2 py-1.5">
                      <p className="text-[9px] text-muted-foreground">BA Permit</p>
                      <p className="truncate font-medium text-card-foreground">
                        {truck.permit || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-card px-2 py-1.5">
                      <p className="text-[9px] text-muted-foreground">Licence code</p>
                      <p className="truncate font-medium text-card-foreground">
                        {truck.licence || "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void toggleTruckDocs(truck)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/5 py-1.5 text-[11px] font-semibold text-primary"
                  >
                    <FileText className="h-3 w-3" />
                    {expanded ? "Hide documents" : "View documents"}
                  </button>

                  {expanded && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {docsLoadingId === truck.id && !docs ? (
                        <p className="col-span-3 py-3 text-center text-[11px] text-muted-foreground">
                          Loading documents…
                        </p>
                      ) : (
                        DOC_KINDS.map((kind) => (
                          <DocThumb
                            key={kind}
                            url={docs?.[kind]}
                            label={TRUCK_DOCUMENT_LABELS[kind]}
                          />
                        ))
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === truck.id}
                      onClick={() => void reviewTruck(truck, true)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-success px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      {busyId === truck.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === truck.id}
                      onClick={() => void reviewTruck(truck, false)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-destructive px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
            {pendingTrucks.length === 0 && !loading && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No pending registrations.
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Drivers/trucks ({otherTrucks.length})
          </p>
          <div className="space-y-2">
            {otherTrucks.map((truck) => (
              <div
                key={truck.id}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <TruckIcon className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-bold text-card-foreground">
                      {truck.name} · {truck.plate}
                    </p>
                    <p className="text-muted-foreground">
                      {truck.phone} · {truck.category}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-card px-2 py-0.5 font-semibold text-muted-foreground">
                  {truck.status}
                </span>
              </div>
            ))}
            {otherTrucks.length === 0 && !loading && (
              <p className="py-4 text-center text-xs text-muted-foreground">No trucks yet.</p>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center shadow-[var(--shadow-card)]">
      <p className="text-2xl font-black text-primary">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
