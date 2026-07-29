import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { CheckCircle2, Loader2, LogOut, Package, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { LoadRecord, PaymentRequestRecord, TruckRecord, WalletTransaction } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BG = "#0f0900";
const CREAM = "#fdf6ee";
const TAN = "#c9a05a";
const DIM = "#4a3010";
const DIMMER = "#2a1800";
const LINE = "#1e1000";

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: BG, color: CREAM, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif" },
  header: { padding: "28px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  row: { padding: "16px 0", borderBottom: `1px solid ${LINE}`, display: "flex", flexDirection: "column" as const, gap: 10 },
  label: { color: DIM, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const },
  name: { color: CREAM, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" },
  sub: { color: DIM, fontSize: 12, marginTop: 2 },
  approveBtn: { background: TAN, border: "none", borderRadius: 10, padding: "9px 20px", color: BG, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  rejectBtn: { background: "none", border: "none", padding: "9px 0", color: "#8a2020", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  signOutBtn: { background: "none", border: `1px solid ${DIMMER}`, borderRadius: 8, padding: "6px 14px", color: DIM, fontSize: 12, fontWeight: 600, cursor: "pointer" },
};

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  const n = (s || "").toLowerCase();
  if (["verified", "completed", "approved", "active"].includes(n)) return "default";
  if (["cancelled", "rejected", "declined", "suspended"].includes(n)) return "destructive";
  if (["pending", "pending review", "broadcasting"].includes(n)) return "secondary";
  return "outline";
}

type ErrDetails = { message: string; code?: string; hint?: string };

function extractErr(error: unknown): ErrDetails {
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; code?: unknown; hint?: unknown };
    return { message: typeof e.message === "string" ? e.message : String(error), code: typeof e.code === "string" ? e.code : undefined };
  }
  return { message: error instanceof Error ? error.message : String(error) };
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>{children}</div>
    </div>
  );
}

export function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) { setCheckingSession(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setCheckingSession(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    let cancelled = false;
    setCheckingAdmin(true);
    (async () => {
      try {
        const { data, error } = await supabase!.rpc("is_admin");
        if (error) throw error;
        if (!cancelled) setIsAdmin(Boolean(data));
      } catch { if (!cancelled) { setIsAdmin(false); toast.error("Could not verify admin access"); } }
      finally { if (!cancelled) setCheckingAdmin(false); }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  async function handleSignOut() {
    await supabase?.auth.signOut().catch(() => null);
    setSession(null); setIsAdmin(false);
  }

  if (!isSupabaseConfigured) return <Centered><p style={{ color: DIM }}>Admin not configured.</p></Centered>;
  if (checkingSession) return <Centered><Loader2 style={{ color: TAN }} className="mx-auto h-8 w-8 animate-spin" /></Centered>;
  if (!session) return <LoginForm />;
  if (checkingAdmin) return <Centered><Loader2 style={{ color: TAN }} className="mx-auto h-8 w-8 animate-spin" /></Centered>;
  if (!isAdmin) return (
    <Centered>
      <ShieldAlert style={{ color: "#8a2020", margin: "0 auto 12px" }} className="h-10 w-10" />
      <p style={{ color: CREAM, marginBottom: 16 }}>{session.user.email} is not an admin.</p>
      <button style={S.signOutBtn} onClick={handleSignOut}>Sign out</button>
    </Centered>
  );

  return <AdminDashboard email={session.user.email ?? ""} onSignOut={handleSignOut} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inp: React.CSSProperties = {
    background: "transparent", border: "none", outline: "none",
    color: CREAM, fontSize: 16, width: "100%", fontFamily: "inherit", padding: 0,
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSubmitting(true); setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
    } catch (err) { setError(err instanceof Error ? err.message : "Sign in failed"); }
    finally { setSubmitting(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "52px 28px", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif" }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ width: 52, height: 52, background: TAN, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <ShieldCheck style={{ color: BG }} className="h-6 w-6" />
        </div>
        <p style={{ color: CREAM, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>Admin</p>
        <p style={{ color: DIM, fontSize: 12, marginTop: 4 }}>Van-Link Operations</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ padding: "20px 0", borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
          <p style={S.label}>Email</p>
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@vanlink.co.bw" style={{ ...inp, marginTop: 10 }} />
        </div>
        <div style={{ padding: "20px 0", borderBottom: `1px solid ${LINE}` }}>
          <p style={S.label}>Password</p>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inp, marginTop: 10 }} />
        </div>
        {error && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 16, fontWeight: 600 }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{
          marginTop: 40, background: TAN, border: "none", borderRadius: 14,
          padding: 17, color: BG, fontSize: 15, fontWeight: 800,
          cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1,
        }}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function AdminDashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div style={S.page}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={S.header}>
          <div>
            <p style={{ color: CREAM, fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>Admin</p>
            <p style={{ color: DIM, fontSize: 11, marginTop: 2 }}>{email}</p>
          </div>
          <button style={S.signOutBtn} onClick={onSignOut}><LogOut className="h-3 w-3 inline mr-1" />Sign out</button>
        </div>

        <div style={{ padding: "0 24px" }}>
          <Tabs defaultValue="drivers">
            <TabsList style={{ display: "flex", background: "none", border: "none", borderBottom: `1px solid ${LINE}`, borderRadius: 0, padding: 0, marginBottom: 24, gap: 24 }}>
              {["drivers", "payments", "loads", "wallet"].map(t => (
                <TabsTrigger key={t} value={t} style={{ background: "none", border: "none", borderBottom: "2px solid transparent", borderRadius: 0, padding: "8px 0 12px", color: DIM, fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="drivers"><DriversTab /></TabsContent>
            <TabsContent value="payments"><PaymentsTab /></TabsContent>
            <TabsContent value="loads"><LoadsTab /></TabsContent>
            <TabsContent value="wallet"><WalletTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function DriversTab() {
  const [rows, setRows] = useState<TruckRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("trucks").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Could not load drivers");
    setRows((data || []) as TruckRecord[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function approve(id: string) {
    if (!supabase) return;
    setActingId(id);
    const { error } = await supabase.from("trucks").update({ status: "verified" }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Driver approved");
    await load(); setActingId(null);
  }

  async function reject(id: string) {
    if (!supabase) return;
    setActingId(id);
    const { error } = await supabase.from("trucks").update({ status: "rejected" }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Driver rejected");
    await load(); setActingId(null);
  }

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No drivers yet" />;

  const pending = rows.filter(r => ["pending", "pending review"].includes((r.status ?? "").toLowerCase()));
  const others = rows.filter(r => !["pending", "pending review"].includes((r.status ?? "").toLowerCase()));

  return (
    <div>
      {pending.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ ...S.label, marginBottom: 16 }}>⏳ {pending.length} awaiting approval</p>
          {pending.map((row) => (
            <div key={row.id} style={S.row}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={S.name}>{row.name}</p>
                  <p style={S.sub}>{row.phone} · {row.category} · {row.plate}{row.area ? ` · ${row.area}` : ""}</p>
                </div>
                <p style={{ color: TAN, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>PENDING</p>
              </div>
              {row.id && (
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <button style={{ ...S.approveBtn, opacity: actingId === row.id ? 0.5 : 1 }} disabled={actingId === row.id} onClick={() => approve(row.id as string)}>
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button style={{ ...S.rejectBtn, opacity: actingId === row.id ? 0.5 : 1 }} disabled={actingId === row.id} onClick={() => reject(row.id as string)}>
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div>
          {others.length > 0 && pending.length > 0 && <p style={{ ...S.label, marginBottom: 16, marginTop: 24 }}>All drivers</p>}
          {others.map((row) => (
            <div key={row.id ?? row.phone} style={{ ...S.row, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={S.name}>{row.name}</p>
                <p style={S.sub}>{row.phone} · {row.category}</p>
              </div>
              <Badge variant={statusVariant(row.status ?? "")}>{row.status ?? "—"}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentsTab() {
  const [rows, setRows] = useState<PaymentRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<ErrDetails | null>(null);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("payment_requests").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Could not load payments");
    else setRows((data || []) as PaymentRequestRecord[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function approve(id: string) {
    if (!supabase) return;
    setActingId(id); setVerifyError(null);
    try {
      const { error } = await supabase.rpc("admin_verify_payment", { p_request_id: id });
      if (error) throw error;
      toast.success("Payment approved"); await load();
    } catch (error) { setVerifyError(extractErr(error)); toast.error("Could not approve"); }
    finally { setActingId(null); }
  }

  async function reject(id: string) {
    if (!supabase) return;
    setActingId(id);
    try {
      const { error } = await supabase.from("payment_requests").update({ status: "rejected" }).eq("id", id);
      if (error) throw error;
      toast.success("Payment rejected"); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Action failed"); }
    finally { setActingId(null); }
  }

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No payment requests yet" />;

  return (
    <div>
      {verifyError && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 16 }}>{verifyError.message}</p>}
      {rows.map((row) => (
        <div key={row.id} style={{ ...S.row, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={S.name}>P{Number(row.amount).toFixed(2)} <span style={{ color: DIM, fontWeight: 500, fontSize: 13 }}>via {row.provider}</span></p>
            <p style={S.sub}>{row.phone} → {row.pay_to_number}</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {row.status === "pending" && row.id ? (
              <>
                <button style={{ ...S.approveBtn, opacity: actingId === row.id ? 0.5 : 1 }} disabled={actingId === row.id} onClick={() => approve(row.id as string)}>
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </button>
                <button style={{ ...S.rejectBtn, opacity: actingId === row.id ? 0.5 : 1 }} disabled={actingId === row.id} onClick={() => reject(row.id as string)}>
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </>
            ) : <Badge variant={statusVariant(row.status)}>{row.status}</Badge>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadsTab() {
  const [rows, setRows] = useState<LoadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("loads").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Could not load loads");
    else setRows((data || []) as LoadRecord[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function cancel(id: string) {
    if (!supabase) return;
    setActingId(id);
    try {
      const { error } = await supabase.rpc("admin_cancel_load", { p_load_id: id });
      if (error) throw error;
      toast.success("Load cancelled"); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Action failed"); }
    finally { setActingId(null); }
  }

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No loads yet" />;

  return (
    <div>
      {rows.map((row) => (
        <div key={row.id} style={{ ...S.row, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={S.name}>{row.customer} <span style={{ color: DIM, fontWeight: 500 }}>· P{Number(row.offer).toFixed(2)}</span></p>
            <p style={S.sub}>{row.pickup} → {row.dropoff}</p>
            {row.driver && <p style={{ ...S.sub, color: TAN }}>{row.driver}</p>}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
            {!["Completed", "Cancelled"].includes(row.status) && (
              <button style={{ ...S.rejectBtn, opacity: actingId === row.id ? 0.5 : 1 }} disabled={actingId === row.id} onClick={() => cancel(row.id)}>
                <XCircle className="h-4 w-4" /> Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function WalletTab() {
  const [rows, setRows] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Could not load wallet");
        setRows((data || []) as WalletTransaction[]);
        setLoading(false);
      });
  }, []);

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No transactions yet" />;

  return (
    <div>
      {rows.map((row) => (
        <div key={row.id ?? `${row.phone}-${row.created_at}`} style={{ ...S.row, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={S.name}>{row.phone}</p>
            <p style={S.sub}>{row.type}{row.note ? ` · ${row.note}` : ""}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: Number(row.amount) < 0 ? "#c0392b" : "#3a7a3a", fontSize: 15, fontWeight: 700 }}>P{Number(row.amount).toFixed(2)}</p>
            <p style={{ color: DIMMER, fontSize: 11 }}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabLoading() {
  return (
    <div style={{ padding: "60px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: DIM }}>
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: TAN }} /> Loading…
    </div>
  );
}

function TabEmpty({ label }: { label: string }) {
  return (
    <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: DIM }}>
      <Package className="h-6 w-6" style={{ color: DIMMER }} />
      <p style={{ fontSize: 14 }}>{label}</p>
    </div>
  );
}
