import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@tanstack/react-router';
import { Truck, AlertCircle, Check, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email.trim()) throw new Error('Email required');
      await base44.auth.resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <div className="bg-[#3D2B0E] px-5 pt-12 pb-10">
        <Link to="/login" className="flex items-center gap-2 text-white/60 hover:text-white mb-4 font-semibold text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[#C9A05A] flex items-center justify-center">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-white tracking-tight text-lg leading-none">Van-Link</p>
            <p className="text-[11px] text-white/50 mt-0.5">Goods transport across Botswana</p>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Reset password</h1>
        <p className="text-sm text-white/50 mt-1">Enter your email to get a reset link</p>
      </div>

      <div className="flex-1 px-5 pt-8 pb-10 max-w-sm w-full mx-auto">
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-green-900 mb-2">Check your email!</h2>
            <p className="text-sm text-green-700 mb-4">
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-xs text-green-600 mb-6">Click the link in the email to reset your password.</p>
            <Link
              to="/login"
              className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl transition-colors"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-900">{error}</p>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Email</Label>
              <Input
                className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white text-[#3D2B0E]"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-bold text-base mt-6"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
