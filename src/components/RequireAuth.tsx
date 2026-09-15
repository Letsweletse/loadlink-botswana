import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import AdminLogin from "@/components/AdminLogin";

/** Auth gate for pages that require a signed-in user. Admin pages use the
 * dedicated admin login and verify the admin role server-side when possible. */
export default function RequireAuth({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [adminCheck, setAdminCheck] = useState<boolean | null>(adminOnly ? null : false);

  useEffect(() => {
    if (!adminOnly || loading || !user) return;
    if (user.role === "admin") {
      setAdminCheck(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase?.rpc("is_admin") || { data: false, error: null };
        if (!cancelled) setAdminCheck(!error && Boolean(data));
      } catch {
        if (!cancelled) setAdminCheck(false);
      }
    })();
    return () => { cancelled = true; };
  }, [adminOnly, loading, user?.id, user?.role]);

  useEffect(() => {
    if (loading || adminOnly) return;
    if (!user) navigate({ to: "/login" });
  }, [loading, user, adminOnly, navigate]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="h-7 w-7 rounded-full border-2 border-[#C9A05A] border-t-transparent animate-spin" /></div>;
  }

  if (adminOnly && !user) return <AdminLogin />;
  if (!user) return null;
  if (adminOnly && adminCheck === null) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="h-7 w-7 rounded-full border-2 border-[#C9A05A] border-t-transparent animate-spin" /></div>;
  }
  if (adminOnly && !adminCheck) {
    return <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-5 text-center"><p className="font-semibold text-[#3D2B0E]">This account does not have admin access.</p><button onClick={() => supabase?.auth.signOut()} className="text-sm font-semibold text-[#C9A05A]">Sign out</button></div>;
  }

  return <>{children}</>;
}
