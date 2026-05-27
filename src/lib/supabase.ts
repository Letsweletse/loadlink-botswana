import type { TruckSize } from "./vanlink";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function endpoint(table: string, query = "") {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
  return `${supabaseUrl}/rest/v1/${table}${query}`;
}

async function request<T>(table: string, options: RequestInit = {}, query = ""): Promise<T> {
  if (!supabaseAnonKey) throw new Error("Supabase key is not configured");
  const response = await fetch(endpoint(table, query), {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.error || `Supabase request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

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
  status: string;
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
};

export async function fetchLoads() {
  return request<LoadRecord[]>("loads", {}, "?select=*&order=created_at.desc");
}

export async function fetchTrucks() {
  return request<TruckRecord[]>("trucks", {}, "?select=*&order=created_at.desc");
}

export async function createLoad(load: LoadRecord) {
  const rows = await request<LoadRecord[]>("loads", { method: "POST", body: JSON.stringify(load) });
  return rows[0];
}

export async function createTruck(truck: TruckRecord) {
  const payload = { wallet: 0, rating: 4.8, online: false, status: "Pending review", ...truck };
  const rows = await request<TruckRecord[]>("trucks", { method: "POST", body: JSON.stringify(payload) });
  return rows[0];
}

export async function upsertProfile(profile: { role: "customer" | "driver" | "admin"; name: string; phone: string; email?: string; business?: string; address?: string }) {
  const rows = await request<any[]>("profiles", {
    method: "POST",
    body: JSON.stringify(profile),
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
  }, "?on_conflict=phone");
  return rows[0];
}

export function makeLoadId() {
  return `LL-${String(Date.now()).slice(-6)}`;
}
