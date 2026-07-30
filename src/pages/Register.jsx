import { useState } from 'react';
import { base44, normalizePhone } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from '@tanstack/react-router';
import { Truck, Check } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('client');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Enter your full name');
    if (phone.replace(/\D/g, '').length < 8) return setError('Enter a valid Botswana phone number');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await base44.auth.signUpWithEmailPassword(email, password, {
        full_name: fullName.trim(),
        phone: normalizePhone(phone),
        role: role === 'driver' ? 'driver' : 'customer',
      });
      if (res?.session) navigate({ to: '/' });
      else setSent(true);
    } catch (err) {
      setError(err.message || 'Could not create your account. Please try again.');
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <div className="bg-[#3D2B0E] px-5 pt-12 pb-10">
          <p className="font-extrabold text-white tracking-tight text-lg">Van-Link</p>
        </div>
        <div className="flex-1 px-5 pt-10 max-w-sm w-full mx-auto text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
            <Check className="h-7 w-7 text-[#16A34A]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#3D2B0E] tracking-tight">Check your email</h1>
          <p className="text-sm text-[#6B7280] mt-2 leading-6">
            We sent a confirmation link to <span className="font-semibold text-[#3D2B0E]">{email}</span>.
            Tap it to activate your account, then sign in.
          </p>
          <Link to="/login">
            <Button className="mt-6 w-full h-12 rounded-xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-bold">
              Go to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <div className="bg-[#3D2B0E] px-5 pt-12 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[#C9A05A] flex items-center justify-center">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-white tracking-tight text-lg leading-none">Van-Link</p>
            <p className="text-[11px] text-white/50 mt-0.5">Goods transport across Botswana &amp; SACU</p>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Create account</h1>
        <p className="text-sm text-white/50 mt-1">Join Van-Link today</p>
      </div>

      <div className="flex-1 px-5 pt-8 pb-10 max-w-sm w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>
          )}

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">I am a</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {[['client', 'Client'], ['driver', 'Driver']].map(([val, label]) => (
                <button
                  key={val} type="button" onClick={() => setRole(val)}
                  className={`h-12 rounded-xl border font-semibold text-sm transition-colors ${
                    role === val
                      ? 'bg-[#C9A05A] border-[#C9A05A] text-white'
                      : 'bg-white border-[#E5E7EB] text-[#3D2B0E]'
                  }`}
                >{label}</button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Full name</Label>
            <Input className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white focus-visible:ring-[#C9A05A]"
              placeholder="Letsweletse Seatla" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Email</Label>
            <Input className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white focus-visible:ring-[#C9A05A]"
              type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Phone</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-12 px-3 flex items-center rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#3D2B0E] shrink-0">🇧🇼 +267</span>
              <Input className="h-12 rounded-xl border-[#E5E7EB] bg-white focus-visible:ring-[#C9A05A]"
                type="tel" inputMode="numeric" placeholder="75 123 456" value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))} required />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Password</Label>
            <Input className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white focus-visible:ring-[#C9A05A]"
              type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Confirm password</Label>
            <Input className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white focus-visible:ring-[#C9A05A]"
              type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>

          <Button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-bold text-base shadow-md shadow-[#C9A05A]/20">
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF] font-medium">or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          <Button type="button" variant="outline"
            className="w-full h-12 rounded-xl border-[#E5E7EB] font-semibold text-[#3D2B0E] hover:bg-[#F9FAFB]"
            onClick={() => base44.auth.loginWithProvider('google')}>
            Continue with Google
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-[#6B7280]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#C9A05A] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
