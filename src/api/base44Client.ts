// Data layer -> Supabase (real Van-Link schema)
import { supabase } from "@/lib/supabase";

export function normalizePhone(v?: string) {
  const d = String(v || "").replace(/\D/g, "");
  if (d.startsWith("267") && d.length === 11) return `+${d}`;
  if (d.length === 8) return `+267${d}`;
  return String(v || "").trim();
}

// Map UI category keys <-> db enum (mini|medium|big)
const CAT_TO_DB: Record<string, string> = {
  under_2ton: "mini", medium_7ton: "medium", big_over_7ton: "big", plant_machinery: "plant",
  mini: "mini", medium: "medium", big: "big", plant: "plant",
};
const DB_TO_CAT: Record<string, string> = {
  mini: "under_2ton", medium: "medium_7ton", big: "big_over_7ton", plant: "plant_machinery",
};

// Map UI status <-> db status
const ST_TO_DB: Record<string, string> = {
  broadcasting: "Broadcasting", accepted: "Accepted", picked_up: "Collected",
  in_transit: "Collected", delivered: "Delivered", completed: "Delivered",
};
const DB_TO_ST: Record<string, string> = {
  Broadcasting: "broadcasting", Accepted: "accepted", Collected: "in_transit",
  Delivered: "delivered", Completed: "completed",
};

function loadOut(r: any) {
  if (!r) return r;
  return {
    ...r,
    category: DB_TO_CAT[r.category] || r.category,
    status: DB_TO_ST[r.status] || r.status,
    client_email: r.client_email,
    client_name: r.client_name,
    created_date: r.created_at,
    fare: Number(r.offer || 0),
    offered_fare: Number(r.offer || 0),
    base_fare: r.base_fare != null ? Number(r.base_fare) : Number(r.offer || 0),
    final_fare: r.final_fare != null ? Number(r.final_fare) : null,
    commission: r.commission != null ? Number(r.commission) : null,
    distance_km: Number(r.km || 0),
    pickup_address: r.pickup,
    dropoff_address: r.dropoff,
    goods_description: r.cargo_description,
    driver_name: r.driver,
    stops: Array.isArray(r.stops) ? r.stops : [],
    accepted_at: r.accepted_at,
    picked_up_at: r.picked_up_at,
    delivered_at: r.delivered_at,
    driver_email: r.driver_email,
  };
}

function loadIn(p: any) {
  const out: any = { ...p };
  if (p.category) out.category = CAT_TO_DB[p.category] || p.category;
  if (p.status) out.status = ST_TO_DB[String(p.status).toLowerCase()] || p.status;
  if (p.fare !== undefined) { out.offer = p.fare; delete out.fare; }
  if (p.distance_km !== undefined) { out.km = p.distance_km; delete out.distance_km; }
  if (p.pickup_address !== undefined) { out.pickup = p.pickup_address; delete out.pickup_address; }
  if (p.dropoff_address !== undefined) { out.dropoff = p.dropoff_address; delete out.dropoff_address; }
  if (p.goods_description !== undefined) { out.cargo_description = p.goods_description; delete out.goods_description; }
  if (p.offered_fare !== undefined) { out.offer = p.offered_fare; delete out.offered_fare; }
  delete out.created_date;
  delete out.client_email;
  delete out.driver_name;
  delete out.fare;
  return out;
}

function vehicleOut(r: any) {
  if (!r) return r;
  return { ...r, category: DB_TO_CAT[r.category] || r.category, number_plate: r.plate };
}
function vehicleIn(p: any) {
  const out: any = { ...p };
  if (p.category) out.category = CAT_TO_DB[p.category] || p.category;
  return out;
}

function orderParts(order = "-created_at") {
  let col = order.startsWith("-") ? order.slice(1) : order;
  const asc = !order.startsWith("-");
  if (col === "created_date") col = "created_at";
  return { col, asc };
}

function entity(table: string, mapOut = (x: any) => x, mapIn = (x: any) => x, idCol = "id") {
  return {
    async filter(filters: Record<string, any> = {}, order = "-created_at", limit = 50) {
      if (!supabase) return [];
      let q = supabase.from(table).select("*");
      for (const [k, v] of Object.entries(filters)) {
        if (v === undefined || v === null) continue;
        if (k === "status") q = q.eq("status", ST_TO_DB[String(v).toLowerCase()] || v);
        else if (k === "category") q = q.eq("category", CAT_TO_DB[String(v)] || v);
        else if (k === "client_email") q = q.eq("phone", v);
        else q = q.eq(k, v);
      }
      const { col, asc } = orderParts(order);
      const { data, error } = await q.order(col, { ascending: asc }).limit(limit);
      if (error) { console.warn(`[${table}] filter`, error.message); return []; }
      return (data ?? []).map(mapOut);
    },
    async list(order = "-created_at", limit = 50) {
      return this.filter({}, order, limit);
    },
    async get(id: string) {
      if (!supabase) return null;
      const { data, error } = await supabase.from(table).select("*").eq(idCol, id).maybeSingle();
      if (error) { console.warn(`[${table}] get`, error.message); return null; }
      return data ? mapOut(data) : null;
    },
    async create(payload: any) {
      if (!supabase) throw new Error("Service unavailable");
      const { data, error } = await supabase.from(table).insert(mapIn(payload)).select().single();
      if (error) throw new Error(error.message);
      return mapOut(data);
    },
    async update(id: string, payload: any) {
      if (!supabase) throw new Error("Service unavailable");
      const { data, error } = await supabase.from(table).update(mapIn(payload)).eq(idCol, id).select().single();
      if (error) throw new Error(error.message);
      return mapOut(data);
    },
  };
}

export const base44 = {
  entities: {
    Booking: {
      ...entity("loads", loadOut, loadIn, "id"),
      async create(payload: any) {
        if (!supabase) throw new Error("Service unavailable");
        const row = loadIn(payload);
        if (!row.id) row.id = `VL${Date.now().toString(36).toUpperCase()}`;
        if (!row.status) row.status = "Broadcasting";
        if (!row.client_email) {
          const { data: au } = await supabase.auth.getUser();
          row.client_email = au.user?.email ?? null;
        }
        try {
          const { geocode } = await import("@/lib/mapbox");
          if (row.pickup && row.pickup_lat == null) {
            const c = await geocode(row.pickup);
            if (c) { row.pickup_lat = c.lat; row.pickup_lng = c.lng; }
          }
          if (row.dropoff && row.dropoff_lat == null) {
            const c = await geocode(row.dropoff);
            if (c) { row.dropoff_lat = c.lat; row.dropoff_lng = c.lng; }
          }
        } catch { /* geocoding is best-effort */ }
        const { data, error } = await supabase.from("loads").insert(row).select().single();
        if (error) throw new Error(error.message);
        return loadOut(data);
      },
    },
    Vehicle: {
      async filter(filters: Record<string, any> = {}, order = "-created_at", limit = 50) {
        if (!supabase) return [];
        let q = supabase.from("trucks").select("*");
        for (const [k, v] of Object.entries(filters)) {
          if (v === undefined || v === null) continue;
          if (k === "category") q = q.eq("category", CAT_TO_DB[String(v)] || v);
          else q = q.eq(k, v);
        }
        const { col, asc } = orderParts(order === "-created_date" ? "-created_at" : order);
        const { data, error } = await q.order(col, { ascending: asc }).limit(limit);
        if (error) { console.warn("[trucks] filter", error.message); return []; }
        return (data ?? []).map(vehicleOut);
      },
      async list(order = "-created_at", limit = 50) { return this.filter({}, order, limit); },
      async get(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase.from("trucks").select("*").eq("id", id).maybeSingle();
        if (error) { console.warn("[trucks] get", error.message); return null; }
        return data ? vehicleOut(data) : null;
      },
      async create(payload: any) {
        if (!supabase) throw new Error("Service unavailable");
        const row = vehicleIn(payload);
        if (!row.driver_email) {
          const { data: au } = await supabase.auth.getUser();
          row.driver_email = au.user?.email ?? null;
        }
        const { data, error } = await supabase.from("trucks").insert(row).select().single();
        if (error) throw new Error(error.message);
        return vehicleOut(data);
      },
      async update(id: string, payload: any) {
        if (!supabase) throw new Error("Service unavailable");
        const { data, error } = await supabase.from("trucks").update(vehicleIn(payload)).eq("id", id).select().single();
        if (error) throw new Error(error.message);
        return vehicleOut(data);
      },
    },
    Profile: entity("profiles"),
    Transaction: entity("wallet_transactions"),
    PaymentRequest: entity("payment_requests"),
    SupportTicket: entity("support_tickets"),
    Rating: entity("ratings"),
    Notification: entity("notifications"),
    Message: entity("messages"),
    SavedSearch: entity("saved_searches"),
  },

  auth: {
    async me() {
      if (!supabase) return null;
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
    async signUpWithEmailPassword(email: string, password: string, meta: Record<string, any> = {}) {
      if (!supabase) throw new Error("Service unavailable");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: meta, emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    async loginViaEmailPassword(email: string, password: string) {
      if (!supabase) throw new Error("Service unavailable");
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!error) return;
      const m = (error.message || "").toLowerCase();
      if (m.includes("email not confirmed")) {
        throw new Error("Please confirm your email first — check your inbox for the link we sent.");
      }
      if (m.includes("invalid login credentials")) {
        throw new Error(
          "Email or password is incorrect. If you signed up with Google, use the \u201CContinue with Google\u201D button below."
        );
      }
      throw new Error(error.message);
    },

    /** Resend the signup confirmation email. */
    async resendConfirmation(email: string) {
      if (!supabase) throw new Error("Service unavailable");
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw new Error(error.message);
    },
    async resetPassword(email: string) {
      if (!supabase) throw new Error("Service unavailable");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw new Error(error.message);
    },
    loginWithProvider(provider: "google") {
      supabase?.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin, queryParams: { prompt: "select_account" } },
      });
    },
    /** Update the signed-in user's profile row (and auth metadata). */
    async updateMe(patch: { name?: string; phone?: string; role?: string; email?: string; business?: string; address?: string; id_number?: string; terms_accepted?: boolean }) {
      if (!supabase) throw new Error("Service unavailable");
      const { data: au } = await supabase.auth.getUser();
      const uid = au.user?.id;
      if (!uid) throw new Error("Not signed in");

      const row: any = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.email !== undefined) row.email = patch.email;
      if (patch.business !== undefined) row.business = patch.business;
      if (patch.address !== undefined) row.address = patch.address;
      if (patch.phone) row.phone = normalizePhone(patch.phone);
      if (patch.role) row.role = patch.role === "client" ? "customer" : patch.role;
      if (patch.terms_accepted) {
        row.terms_accepted_at = new Date().toISOString();
        row.terms_version = "2026-07-31";
      }
      row.updated_at = new Date().toISOString();

      const { data: existing } = await supabase
        .from("profiles").select("id").eq("user_id", uid).limit(1).maybeSingle();

      if (existing) {
        const { error } = await supabase.from("profiles").update(row).eq("id", existing.id);
        if (error) throw new Error(error.message.includes("duplicate") ? "That phone number is already registered." : error.message);
      } else {
        const { error } = await supabase.from("profiles").insert({ ...row, user_id: uid });
        if (error) throw new Error(error.message.includes("duplicate") ? "That phone number is already registered." : error.message);
      }

      await supabase.auth.updateUser({
        data: {
          ...(patch.name ? { full_name: patch.name } : {}),
          ...(patch.phone ? { phone: normalizePhone(patch.phone) } : {}),
          ...(patch.role ? { role: patch.role === "client" ? "customer" : patch.role } : {}),
        },
      }).catch(() => null);

      return true;
    },

    logout() {
      return supabase?.auth.signOut();
    },
  },
};
