import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Login failed. Check your email and password.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      {/* Top brand strip */}
      <div className="bg-[#0F0F0F] px-5 pt-12 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[#F97316] flex items-center justify-center">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-white tracking-tight text-lg leading-none">Van-Link</p>
            <p className="text-[11px] text-white/50 mt-0.5">Goods transport across Botswana & SACU</p>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Sign in</h1>
        <p className="text-sm text-white/50 mt-1">Welcome back</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-8 pb-10 max-w-sm w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Email</Label>
            <Input
              className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white text-[#0F0F0F] placeholder:text-[#9CA3AF] focus-visible:ring-[#F97316]"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Password</Label>
              <Link to="/forgot-password" className="text-xs text-[#F97316] font-medium hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              className="h-12 rounded-xl border-[#E5E7EB] bg-white text-[#0F0F0F] focus-visible:ring-[#F97316]"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-[#F97316] hover:bg-[#EA6A0A] text-white font-bold text-base shadow-md shadow-[#F97316]/20"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF] font-medium">or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-[#E5E7EB] font-semibold text-[#0F0F0F] hover:bg-[#F9FAFB]"
            onClick={() => base44.auth.loginWithProvider('google', '/')}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-[#6B7280]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#F97316] font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
