import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type VLUser = {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role?: "client" | "driver" | "admin";
  profileId?: string;
};

type Ctx = {
  user: VLUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  user: null, loading: true, refresh: async () => {}, signOut: async () => {},
});

// db role (customer|driver|admin) -> ui role (client|driver|admin)
const toUiRole = (r?: string) => (r === "customer" ? "client" : (r as any)) || "client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VLUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (authUser: any | null) => {
    if (!authUser) { setUser(null); return; }
    const meta = authUser.user_metadata || {};
    const base: VLUser = {
      id: authUser.id,
      email: authUser.email,
      full_name: meta.full_name || meta.name || "",
      phone: meta.phone || "",
      role: toUiRole(meta.role),
    };
    if (supabase) {
      const { data } = await supabase
        .from("profiles").select("id,name,phone,email,role")
        .eq("user_id", authUser.id).maybeSingle();
      if (data) {
        base.profileId = data.id;
        base.full_name = data.name || base.full_name;
        base.phone = data.phone || base.phone;
        base.email = data.email || base.email;
        base.role = toUiRole(data.role);
      }
    }
    setUser(base);
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.auth.getUser();
    await hydrate(data.user ?? null);
  }, [hydrate]);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      await hydrate(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (!alive) return;
      await hydrate(session?.user ?? null);
      setLoading(false);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [hydrate]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
