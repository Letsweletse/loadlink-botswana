import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try { await base44.auth.resetPasswordRequest(email); } catch {}
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <div className="bg-[#0F0F0F] px-5 pt-12 pb-10">
        <Link to="/login" className="flex items-center gap-2 text-white/50 text-sm mb-6 hover:text-white/80 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Reset password</h1>
        <p className="text-sm text-white/50 mt-1">We'll send a reset link to your email</p>
      </div>

      <div className="flex-1 px-5 pt-8 pb-10 max-w-sm w-full mx-auto">
        {sent ? (
          <div className="text-center py-8">
            <div className="h-14 w-14 rounded-2xl bg-[#F0FDF4] border border-[#16A34A]/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-[#16A34A]" />
            </div>
            <h2 className="font-bold text-[#0F0F0F] mb-2">Check your email</h2>
            <p className="text-sm text-[#6B7280]">
              If an account exists for <span className="font-medium text-[#0F0F0F]">{email}</span>, a reset link has been sent.
            </p>
            <Link to="/login" className="mt-6 block">
              <Button className="w-full h-12 rounded-xl bg-[#F97316] hover:bg-[#EA6A0A] text-white font-bold">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Email address</Label>
              <Input
                className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white focus-visible:ring-[#F97316]"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#F97316] hover:bg-[#EA6A0A] text-white font-bold shadow-md shadow-[#F97316]/20"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
