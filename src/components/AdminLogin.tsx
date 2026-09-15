import { useState, type FormEvent } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Truck } from "lucide-react";

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
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || "Admin sign-in failed. Check your credentials.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#3D2B0E] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-7 w-7 text-[#C9A05A]" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-[#C9A05A]" />
            <span className="text-sm font-extrabold text-[#3D2B0E]">Van-Link</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3D2B0E]">Admin Portal</h1>
          <p className="text-sm text-[#6B7280] mt-1">Operations access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Admin email</Label>
            <Input className="mt-1.5 h-12 rounded-xl" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@vanlink.co.bw" required />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Password</Label>
            <Input className="mt-1.5 h-12 rounded-xl" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-[#3D2B0E] hover:bg-[#1A1A1A] text-white font-bold">
            {loading ? "Signing in…" : "Sign in to Admin"}
          </Button>
        </form>
      </div>
    </div>
  );
}
