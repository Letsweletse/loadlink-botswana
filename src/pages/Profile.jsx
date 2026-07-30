import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, User, Phone, CreditCard, ChevronRight } from 'lucide-react';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [role, setRole] = useState(user?.role || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [idNumber, setIdNumber] = useState(user?.id_number || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setRole(r => r || user.role || '');
    setPhone(p => (p && !String(p).startsWith('PENDING-') ? p : (String(user.phone || '').startsWith('PENDING-') ? '' : user.phone || '')));
  }, [user?.id, user?.phone, user?.role]);

  const needsPhone = String(user?.phone || '').startsWith('PENDING-');

  async function handleSave() {
    setError('');
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length < 8) { setError('Enter a valid Botswana phone number'); return; }
    setSaving(true);
    try {
      await base44.auth.updateMe({ role, phone });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message || 'Could not save your profile.');
    }
    setSaving(false);
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

      {/* Header */}
      <div className="bg-[#3D2B0E] px-5 pt-12 pb-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-4">Account</p>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-[#C9A05A] flex items-center justify-center shrink-0">
            <span className="text-xl font-extrabold text-white">{initials}</span>
          </div>
          <div>
            <p className="font-extrabold text-white text-xl tracking-tight">{user?.full_name || 'Your Profile'}</p>
            <p className="text-sm text-white/50 mt-0.5">{user?.email}</p>
            {role && (
              <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider bg-[#C9A05A]/20 text-[#C9A05A] px-2.5 py-0.5 rounded-full">
                {role}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-24 space-y-5">

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Profile Details</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] flex items-center gap-1.5">
                <User className="h-3 w-3" /> I am a
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-[#3D2B0E]">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client — I need goods transported</SelectItem>
                  <SelectItem value="driver">Driver — I offer transport services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> WhatsApp / Phone
              </Label>
              <Input
                className="mt-1.5 h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-[#3D2B0E]"
                placeholder="+267 7X XXX XXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" /> ID / Omang Number
              </Label>
              <Input
                className="mt-1.5 h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] text-[#3D2B0E]"
                placeholder="National ID number"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
              />
            </div>
          </div>
        </div>

        {needsPhone && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 mb-3">
            <p className="font-bold text-[#92400E] text-sm">Add your phone number</p>
            <p className="text-xs text-[#B45309] mt-1">
              Van-Link uses your phone to match you with loads and drivers. Bookings won't work until you save it.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-3">{error}</div>
        )}

        <Button
          onClick={handleSave}
          className="w-full h-12 rounded-xl bg-[#C9A05A] hover:bg-[#B08A45] text-white font-bold shadow-md shadow-[#C9A05A]/20"
          disabled={saving}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </Button>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
          <button
            className="flex items-center justify-between w-full px-4 py-3.5 text-red-600"
            onClick={() => base44.auth.logout()}
          >
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-semibold">Sign Out</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </button>
        </div>

        <p className="text-center text-[10px] text-[#9CA3AF]">Van-Link · Botswana & SACU</p>
      </div>
    </div>
  );
}
