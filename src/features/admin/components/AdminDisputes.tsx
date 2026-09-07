import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, CheckCircle, XCircle, Package, ShieldCheck, Clock, X,
  Building2, Video, Wallet, Play, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../services/admin.service';
import { useSocket } from '@/shared/contexts/SocketContext';
import { useAppSelector } from '@/store/hooks';

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
  const { user } = useAppSelector(state => state.auth);
  const isSuperAdmin = user?.role === 'superadmin';
  const [filter, setFilter] = useState('open');
  const [rejecting, setRejecting] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyingRefund, setVerifyingRefund] = useState<{
    id: string;
    orderNumber?: string;
    amount?: number;
    commissionAmount?: number;
  } | null>(null);
  const [verifiedDisputeIds, setVerifiedDisputeIds] = useState<Record<string, boolean>>({});
  const [verifyReason, setVerifyReason] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const { socket } = useSocket();

  const { data: disputes = [], isLoading, refetch } = useQuery({
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
    if (acting) return; // guard against double-fire
    setActing(id);
    try {
      await adminService.validateDispute(id);
      toast.success('Dispute validated. Supplier notified.');
      await qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      await refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to validate');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    const rejectId = rejecting.id;
    setActing(rejectId);
    try {
      await adminService.rejectDispute(rejectId, rejectReason.trim());
      toast.success('Dispute rejected.');
      setRejecting(null);
      setRejectReason('');
      await qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      await refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject');
    } finally {
      setActing(null);
    }
  };

  const handleVerifyRefund = async () => {
    if (!verifyingRefund) return;
    if (!isSuperAdmin) {
      toast.error('Access Denied: Only Main Website Admin can verify refunds and unfreeze wallet funds');
      return;
    }
    const targetId = verifyingRefund.id;
    setActing(targetId);
    try {
      const res = await adminService.verifyRefundAndUnfreeze(targetId, verifyReason.trim());

      // 1. Instantly mark as verified in local component state so button immediately switches to verified banner
      setVerifiedDisputeIds(prev => ({ ...prev, [targetId]: true }));

      // 2. Instantly update TanStack Query cache across all dispute lists
      qc.setQueriesData({ queryKey: ['admin', 'disputes'] }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((d: any) =>
          d._id === targetId
            ? {
                ...d,
                adminRefundVerified: true,
                adminRefundVerifiedAt: new Date().toISOString(),
                status: 'resolved',
                resolvedAt: new Date().toISOString(),
              }
            : d
        );
      });

      toast.success(res?.message || 'Refund verified! Supplier wallet commission unfrozen and credited to available balance.');
      setVerifyingRefund(null);
      setVerifyReason('');

      // 3. Re-sync with server in background
      await qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      await refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to verify refund');
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
                    <div className="flex items-center gap-3 text-right">
                      {d.commissionAmount != null && Number(d.commissionAmount) > 0 && (
                        <div className="text-right bg-[#f0f9ff] border border-[#bae6fd] px-3 py-1 rounded-[8px]">
                          <p className="text-[10px] text-[#0284c7] font-bold uppercase tracking-wider m-0 flex items-center justify-end gap-1">
                            <Wallet size={11} /> Commission Frozen
                          </p>
                          <p className="text-sm sm:text-base font-extrabold text-[#0369a1] m-0">
                            ₹{Number(d.commissionAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {order?.totalAmount != null && (
                        <div className="text-right">
                          <p className="text-[10px] text-[#94a3b8] uppercase tracking-wide m-0">Order Value</p>
                          <p className="text-base font-extrabold text-[#0f172a] m-0">₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      )}
                    </div>
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

                  {/* Evidence (Images & Videos) */}
                  {d.evidence?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-[#0f172a] m-0 mb-2">Evidence ({d.evidence.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {d.evidence.map((ev: any, i: number) => {
                          const isVid = ev.type === 'video' || ev.url?.match(/\.(mp4|webm|mov|ogg)($|\?)/i) || ev.url?.includes('/video/upload/');
                          return (
                            <button
                              key={i}
                              onClick={() => setLightbox({ url: ev.url, type: isVid ? 'video' : 'image' })}
                              className="relative w-20 h-20 rounded-[8px] overflow-hidden border border-[#e2e8f0] cursor-pointer hover:border-[#0284c7] p-0 bg-black flex items-center justify-center group"
                            >
                              {isVid ? (
                                <>
                                  <video src={ev.url} className="w-full h-full object-cover opacity-80" muted playsInline />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20">
                                    <div className="w-7 h-7 rounded-full bg-white/90 text-[#0f172a] flex items-center justify-center shadow">
                                      <Play size={13} className="ml-0.5 fill-current" />
                                    </div>
                                  </div>
                                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1 rounded flex items-center gap-0.5">
                                    <Video size={9} /> Video
                                  </span>
                                </>
                              ) : (
                                <img src={ev.url} alt={`evidence ${i + 1}`} className="w-full h-full object-cover" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Buyer's Refund Account Details (if provided) */}
                  {d.buyerRefundDetails && (d.buyerRefundDetails.accountNumber || d.buyerRefundDetails.upiId) && (
                    <div className="bg-[#f0fdfa] border border-[#99f6e4] rounded-[8px] px-4 py-3">
                      <p className="text-xs font-bold text-[#0f766e] m-0 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                        <Building2 size={14} /> Buyer's Refund Account Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#134e4a]">
                        {d.buyerRefundDetails.accountHolderName && (
                          <p className="m-0"><span className="text-[#64748b]">A/C Holder:</span> <strong>{d.buyerRefundDetails.accountHolderName}</strong></p>
                        )}
                        {d.buyerRefundDetails.bankName && (
                          <p className="m-0"><span className="text-[#64748b]">Bank:</span> <strong>{d.buyerRefundDetails.bankName}</strong></p>
                        )}
                        {d.buyerRefundDetails.accountNumber && (
                          <p className="m-0"><span className="text-[#64748b]">A/C Number:</span> <strong className="font-mono">{d.buyerRefundDetails.accountNumber}</strong></p>
                        )}
                        {d.buyerRefundDetails.ifscCode && (
                          <p className="m-0"><span className="text-[#64748b]">IFSC:</span> <strong className="font-mono">{d.buyerRefundDetails.ifscCode}</strong></p>
                        )}
                        {d.buyerRefundDetails.upiId && (
                          <p className="m-0"><span className="text-[#64748b]">UPI ID:</span> <strong className="font-mono">{d.buyerRefundDetails.upiId}</strong></p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resolution (refund/partial/other — exchange has its own block) */}
                  {d.status !== 'exchange' && (d.resolutionMethod || d.resolutionNote) && (
                    <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] px-4 py-3 flex flex-col gap-2.5">
                      <div>
                        <p className="text-xs font-bold text-[#15803d] m-0 mb-1 uppercase tracking-wide">Supplier's Resolution</p>
                        {d.resolutionMethod && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803d] bg-white border border-[#bbf7d0] px-2 py-0.5 rounded-full mb-1.5">
                            {{ refund: '💰 Refund', replacement: '📦 Replacement', partial: '⚖️ Partial Settlement', other: '🤝 Other' }[d.resolutionMethod as string] || d.resolutionMethod}
                          </span>
                        )}
                        {d.refundTransactionId && <p className="text-sm text-[#166534] m-0 font-semibold">UTR: <span className="font-mono">{d.refundTransactionId}</span></p>}
                        {d.resolutionNote && <p className="text-sm text-[#166534] m-0">{d.resolutionNote}</p>}
                      </div>

                      {/* Refund Verification Badge / Action Button for Admin */}
                      {d.resolutionMethod === 'refund' && (() => {
                        const isRefundVerified = d.adminRefundVerified || d.status === 'resolved' || !!verifiedDisputeIds[d._id];
                        // The admin can only verify & unfreeze once the buyer has confirmed
                        // the refund ("all good"), or the 72-hour confirmation window has passed.
                        const buyerConfirmed = !!d.buyerConfirmedAt;
                        const resolvedAtMs = d.supplierResolvedAt ? new Date(d.supplierResolvedAt).getTime() : null;
                        const windowMs = 72 * 60 * 60 * 1000;
                        const windowElapsed = resolvedAtMs != null && (Date.now() - resolvedAtMs) >= windowMs;
                        const canVerify = buyerConfirmed || windowElapsed;
                        const hoursLeft = resolvedAtMs != null
                          ? Math.max(0, Math.ceil((resolvedAtMs + windowMs - Date.now()) / (60 * 60 * 1000)))
                          : null;
                        return (
                          <div className="pt-2 border-t border-[#bbf7d0]">
                            {isRefundVerified ? (
                              <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-[#15803d] bg-[#dcfce7] border border-[#86efac] px-3 py-2.5 rounded-[8px]">
                                <div className="flex items-center gap-2">
                                  <CheckCircle size={15} className="flex-shrink-0 text-[#15803d]" />
                                  <span>Refund verified by Admin. Supplier's frozen platform commission has been returned to their wallet balance.</span>
                                </div>
                                {d.commissionAmount != null && Number(d.commissionAmount) > 0 && (
                                  <span className="bg-white text-[#15803d] px-2.5 py-0.5 rounded-full border border-[#86efac] font-extrabold text-xs shadow-xs">
                                    +₹{Number(d.commissionAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Unfrozen
                                  </span>
                                )}
                              </div>
                            ) : canVerify ? (
                              <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[8px] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold text-[#92400e] m-0 flex items-center gap-1.5">
                                    <Wallet size={14} /> Refund Pending Admin Verification
                                  </p>
                                  <p className="text-[11px] text-[#b45309] m-0 mt-0.5">
                                    {buyerConfirmed
                                      ? 'Buyer confirmed receiving the refund. '
                                      : 'Buyer did not respond within 72 hours. '}
                                    Supplier submitted refund with UTR <strong className="font-mono">{d.refundTransactionId || 'N/A'}</strong>. Verify to resolve ticket and credit frozen commission{d.commissionAmount != null && Number(d.commissionAmount) > 0 ? (
                                      <strong className="text-[#0369a1] font-bold"> (₹{Number(d.commissionAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</strong>
                                    ) : ''} back to supplier wallet.
                                  </p>
                                </div>
                                {isSuperAdmin ? (
                                  <button
                                    onClick={() => {
                                      setVerifyingRefund({
                                        id: d._id,
                                        orderNumber: order?.orderNumber,
                                        amount: order?.totalAmount,
                                        commissionAmount: d.commissionAmount,
                                      });
                                      setVerifyReason('');
                                    }}
                                    disabled={acting === d._id}
                                    className="px-3.5 py-2 text-xs font-bold text-white bg-[#0284c7] hover:bg-[#0369a1] rounded-[8px] border-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-sm disabled:opacity-50 transition-colors"
                                  >
                                    <ShieldCheck size={14} /> Verify & Unfreeze Wallet
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    title="Locked: Only Main Website Admin (SuperAdmin) can verify refund and unfreeze wallet funds"
                                    className="px-3.5 py-2 text-xs font-bold text-[#94a3b8] bg-[#f1f5f9] border border-[#e2e8f0] rounded-[8px] cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap opacity-80"
                                  >
                                    <Lock size={14} /> Unfreeze Locked (Main Admin Only)
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3">
                                <p className="text-xs font-bold text-[#475569] m-0 flex items-center gap-1.5">
                                  <Clock size={14} /> Waiting for Buyer Confirmation
                                </p>
                                <p className="text-[11px] text-[#64748b] m-0 mt-0.5">
                                  Supplier submitted a refund (UTR <strong className="font-mono">{d.refundTransactionId || 'N/A'}</strong>). You can verify &amp; unfreeze the supplier's commission once the buyer confirms receipt{hoursLeft != null ? `, or after the 72-hour window ends (~${hoursLeft}h left)` : ' or the 72-hour window ends'}.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                    d.buyerConfirmedAt ? (
                      <p className="text-xs text-[#059669] m-0 flex items-center gap-1.5"><CheckCircle size={13} /> Buyer confirmed the refund — awaiting your verification.</p>
                    ) : (
                      <p className="text-xs text-[#9333ea] m-0 flex items-center gap-1.5"><Clock size={13} /> Supplier marked resolved — buyer's 72h confirmation window running.</p>
                    )
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

      {/* Verify Refund & Unfreeze Modal */}
      {verifyingRefund && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4" onClick={e => { if (e.target === e.currentTarget && !acting) setVerifyingRefund(null); }}>
          <div className="w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden">
            <div className="px-6 py-5">
              <div className="w-12 h-12 rounded-full bg-[#ecfeff] flex items-center justify-center mb-4"><Wallet size={22} className="text-[#0284c7]" /></div>
              <h3 className="text-base font-extrabold text-[#0f172a] m-0 mb-1">Verify Refund & Unfreeze Commission?</h3>
              <p className="text-sm text-[#64748b] m-0 mb-3">
                Confirming this refund will mark order {verifyingRefund.orderNumber ? `(#${verifyingRefund.orderNumber})` : ''} as resolved. The supplier's frozen commission will be automatically unfrozen and deposited into their available wallet balance.
              </p>

              {verifyingRefund.commissionAmount != null && Number(verifyingRefund.commissionAmount) > 0 && (
                <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-[10px] p-3 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#0369a1] uppercase font-bold tracking-wide block">Commission to Unfreeze</span>
                    <span className="text-xs text-[#64748b]">Credited to supplier available balance</span>
                  </div>
                  <span className="text-base font-extrabold text-[#0284c7]">
                    ₹{Number(verifyingRefund.commissionAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <label className="text-xs font-bold text-[#475569] block mb-1.5">Verification Note / Reason (Optional)</label>
              <textarea
                value={verifyReason}
                onChange={e => setVerifyReason(e.target.value)}
                placeholder="e.g. UTR verified with buyer's bank statement. Full refund confirmed."
                rows={3}
                className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-[#0284c7] resize-none"
              />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setVerifyingRefund(null)} disabled={!!acting} className="flex-1 py-2.5 text-sm font-bold text-[#64748b] bg-[#f1f5f9] rounded-[8px] border-none cursor-pointer disabled:opacity-50">Cancel</button>
                <button onClick={handleVerifyRefund} disabled={!!acting} className="flex-1 py-2.5 text-sm font-bold text-white bg-[#0284c7] rounded-[8px] border-none cursor-pointer hover:bg-[#0369a1] disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={16} /> {acting ? 'Verifying…' : 'Verify & Unfreeze'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence lightbox (Images & Videos) */}
      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white border-none cursor-pointer hover:bg-white/20"><X size={20} /></button>
          {lightbox.type === 'video' ? (
            <video
              src={lightbox.url}
              controls
              autoPlay
              className="max-w-full max-h-[85vh] rounded-[8px] shadow-2xl bg-black"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img src={lightbox.url} alt="evidence" className="max-w-full max-h-[90vh] object-contain rounded-[8px]" onClick={e => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;
