import { createClient } from "@supabase/supabase-js";
import type { TruckSize } from "./vanlink";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
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
  const db = requireClient();
  const { data, error } = await db.from("loads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as LoadRecord[];
}

export async function fetchTrucks() {
  const db = requireClient();
  const { data, error } = await db.from("trucks").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as TruckRecord[];
}

export async function createLoad(load: LoadRecord) {
  const db = requireClient();
  const { data, error } = await db.from("loads").insert(load).select().single();
  if (error) throw error;
  return data as LoadRecord;
}

export async function createTruck(truck: TruckRecord) {
  const db = requireClient();
  const { data, error } = await db.from("trucks").insert({ wallet: 0, rating: 4.8, online: false, status: "Pending review", ...truck }).select().single();
  if (error) throw error;
  return data as TruckRecord;
}

export async function upsertProfile(profile: { role: "customer" | "driver" | "admin"; name: string; phone: string; email?: string; business?: string; address?: string }) {
  const db = requireClient();
  const { data, error } = await db.from("profiles").upsert(profile, { onConflict: "phone" }).select().single();
  if (error) throw error;
  return data;
}

export function makeLoadId() {
  return `LL-${String(Date.now()).slice(-6)}`;
}
