import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  LogOut,
  Package,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  LoadRecord,
  PaymentRequestRecord,
  TruckRecord,
  WalletTransaction,
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm text-center">{children}</div>
    </div>
  );
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const normalized = status.toLowerCase();
  if (["verified", "completed", "approved"].includes(normalized)) return "default";
  if (["cancelled", "rejected", "declined"].includes(normalized)) return "destructive";
  if (["pending", "broadcasting"].includes(normalized)) return "secondary";
  return "outline";
}

type SupabaseErrorDetails = {
  message: string;
  code?: string;
  hint?: string;
  details?: string;
};

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

function SupabaseErrorPanel({ error }: { error: SupabaseErrorDetails }) {
  return (
    <div className="mb-3 space-y-1 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
      <p className="font-bold">admin_verify_payment failed</p>
      <p>
        <span className="font-semibold">message:</span> {error.message}
      </p>
      {error.code && (
        <p>
          <span className="font-semibold">code:</span> {error.code}
        </p>
      )}
      {error.hint && (
        <p>
          <span className="font-semibold">hint:</span> {error.hint}
        </p>
      )}
      {error.details && (
        <p>
          <span className="font-semibold">details:</span> {error.details}
        </p>
      )}
    </div>
  );
}

export function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    setCheckingAdmin(true);
    (async () => {
      try {
        const { data, error } = await supabase!.rpc("is_admin");
        if (error) throw error;
        if (!cancelled) setIsAdmin(Boolean(data));
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setIsAdmin(false);
        toast.error("Could not verify admin access");
      } finally {
        if (!cancelled) setCheckingAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  async function handleSignOut() {
    await supabase?.auth.signOut().catch(() => null);
    setSession(null);
    setIsAdmin(false);
  }

  if (!isSupabaseConfigured) {
    return (
      <Centered>
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Admin service is not configured.</p>
      </Centered>
    );
  }

  if (checkingSession) {
    return (
      <Centered>
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      </Centered>
    );
  }

  if (!session) {
    return <LoginForm />;
  }

  if (checkingAdmin) {
    return (
      <Centered>
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Checking access…</p>
      </Centered>
    );
  }

  if (!isAdmin) {
    return (
      <Centered>
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <p className="text-sm text-card-foreground">
          {session.user.email} is signed in but is not an admin.
        </p>
        <Button variant="outline" className="mt-4" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </Centered>
    );
  }

  return <AdminDashboard email={session.user.email ?? ""} onSignOut={handleSignOut} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Centered>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border bg-card p-6 text-left shadow-[var(--shadow-card)]"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-black uppercase tracking-[0.16em] text-card-foreground">
            Admin sign in
          </h1>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>
    </Centered>
  );
}

function AdminDashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-black text-card-foreground">Admin panel</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </header>

        <Tabs defaultValue="payments">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="loads">Loads</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          </TabsList>
          <TabsContent value="payments">
            <PaymentsTab />
          </TabsContent>
          <TabsContent value="drivers">
            <DriversTab />
          </TabsContent>
          <TabsContent value="loads">
            <LoadsTab />
          </TabsContent>
          <TabsContent value="wallet">
            <WalletTab />
          </TabsContent>
        </Tabs>
      </div>
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
    const { data, error } = await supabase
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Could not load payment requests");
    } else {
      setRows((data || []) as PaymentRequestRecord[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(id: string) {
    if (!supabase) return;
    setActingId(id);
    setVerifyError(null);
    try {
      const { error } = await supabase.rpc("admin_verify_payment", { p_request_id: id });
      if (error) throw error;
      toast.success("Payment approved");
      await load();
    } catch (error) {
      setVerifyError(extractSupabaseError(error));
      toast.error("Could not approve payment");
    } finally {
      setActingId(null);
    }
  }

  async function reject(id: string) {
    if (!supabase) return;
    setActingId(id);
    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
      toast.success("Payment rejected");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setActingId(null);
    }
  }

  if (loading) return <TabLoading />;

  if (!rows.length) {
    return (
      <>
        {verifyError && <SupabaseErrorPanel error={verifyError} />}
        <TabEmpty label="No payment requests yet" />
      </>
    );
  }

  return (
    <>
      {verifyError && <SupabaseErrorPanel error={verifyError} />}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Pay to</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.phone}</TableCell>
                <TableCell>P{Number(row.amount).toFixed(2)}</TableCell>
                <TableCell>{row.provider}</TableCell>
                <TableCell>{row.pay_to_number}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {row.status === "pending" && row.id ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={actingId === row.id}
                        onClick={() => approve(row.id as string)}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actingId === row.id}
                        onClick={() => reject(row.id as string)}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function DriversTab() {
  const [rows, setRows] = useState<TruckRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("trucks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Could not load drivers");
        setRows((data || []) as TruckRecord[]);
        setLoading(false);
      });
  }, []);

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No drivers yet" />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Plate</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id ?? row.phone}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.phone}</TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell>{row.plate}</TableCell>
              <TableCell>P{Number(row.wallet ?? 0).toFixed(2)}</TableCell>
              <TableCell>{row.rating ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(row.status ?? "")}>{row.status ?? "—"}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
    const { data, error } = await supabase
      .from("loads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Could not load loads");
    } else {
      setRows((data || []) as LoadRecord[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function cancel(id: string) {
    if (!supabase) return;
    setActingId(id);
    try {
      const { error } = await supabase.rpc("admin_cancel_load", { p_load_id: id });
      if (error) throw error;
      toast.success("Load cancelled");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setActingId(null);
    }
  }

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No loads yet" />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Offer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const cancellable = !["Completed", "Cancelled"].includes(row.status);
            return (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{row.id}</TableCell>
                <TableCell>{row.customer}</TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {row.pickup} → {row.dropoff}
                </TableCell>
                <TableCell>P{Number(row.offer).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                </TableCell>
                <TableCell>{row.driver ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {cancellable && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actingId === row.id}
                      onClick={() => cancel(row.id)}
                    >
                      <XCircle className="h-4 w-4" /> Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function WalletTab() {
  const [rows, setRows] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Could not load wallet transactions");
        setRows((data || []) as WalletTransaction[]);
        setLoading(false);
      });
  }, []);

  if (loading) return <TabLoading />;
  if (!rows.length) return <TabEmpty label="No wallet transactions yet" />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Load</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id ?? `${row.phone}-${row.created_at}`}>
              <TableCell>{row.phone}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell
                className={Number(row.amount) < 0 ? "text-destructive" : "text-card-foreground"}
              >
                P{Number(row.amount).toFixed(2)}
              </TableCell>
              <TableCell>{row.load_id ?? "—"}</TableCell>
              <TableCell className="max-w-[200px] truncate">{row.note ?? "—"}</TableCell>
              <TableCell>
                {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TabLoading() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-10 text-muted-foreground shadow-[var(--shadow-card)]">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

function TabEmpty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-10 text-muted-foreground shadow-[var(--shadow-card)]">
      <Package className="h-5 w-5" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
