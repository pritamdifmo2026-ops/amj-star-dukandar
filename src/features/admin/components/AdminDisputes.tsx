import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, CheckCircle, XCircle, Package, ShieldCheck, Clock, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../services/admin.service';
import { useSocket } from '@/shared/contexts/SocketContext';

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  open:              { label: 'Awaiting Review',  color: '#a16207', bg: '#fefce8', border: '#fde047' },
  validated:         { label: 'Validated',        color: '#0284c7', bg: '#eff6ff', border: '#93c5fd' },
  reopened:          { label: 'Reopened',         color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  supplier_resolved: { label: 'Supplier Resolved',color: '#9333ea', bg: '#faf5ff', border: '#d8b4fe' },
  exchange:          { label: 'Exchange',         color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  resolved:          { label: 'Resolved',         color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
  rejected:          { label: 'Rejected',         color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

const EXCHANGE_STAGE_LABEL: Record<string, string> = {
  awaiting_return: 'Awaiting buyer return',
  return_received: 'Return received — preparing replacement',
  replacement_shipped: 'Replacement shipped — awaiting buyer',
};

const FILTERS = [
  { key: 'open',      label: 'Awaiting Review' },
  { key: 'validated', label: 'In Progress' },
  { key: 'resolved',  label: 'Resolved' },
  { key: 'all',       label: 'All' },
];

const AdminDisputes: React.FC = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('open');
  const [rejecting, setRejecting] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { socket } = useSocket();

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['admin', 'disputes', filter],
    queryFn: () => adminService.getDisputes(filter === 'all' ? undefined : filter === 'validated' ? undefined : filter),
  });

  // Real-time: refresh the list whenever any dispute changes anywhere
  useEffect(() => {
    if (!socket) return;
    const handler = () => qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    socket.on('dispute_update', handler);
    return () => { socket.off('dispute_update', handler); };
  }, [socket, qc]);

  // "In Progress" = validated + reopened + supplier_resolved + exchange
  const visible = filter === 'validated'
    ? disputes.filter((d: any) => ['validated', 'reopened', 'supplier_resolved', 'exchange'].includes(d.status))
    : disputes;

  const handleValidate = async (id: string) => {
    setActing(id);
    try {
      await adminService.validateDispute(id);
      toast.success('Dispute validated. Supplier notified.');
      qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to validate');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setActing(rejecting.id);
    try {
      await adminService.rejectDispute(rejecting.id, rejectReason.trim());
      toast.success('Dispute rejected.');
      setRejecting(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[#64748b] m-0">Review buyer tickets and their evidence. Validate authentic disputes so the supplier is notified to resolve, or reject unverifiable ones.</p>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-2 text-xs font-bold rounded-[8px] border cursor-pointer transition-colors ${
              filter === f.key ? 'bg-[#0284c7] text-white border-[#0284c7]' : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-[#0284c7] hover:text-[#0284c7]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-[#0284c7] rounded-full animate-spin" /></div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] py-16 text-center text-sm text-[#94a3b8]">
          No disputes in this category.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((d: any) => {
            const meta = STATUS_META[d.status] || STATUS_META.open;
            const order = d.orderId;
            return (
              <div key={d._id} className="bg-white border border-[#eef2f6] rounded-[12px] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 bg-[#fafbfc] border-b border-[#f1f5f9] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#0f172a] bg-[#e2e8f0] px-2.5 py-1 rounded-full">{order?.orderNumber || '—'}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full capitalize" style={{ color: meta.color, backgroundColor: meta.bg, border: `1px solid ${meta.border}` }}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#fef2f2] text-[#dc2626] border border-[#fca5a5] capitalize">
                      {d.issueType}
                    </span>
                    {d.reopenCount > 0 && (
                      <span className="text-[10px] font-bold text-[#dc2626]">Reopened ×{d.reopenCount}</span>
                    )}
                  </div>
                  <span className="text-xs text-[#94a3b8]">{new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  {/* Parties + amount */}
                  <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#64748b]">Buyer: <strong className="text-[#0f172a]">{d.buyerId?.name || 'Unknown'}</strong></span>
                      <span className="text-[#64748b]">Supplier: <strong className="text-[#0f172a]">{d.supplierBusinessName}</strong></span>
                    </div>
                    {order?.totalAmount != null && (
                      <div className="text-right">
                        <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide m-0">Order Value</p>
                        <p className="text-base font-extrabold text-[#0f172a] m-0">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>

                  {/* Item */}
                  {order?.items?.[0]?.name && (
                    <p className="text-sm font-semibold text-[#0f172a] m-0 flex items-center gap-1.5">
                      <Package size={14} className="text-[#94a3b8]" /> {order.items[0].name}
                    </p>
                  )}

                  {/* Description */}
                  <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[8px] px-4 py-3">
                    <p className="text-xs font-bold text-[#b91c1c] m-0 mb-1 uppercase tracking-wide">Buyer's Complaint</p>
                    <p className="text-sm text-[#7f1d1d] m-0 whitespace-pre-wrap leading-relaxed">{d.description}</p>
                  </div>

                  {/* Evidence */}
                  {d.evidence?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#0f172a] m-0 mb-2">Evidence ({d.evidence.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {d.evidence.map((ev: any, i: number) => (
                          <button key={i} onClick={() => setLightbox(ev.url)} className="w-20 h-20 rounded-[8px] overflow-hidden border border-[#e2e8f0] cursor-pointer hover:border-[#0284c7] p-0 bg-transparent">
                            <img src={ev.url} alt={`evidence ${i + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution (refund/partial/other — exchange has its own block) */}
                  {d.status !== 'exchange' && (d.resolutionMethod || d.resolutionNote) && (
                    <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] px-4 py-3">
                      <p className="text-xs font-bold text-[#15803d] m-0 mb-1 uppercase tracking-wide">Supplier's Resolution</p>
                      {d.resolutionMethod && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803d] bg-white border border-[#bbf7d0] px-2 py-0.5 rounded-full mb-1.5">
                          {{ refund: '💰 Refund', replacement: '📦 Replacement', partial: '⚖️ Partial Settlement', other: '🤝 Other' }[d.resolutionMethod as string] || d.resolutionMethod}
                        </span>
                      )}
                      {d.resolutionNote && <p className="text-sm text-[#166534] m-0">{d.resolutionNote}</p>}
                    </div>
                  )}

                  {/* Actions — only for OPEN disputes */}
                  {d.status === 'open' && (
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => { setRejecting({ id: d._id }); setRejectReason(''); }}
                        disabled={acting === d._id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fca5a5] rounded-[8px] cursor-pointer hover:bg-[#fee2e2] disabled:opacity-50"
                      >
                        <XCircle size={15} /> Reject
                      </button>
                      <button
                        onClick={() => handleValidate(d._id)}
                        disabled={acting === d._id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50"
                      >
                        <ShieldCheck size={15} /> {acting === d._id ? 'Validating…' : 'Validate & Notify Supplier'}
                      </button>
                    </div>
                  )}

                  {/* Status hints for non-open */}
                  {d.status === 'validated' && (
                    <p className="text-xs text-[#0284c7] m-0 flex items-center gap-1.5"><Clock size={13} /> Supplier notified — awaiting their resolution.</p>
                  )}
                  {d.status === 'supplier_resolved' && (
                    <p className="text-xs text-[#9333ea] m-0 flex items-center gap-1.5"><Clock size={13} /> Supplier marked resolved — buyer's 72h confirmation window running.</p>
                  )}
                  {d.status === 'exchange' && (
                    <div className="bg-[#ecfeff] border border-[#a5f3fc] rounded-[8px] px-4 py-3">
                      <p className="text-xs font-bold text-[#0891b2] m-0 mb-1 uppercase tracking-wide">📦 Exchange in progress {d.requiresReturn ? '(return required)' : '(no return)'}</p>
                      <p className="text-sm text-[#155e75] m-0">{EXCHANGE_STAGE_LABEL[d.exchangeStage] || d.exchangeStage}</p>
                      {d.returnTracking && <p className="text-xs text-[#155e75] m-0 mt-1">Return: {d.returnCourier} · {d.returnTracking}</p>}
                      {d.replacementTracking && <p className="text-xs text-[#155e75] m-0">Replacement: {d.replacementCourier} · {d.replacementTracking}</p>}
                      {d.escalatedAt && <p className="text-xs font-bold text-[#dc2626] m-0 mt-1.5 flex items-center gap-1"><AlertTriangle size={12} /> Stalled 7+ days — needs your attention.</p>}
                    </div>
                  )}
                  {d.status === 'resolved' && (
                    <p className="text-xs text-[#15803d] m-0 flex items-center gap-1.5"><CheckCircle size={13} /> Resolved and order completed.</p>
                  )}
                  {d.status === 'rejected' && d.adminRejectedReason && (
                    <p className="text-xs text-[#64748b] m-0">Rejected: {d.adminRejectedReason}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejecting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4" onClick={e => { if (e.target === e.currentTarget && !acting) setRejecting(null); }}>
          <div className="w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden">
            <div className="px-6 py-5">
              <div className="w-12 h-12 rounded-full bg-[#fef2f2] flex items-center justify-center mb-4"><AlertTriangle size={22} className="text-[#dc2626]" /></div>
              <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Reject this dispute?</h3>
              <p className="text-sm text-[#64748b] m-0 mb-4">The order returns to the buyer's confirmation step. The buyer is notified with your reason.</p>
              <label className="text-xs font-bold text-[#475569] block mb-1.5">Reason</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Evidence does not show any defect; product matches the order."
                rows={3}
                className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-[#0284c7] resize-none"
              />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setRejecting(null)} disabled={!!acting} className="flex-1 py-2.5 text-sm font-bold text-[#64748b] bg-[#f1f5f9] rounded-[8px] border-none cursor-pointer disabled:opacity-50">Cancel</button>
                <button onClick={handleReject} disabled={!!acting} className="flex-1 py-2.5 text-sm font-bold text-white bg-[#dc2626] rounded-[8px] border-none cursor-pointer hover:bg-[#b91c1c] disabled:opacity-50">
                  {acting ? 'Rejecting…' : 'Reject Dispute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white border-none cursor-pointer hover:bg-white/20"><X size={20} /></button>
          <img src={lightbox} alt="evidence" className="max-w-full max-h-[90vh] object-contain rounded-[8px]" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;
