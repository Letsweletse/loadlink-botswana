import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Truck, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("admin_session", JSON.stringify(data.session));
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F9FAFB] px-4 sm:px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="h-12 sm:h-14 w-12 sm:w-14 rounded-xl sm:rounded-2xl bg-[#3D2B0E] flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <ShieldCheck className="h-6 sm:h-7 w-6 sm:w-7 text-[#C9A05A]" />
          </div>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
            <Truck className="h-4 w-4 text-[#C9A05A]" />
            <span className="text-xs sm:text-sm font-extrabold text-[#3D2B0E]">Van-Link</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#3D2B0E]">Admin Portal</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-semibold text-red-900">{error}</p>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold uppercase text-[#6B7280]">Email</Label>
            <Input
              className="mt-1.5 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@vanlink.co.bw"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase text-[#6B7280]">Password</Label>
            <Input
              className="mt-1.5 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 sm:h-12 rounded-lg sm:rounded-xl bg-[#3D2B0E] hover:bg-[#1A1A1A] text-white font-bold text-sm sm:text-base disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign in to Admin"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
