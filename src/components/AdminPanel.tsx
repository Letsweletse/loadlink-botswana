import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { CheckCircle2, Loader2, LogOut, Package, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { LoadRecord, PaymentRequestRecord, TruckRecord, WalletTransaction } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BG = "#fdf8f2";
const DARK = "#1e1208";
const BROWN = "#3d2b0e";
const TAN = "#c9a05a";
const MID = "#b09060";
const LINE = "#e8d5b7";
const DIM = "#c8a878";
const FF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif";

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  const n = (s || "").toLowerCase();
  if (["verified", "completed", "approved", "active"].includes(n)) return "default";
  if (["cancelled", "rejected", "declined", "suspended"].includes(n)) return "destructive";
  if (["pending", "pending review", "broadcasting"].includes(n)) return "secondary";
  return "outline";
}

type ErrDetails = { message: string; code?: string };
function extractErr(e: unknown): ErrDetails {
  if (e && typeof e === "object") {
    const err = e as { message?: unknown; code?: unknown };
    return { message: typeof err.message === "string" ? err.message : String(e), code: typeof err.code === "string" ? err.code : undefined };
  }
  return { message: e instanceof Error ? e.message : String(e) };
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FF }}>
      <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>{children}</div>
    </div>
  );
}

const row: React.CSSProperties = { padding: "16px 0", borderBottom: `1px solid ${LINE}`, display: "flex", flexDirection: "column", gap: 10 };
const nm: React.CSSProperties = { color: DARK, fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" };
const sb: React.CSSProperties = { color: MID, fontSize: 12, marginTop: 2 };
const approveBtn: React.CSSProperties = { background: BROWN, border: "none", borderRadius: 10, padding: "9px 22px", color: BG, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FF };
const rejectBtn: React.CSSProperties = { background: "none", border: "none", padding: "9px 0", color: "#b03030", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: FF };
const outlineBtn: React.CSSProperties = { background: "none", border: `1px solid ${LINE}`, borderRadius: 8, padding: "6px 14px", color: MID, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF };

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

  if (!isSupabaseConfigured) return <Centered><p style={{ color: MID }}>Admin not configured.</p></Centered>;
  if (checkingSession) return <Centered><Loader2 style={{ color: TAN }} className="mx-auto h-7 w-7 animate-spin" /></Centered>;
  if (!session) return <LoginForm />;
  if (checkingAdmin) return <Centered><Loader2 style={{ color: TAN }} className="mx-auto h-7 w-7 animate-spin" /></Centered>;
  if (!isAdmin) return (
    <Centered>
      <ShieldAlert style={{ color: "#b03030", margin: "0 auto 12px" }} className="h-10 w-10" />
      <p style={{ color: DARK, marginBottom: 16, fontSize: 14 }}>{session.user.email} is not an admin.</p>
      <button style={outlineBtn} onClick={handleSignOut}>Sign out</button>
    </Centered>
  );

  return <AdminDashboard email={session.user.email ?? ""} onSignOut={handleSignOut} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inp: React.CSSProperties = { background: "transparent", border: "none", outline: "none", color: DARK, fontSize: 15, width: "100%", fontFamily: FF, padding: 0, marginTop: 10 };

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
    <div style={{ minHeight: "100vh", background: BG, padding: "52px 28px", display: "flex", flexDirection: "column", fontFamily: FF }}>
      <div style={{ marginBottom: 48 }}>
        <img src="/icon-512.png" alt="Van-Link" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16, display: "block", objectFit: "cover" }} />
        <p style={{ color: DARK, fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>Admin</p>
        <p style={{ color: MID, fontSize: 12, marginTop: 4, letterSpacing: "0.04em" }}>VAN-LINK OPERATIONS</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ padding: "20px 0", borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
          <p style={{ color: MID, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Email</p>
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@vanlink.co.bw" style={inp} />
        </div>
        <div style={{ padding: "20px 0", borderBottom: `1px solid ${LINE}` }}>
          <p style={{ color: MID, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Password</p>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
        </div>
        {error && <p style={{ color: "#b03030", fontSize: 13, marginTop: 16, fontWeight: 600 }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{ marginTop: 40, background: BROWN, border: "none", borderRadius: 14, padding: 17, color: BG, fontSize: 15, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1, fontFamily: FF }}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function AdminDashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FF }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ padding: "28px 28px 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/icon-512.png" alt="Van-Link" style={{ width: 36, height: 36, borderRadius: 9, objectFit: "cover" }} />
            <div>
              <p style={{ color: DARK, fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>Van-Link Admin</p>
              <p style={{ color: MID, fontSize: 11, marginTop: 1 }}>{email}</p>
            </div>
          </div>
          <button style={outlineBtn} onClick={onSignOut}><LogOut className="h-3 w-3 inline mr-1" />Sign out</button>
        </div>

        <div style={{ padding: "0 28px" }}>
          <Tabs defaultValue="drivers">
            <TabsList style={{ display: "flex", background: "none", border: "none", borderBottom: `1.5px solid ${LINE}`, borderRadius: 0, padding: 0, marginBottom: 24, gap: 28 }}>
              {[["drivers","Drivers"],["payments","Payments"],["loads","Loads"],["wallet","Wallet"]].map(([val, label]) => (
                <TabsTrigger key={val} value={val} style={{ background: "none", border: "none", borderBottom: "2px solid transparent", borderRadius: 0, padding: "8px 0 12px", color: DIM, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: FF }}>
                  {label}
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
    if (error) toast.error(error.message); else toast.success("Driver approved ✅");
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
          <p style={{ color: TAN, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
            ⏳ {pending.length} awaiting approval
          </p>
          {pending.map((row) => (
            <div key={row.id} style={row}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={nm}>{row.name}</p>
                  <p style={sb}>{row.phone} · {row.category} · {row.plate}{row.area ? ` · ${row.area}` : ""}</p>
                </div>
                <p style={{ color: TAN, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>PENDING</p>
              </div>
              {row.id && (
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <button style={{ ...approveBtn, opacity: actingId === row.id ? 0.5 : 1 }} disabled={actingId === row.id} onClick={() => approve(row.id as string)}>
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button style={{ ...rejectBtn, opacity: actingId === row.id ? 0.5 : 1 }} disabled={actingId === row.id} onClick={() => reject(row.id as string)}>
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {others.map((r) => (
        <div key={r.id ?? r.phone} style={{ ...row, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={nm}>{r.name}</p>
            <p style={sb}>{r.phone} · {r.category}</p>
          </div>
          <Badge variant={statusVariant(r.status ?? "")}>{r.status ?? "—"}</Badge>
        </div>
      ))}
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
    } catch (e) { setVerifyError(extractErr(e)); toast.error("Could not approve"); }
    finally { setActingId(null); }
  }

  async function reject(id: string) {
    if (!supabase) return;
    setActingId(id);
    try {
      const { error } = await supabase.from("payment_requests").update({ status: "rejected" }).eq("id", id);
      if (error) throw error;
      toast.success("Payment rejected"); await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Action failed"); }
    finally { setActingId(null); }
  }

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No payment requests yet" />;

  return (
    <div>
      {verifyError && <p style={{ color: "#b03030", fontSize: 13, marginBottom: 16 }}>{verifyError.message}</p>}
      {rows.map((r) => (
        <div key={r.id} style={{ ...row, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={nm}>P{Number(r.amount).toFixed(2)} <span style={{ color: MID, fontWeight: 400, fontSize: 13 }}>via {r.provider}</span></p>
            <p style={sb}>{r.phone} → {r.pay_to_number}</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {r.status === "pending" && r.id ? (
              <>
                <button style={{ ...approveBtn, opacity: actingId === r.id ? 0.5 : 1 }} disabled={actingId === r.id} onClick={() => approve(r.id as string)}>
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </button>
                <button style={{ ...rejectBtn, opacity: actingId === r.id ? 0.5 : 1 }} disabled={actingId === r.id} onClick={() => reject(r.id as string)}>
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </>
            ) : <Badge variant={statusVariant(r.status)}>{r.status}</Badge>}
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
    } catch (e) { toast.error(e instanceof Error ? e.message : "Action failed"); }
    finally { setActingId(null); }
  }

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No loads yet" />;

  return (
    <div>
      {rows.map((r) => (
        <div key={r.id} style={{ ...row, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={nm}>{r.customer} <span style={{ color: MID, fontWeight: 400 }}>· P{Number(r.offer).toFixed(2)}</span></p>
            <p style={sb}>{r.pickup} → {r.dropoff}</p>
            {r.driver && <p style={{ ...sb, color: TAN }}>{r.driver}</p>}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
            {!["Completed", "Cancelled"].includes(r.status) && (
              <button style={{ ...rejectBtn, opacity: actingId === r.id ? 0.5 : 1 }} disabled={actingId === r.id} onClick={() => cancel(r.id)}>
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
      {rows.map((r) => (
        <div key={r.id ?? `${r.phone}-${r.created_at}`} style={{ ...row, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={nm}>{r.phone}</p>
            <p style={sb}>{r.type}{r.note ? ` · ${r.note}` : ""}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: Number(r.amount) < 0 ? "#b03030" : "#2d6a2d", fontSize: 15, fontWeight: 700 }}>P{Number(r.amount).toFixed(2)}</p>
            <p style={{ color: DIM, fontSize: 11 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabLoading() {
  return (
    <div style={{ padding: "60px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: MID }}>
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: TAN }} /> Loading…
    </div>
  );
}

function TabEmpty({ label }: { label: string }) {
  return (
    <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: MID }}>
      <Package className="h-6 w-6" style={{ color: LINE }} />
      <p style={{ fontSize: 14 }}>{label}</p>
    </div>
  );
}
