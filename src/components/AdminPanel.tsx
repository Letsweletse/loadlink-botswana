import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { CheckCircle2, Loader2, LogOut, Package, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { LoadRecord, PaymentRequestRecord, TruckRecord, WalletTransaction } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GOLD = "#8B6914";
const GOLD_BORDER = "#D4A843";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const n = (status || "").toLowerCase();
  if (["verified", "completed", "approved", "active"].includes(n)) return "default";
  if (["cancelled", "rejected", "declined", "suspended"].includes(n)) return "destructive";
  if (["pending", "pending review", "broadcasting"].includes(n)) return "secondary";
  return "outline";
}

type SupabaseErrorDetails = { message: string; code?: string; hint?: string; details?: string };

function extractSupabaseError(error: unknown): SupabaseErrorDetails {
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; code?: unknown; hint?: unknown; details?: unknown };
    return {
      message: typeof e.message === "string" && e.message ? e.message : String(error),
      code: typeof e.code === "string" ? e.code : undefined,
      hint: typeof e.hint === "string" ? e.hint : undefined,
      details: typeof e.details === "string" ? e.details : undefined,
    };
  }
  return { message: error instanceof Error ? error.message : String(error) };
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#1a1208", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "360px", textAlign: "center" }}>{children}</div>
    </div>
  );
}

function GoldBtn({ onClick, disabled, children, variant = "primary" }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: "primary" | "danger" | "outline";
}) {
  const styles: React.CSSProperties = variant === "primary"
    ? { background: GOLD, color: "#fff", border: "none" }
    : variant === "danger"
    ? { background: "#dc2626", color: "#fff", border: "none" }
    : { background: "transparent", color: GOLD, border: `1px solid ${GOLD_BORDER}` };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles, padding: "10px 16px", borderRadius: "12px", fontWeight: 700, fontSize: "13px",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      display: "flex", alignItems: "center", gap: "6px", transition: "opacity 0.15s",
    }}>
      {children}
    </button>
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
      } catch {
        if (!cancelled) { setIsAdmin(false); toast.error("Could not verify admin access"); }
      } finally {
        if (!cancelled) setCheckingAdmin(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  async function handleSignOut() {
    await supabase?.auth.signOut().catch(() => null);
    setSession(null); setIsAdmin(false);
  }

  if (!isSupabaseConfigured) return <Centered><p style={{ color: "#ccc" }}>Admin not configured.</p></Centered>;
  if (checkingSession) return <Centered><Loader2 style={{ color: GOLD }} className="mx-auto h-8 w-8 animate-spin" /></Centered>;
  if (!session) return <LoginForm />;
  if (checkingAdmin) return (
    <Centered>
      <Loader2 style={{ color: GOLD }} className="mx-auto h-8 w-8 animate-spin" />
      <p style={{ color: "#aaa", marginTop: 12, fontSize: 13 }}>Checking access…</p>
    </Centered>
  );
  if (!isAdmin) return (
    <Centered>
      <ShieldAlert style={{ color: "#dc2626", margin: "0 auto 12px" }} className="h-10 w-10" />
      <p style={{ color: "#fff", marginBottom: 16, fontSize: 14 }}>{session.user.email} is not an admin.</p>
      <GoldBtn variant="outline" onClick={handleSignOut}><LogOut className="h-4 w-4" /> Sign out</GoldBtn>
    </Centered>
  );

  return <AdminDashboard email={session.user.email ?? ""} onSignOut={handleSignOut} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: "12px",
    border: `1.5px solid ${GOLD_BORDER}`, background: "#2a1f0a",
    color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box",
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSubmitting(true); setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally { setSubmitting(false); }
  }

  return (
    <Centered>
      <form onSubmit={handleSubmit} style={{ background: "#241a08", border: `1.5px solid ${GOLD_BORDER}`, borderRadius: "20px", padding: "28px 24px", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <ShieldCheck style={{ color: GOLD }} className="h-6 w-6" />
          <span style={{ color: GOLD, fontWeight: 900, fontSize: 14, letterSpacing: "0.15em", textTransform: "uppercase" }}>Van-Link Admin</span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", color: "#cca84a", fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Email</label>
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@vanlink.co.bw" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: "#cca84a", fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Password</label>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
        </div>
        {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{
          width: "100%", background: GOLD, color: "#fff", border: "none", borderRadius: "12px",
          padding: "14px", fontWeight: 800, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Centered>
  );
}

function AdminDashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#1a1208", color: "#fff" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: "16px 20px", background: "#241a08", borderRadius: 16, border: `1px solid ${GOLD_BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ShieldCheck style={{ color: GOLD }} className="h-6 w-6" />
            <div>
              <p style={{ color: GOLD, fontWeight: 900, fontSize: 14, margin: 0 }}>Van-Link Admin</p>
              <p style={{ color: "#888", fontSize: 12, margin: 0 }}>{email}</p>
            </div>
          </div>
          <GoldBtn variant="outline" onClick={onSignOut}><LogOut className="h-4 w-4" /> Sign out</GoldBtn>
        </div>
        <Tabs defaultValue="drivers">
          <TabsList className="grid w-full grid-cols-4 mb-4" style={{ background: "#241a08", border: `1px solid ${GOLD_BORDER}` }}>
            <TabsTrigger value="drivers" style={{ color: "#cca84a" }}>Drivers</TabsTrigger>
            <TabsTrigger value="payments" style={{ color: "#cca84a" }}>Payments</TabsTrigger>
            <TabsTrigger value="loads" style={{ color: "#cca84a" }}>Loads</TabsTrigger>
            <TabsTrigger value="wallet" style={{ color: "#cca84a" }}>Wallet</TabsTrigger>
          </TabsList>
          <TabsContent value="drivers"><DriversTab /></TabsContent>
          <TabsContent value="payments"><PaymentsTab /></TabsContent>
          <TabsContent value="loads"><LoadsTab /></TabsContent>
          <TabsContent value="wallet"><WalletTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: "#241a08", border: `1px solid ${GOLD_BORDER}`, borderRadius: 16, overflow: "hidden" };
const thStyle: React.CSSProperties = { color: "#cca84a", fontWeight: 700, fontSize: 12, padding: "12px 16px", textTransform: "uppercase" as const, letterSpacing: "0.06em", borderBottom: "1px solid #3a2a10", textAlign: "left" as const };
const tdStyle: React.CSSProperties = { color: "#e5d5a0", fontSize: 13, padding: "12px 16px", borderBottom: "1px solid #2a1f0a" };

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {pending.length > 0 && (
        <div style={{ background: "#2a1f06", border: `2px solid ${GOLD_BORDER}`, borderRadius: 16, padding: 16 }}>
          <p style={{ color: GOLD, fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
            ⏳ {pending.length} awaiting approval
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pending.map((row) => (
              <div key={row.id} style={{ background: "#1a1208", border: "1px solid #3a2a10", borderRadius: 12, padding: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, margin: 0 }}>{row.name}</p>
                  <p style={{ color: "#888", fontSize: 12, margin: "4px 0 0" }}>{row.phone}</p>
                  <p style={{ color: "#888", fontSize: 12, margin: "2px 0 0" }}>{row.category} · {row.plate}</p>
                  {row.area && <p style={{ color: "#888", fontSize: 12, margin: "2px 0 0" }}>Area: {row.area}</p>}
                </div>
                {row.id && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <GoldBtn variant="primary" disabled={actingId === row.id} onClick={() => approve(row.id as string)}>
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </GoldBtn>
                    <GoldBtn variant="danger" disabled={actingId === row.id} onClick={() => reject(row.id as string)}>
                      <XCircle className="h-4 w-4" /> Reject
                    </GoldBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {others.length > 0 && (
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Name","Phone","Category","Plate","Wallet","Status"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {others.map((row) => (
                <tr key={row.id ?? row.phone}>
                  <td style={tdStyle}>{row.name}</td>
                  <td style={tdStyle}>{row.phone}</td>
                  <td style={tdStyle}>{row.category}</td>
                  <td style={tdStyle}>{row.plate}</td>
                  <td style={tdStyle}>P{Number(row.wallet ?? 0).toFixed(2)}</td>
                  <td style={tdStyle}><Badge variant={statusVariant(row.status ?? "")}>{row.status ?? "—"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaymentsTab() {
  const [rows, setRows] = useState<PaymentRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<SupabaseErrorDetails | null>(null);

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
    } catch (error) {
      setVerifyError(extractSupabaseError(error));
      toast.error("Could not approve payment");
    } finally { setActingId(null); }
  }

  async function reject(id: string) {
    if (!supabase) return;
    setActingId(id);
    try {
      const { error } = await supabase.from("payment_requests").update({ status: "rejected" }).eq("id", id);
      if (error) throw error;
      toast.success("Payment rejected"); await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally { setActingId(null); }
  }

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No payment requests yet" />;

  return (
    <div style={cardStyle}>
      {verifyError && (
        <div style={{ background: "#3a0a0a", border: "1px solid #dc2626", borderRadius: 12, padding: 12, margin: 12, fontSize: 12, color: "#f87171" }}>
          <p style={{ fontWeight: 700, margin: "0 0 4px" }}>Error: {verifyError.message}</p>
          {verifyError.code && <p style={{ margin: 0 }}>Code: {verifyError.code}</p>}
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Phone","Amount","Provider","Pay to","Status","Action"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={tdStyle}>{row.phone}</td>
              <td style={tdStyle}>P{Number(row.amount).toFixed(2)}</td>
              <td style={tdStyle}>{row.provider}</td>
              <td style={tdStyle}>{row.pay_to_number}</td>
              <td style={tdStyle}><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
              <td style={{ ...tdStyle, textAlign: "right" }}>
                {row.status === "pending" && row.id && (
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <GoldBtn variant="primary" disabled={actingId === row.id} onClick={() => approve(row.id as string)}>
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </GoldBtn>
                    <GoldBtn variant="danger" disabled={actingId === row.id} onClick={() => reject(row.id as string)}>
                      <XCircle className="h-3 w-3" /> Reject
                    </GoldBtn>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally { setActingId(null); }
  }

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No loads yet" />;

  return (
    <div style={cardStyle}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["ID","Customer","Route","Offer","Status","Driver","Action"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{row.id}</td>
              <td style={tdStyle}>{row.customer}</td>
              <td style={{ ...tdStyle, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.pickup} → {row.dropoff}</td>
              <td style={tdStyle}>P{Number(row.offer).toFixed(2)}</td>
              <td style={tdStyle}><Badge variant={statusVariant(row.status)}>{row.status}</Badge></td>
              <td style={tdStyle}>{row.driver ?? "—"}</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>
                {!["Completed", "Cancelled"].includes(row.status) && (
                  <GoldBtn variant="danger" disabled={actingId === row.id} onClick={() => cancel(row.id)}>
                    <XCircle className="h-3 w-3" /> Cancel
                  </GoldBtn>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  if (!rows.length) return <TabEmpty label="No wallet transactions yet" />;

  return (
    <div style={cardStyle}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Phone","Type","Amount","Load","Note","Date"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? `${row.phone}-${row.created_at}`}>
              <td style={tdStyle}>{row.phone}</td>
              <td style={tdStyle}>{row.type}</td>
              <td style={{ ...tdStyle, color: Number(row.amount) < 0 ? "#f87171" : "#86efac" }}>P{Number(row.amount).toFixed(2)}</td>
              <td style={tdStyle}>{row.load_id ?? "—"}</td>
              <td style={{ ...tdStyle, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.note ?? "—"}</td>
              <td style={tdStyle}>{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabLoading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 20px", background: "#241a08", borderRadius: 16, border: `1px solid ${GOLD_BORDER}`, color: "#cca84a" }}>
      <Loader2 className="h-5 w-5 animate-spin" /> Loading…
    </div>
  );
}

function TabEmpty({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "40px 20px", background: "#241a08", borderRadius: 16, border: `1px solid ${GOLD_BORDER}`, color: "#888" }}>
      <Package className="h-6 w-6" style={{ color: GOLD }} />
      <p style={{ margin: 0, fontSize: 14 }}>{label}</p>
    </div>
  );
}
