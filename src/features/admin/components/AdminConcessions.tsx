import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, RefreshCw, HandCoins } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import concessionApi, {
  type ConcessionRequest,
  type ConcessionStatus,
  type ConcessionType,
} from '../services/concession.api';

const STATUS_FILTERS: (ConcessionStatus | 'all')[] = ['pending', 'approved', 'rejected', 'all'];

const TYPE_LABEL: Record<ConcessionType, string> = {
  subscription_trial:    'Subscription Trial',
  subscription_price:    'Custom Subscription Price',
  subscription_duration: 'Custom Subscription Duration',
  listing_fee_waiver:    'Listing-Fee Waiver',
  listing_fee_custom:    'Custom Listing Fee',
};

const STATUS_STYLE: Record<ConcessionStatus, string> = {
  pending:   'bg-[#fff7ed] text-[#c2410c]',
  approved:  'bg-[#ecfdf5] text-[#059669]',
  rejected:  'bg-[#fef2f2] text-[#b91c1c]',
  cancelled: 'bg-[#f1f5f9] text-[#64748b]',
};

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function summariseProposal(r: ConcessionRequest): string {
  const p = r.proposal || {};
  switch (r.type) {
    case 'subscription_trial':    return `${p.tier ?? '?'} · ${p.trialDays ?? '?'} days trial`;
    case 'subscription_price':    return `₹${p.price ?? '?'} for next cycle`;
    case 'subscription_duration': return `${p.durationMonths ?? '?'} months`;
    case 'listing_fee_waiver':    return `Waive until ${p.until ? new Date(p.until).toLocaleDateString('en-IN') : '?'}`;
    case 'listing_fee_custom': {
      const bits: string[] = [];
      if (p.perProduct != null) bits.push(`₹${p.perProduct}/product`);
      if (p.minMonthly != null) bits.push(`min ₹${p.minMonthly}/mo`);
      return bits.join(' · ') || 'custom fee';
    }
  }
}

const Row: React.FC<{
  request: ConcessionRequest;
  canDecide: boolean;
  onDecide: (r: ConcessionRequest, mode: 'approve' | 'reject') => void;
}> = ({ request, canDecide, onDecide }) => {
  const supplier = typeof request.supplierId === 'object' ? request.supplierId : null;
  const requester = typeof request.requestedBy === 'object' ? request.requestedBy : null;
  return (
    <tr className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
      <td className="py-3 px-4">
        <div className="font-semibold text-[#0f172a]">{supplier?.businessName ?? '—'}</div>
        <div className="text-xs text-[#64748b] mt-0.5">
          {supplier?.tier ?? ''} {supplier?.subscription?.status ? `· ${supplier.subscription.status}` : ''}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="font-semibold text-[#0f172a]">{TYPE_LABEL[request.type]}</div>
        <div className="text-xs text-[#475569] mt-0.5">{summariseProposal(request)}</div>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-[#0f172a]">{requester?.name ?? '—'}</div>
        <div className="text-xs text-[#64748b] mt-0.5 capitalize">{request.source}{requester?.role ? ` · ${requester.role}` : ''}</div>
      </td>
      <td className="py-3 px-4 text-sm text-[#475569] max-w-[240px]">
        <div className="line-clamp-2" title={request.reason}>{request.reason}</div>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-[6px] uppercase ${STATUS_STYLE[request.status]}`}>
          {request.status}
        </span>
        <div className="text-xs text-[#94a3b8] mt-1">{fmtDate(request.createdAt)}</div>
      </td>
      <td className="py-3 px-4">
        {request.status === 'pending' ? (
          canDecide ? (
            <div className="flex gap-2">
              <button
                onClick={() => onDecide(request, 'approve')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer"
              >
                <CheckCircle2 size={13} /> Approve
              </button>
              <button
                onClick={() => onDecide(request, 'reject')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-white border border-[#fecaca] text-[#b91c1c] text-xs font-bold cursor-pointer hover:bg-[#fef2f2]"
              >
                <XCircle size={13} /> Reject
              </button>
            </div>
          ) : (
            <span className="text-xs text-[#94a3b8] italic">Awaiting superadmin</span>
          )
        ) : (
          <div className="text-xs text-[#64748b]">
            {request.decisionNote ? <span title={request.decisionNote}>{request.decisionNote.slice(0, 60)}…</span> : '—'}
          </div>
        )}
      </td>
    </tr>
  );
};

const DecisionDialog: React.FC<{
  target: { request: ConcessionRequest; mode: 'approve' | 'reject' } | null;
  onClose: () => void;
  onDone: () => void;
}> = ({ target, onClose, onDone }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => { setNote(''); setError(''); }, [target]);

  if (!target) return null;
  const { request, mode } = target;

  const submit = async () => {
    setError('');
    if (mode === 'reject' && !note.trim()) {
      setError('A reason is required to reject.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'approve') await concessionApi.approve(request._id, note.trim() || undefined);
      else                    await concessionApi.reject(request._id, note.trim());
      onDone();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message ?? 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <h3 className="text-base font-extrabold text-[#0f172a]">
          {mode === 'approve' ? 'Approve concession' : 'Reject concession'}
        </h3>
        <div className="bg-[#f8fafc] rounded-[10px] p-3 text-sm">
          <div className="font-semibold text-[#0f172a]">{TYPE_LABEL[request.type]}</div>
          <div className="text-[#475569] mt-1">{summariseProposal(request)}</div>
          <div className="text-xs text-[#64748b] mt-2 italic">"{request.reason}"</div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
            Decision note {mode === 'reject' && <span className="text-[#b91c1c]">*</span>}
          </span>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder={mode === 'approve' ? 'Optional note for the requester' : 'Why is this being rejected?'}
            className="border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#0f172a]"
          />
        </label>
        {error && <div className="text-xs text-[#b91c1c] bg-[#fef2f2] px-3 py-2 rounded-[8px]">{error}</div>}
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-[8px] border border-[#e2e8f0] bg-white text-[#475569] font-semibold text-sm cursor-pointer hover:bg-[#f8fafc] disabled:opacity-50"
          >Cancel</button>
          <button
            onClick={submit}
            disabled={submitting}
            className={`px-4 py-2 rounded-[8px] text-white font-bold text-sm cursor-pointer disabled:opacity-50 ${
              mode === 'approve' ? 'bg-[#059669] hover:bg-[#047857]' : 'bg-[#b91c1c] hover:bg-[#991b1b]'
            }`}
          >
            {submitting ? 'Working…' : mode === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminConcessions: React.FC = () => {
  const [status, setStatus] = useState<ConcessionStatus | 'all'>('pending');
  const [target, setTarget] = useState<{ request: ConcessionRequest; mode: 'approve' | 'reject' } | null>(null);
  const qc = useQueryClient();
  const user = useAppSelector(s => s.auth.user);
  const canDecide = user?.role === 'superadmin';

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-concessions', status],
    queryFn: () => concessionApi.list(status),
  });

  const rows = data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <HandCoins size={22} className="text-[#7c3aed]" />
          <h3 className="text-lg font-extrabold text-[#0f172a]">Billing Concessions</h3>
        </div>
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold uppercase tracking-wider cursor-pointer ${
                status === s
                  ? 'bg-[#0f172a] text-white'
                  : 'bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc]'
              }`}
            >{s}</button>
          ))}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-[8px] border border-[#e2e8f0] bg-white text-[#475569] cursor-pointer hover:bg-[#f8fafc]"
            title="Refresh"
          ><RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#e2e8f0] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#f8fafc] text-left text-[11px] uppercase tracking-wider text-[#475569]">
            <tr>
              <th className="py-3 px-4 font-bold">Supplier</th>
              <th className="py-3 px-4 font-bold">Type / Proposal</th>
              <th className="py-3 px-4 font-bold">Requested by</th>
              <th className="py-3 px-4 font-bold">Reason</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-10 text-center text-[#64748b] text-sm">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-[#64748b] text-sm">
                <Clock size={26} className="mx-auto mb-2 text-[#94a3b8]" />
                No {status === 'all' ? '' : status} concession requests.
              </td></tr>
            ) : rows.map(r => (
              <Row key={r._id} request={r} canDecide={canDecide} onDecide={(request, mode) => setTarget({ request, mode })} />
            ))}
          </tbody>
        </table>
      </div>

      {!canDecide && (
        <div className="text-xs text-[#64748b] bg-[#f8fafc] rounded-[8px] px-4 py-2 border border-[#e2e8f0]">
          Only superadmin can approve or reject concession requests. You can view and recommend.
        </div>
      )}

      <DecisionDialog
        target={target}
        onClose={() => setTarget(null)}
        onDone={() => qc.invalidateQueries({ queryKey: ['admin-concessions'] })}
      />
    </div>
  );
};

export default AdminConcessions;
