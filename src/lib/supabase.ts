import { createClient } from "@supabase/supabase-js";
import type { TruckSize } from "./vanlink";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PROFILE_TIMEOUT_MS = 7000;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

function normalizePhone(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("267")) return `+${digits}`;
  if (digits.length === 8) return `+267${digits}`;
  return String(phone || "").trim();
}

async function withProfileTimeout<T>(work: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Profile save timed out")), PROFILE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
  created_at?: string;
};

export type TruckRecord = {
  id?: string;
  owner_phone?: string | null;
  name: string;
  phone: string;
  category: TruckSize;
  plate: string;
  area?: string | null;
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
  type: "deposit" | "commission" | "payout" | "adjustment" | string;
  amount: number;
  note?: string | null;
  load_id?: string | null;
  created_at?: string;
};

export async function fetchLoads() {
  const db = requireClient();
  const { data, error } = await db.from("loads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as LoadRecord[];
}

export async function fetchOpenLoads(category?: TruckSize) {
  const db = requireClient();
  let query = db.from("loads").select("*").in("status", ["Broadcasting", "Accepted", "In transit"]).order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as LoadRecord[];
}

export async function fetchLoad(id: string) {
  const db = requireClient();
  const { data, error } = await db.from("loads").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as LoadRecord | null;
}

export async function fetchTrucks() {
  const db = requireClient();
  const { data, error } = await db.from("trucks").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as TruckRecord[];
}

export async function fetchTrucksByPhone(phone: string) {
  const db = requireClient();
  const { data, error } = await db.from("trucks").select("*").eq("phone", phone).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as TruckRecord[];
}

export async function createLoad(load: LoadRecord) {
  const db = requireClient();
  const { data, error } = await db.from("loads").insert(load).select().single();
  if (error) throw error;
  return data as LoadRecord;
}

export async function updateLoad(id: string, updates: Partial<LoadRecord>) {
  const db = requireClient();
  const { data, error } = await db.from("loads").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as LoadRecord;
}

export async function acceptLoad(load: LoadRecord, driver: { name: string; phone: string }) {
  return updateLoad(load.id, {
    status: "Accepted",
    driver: driver.name,
    driver_phone: driver.phone,
  });
}

export async function completeLoad(load: LoadRecord) {
  const commission = Math.round(Number(load.offer || 0) * 0.1);
  const updated = await updateLoad(load.id, { status: "Completed" });
  if (load.driver_phone) {
    await createWalletTransaction({ phone: load.driver_phone, type: "commission", amount: -commission, note: `10% commission for ${load.id}`, load_id: load.id }).catch(() => null);
  }
  return updated;
}

export async function createTruck(truck: TruckRecord) {
  const db = requireClient();
  const { data, error } = await db.from("trucks").insert({ wallet: 0, rating: 4.8, online: false, status: "Pending review", ...truck }).select().single();
  if (error) throw error;
  return data as TruckRecord;
}

export async function updateTruck(id: string, updates: Partial<TruckRecord>) {
  const db = requireClient();
  const { data, error } = await db.from("trucks").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as TruckRecord;
}

export async function upsertProfile(profile: { role: "customer" | "driver" | "admin"; name: string; phone: string; email?: string; business?: string; address?: string }) {
  const cleanProfile = { ...profile, name: profile.name.trim() || "LoadLink user", phone: normalizePhone(profile.phone) };

  try {
    const db = requireClient();
    const { data, error } = await withProfileTimeout(
      db.from("profiles").upsert(cleanProfile, { onConflict: "phone" }).select().single(),
    );
    if (error) throw error;
    return data as ProfileRecord;
  } catch (error) {
    console.error("Profile backend save failed; continuing signup", error);
    return {
      id: "pending-profile",
      created_at: new Date().toISOString(),
      ...cleanProfile,
    } as ProfileRecord;
  }
}

export async function fetchProfile(phone: string) {
  const db = requireClient();
  const { data, error } = await db.from("profiles").select("*").eq("phone", normalizePhone(phone)).maybeSingle();
  if (error) throw error;
  return data as ProfileRecord | null;
}

export async function createWalletTransaction(tx: WalletTransaction) {
  const db = requireClient();
  const { data, error } = await db.from("wallet_transactions").insert(tx).select().single();
  if (error) throw error;
  return data as WalletTransaction;
}

export async function fetchWalletTransactions(phone: string) {
  const db = requireClient();
  const { data, error } = await db.from("wallet_transactions").select("*").eq("phone", normalizePhone(phone)).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as WalletTransaction[];
}

export function makeLoadId() {
  return `LL-${String(Date.now()).slice(-6)}`;
}

export function localUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("vanlink_user");
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as { name: string; phone: string; role: "client" | "driver" | string };
    return { ...user, phone: normalizePhone(user.phone) };
  } catch {
    localStorage.removeItem("vanlink_user");
    return null;
  }
}
