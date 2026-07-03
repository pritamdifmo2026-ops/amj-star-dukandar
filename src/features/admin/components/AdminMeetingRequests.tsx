import React, { useEffect, useState } from 'react';
import apiClient from '@/api/client';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import {
  Video, Clock, CheckCircle, XCircle, RefreshCw, Calendar,
  AlertCircle, User, Link as LinkIcon
} from 'lucide-react';

interface MeetingRequest {
  _id: string;
  supplierName: string;
  supplierEmail: string;
  serviceType: string;
  message?: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  scheduledAt?: string;
  meetingLink?: string;
  meetingPlatform?: 'zoom' | 'google_meet';
  adminNotes?: string;
  createdAt: string;
}

const STATUS_FILTERS = ['ALL', 'PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const;

const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  PENDING:   { label: 'Pending',   icon: <Clock size={13} />,        cls: 'bg-[#fff7ed] text-[#c2410c]' },
  SCHEDULED: { label: 'Scheduled', icon: <Calendar size={13} />,     cls: 'bg-[#eff6ff] text-[#1d4ed8]' },
  COMPLETED: { label: 'Completed', icon: <CheckCircle size={13} />,  cls: 'bg-[#ecfdf5] text-[#059669]' },
  CANCELLED: { label: 'Cancelled', icon: <XCircle size={13} />,      cls: 'bg-[#fef2f2] text-[#dc2626]' },
};

const AdminMeetingRequests: React.FC = () => {
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('ALL');

  // Schedule modal
  const [scheduleModal, setScheduleModal] = useState<{ open: boolean; meeting: MeetingRequest | null }>({ open: false, meeting: null });
  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: '',
    meetingLink: '',
    meetingPlatform: 'zoom' as 'zoom' | 'google_meet',
    adminNotes: '',
  });
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  // Action in-progress tracker
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchMeetings = async () => {
    setLoading(true); setError(null);
    try {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const { data } = await apiClient.get(`/meeting-requests${params}`);
      setMeetings(data.meetings || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load meeting requests.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMeetings(); }, [statusFilter]);

  const openScheduleModal = (meeting: MeetingRequest) => {
    setScheduleForm({
      scheduledAt: meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : '',
      meetingLink: meeting.meetingLink || '',
      meetingPlatform: meeting.meetingPlatform || 'zoom',
      adminNotes: meeting.adminNotes || '',
    });
    setScheduleError(null);
    setScheduleModal({ open: true, meeting });
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleModal.meeting) return;
    if (!scheduleForm.scheduledAt || !scheduleForm.meetingLink) {
      setScheduleError('Date/time and meeting link are required.');
      return;
    }
    setScheduleSubmitting(true); setScheduleError(null);
    try {
      await apiClient.patch(`/meeting-requests/${scheduleModal.meeting._id}/schedule`, scheduleForm);
      setScheduleModal({ open: false, meeting: null });
      fetchMeetings();
    } catch (err: any) {
      setScheduleError(err?.response?.data?.message || err?.message || 'Failed to schedule meeting.');
    } finally { setScheduleSubmitting(false); }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this meeting request?')) return;
    setActionId(id);
    try {
      await apiClient.patch(`/meeting-requests/${id}/cancel`, {});
      fetchMeetings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to cancel.');
    } finally { setActionId(null); }
  };

  const handleComplete = async (id: string) => {
    if (!window.confirm('Mark this meeting as completed?')) return;
    setActionId(id);
    try {
      await apiClient.patch(`/meeting-requests/${id}/complete`, {});
      fetchMeetings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to complete.');
    } finally { setActionId(null); }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors cursor-pointer ${
                statusFilter === f
                  ? 'bg-[#0284c7] text-white border-[#0284c7]'
                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#0284c7] hover:text-[#0284c7]'
              }`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button
          onClick={fetchMeetings}
          className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] font-bold cursor-pointer text-xs px-4 py-2 rounded-[8px] hover:bg-[#f1f5f9]"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-[8px] text-[#dc2626] text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-[10px] border border-[#eef2f6] animate-pulse" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white rounded-[10px] border border-[#eef2f6] p-8 flex flex-col items-center gap-3 text-[#94a3b8]">
          <Video size={40} />
          <p className="text-sm">No meeting requests found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map(m => {
            const sc = statusConfig[m.status] || statusConfig.PENDING;
            const busy = actionId === m._id;
            return (
              <div key={m._id} className="bg-white rounded-[10px] border border-[#eef2f6] p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-[#94a3b8] shrink-0" />
                      <span className="font-bold text-[#0f172a] text-sm">{m.supplierName}</span>
                      <span className="text-xs text-[#94a3b8]">({m.supplierEmail})</span>
                    </div>
                    <p className="font-semibold text-[#334155] text-[0.9rem] m-0">{m.serviceType}</p>
                    {m.message && <p className="text-xs text-[#64748b] m-0">{m.message}</p>}
                  </div>
                  <span className={`flex items-center gap-1 text-[0.7rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${sc.cls}`}>
                    {sc.icon} {sc.label}
                  </span>
                </div>

                {m.status === 'SCHEDULED' && m.scheduledAt && (
                  <div className="p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] flex flex-col gap-1">
                    <p className="text-xs font-semibold text-[#1e40af] m-0">
                      <Calendar size={12} className="inline mr-1" />
                      {new Date(m.scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })} IST
                    </p>
                    <p className="text-xs text-[#334155] m-0">Platform: {m.meetingPlatform === 'zoom' ? 'Zoom' : 'Google Meet'}</p>
                    {m.meetingLink && (
                      <a href={m.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1d4ed8] font-semibold flex items-center gap-1 no-underline hover:underline">
                        <LinkIcon size={12} /> {m.meetingLink}
                      </a>
                    )}
                    {m.adminNotes && <p className="text-xs text-[#475569] m-0 italic">Note: {m.adminNotes}</p>}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.7rem] text-[#94a3b8] m-0">
                    {new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex gap-2">
                    {(m.status === 'PENDING' || m.status === 'SCHEDULED') && (
                      <button
                        onClick={() => openScheduleModal(m)}
                        className="flex items-center gap-1.5 bg-[#0284c7] text-white font-bold text-xs px-4 py-2 rounded-[8px] border-none cursor-pointer hover:bg-[#0369a1] transition-colors"
                      >
                        <Calendar size={13} /> {m.status === 'SCHEDULED' ? 'Reschedule' : 'Schedule'}
                      </button>
                    )}
                    {m.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleComplete(m._id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 bg-[#059669] text-white font-bold text-xs px-4 py-2 rounded-[8px] border-none cursor-pointer hover:bg-[#047857] transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={13} /> Done
                      </button>
                    )}
                    {(m.status === 'PENDING' || m.status === 'SCHEDULED') && (
                      <button
                        onClick={() => handleCancel(m._id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 bg-[#fef2f2] text-[#dc2626] font-bold text-xs px-4 py-2 rounded-[8px] border border-[#fecaca] cursor-pointer hover:bg-[#dc2626] hover:text-white transition-colors disabled:opacity-50"
                      >
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule modal */}
      <Modal
        isOpen={scheduleModal.open}
        onClose={() => setScheduleModal({ open: false, meeting: null })}
        title={`Schedule Meeting — ${scheduleModal.meeting?.serviceType || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleModal({ open: false, meeting: null })}>Cancel</Button>
            <Button onClick={handleScheduleSubmit} disabled={scheduleSubmitting}>
              {scheduleSubmitting ? 'Saving...' : 'Confirm & Notify Supplier'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-1">
          {scheduleModal.meeting && (
            <div className="p-3 bg-[#f8fafc] rounded-[8px] border border-[#e2e8f0] text-sm">
              <span className="font-bold text-[#0f172a]">{scheduleModal.meeting.supplierName}</span>
              <span className="text-[#64748b]"> · {scheduleModal.meeting.supplierEmail}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Date &amp; Time <span className="text-[#dc2626]">*</span></label>
            <input
              type="datetime-local"
              value={scheduleForm.scheduledAt}
              onChange={e => setScheduleForm(p => ({ ...p, scheduledAt: e.target.value }))}
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Platform <span className="text-[#dc2626]">*</span></label>
            <div className="flex gap-3">
              {(['zoom', 'google_meet'] as const).map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="platform"
                    value={p}
                    checked={scheduleForm.meetingPlatform === p}
                    onChange={() => setScheduleForm(prev => ({ ...prev, meetingPlatform: p }))}
                    className="accent-[#0284c7]"
                  />
                  {p === 'zoom' ? 'Zoom' : 'Google Meet'}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Meeting Link <span className="text-[#dc2626]">*</span></label>
            <input
              type="url"
              value={scheduleForm.meetingLink}
              onChange={e => setScheduleForm(p => ({ ...p, meetingLink: e.target.value }))}
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-[#0284c7]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Notes for Supplier <span className="text-[#94a3b8] font-normal">(optional)</span></label>
            <textarea
              value={scheduleForm.adminNotes}
              onChange={e => setScheduleForm(p => ({ ...p, adminNotes: e.target.value }))}
              placeholder="Any preparation tips or agenda items..."
              rows={3}
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm resize-y outline-none focus:border-[#0284c7]"
            />
          </div>

          {scheduleError && (
            <div className="flex items-start gap-2 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-[8px] text-[#dc2626] text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {scheduleError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminMeetingRequests;
