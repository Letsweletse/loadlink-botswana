import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@tanstack/react-router';
import { Truck, AlertCircle, Check } from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState('details'); // details, confirm
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate
      if (!formData.name.trim()) throw new Error('Name required');
      if (!formData.email.trim()) throw new Error('Email required');
      if (formData.password.length < 8) throw new Error('Password must be 8+ characters');
      if (!formData.phone.trim()) throw new Error('Phone required');

      // Sign up
      await base44.auth.signUpWithEmailPassword(formData.email, formData.password, {
        full_name: formData.name,
        phone: formData.phone,
        role: formData.role,
      });

      // Create profile
      await base44.auth.updateMe({
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
      });

      setSuccess(true);
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Sign up failed');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
        <div className="bg-[#3D2B0E] px-5 pt-12 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[#C9A05A] flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-white tracking-tight text-lg leading-none">Van-Link</p>
              <p className="text-[11px] text-white/50 mt-0.5">Goods transport across Botswana</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-5 pt-12 pb-10 max-w-sm w-full mx-auto text-center">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-6">
            <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-900 mb-2">Check your email!</h2>
            <p className="text-sm text-green-700 mb-4">
              We sent a confirmation link to <strong>{formData.email}</strong>
            </p>
            <p className="text-xs text-green-600">Click the link in the email to confirm your account.</p>
          </div>

          <p className="text-sm text-[#6B7280] mb-4">
            Didn't get the email? Check your spam folder or{' '}
            <button
              onClick={() => {
                setError('');
                base44.auth.resendConfirmation(formData.email).catch(err => setError(err.message));
              }}
              className="text-[#C9A05A] font-semibold hover:underline"
            >
              resend it
            </button>
          </p>

          <Link to="/login" className="text-[#C9A05A] font-semibold hover:underline">
            Back to login
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
            <p className="text-[11px] text-white/50 mt-0.5">Goods transport across Botswana</p>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Create account</h1>
        <p className="text-sm text-white/50 mt-1">Join Van-Link today</p>
      </div>

      <div className="flex-1 px-5 pt-8 pb-10 max-w-sm w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-900">{error}</p>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Full Name</Label>
            <Input
              className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white text-[#3D2B0E]"
              placeholder="Your full name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Email</Label>
            <Input
              className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white text-[#3D2B0E]"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Phone Number</Label>
            <Input
              className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white text-[#3D2B0E]"
              placeholder="+267 7X XXX XXX"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Password</Label>
            <Input
              className="mt-1.5 h-12 rounded-xl border-[#E5E7EB] bg-white text-[#3D2B0E]"
              type="password"
              placeholder="Min 8 characters"
              value={formData.password}
              onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">I am a</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { value: 'customer', label: 'Customer 👤' },
                { value: 'driver', label: 'Driver 🚚' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: opt.value }))}
                  className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    formData.role === opt.value
                      ? 'border-[#C9A05A] bg-[#FFF8EC] text-[#3D2B0E]'
                      : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#C9A05A]'
                  }`}
                  disabled={loading}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-bold text-base mt-6"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-[#6B7280]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#C9A05A] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
