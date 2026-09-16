import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Truck, AlertCircle, Eye, EyeOff, Check } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isComplete = email.trim() && password.trim();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
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
      setSuccess(true);
      
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#3D2B0E] to-[#2A1F0A] px-4 py-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg width=60 height=60 xmlns=%22http://www.w3.org/2000/svg%22><rect fill=%23C9A05A width=60 height=60/><path d=%22M0 0h60v60H0z%22 fill-opacity=.1/></svg>')] bg-repeat"></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo Section */}
        <div className="mb-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#C9A05A] to-[#B8934A] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Truck className="h-5 w-5 text-[#C9A05A]" />
            <span className="text-sm font-extrabold text-[#C9A05A] tracking-wider">VAN-LINK</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Admin Portal</h1>
          <p className="text-sm text-white/60">Secure Operations Access</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl p-6 shadow-2xl space-y-5">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-sm font-semibold text-green-900">Login successful! Redirecting...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-900">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#3D2B0E]">Admin Email</Label>
            <Input
              className="mt-2 h-12 rounded-xl border-2 border-[#E5E7EB] bg-white text-[#3D2B0E] text-base placeholder-[#9CA3AF] focus:border-[#C9A05A] focus:ring-0 transition-colors"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@vanlink.co.bw"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          {/* Password Input */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#3D2B0E]">Password</Label>
            <div className="relative mt-2">
              <Input
                className="w-full h-12 rounded-xl border-2 border-[#E5E7EB] bg-white text-[#3D2B0E] text-base placeholder-[#9CA3AF] focus:border-[#C9A05A] focus:ring-0 transition-colors pr-12"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#3D2B0E]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={loading || !isComplete}
            className={`w-full h-12 rounded-xl font-bold text-base transition-all active:scale-95 ${
              isComplete
                ? 'bg-gradient-to-r from-[#C9A05A] to-[#B08A45] hover:shadow-lg text-white'
                : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign in to Admin"
            )}
          </Button>

          {/* Security Badge */}
          <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-3">
            <p className="text-xs text-[#15803D] font-semibold flex items-center gap-2">
              <span>🔒</span>
              Secure server-side authentication
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-white/60">
            Need help? Contact{" "}
            <a href="mailto:support@vanlink.co.bw" className="text-[#C9A05A] hover:underline font-semibold">
              support@vanlink.co.bw
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
