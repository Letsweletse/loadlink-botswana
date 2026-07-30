import { supabase } from "@/lib/supabase";

async function filter(table: string, filters: Record<string, any> = {}, order = "-created_at", limit = 50) {
  if (!supabase) return [];
  let q = supabase.from(table).select("*");
  Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
  const col = order.startsWith("-") ? order.slice(1) : order;
  q = q.order(col, { ascending: !order.startsWith("-") }).limit(limit);
  const { data } = await q;
  return data ?? [];
}

async function get(table: string, id: string) {
  if (!supabase) return null;
  const { data } = await supabase.from(table).select("*").eq("id", id).single();
  return data;
}

async function create(table: string, payload: any) {
  if (!supabase) return null;
  const { data } = await supabase.from(table).insert(payload).select().single();
  return data;
}

async function update(table: string, id: string, payload: any) {
  if (!supabase) return null;
  const { data } = await supabase.from(table).update(payload).eq("id", id).select().single();
  return data;
}

function makeEntity(table: string) {
  return {
    filter: (f?: any, o?: string, l?: number) => filter(table, f, o, l),
    get: (id: string) => get(table, id),
    create: (p: any) => create(table, p),
    update: (id: string, p: any) => update(table, id, p),
  };
}

export const base44 = {
  entities: {
    Booking: makeEntity("loads"),
    Vehicle: makeEntity("trucks"),
    Transaction: makeEntity("transactions"),
    SupportTicket: makeEntity("support_tickets"),
    Rating: makeEntity("ratings"),
    Notification: makeEntity("notifications"),
    SavedSearch: makeEntity("saved_searches"),
    Message: makeEntity("messages"),
  },
  auth: {
    me: async () => {
      if (!supabase) return null;
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    loginViaEmailPassword: async (email: string, password: string) => {
      if (!supabase) throw new Error("Not configured");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    loginWithProvider: (provider: "google", _redirect: string) => {
      supabase?.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    },
    logout: () => supabase?.auth.signOut(),
  },
};
