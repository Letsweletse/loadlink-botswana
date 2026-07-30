import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MessageSquare, Plus, ChevronDown, ChevronUp, Clock, Phone } from 'lucide-react';

const TYPE_CONFIG = {
  emergency: { label: '🚨 Emergency', color: 'bg-red-50 text-red-700 border-red-200' },
  complaint:  { label: '😤 Complaint', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  dispute:    { label: '⚖️ Dispute',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  other:      { label: '💬 Other',     color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const STATUS_CONFIG = {
  open:      { label: 'Open',      color: 'bg-[#FFFBEB] text-[#D97706]' },
  in_review: { label: 'In Review', color: 'bg-[#EFF6FF] text-[#2563EB]' },
  resolved:  { label: 'Resolved',  color: 'bg-[#F0FDF4] text-[#16A34A]' },
  closed:    { label: 'Closed',    color: 'bg-[#F9FAFB] text-[#6B7280]' },
};

function TicketCard({ ticket }) {
  const [expanded, setExpanded] = useState(false);
  const type = TYPE_CONFIG[ticket.type];
  const status = STATUS_CONFIG[ticket.status];
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
      <button className="w-full text-left p-4" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${type?.color}`}>{type?.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status?.color}`}>{status?.label}</span>
            </div>
            <p className="font-bold text-sm text-[#0F0F0F]">{ticket.subject}</p>
            <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(ticket.created_date).toLocaleDateString()}
            </p>
          </div>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-[#9CA3AF] shrink-0 mt-1" />
            : <ChevronDown className="h-4 w-4 text-[#9CA3AF] shrink-0 mt-1" />
          }
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#E5E7EB] pt-3">
          <p className="text-sm text-[#6B7280]">{ticket.description}</p>
          {ticket.booking_id && (
            <p className="text-xs text-[#6B7280]">Ref: <span className="font-mono text-[#0F0F0F]">{ticket.booking_id}</span></p>
          )}
          {ticket.admin_reply ? (
            <div className="bg-[#FFF0E6] border border-[#F97316]/20 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#F97316] mb-1">Admin Response</p>
              <p className="text-sm text-[#0F0F0F]">{ticket.admin_reply}</p>
            </div>
          ) : (
            <p className="text-xs text-[#9CA3AF] italic">Awaiting response…</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Support() {
  const { user } = useAuth();
  const role = user?.role || 'client';
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const prefillType = urlParams.get('type') || '';
  const prefillBookingId = urlParams.get('booking_id') || '';
  const [showForm, setShowForm] = useState(!!prefillType);
  const [form, setForm] = useState({
    type: prefillType,
    subject: prefillType === 'emergency' ? 'Emergency — Need Immediate Help' : '',
    description: '',
    booking_id: prefillBookingId,
  });

  useEffect(() => {
    base44.entities.SupportTicket.filter({ submitted_by: user.email }, '-created_date', 50)
      .then(setTickets)
      .finally(() => setLoading(false));
  }, [user.email]);

  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const ticket = await base44.entities.SupportTicket.create({
      submitted_by: user.email,
      role,
      type: form.type,
      subject: form.subject,
      description: form.description,
      booking_id: form.booking_id || undefined,
      priority: form.type === 'emergency' ? 'urgent' : 'medium',
    });
    setTickets(prev => [ticket, ...prev]);
    setForm({ type: '', subject: '', description: '', booking_id: '' });
    setShowForm(false);
    setSubmitting(false);
  }

  return (
    <div className="max-w-lg mx-auto bg-[#F9FAFB] min-h-screen">

      {/* Header */}
      <div className="bg-[#0F0F0F] px-4 pt-12 pb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Help</p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Support</h1>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(v => !v)}
          className="rounded-xl bg-[#F97316] hover:bg-[#EA6A0A] text-white font-semibold h-9"
        >
          <Plus className="h-4 w-4 mr-1" /> New Ticket
        </Button>
      </div>

      <div className="p-4 pb-24 space-y-4">

        {/* Emergency banner */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">Life-threatening emergency?</p>
            <p className="text-xs text-red-600 mt-0.5">Call emergency services immediately</p>
            <div className="flex gap-3 mt-2">
              <a href="tel:999" className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
                <Phone className="h-3 w-3" /> 999
              </a>
              <a href="tel:911" className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
                <Phone className="h-3 w-3" /> 911
              </a>
            </div>
          </div>
        </div>

        {/* New Ticket Form */}
        {showForm && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">New Ticket</p>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-[#6B7280]">Issue Type</Label>
                <Select value={form.type} onValueChange={v => update('type', v)}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">🚨 Emergency</SelectItem>
                    <SelectItem value="complaint">😤 Complaint</SelectItem>
                    <SelectItem value="dispute">⚖️ Dispute</SelectItem>
                    <SelectItem value="other">💬 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#6B7280]">Subject</Label>
                <Input className="mt-1.5 h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB]" placeholder="Brief summary" value={form.subject} onChange={e => update('subject', e.target.value)} required />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#6B7280]">Details</Label>
                <Textarea className="mt-1.5 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] resize-none" placeholder="Describe the issue…" value={form.description} onChange={e => update('description', e.target.value)} required rows={4} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#6B7280]">Booking ID <span className="text-[#9CA3AF] font-normal">(optional)</span></Label>
                <Input className="mt-1.5 h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB]" placeholder="Paste booking ID" value={form.booking_id} onChange={e => update('booking_id', e.target.value)} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl border-[#E5E7EB] font-semibold" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 h-11 rounded-xl bg-[#F97316] hover:bg-[#EA6A0A] text-white font-bold" disabled={submitting || !form.type}>
                  {submitting ? 'Submitting…' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-14 w-14 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <MessageSquare className="h-6 w-6 text-[#9CA3AF]" />
            </div>
            <p className="font-bold text-[#0F0F0F] mb-1">No tickets yet</p>
            <p className="text-xs text-[#6B7280]">Tap "New Ticket" to contact our team.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
