import React, { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { SupplierTier, SubscriptionStatus } from '@/features/supplier/store/supplier.slice';
import apiClient from '@/api/client';
import {
  Video, Clock, CheckCircle, XCircle, RefreshCw, Send, AlertCircle, Calendar
} from 'lucide-react';

const SERVICE_TYPES = [
  'Dedicated Listing Support',
  'Product Catalog Management',
  'SEO Optimization',
  'Product Content Writing',
  'Listing Optimization',
  'Technical Support',
  'General Consultation',
] as const;

type ServiceType = typeof SERVICE_TYPES[number];

interface MeetingRequest {
  _id: string;
  serviceType: ServiceType;
  message?: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  scheduledAt?: string;
  meetingLink?: string;
  meetingPlatform?: 'zoom' | 'google_meet';
  adminNotes?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  PENDING:   { label: 'Pending',   icon: <Clock size={13} />,        cls: 'bg-[#fff7ed] text-[#c2410c]' },
  SCHEDULED: { label: 'Scheduled', icon: <Calendar size={13} />,     cls: 'bg-[#eff6ff] text-[#1d4ed8]' },
  COMPLETED: { label: 'Completed', icon: <CheckCircle size={13} />,  cls: 'bg-[#ecfdf5] text-[#059669]' },
  CANCELLED: { label: 'Cancelled', icon: <XCircle size={13} />,      cls: 'bg-[#fef2f2] text-[#dc2626]' },
};

const sectionCls = "bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-lg:p-5";
const refreshBtnCls = "flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] font-bold cursor-pointer text-[0.8rem] px-4 py-2 rounded-[8px] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]";

const MeetingRequests: React.FC = () => {
  const { profile } = useAppSelector(state => state.supplier);
  const isBetaActive =
    profile?.tier === SupplierTier.BETA &&
    profile?.subscription?.status === SubscriptionStatus.ACTIVE;

  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState<{ serviceType: ServiceType | ''; message: string }>({
    serviceType: '',
    message: '',
  });

  const fetchMeetings = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await apiClient.get('/meeting-requests/mine');
      setMeetings(data.meetings || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load meeting requests.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isBetaActive) fetchMeetings(); else setLoading(false); }, [isBetaActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceType) return;
    setSubmitting(true); setError(null); setSuccessMsg(null);
    try {
      await apiClient.post('/meeting-requests', {
        serviceType: form.serviceType,
        message: form.message.trim() || undefined,
      });
      setSuccessMsg('Meeting request submitted! The AMJSTAR team will schedule it soon.');
      setForm({ serviceType: '', message: '' });
      fetchMeetings();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit request.');
    } finally { setSubmitting(false); }
  };

  if (!isBetaActive) {
    return (
      <div className={sectionCls}>
        <div className="flex flex-col items-center gap-4 py-16 text-[#64748b]">
          <Video size={48} className="text-[#cbd5e1]" />
          <p className="text-base font-semibold text-[#334155]">Meeting Support is available for Beta plan subscribers only.</p>
          <p className="text-sm">Upgrade to the Beta plan to access Dedicated Listing Support, SEO Optimization, and more via personal meetings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Request form */}
      <div className={sectionCls}>
        <h2 className="flex items-center gap-2 text-[1.25rem] text-[#1e293b] m-0 mb-6 font-extrabold">
          <Video size={20} /> Schedule a Meeting
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Service Type <span className="text-[#dc2626]">*</span></label>
            <select
              value={form.serviceType}
              onChange={e => setForm(prev => ({ ...prev, serviceType: e.target.value as ServiceType }))}
              required
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm bg-white text-[#0f172a] outline-none focus:border-[#e65c00]"
            >
              <option value="">Select a service...</option>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Additional Notes <span className="text-[#94a3b8] font-normal">(optional)</span></label>
            <textarea
              value={form.message}
              onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Describe what you'd like to discuss or any specific requirements..."
              rows={3}
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#0f172a] resize-y outline-none focus:border-[#e65c00]"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-[8px] text-[#dc2626] text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2 p-3 bg-[#ecfdf5] border border-[#bbf7d0] rounded-[8px] text-[#059669] text-sm">
              <CheckCircle size={16} className="shrink-0 mt-0.5" /> {successMsg}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || !form.serviceType}
            className="self-start flex items-center gap-2 bg-[#e65c00] text-white font-bold px-6 py-2.5 rounded-[8px] text-sm border-none cursor-pointer hover:bg-[#c94f00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Meetings list */}
      <div className={sectionCls}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="flex items-center gap-2 text-[1.25rem] text-[#1e293b] m-0 font-extrabold">
            <Calendar size={20} /> My Meeting Requests
          </h2>
          <button className={refreshBtnCls} onClick={fetchMeetings}><RefreshCw size={15} /> Refresh</button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-[#f8fafc] rounded-[8px] animate-pulse" />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-[#94a3b8]">
            <Calendar size={40} />
            <p className="text-sm">No meeting requests yet. Use the form above to schedule one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {meetings.map(m => {
              const sc = statusConfig[m.status] || statusConfig.PENDING;
              return (
                <div key={m._id} className="bg-[#f8fafc] border border-[#eef2f6] rounded-[10px] p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#0f172a] text-[0.95rem] m-0">{m.serviceType}</p>
                      {m.message && <p className="text-xs text-[#64748b] mt-0.5 m-0">{m.message}</p>}
                    </div>
                    <span className={`flex items-center gap-1 text-[0.7rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${sc.cls}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                  {m.status === 'SCHEDULED' && m.scheduledAt && (
                    <div className="mt-1 p-3 bg-white border border-[#bfdbfe] rounded-[8px] flex flex-col gap-1.5">
                      <p className="text-xs font-semibold text-[#1e40af] m-0">
                        <Calendar size={12} className="inline mr-1" />
                        {new Date(m.scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })} IST
                      </p>
                      <p className="text-xs text-[#334155] m-0 font-medium">
                        Platform: {m.meetingPlatform === 'zoom' ? 'Zoom' : 'Google Meet'}
                      </p>
                      {m.meetingLink && (
                        <a
                          href={m.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#1d4ed8] px-3 py-1.5 rounded-[6px] w-fit no-underline hover:bg-[#1e40af] transition-colors mt-1"
                        >
                          <Video size={13} /> Join Meeting
                        </a>
                      )}
                      {m.adminNotes && (
                        <p className="text-xs text-[#475569] m-0 mt-0.5 italic">Note: {m.adminNotes}</p>
                      )}
                    </div>
                  )}
                  <p className="text-[0.7rem] text-[#94a3b8] m-0 mt-0.5">
                    Requested {new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRequests;
