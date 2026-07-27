import { createClient } from "@supabase/supabase-js";
import type { TruckSize } from "./vanlink";
import { safeJsonParse, safeStorageGet, safeStorageRemove, safeStorageSet } from "./safe-storage";

const fallbackSupabaseUrl = "https://ebvjnirbkyixgwxahdpe.supabase.co";
const fallbackSupabaseAnonKey = "sb_publishable_C7nBRiS7OwDEJh-j9jxjQQ_t7rpMPQy";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;
const REQUEST_TIMEOUT_MS = 7000;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

function requireClient() {
  if (!supabase) throw new Error("Service is not configured");
  return supabase;
}

export function normalizePhone(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("267")) return `+${digits}`;
  if (digits.length === 8) return `+267${digits}`;
  return String(phone || "").trim();
}

async function withTimeout<T>(work: PromiseLike<T>, label = "Request") {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([Promise.resolve(work), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function saveJson<T>(key: string, value: T) {
  const saved = safeStorageSet(key, JSON.stringify(value));
  if (!saved) console.warn("Could not save local app data");
}

function readJson<T>(key: string, fallback: T): T {
  const raw = safeStorageGet(key);
  const parsed = safeJsonParse(raw, fallback);
  if (raw && parsed === fallback) safeStorageRemove(key);
  return parsed;
}

export type LoadStatus = "Broadcasting" | "Accepted" | "In transit" | "Completed" | string;

export type LoadRecord = {
  id: string;
  customer: string;
  phone: string;
  pickup: string;
  dropoff: string;
  category: TruckSize;
  load?: string | null;
  km: number;
  offer: number;
  status: LoadStatus;
  driver?: string | null;
  driver_phone?: string | null;
  driver_lat?: number | null;
  driver_lng?: number | null;
  location_updated_at?: string | null;
  created_at?: string;
  accepted_at?: string | null;
  weight_tonnes?: number | null;
  cargo_description?: string | null;
};

export type TruckRecord = {
  id?: string;
  owner_phone?: string | null;
  name: string;
  phone: string;
  category: TruckSize;
  plate: string;
  area: string;
  capacity_tonnes?: number | null;
  wallet?: number;
  rating?: number;
  online?: boolean;
  status?: string;
  licence?: string | null;
  disc?: string | null;
  permit?: string | null;
  created_at?: string;
};

export type ProfileRecord = {
  id?: string;
  user_id?: string | null;
  role: "customer" | "driver" | "admin" | string;
  name: string;
  phone: string;
  email?: string | null;
  business?: string | null;
  address?: string | null;
  created_at?: string;
};

export type WalletTransaction = {
  id?: string;
  phone: string;
  transaction_type: "deposit" | "commission" | "adjustment" | "load_fee" | "refund" | string;
  amount: number;
  notes?: string | null;
  load_id?: string | null;
  created_at?: string;
};

export type PaymentRequestRecord = {
  id?: string;
  phone: string;
  amount: number;
  provider: "orange_money" | string;
  pay_to_number: string;
  status: "pending" | "approved" | "rejected" | string;
  notes?: string | null;
  created_at?: string;
};

export async function fetchLoads() {
  const cachedTrip = readJson<LoadRecord | null>("vanlink_trip", null);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db.from("loads").select("*").order("created_at", { ascending: false }),
      "Loads",
    );
    if (error) throw error;
    return (data || []) as LoadRecord[];
  } catch (error) {
    console.warn("Could not load trips from service yet", error);
    return cachedTrip ? [cachedTrip] : [];
  }
}

export type OpenLoadsFilter = {
  category?: TruckSize;
  capacity_tonnes?: number | null;
  area?: string | null;
};

// Matches a driver's truck against loads it can actually carry: same
// category, within its weight capacity, and picking up from the truck's
// operating area (case-insensitive contains, e.g. area "Gaborone" matches
// pickup "Game City, Gaborone").
export async function fetchOpenLoads(filter: OpenLoadsFilter = {}) {
  const { category, capacity_tonnes: capacityTonnes, area } = filter;
  const cachedTrip = readJson<LoadRecord | null>("vanlink_trip", null);
  try {
    const db = requireClient();
    let query = db
      .from("loads")
      .select("*")
      .in("status", ["Broadcasting", "Accepted", "In transit"])
      .order("created_at", { ascending: false });
    if (category) query = query.eq("category", category);
    if (capacityTonnes != null) query = query.lte("weight_tonnes", capacityTonnes);
    if (area) query = query.ilike("pickup", `%${area}%`);
    const { data, error } = await withTimeout(query, "Open loads");
    if (error) throw error;
    return (data || []) as LoadRecord[];
  } catch (error) {
    console.warn("Could not load open trips from service yet", error);
    if (!cachedTrip) return [];
    if (category && cachedTrip.category !== category) return [];
    return [cachedTrip];
  }
}

export async function fetchLoad(id: string) {
  const cachedTrip = readJson<LoadRecord | null>("vanlink_trip", null);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db.from("loads").select("*").eq("id", id).maybeSingle(),
      "Trip",
    );
    if (error) throw error;
    return (data as LoadRecord | null) || cachedTrip;
  } catch (error) {
    console.warn("Could not refresh trip yet", error);
    return cachedTrip;
  }
}

export async function fetchActiveLoadForDriver(phone: string) {
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db
        .from("loads")
        .select("*")
        .eq("driver_phone", normalizePhone(phone))
        .in("status", ["Accepted", "In transit"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      "Active load",
    );
    if (error) throw error;
    return (data as LoadRecord | null) || null;
  } catch (error) {
    console.warn("Could not check for an active load yet", error);
    return null;
  }
}

// Best-effort: a dropped GPS ping shouldn't surface an error to the driver,
// so failures are logged and swallowed rather than thrown.
export async function updateDriverLocation(loadId: string, lat: number, lng: number) {
  try {
    const db = requireClient();
    const { error } = await db
      .from("loads")
      .update({ driver_lat: lat, driver_lng: lng, location_updated_at: new Date().toISOString() })
      .eq("id", loadId);
    if (error) throw error;
  } catch (error) {
    console.warn("Could not save driver location", error);
  }
}

export async function fetchTrucks() {
  const cached = readJson<TruckRecord[]>("vanlink_trucks", []);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db.from("trucks").select("*").order("created_at", { ascending: false }),
      "Trucks",
    );
    if (error) throw error;
    return (data || cached) as TruckRecord[];
  } catch (error) {
    console.warn("Could not refresh trucks yet", error);
    return cached;
  }
}

export async function fetchTrucksByStatus(status: string) {
  const cached = readJson<TruckRecord[]>("vanlink_trucks", []);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db.from("trucks").select("*").eq("status", status).order("created_at", { ascending: false }),
      "Pending trucks",
    );
    if (error) throw error;
    return (data || []) as TruckRecord[];
  } catch (error) {
    console.warn("Could not load pending trucks yet", error);
    return cached.filter((truck) => truck.status === status);
  }
}

export type TruckDocumentKind = "driver_licence" | "licence_disc" | "ba_permit";

export const TRUCK_DOCUMENT_LABELS: Record<TruckDocumentKind, string> = {
  driver_licence: "Driver licence",
  licence_disc: "Licence disc",
  ba_permit: "BA permit",
};

// Admin document review reads from the same "driver-documents" bucket/path
// convention the driver upload flow writes to (see uploadDriverDocument in
// routes/driver.tsx: `${folder}/${kind}-${timestamp}-${filename}`), so no
// separate document table is needed — the storage listing is the source of
// truth. Requires the admin's session to have storage read access to other
// drivers' folders; if that policy isn't in place yet, this just resolves to
// an empty map and the review UI shows "not uploaded" placeholders.
export async function fetchTruckDocuments(phone: string) {
  const result: Partial<Record<TruckDocumentKind, string>> = {};
  if (!isSupabaseConfigured || !supabase) return result;

  const folder = normalizePhone(phone).replace(/\D/g, "");
  if (!folder) return result;

  try {
    const { data, error } = await supabase.storage.from("driver-documents").list(folder, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error || !data) return result;

    const kinds: TruckDocumentKind[] = ["driver_licence", "licence_disc", "ba_permit"];
    for (const kind of kinds) {
      const file = data.find((item) => item.name.startsWith(`${kind}-`));
      if (!file) continue;
      const { data: pub } = supabase.storage
        .from("driver-documents")
        .getPublicUrl(`${folder}/${file.name}`);
      result[kind] = pub.publicUrl;
    }
    return result;
  } catch (error) {
    console.warn("Could not load driver documents yet", error);
    return result;
  }
}

export async function fetchTrucksByPhone(phone: string) {
  const cached = readJson<TruckRecord[]>("vanlink_trucks", []);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db
        .from("trucks")
        .select("*")
        .eq("phone", normalizePhone(phone))
        .order("created_at", { ascending: false }),
      "Driver profile",
    );
    if (error) throw error;
    return (data || cached) as TruckRecord[];
  } catch (error) {
    console.warn("Could not refresh driver profile yet", error);
    return cached;
  }
}

export async function createLoad(load: LoadRecord) {
  const localLoad = {
    created_at: new Date().toISOString(),
    ...load,
    phone: normalizePhone(load.phone),
  };
  saveJson("vanlink_trip", {
    ...localLoad,
    drop: localLoad.dropoff,
    distance: localLoad.km,
    fare: localLoad.offer,
  });
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db.from("loads").insert(localLoad).select().single(),
      "Booking",
    );
    if (error) throw error;
    return data as LoadRecord;
  } catch (error) {
    console.warn("Booking will continue locally until service responds", error);
    return localLoad;
  }
}

export async function updateLoad(id: string, updates: Partial<LoadRecord>) {
  const cachedTrip = readJson<LoadRecord | null>("vanlink_trip", null);
  const localTrip = cachedTrip?.id === id ? { ...cachedTrip, ...updates } : cachedTrip;
  if (localTrip) saveJson("vanlink_trip", localTrip);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db.from("loads").update(updates).eq("id", id).select().single(),
      "Update trip",
    );
    if (error) throw error;
    return data as LoadRecord;
  } catch (error) {
    console.warn("Trip update saved locally until service responds", error);
    if (localTrip) return localTrip;
    throw error;
  }
}

export class LoadAlreadyTakenError extends Error {
  constructor(loadId: string) {
    super(`Load ${loadId} was already accepted by another driver`);
    this.name = "LoadAlreadyTakenError";
  }
}

export class InsufficientWalletBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientWalletBalanceError";
  }
}

export async function acceptLoad(load: LoadRecord, driver: { name: string; phone: string }) {
  const db = requireClient();
  // accept_load() is a SECURITY DEFINER Postgres function: it row-locks the
  // load, re-checks status === 'Broadcasting' (race guard against two drivers
  // accepting at once), and atomically deducts the 10% load fee from the
  // driver's wallet before flipping status to Accepted. All of that happens
  // in one transaction server-side so there's no window where a driver could
  // be charged without the load actually being assigned to them, or vice versa.
  const { data, error } = await withTimeout(
    db.rpc("accept_load", {
      p_load_id: load.id,
      p_driver_name: driver.name,
      p_driver_phone: normalizePhone(driver.phone),
    }),
    "Accept load",
  );
  if (error) {
    if (
      error.message?.includes("LOAD_ALREADY_TAKEN") ||
      error.message?.includes("LOAD_NOT_FOUND")
    ) {
      throw new LoadAlreadyTakenError(load.id);
    }
    if (error.message?.includes("INSUFFICIENT_WALLET_BALANCE")) {
      throw new InsufficientWalletBalanceError(
        "Your wallet balance is too low to accept this load. Top up first.",
      );
    }
    throw error;
  }
  return data as LoadRecord;
}

export async function completeLoad(load: LoadRecord) {
  // The 10% platform fee is already deducted as a 'load_fee' transaction at
  // accept time (see acceptLoad), so completing a load is just a status flip.
  return updateLoad(load.id, { status: "Completed" });
}

export async function createTruck(truck: TruckRecord) {
  const localTruck = {
    id: `truck-${Date.now()}`,
    created_at: new Date().toISOString(),
    wallet: 0,
    rating: 4.8,
    online: false,
    status: "Pending review",
    ...truck,
    phone: normalizePhone(truck.phone),
    owner_phone: truck.owner_phone ? normalizePhone(truck.owner_phone) : truck.owner_phone,
  };
  saveJson("vanlink_trucks", [localTruck]);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db.from("trucks").insert(localTruck).select().single(),
      "Truck profile",
    );
    if (error) throw error;
    return data as TruckRecord;
  } catch (error) {
    console.warn("Truck saved locally until service responds", error);
    return localTruck;
  }
}

export async function updateTruck(id: string, updates: Partial<TruckRecord>) {
  const cached = readJson<TruckRecord[]>("vanlink_trucks", []);
  const localTruck = { ...(cached[0] || { id }), ...updates, id } as TruckRecord;
  saveJson("vanlink_trucks", [localTruck]);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db.from("trucks").update(updates).eq("id", id).select().single(),
      "Truck update",
    );
    if (error) throw error;
    return data as TruckRecord;
  } catch (error) {
    console.warn("Truck update saved locally until service responds", error);
    return localTruck;
  }
}

// Plain status flip, same shape as completeLoad — approving/rejecting a
// registration has no wallet or refund side effects, so unlike
// cancelLoadAsAdmin/verifyPaymentRequest it doesn't need a SECURITY DEFINER
// RPC, just an admin-scoped RLS policy on trucks.
export async function reviewTruckRegistration(id: string, approve: boolean) {
  return updateTruck(id, { status: approve ? "Active" : "Suspended" });
}

export async function upsertProfile(profile: {
  role: "customer" | "driver" | "admin";
  name: string;
  phone: string;
  email?: string;
  business?: string;
  address?: string;
}) {
  const cleanProfile = {
    ...profile,
    name: profile.name.trim() || "Van-Link user",
    phone: normalizePhone(profile.phone),
  };
  saveJson("vanlink_profile", cleanProfile);

  try {
    const db = requireClient();
    // RLS on profiles is scoped to user_id = auth.uid(), so every write must
    // carry the signed-in user's id or the insert/claim will be rejected.
    const { data: sessionData } = await db.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) throw new Error("Not signed in");

    const { data, error } = await withTimeout(
      db
        .from("profiles")
        .upsert({ ...cleanProfile, user_id: userId }, { onConflict: "phone" })
        .select()
        .single(),
      "Profile",
    );
    if (error) throw error;
    return data as ProfileRecord;
  } catch (error) {
    console.warn("Profile saved locally until service responds", error);
    return {
      id: "pending-profile",
      created_at: new Date().toISOString(),
      ...cleanProfile,
    } as ProfileRecord;
  }
}

export async function fetchProfile(phone: string) {
  const cached = readJson<ProfileRecord | null>("vanlink_profile", null);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db.from("profiles").select("*").eq("phone", normalizePhone(phone)).maybeSingle(),
      "Profile",
    );
    if (error) throw error;
    return (data as ProfileRecord | null) || cached;
  } catch (error) {
    console.warn("Could not refresh profile yet", error);
    return cached;
  }
}

export async function createWalletTransaction(tx: WalletTransaction) {
  const cached = readJson<WalletTransaction[]>("vanlink_wallet", []);
  const localTx = {
    id: `wallet-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...tx,
    phone: normalizePhone(tx.phone),
  };
  saveJson("vanlink_wallet", [localTx, ...cached]);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db.from("wallet_transactions").insert(localTx).select().single(),
      "Wallet",
    );
    if (error) throw error;
    return data as WalletTransaction;
  } catch (error) {
    console.warn("Wallet update saved locally until service responds", error);
    return localTx;
  }
}

export async function createPaymentRequest(request: PaymentRequestRecord) {
  const cached = readJson<PaymentRequestRecord[]>("vanlink_payment_requests", []);
  const localRequest = {
    id: `payment-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...request,
    status: request.status || "pending",
    phone: normalizePhone(request.phone),
  };
  saveJson("vanlink_payment_requests", [localRequest, ...cached]);

  try {
    const db = requireClient();
    const { id: _localId, ...insertRequest } = localRequest;
    const { data, error } = await withTimeout(
      db.from("payment_requests").insert(insertRequest).select().single(),
      "Payment request",
    );
    if (error) throw error;
    return data as PaymentRequestRecord;
  } catch (error) {
    console.warn("Payment request saved locally until service responds", error);
    return localRequest;
  }
}

export async function fetchWalletTransactions(phone: string) {
  const cached = readJson<WalletTransaction[]>("vanlink_wallet", []);
  try {
    const db = requireClient();
    const { data, error } = await withTimeout(
      db
        .from("wallet_transactions")
        .select("*")
        .eq("phone", normalizePhone(phone))
        .order("created_at", { ascending: false }),
      "Wallet",
    );
    if (error) throw error;
    return (data || cached) as WalletTransaction[];
  } catch (error) {
    console.warn("Could not refresh wallet yet", error);
    return cached;
  }
}

export async function fetchPaymentRequests() {
  const db = requireClient();
  const { data, error } = await withTimeout(
    db.from("payment_requests").select("*").order("created_at", { ascending: false }),
    "Payment requests",
  );
  if (error) throw error;
  return (data || []) as PaymentRequestRecord[];
}

export async function verifyPaymentRequest(requestId: string) {
  const db = requireClient();
  const { data, error } = await withTimeout(
    db.rpc("admin_verify_payment", { p_request_id: requestId }),
    "Verify payment",
  );
  if (error) throw error;
  return data as PaymentRequestRecord;
}

export async function cancelLoadAsAdmin(loadId: string) {
  const db = requireClient();
  const { data, error } = await withTimeout(
    db.rpc("admin_cancel_load", { p_load_id: loadId }),
    "Cancel load",
  );
  if (error) throw error;
  return data as LoadRecord;
}

export function makeLoadId() {
  return `LL-${String(Date.now()).slice(-6)}`;
}

export function localUser() {
  const raw = safeStorageGet("vanlink_user");
  if (!raw) return null;

  const user = safeJsonParse<{
    name: string;
    phone: string;
    role: "client" | "driver" | string;
  } | null>(raw, null);
  if (!user) {
    safeStorageRemove("vanlink_user");
    return null;
  }

  return { ...user, phone: normalizePhone(user.phone) };
}
