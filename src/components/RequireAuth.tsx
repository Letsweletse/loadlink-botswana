import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/AuthContext";

/** Wrap any page that assumes `user` is non-null. Shows a spinner while
 *  auth resolves, then redirects to /login if there's truly no session —
 *  so pages never crash on user.email/user.phone before auth is ready. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-7 w-7 rounded-full border-2 border-[#C9A05A] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
