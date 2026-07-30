import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@tanstack/react-router';
import { Truck, MailCheck } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Could not send reset email.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <div className="bg-[#3D2B0E] px-5 pt-12 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[#C9A05A] flex items-center justify-center">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <p className="font-extrabold text-white tracking-tight text-lg leading-none">Van-Link</p>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Reset password</h1>
        <p className="text-sm text-white/50 mt-1">We'll email you a reset link</p>
      </div>

      <div className="flex-1 px-5 pt-8 max-w-sm w-full mx-auto">
        {sent ? (
          <div className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <MailCheck className="h-7 w-7 text-[#2563EB]" />
            </div>
            <p className="font-extrabold text-[#3D2B0E] text-lg">Check your email</p>
            <p className="text-sm text-[#6B7280] mt-2 leading-6">
              If an account exists for <span className="font-semibold text-[#3D2B0E]">{email}</span>,
              a reset link is on its way.
            </p>
            <Link to="/login">
              <Button className="mt-6 w-full h-12 rounded-xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-bold">
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>
            )}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Email</Label>
              <Input className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white focus-visible:ring-[#C9A05A]"
                type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-bold">
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
            <p className="text-center text-sm text-[#6B7280]">
              <Link to="/login" className="text-[#C9A05A] font-semibold hover:underline">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
