import React, { useState, useEffect } from 'react';
import { orderApi } from '@/features/order/services/order.api';
import apiClient from '@/api/client';
import {
  ArrowLeft, Phone, Mail, Package, Truck, Boxes, CheckCircle, AlertTriangle,
  Clock, XCircle, Download, Star, Upload, X, ShieldCheck, Wifi,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Status meta ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.FC<any> }> = {
  pending:                { label: 'Processing',                color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd',  Icon: Clock },
  paid:                   { label: 'Pending Dispatch',          color: '#a16207', bg: '#fefce8', border: '#fde047',  Icon: Clock },
  processing:             { label: 'Pending Dispatch',          color: '#a16207', bg: '#fefce8', border: '#fde047',  Icon: Clock },
  packed:                 { label: 'Packed',                    color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc',  Icon: Boxes },
  shipped:                { label: 'Dispatched',                color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd',  Icon: Truck },
  awaiting_confirmation:  { label: 'Awaiting Confirmation',     color: '#9333ea', bg: '#faf5ff', border: '#d8b4fe',  Icon: Clock },
  completed:              { label: 'Completed',                 color: '#15803d', bg: '#f0fdf4', border: '#86efac',  Icon: CheckCircle },
  delivered:              { label: 'Delivered',                 color: '#15803d', bg: '#f0fdf4', border: '#86efac',  Icon: CheckCircle },
  disputed:               { label: 'Disputed',                  color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',  Icon: AlertTriangle },
  cancelled:              { label: 'Cancelled',                 color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',  Icon: XCircle },
};
const getStatusConfig = (s: string) => STATUS_CONFIG[s] ?? { label: s, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', Icon: Clock };

const DISPUTE_LABEL: Record<string, string> = {
  open: 'Under admin review',
  validated: 'Verified — please resolve',
  reopened: 'Reopened — please resolve again',
  supplier_resolved: 'Awaiting buyer confirmation',
  exchange: 'Exchange in progress',
  resolved: 'Resolved',
  rejected: 'Not verified',
};

const EXCHANGE_STEPS = [
  { key: 'awaiting_return',     label: 'Return' },
  { key: 'return_received',     label: 'Inspected' },
  { key: 'replacement_shipped', label: 'Replacement Sent' },
  { key: 'done',                label: 'Confirmed' },
];
const exchangeStepIndex = (stage?: string) => {
  if (stage === 'awaiting_return') return 0;
  if (stage === 'return_received') return 1;
  if (stage === 'replacement_shipped') return 2;
  return 0;
};

const METHOD_META: Record<string, { label: string; icon: string }> = {
  refund:      { label: 'Refund',             icon: '💰' },
  replacement: { label: 'Replacement',        icon: '📦' },
  partial:     { label: 'Partial Settlement', icon: '⚖️' },
  other:       { label: 'Other Resolution',   icon: '🤝' },
};

// Lifecycle stepper steps
const STEPPER = [
  { key: 'placed',    label: 'Ordered' },
  { key: 'packed',    label: 'Packed' },
  { key: 'shipped',   label: 'Dispatched' },
  { key: 'awaiting',  label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
];
const stepIndex = (status: string) => {
  if (['pending', 'paid', 'processing'].includes(status)) return 0;
  if (status === 'packed') return 1;
  if (status === 'shipped') return 2;
  if (status === 'awaiting_confirmation' || status === 'delivered') return 3;
  if (status === 'completed') return 4;
  return 0; // disputed/cancelled handled separately
};

// ─── Inline star rating row ───────────────────────────────────────────────────
const StarRow: React.FC<{ label?: string; value: number; onChange: (v: number) => void; size?: number }> = ({ label, value, onChange, size = 22 }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className={label ? 'flex items-center justify-between' : ''}>
      {label && <span className="text-xs text-[#64748b]">{label}</span>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} className="p-0 bg-transparent border-none cursor-pointer">
            <Star size={size} className={`transition-colors ${n <= (hover || value) ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#cbd5e1]'}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

interface OrderManageProps {
  order: any;
  isSupplier: boolean;
  isOwnShipping: boolean;
  allowedMethods: ('refund' | 'replacement')[];
  onBack: () => void;
  onRefresh: () => void;
}

const OrderManage: React.FC<OrderManageProps> = ({ order: initialOrder, isSupplier, isOwnShipping, allowedMethods, onBack, onRefresh }) => {
  const [order, setOrder] = useState<any>(initialOrder);
  // Re-sync when the parent refetches (e.g. a real-time order_update arrives)
  useEffect(() => { setOrder(initialOrder); }, [initialOrder]);
  // Open at the top — otherwise (esp. on mobile) the page appears scrolled down
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.querySelector('main')?.scrollTo({ top: 0 });
  }, []);
  const dispute = order._dispute;
  const cfg = getStatusConfig(order.status);

  const product = order.quotationId?.conversationId?.productId;
  const productImage = product?.images?.[0] || '';
  const snap = order.snapshot || {};

  // Contact details
  const buyerPhone = snap.buyerPhone || order.buyerId?.phone;
  const buyerEmail = snap.buyerEmail || order.buyerId?.email;
  const supplierPhone = snap.supplierPhone || order.supplierId?.phone;
  const supplierEmail = order.supplierId?.email;
  const contactName = isSupplier ? (snap.buyerName || order.buyerId?.name || 'Customer') : (snap.supplierBusinessName || order.supplierId?.companyName || order.supplierId?.name || 'Supplier');
  const contactPhone = isSupplier ? buyerPhone : supplierPhone;
  const contactEmail = isSupplier ? buyerEmail : supplierEmail;

  // ── Supplier: dispatch / pack / deliver ──
  const [busy, setBusy] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingURL, setTrackingURL] = useState('');

  // ── Supplier: resolve ──
  const [resolveMethod, setResolveMethod] = useState<'refund' | 'replacement' | 'partial' | 'other' | ''>('');
  const [resolveNote, setResolveNote] = useState('');
  const [requiresReturn, setRequiresReturn] = useState<boolean | null>(null);
  const [returnMode, setReturnMode] = useState<'buyer_ships' | 'supplier_pickup' | null>(null);
  const [refundTxId, setRefundTxId] = useState('');

  // ── Exchange: courier/tracking inputs (return + replacement) ──
  const [exCourier, setExCourier] = useState('');
  const [exTracking, setExTracking] = useState('');
  const [reportIssue, setReportIssue] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // ── Buyer: confirm / rating / ticket ──
  const [confirmMode, setConfirmMode] = useState<'idle' | 'rating' | 'ticket'>('idle');
  const [rating, setRating] = useState(0);
  const [dimQuality, setDimQuality] = useState(0);
  const [dimPackaging, setDimPackaging] = useState(0);
  const [dimComm, setDimComm] = useState(0);
  const [dimOnTime, setDimOnTime] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [issueType, setIssueType] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopen, setShowReopen] = useState(false);

  const sync = (patch: any) => { setOrder((o: any) => ({ ...o, ...patch })); onRefresh(); };
  const syncDispute = (patch: any) => { setOrder((o: any) => ({ ...o, _dispute: { ...o._dispute, ...patch } })); onRefresh(); };

  // ── Actions ──
  const handlePack = async () => {
    setBusy(true);
    try { await orderApi.markPacked(order._id); sync({ status: 'packed' }); toast.success('Marked as packed.'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const handleDispatch = async () => {
    if (isOwnShipping && (!courierName.trim() || !trackingNumber.trim())) { toast.error('Enter courier name and tracking number.'); return; }
    setBusy(true);
    try {
      const payload = isOwnShipping ? { courierName: courierName.trim(), trackingNumber: trackingNumber.trim(), trackingURL: trackingURL.trim() } : undefined;
      const res = await orderApi.dispatch(order._id, payload);
      sync({ status: 'shipped', trackingId: res.trackingId, courierName: res.courierName });
      toast.success('Order dispatched. Buyer notified.');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to dispatch'); }
    finally { setBusy(false); }
  };

  const handleMarkDelivered = async () => {
    setBusy(true);
    try { await orderApi.markDelivered(order._id); sync({ status: 'awaiting_confirmation' }); toast.success('Marked delivered. Buyer has 72h to confirm.'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const handleResolve = async () => {
    if (!resolveMethod) { toast.error('Choose a resolution method.'); return; }
    if (resolveMethod === 'replacement' && requiresReturn === null) { toast.error('Choose whether the original must be returned.'); return; }
    if (resolveMethod === 'replacement' && requiresReturn === true && returnMode === null) { toast.error('Choose who arranges the return courier.'); return; }
    if (resolveMethod === 'refund' && !refundTxId.trim()) { toast.error('Enter the refund Transaction ID (UTR).'); return; }
    setBusy(true);
    try {
      await orderApi.supplierResolveDispute(dispute._id, resolveMethod as any, resolveNote.trim(), resolveMethod === 'replacement' ? !!requiresReturn : undefined, resolveMethod === 'refund' ? refundTxId.trim() : undefined, resolveMethod === 'replacement' && requiresReturn ? (returnMode || 'buyer_ships') : undefined);
      if (resolveMethod === 'replacement') {
        syncDispute({ status: 'exchange', resolutionMethod: 'replacement', requiresReturn: !!requiresReturn, returnMode: requiresReturn ? (returnMode || 'buyer_ships') : undefined, exchangeStage: requiresReturn ? 'awaiting_return' : 'return_received' });
        toast.success('Exchange started. Buyer notified.');
      } else {
        syncDispute({ status: 'supplier_resolved', resolutionMethod: resolveMethod, resolutionNote: resolveNote.trim(), refundTransactionId: resolveMethod === 'refund' ? refundTxId.trim() : undefined });
        toast.success('Resolution submitted. Buyer has 72h to confirm.');
      }
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  // ── Exchange milestone handlers ──
  const exReset = () => { setExCourier(''); setExTracking(''); };
  const handleReturnShipment = async () => {
    if (!exCourier.trim() || !exTracking.trim()) { toast.error('Enter return courier and tracking.'); return; }
    setBusy(true);
    try { await orderApi.submitReturnShipment(dispute._id, exCourier.trim(), exTracking.trim()); syncDispute({ returnCourier: exCourier.trim(), returnTracking: exTracking.trim(), returnShippedAt: new Date().toISOString() }); exReset(); toast.success('Return shipment recorded.'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };
  const handlePickupTracking = async () => {
    if (!exCourier.trim() || !exTracking.trim()) { toast.error('Enter pickup courier and tracking.'); return; }
    setBusy(true);
    try { await orderApi.setPickupTracking(dispute._id, exCourier.trim(), exTracking.trim()); syncDispute({ returnCourier: exCourier.trim(), returnTracking: exTracking.trim() }); exReset(); toast.success('Pickup tracking saved. Buyer notified.'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };
  const handleConfirmHandover = async () => {
    setBusy(true);
    try { await orderApi.confirmHandover(dispute._id); syncDispute({ returnShippedAt: new Date().toISOString() }); toast.success('Handover confirmed.'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };
  const handleReturnReceived = async () => {
    setBusy(true);
    try { await orderApi.markReturnReceived(dispute._id); syncDispute({ exchangeStage: 'return_received' }); toast.success('Return received. Now dispatch the replacement.'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };
  const handleDispatchReplacement = async () => {
    if (!exCourier.trim() || !exTracking.trim()) { toast.error('Enter courier and tracking.'); return; }
    setBusy(true);
    try { await orderApi.dispatchReplacement(dispute._id, exCourier.trim(), exTracking.trim()); syncDispute({ exchangeStage: 'replacement_shipped', replacementCourier: exCourier.trim(), replacementTracking: exTracking.trim() }); exReset(); toast.success('Replacement dispatched. Buyer notified.'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };
  const handleConfirmExchange = async () => {
    setBusy(true);
    try { await orderApi.confirmExchangeDone(dispute._id); sync({ status: 'completed', _dispute: { ...dispute, status: 'resolved' } }); toast.success('Exchange confirmed. Order completed!'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };
  const handleReportReplacement = async () => {
    setBusy(true);
    try { await orderApi.reportReplacementIssue(dispute._id, reportReason.trim()); syncDispute({ status: 'reopened', exchangeStage: undefined }); toast.success('Reported. Supplier notified.'); setReportIssue(false); setReportReason(''); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };

  const handleEvidenceUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = 5 - evidenceUrls.length;
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        const form = new FormData();
        form.append('image', file);
        const res = await apiClient.post('/upload/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data?.url) urls.push(res.data.url);
      }
      setEvidenceUrls(p => [...p, ...urls]);
    } catch { toast.error('Upload failed. Try again.'); }
    finally { setUploading(false); }
  };

  const handleConfirmGood = async (withRating: boolean) => {
    setBusy(true);
    try {
      const dims = { quality: dimQuality || undefined, packaging: dimPackaging || undefined, communication: dimComm || undefined, onTime: dimOnTime || undefined };
      await orderApi.confirmDelivery(order._id, {
        condition: 'good',
        rating: withRating && rating ? rating : undefined,
        dimensions: withRating && rating ? dims : undefined,
        comment: withRating ? (reviewComment.trim() || undefined) : undefined,
      });
      sync({ status: 'completed', _reviewSubmitted: withRating && rating > 0 });
      toast.success('Order completed. Thank you!');
      setConfirmMode('idle');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const handleRaiseTicket = async () => {
    if (!issueType) { toast.error('Select an issue type.'); return; }
    if (!issueDesc.trim()) { toast.error('Describe the issue.'); return; }
    if (evidenceUrls.length === 0) { toast.error('Attach at least one photo.'); return; }
    setBusy(true);
    try {
      await orderApi.raiseDispute(order._id, {
        issueType,
        description: issueDesc.trim(),
        evidence: evidenceUrls.map(url => ({ url, type: 'image' as const })),
      });
      sync({ status: 'disputed', _dispute: { status: 'open', issueType, description: issueDesc.trim(), evidence: evidenceUrls.map(url => ({ url, type: 'image' })) } });
      toast.success('Ticket raised. Our team will review it shortly.');
      setConfirmMode('idle');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const handleConfirmResolved = async () => {
    setBusy(true);
    try { await orderApi.buyerConfirmResolved(dispute._id); sync({ status: 'completed', _dispute: { ...dispute, status: 'resolved' } }); toast.success('Confirmed. Order completed!'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const handleReopen = async () => {
    setBusy(true);
    try { await orderApi.buyerReopenDispute(dispute._id, reopenReason.trim()); syncDispute({ status: 'reopened' }); toast.success('Reopened. Supplier notified.'); setShowReopen(false); setReopenReason(''); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '');
  const StatusIcon = cfg.Icon;

  // Resolution options shown to supplier (policy-gated refund/replacement + partial/other always)
  const resolveOptions: ('refund' | 'replacement' | 'partial' | 'other')[] = [
    ...allowedMethods,
    'partial', 'other',
  ];

  const showStepper = !['disputed', 'cancelled'].includes(order.status);
  const activeStep = stepIndex(order.status);

  const card = "bg-white border border-[#eef2f6] rounded-[14px]";
  const sectionTitle = "text-xs font-bold uppercase tracking-wider text-[#94a3b8] m-0 mb-3";

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5 pb-10">

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-[#475569] bg-white border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:bg-[#f8fafc]">
          <ArrowLeft size={15} /> Back to Orders
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-extrabold text-[#0f172a] bg-[#e2e8f0] px-3 py-1 rounded-full">{order.orderNumber}</span>
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border" style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
            <StatusIcon size={12} /> {cfg.label}
          </span>
        </div>
      </div>

      {/* Lifecycle stepper */}
      {showStepper && (
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between">
            {STEPPER.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= activeStep ? 'bg-[#059669] text-white' : 'bg-[#f1f5f9] text-[#94a3b8]'}`}>
                    {i < activeStep ? <CheckCircle size={15} /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-bold ${i <= activeStep ? 'text-[#0f172a]' : 'text-[#94a3b8]'}`}>{s.label}</span>
                </div>
                {i < STEPPER.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < activeStep ? 'bg-[#059669]' : 'bg-[#e2e8f0]'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Contact bar */}
      <div className={`${card} p-5 flex items-center justify-between gap-4 flex-wrap`}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] m-0 mb-0.5">{isSupplier ? 'Buyer' : 'Supplier'}</p>
          <p className="text-sm font-extrabold text-[#0f172a] m-0">{contactName}</p>
          {contactPhone && <p className="text-xs text-[#64748b] m-0 mt-0.5">{contactPhone}</p>}
        </div>
        <div className="flex items-center gap-2">
          {contactPhone && (
            <a href={`tel:${contactPhone}`} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#059669] bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] no-underline hover:bg-[#dcfce7]">
              <Phone size={14} /> Call
            </a>
          )}
          {!isSupplier && contactEmail && (
            <a href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Regarding Order ${order.orderNumber}`)}`} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#0284c7] bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] no-underline hover:bg-[#dbeafe]">
              <Mail size={14} /> Mail
            </a>
          )}
        </div>
      </div>

      {/* Order summary */}
      <div className={`${card} p-5`}>
        <p className={sectionTitle}>Order Summary</p>
        <div className="flex gap-4 items-start mb-4">
          <div className="w-16 h-16 rounded-[10px] overflow-hidden bg-[#f8fafc] border border-[#eef2f6] shrink-0 flex items-center justify-center">
            {productImage ? <img src={productImage} alt="" className="w-full h-full object-cover" /> : <Package size={24} className="text-[#cbd5e1]" />}
          </div>
          <div className="flex-1 min-w-0">
            {order.items.map((it: any, i: number) => (
              <div key={i} className="mb-1">
                <p className="text-sm font-extrabold text-[#0f172a] m-0">{it.name}</p>
                <p className="text-xs text-[#64748b] m-0">₹{it.price.toLocaleString('en-IN')}/{it.unit || 'pcs'} · Qty {it.quantity} {it.unit || 'pcs'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="bg-[#f8fafc] rounded-[10px] border border-[#eef2f6] divide-y divide-[#f1f5f9]">
          {(() => {
            const taxable = snap.taxableAmount ?? order.subtotal ?? 0;
            const gstAmt = snap.gstAmount ?? 0;
            const shipping = order.shippingCost ?? 0;
            const gstType = snap.gstType;
            const gstRate = snap.gstRate ?? 0;
            const halfRate = gstRate / 2;
            const showGst = gstType && gstType !== 'exempt' && gstAmt > 0;
            return (
              <>
                <div className="flex items-center justify-between px-4 py-2 text-xs text-[#64748b]"><span>Taxable Amount</span><span className="font-medium text-[#0f172a]">₹{taxable.toLocaleString('en-IN')}</span></div>
                {showGst && gstType === 'IGST' && <div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]"><span>IGST @ {gstRate}%</span><span>₹{gstAmt.toLocaleString('en-IN')}</span></div>}
                {showGst && gstType === 'CGST_SGST' && (<><div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]"><span>CGST @ {halfRate}%</span><span>₹{(gstAmt / 2).toLocaleString('en-IN')}</span></div><div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]"><span>SGST @ {halfRate}%</span><span>₹{(gstAmt / 2).toLocaleString('en-IN')}</span></div></>)}
                {!showGst && <div className="flex items-center justify-between px-4 py-2 text-xs text-[#94a3b8]"><span>GST</span><span>Exempt / Nil</span></div>}
                {shipping > 0 && <div className="flex items-center justify-between px-4 py-2 text-xs text-[#64748b]"><span>Shipping</span><span className="font-medium text-[#0f172a]">₹{shipping.toLocaleString('en-IN')}</span></div>}
              </>
            );
          })()}
          <div className="flex items-center justify-between px-4 py-3 bg-[#fff7ed]"><span className="text-sm font-bold text-[#0f172a]">Grand Total</span><span className="text-base font-extrabold text-primary">₹{order.totalAmount.toLocaleString('en-IN')}</span></div>
        </div>

        {(snap.deliveryTimeline || snap.shippingNotes) && (
          <div className="mt-3 text-xs text-[#64748b] flex flex-col gap-1">
            {snap.deliveryTimeline && <p className="m-0">Delivery: <strong className="text-[#0f172a]">{snap.deliveryTimeline}</strong></p>}
            {snap.shippingNotes && <p className="m-0">Notes: <span className="text-[#475569]">{snap.shippingNotes}</span></p>}
          </div>
        )}

        {!isSupplier && order.poNumber && (
          <a href={`${apiBase}/api/orders/${order._id}/po-download`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs font-bold text-[#0369a1] bg-[#eff6ff] border border-[#bfdbfe] rounded-[6px] no-underline hover:bg-[#dbeafe]">
            <Download size={12} /> Download PO
          </a>
        )}
      </div>

      {/* Tracking */}
      {order.trackingId && ['shipped', 'awaiting_confirmation', 'completed', 'disputed'].includes(order.status) && (
        <div className={`${card} p-5`}>
          <p className={sectionTitle}>Shipment</p>
          <p className="text-sm text-[#0f172a] m-0">Courier: <strong>{order.courierName || 'AMJSTAR COURIER SERVICES'}</strong></p>
          <p className="text-sm text-[#0f172a] m-0">Tracking ID: <strong>{order.trackingId}</strong></p>
          {order.trackingURL && <a href={order.trackingURL} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1d4ed8] hover:underline">Track shipment →</a>}
        </div>
      )}

      {/* ── DISPUTE PANEL ──────────────────────────────────────────────────── */}
      {order.status === 'disputed' && dispute && (
        <div className={`${card} p-5 border-[#fca5a5]`}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#dc2626] m-0 flex items-center gap-1.5"><AlertTriangle size={14} /> Dispute</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#b91c1c] bg-[#fef2f2] border border-[#fca5a5] px-2.5 py-0.5 rounded-full">
              <ShieldCheck size={11} /> {DISPUTE_LABEL[dispute.status] || dispute.status}
            </span>
          </div>

          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[8px] px-4 py-3 mb-3">
            <p className="text-xs font-bold text-[#b91c1c] m-0 mb-1 capitalize">{dispute.issueType} issue</p>
            <p className="text-sm text-[#7f1d1d] m-0 whitespace-pre-wrap">{dispute.description}</p>
          </div>

          {dispute.evidence?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {dispute.evidence.map((ev: any, i: number) => (
                <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-[8px] overflow-hidden border border-[#e2e8f0]">
                  <img src={ev.url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}

          {/* Resolution shown */}
          {dispute.resolutionMethod && (
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] px-4 py-3 mb-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803d] bg-white border border-[#bbf7d0] px-2 py-0.5 rounded-full mb-1.5">
                {METHOD_META[dispute.resolutionMethod]?.icon} {METHOD_META[dispute.resolutionMethod]?.label}
              </span>
              {dispute.refundTransactionId && (
                <p className="text-sm text-[#166534] m-0 font-semibold">Transaction ID (UTR): <span className="font-mono">{dispute.refundTransactionId}</span></p>
              )}
              {dispute.resolutionNote && <p className="text-sm text-[#166534] m-0">{dispute.resolutionNote}</p>}
            </div>
          )}

          {/* SUPPLIER resolve panel */}
          {isSupplier && ['validated', 'reopened'].includes(dispute.status) && (
            <div className="border-t border-[#f1f5f9] pt-4">
              <p className="text-sm font-bold text-[#0f172a] m-0 mb-1">Resolve this dispute</p>
              <p className="text-xs text-[#64748b] m-0 mb-3">Coordinate with the buyer (call / mail above), then pick how you'll resolve it.</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {resolveOptions.map(m => (
                  <button key={m} type="button" onClick={() => { setResolveMethod(m); if (m !== 'replacement') setRequiresReturn(null); }}
                    className={`text-left p-3 rounded-[8px] border cursor-pointer transition-colors ${resolveMethod === m ? 'border-[#059669] bg-[#f0fdf4]' : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'}`}>
                    <span className="text-sm font-bold text-[#0f172a]">{METHOD_META[m].icon} {METHOD_META[m].label}</span>
                  </button>
                ))}
              </div>

              {/* Replacement → ask about return logistics */}
              {resolveMethod === 'replacement' && (
                <div className="mb-3 p-3 bg-[#f8fafc] border border-[#eef2f6] rounded-[8px]">
                  <p className="text-xs font-bold text-[#0f172a] m-0 mb-2">Does the buyer need to return the original first?</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRequiresReturn(true)}
                      className={`flex-1 p-2.5 rounded-[8px] border text-xs font-bold cursor-pointer ${requiresReturn === true ? 'border-[#059669] bg-[#f0fdf4] text-[#15803d]' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                      Yes — return required
                    </button>
                    <button type="button" onClick={() => { setRequiresReturn(false); setReturnMode(null); }}
                      className={`flex-1 p-2.5 rounded-[8px] border text-xs font-bold cursor-pointer ${requiresReturn === false ? 'border-[#059669] bg-[#f0fdf4] text-[#15803d]' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                      No — replace directly
                    </button>
                  </div>

                  {/* Who arranges the return courier? */}
                  {requiresReturn === true && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-[#0f172a] m-0 mb-2">Who arranges the return courier?</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setReturnMode('supplier_pickup')}
                          className={`flex-1 p-2.5 rounded-[8px] border text-xs font-bold cursor-pointer ${returnMode === 'supplier_pickup' ? 'border-[#059669] bg-[#f0fdf4] text-[#15803d]' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                          📦 I'll send a courier to pick it up
                        </button>
                        <button type="button" onClick={() => setReturnMode('buyer_ships')}
                          className={`flex-1 p-2.5 rounded-[8px] border text-xs font-bold cursor-pointer ${returnMode === 'buyer_ships' ? 'border-[#059669] bg-[#f0fdf4] text-[#15803d]' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                          🚚 Buyer ships it back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Refund → require Transaction ID (UTR) */}
              {resolveMethod === 'refund' && (
                <div className="mb-3">
                  <label className="text-xs font-bold text-[#0f172a] block mb-1">Refund Transaction ID / UTR <span className="text-[#dc2626]">*</span></label>
                  <input value={refundTxId} onChange={e => setRefundTxId(e.target.value)} placeholder="e.g. UTR 1234567890 / UPI ref"
                    className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary uppercase" />
                  <p className="text-[11px] text-[#94a3b8] m-0 mt-1">The buyer sees this to verify the refund hit their account.</p>
                </div>
              )}

              {resolveMethod !== 'replacement' && (
                <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)} rows={3}
                  placeholder={resolveMethod === 'refund' ? 'Optional note for the buyer…' : "Details shared with the buyer — e.g. 'Settled ₹X by mutual agreement'"}
                  className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary resize-none mb-3" />
              )}
              <button onClick={handleResolve} disabled={busy || !resolveMethod || (resolveMethod === 'replacement' && requiresReturn === null) || (resolveMethod === 'replacement' && requiresReturn === true && returnMode === null) || (resolveMethod === 'refund' && !refundTxId.trim())} className="w-full py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50">
                {busy ? 'Submitting…' : resolveMethod === 'replacement' ? 'Approve Exchange' : 'Submit Resolution'}
              </button>
            </div>
          )}

          {isSupplier && dispute.status === 'open' && <p className="text-xs text-[#a16207] m-0 flex items-center gap-1.5"><Clock size={13} /> Awaiting AMJSTAR review before you act.</p>}
          {isSupplier && dispute.status === 'supplier_resolved' && <p className="text-xs text-[#9333ea] m-0 flex items-center gap-1.5"><Clock size={13} /> Awaiting buyer confirmation (72h window).</p>}

          {/* BUYER confirm / reopen panel (refund/partial/other) */}
          {!isSupplier && dispute.status === 'open' && <p className="text-xs text-[#a16207] m-0 flex items-center gap-1.5"><Clock size={13} /> Our team is reviewing your ticket.</p>}
          {!isSupplier && ['validated', 'reopened'].includes(dispute.status) && <p className="text-xs text-[#0284c7] m-0 flex items-center gap-1.5"><Clock size={13} /> Verified — the supplier is resolving it. Coordinate via call / mail above.</p>}
          {!isSupplier && dispute.status === 'supplier_resolved' && (
            <div className="border-t border-[#f1f5f9] pt-4">
              <p className="text-sm font-bold text-[#0f172a] m-0 mb-3">Did this resolve your issue?</p>
              {!showReopen ? (
                <div className="flex gap-3">
                  <button onClick={() => setShowReopen(true)} disabled={busy} className="flex-1 py-2.5 text-sm font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fca5a5] rounded-[8px] cursor-pointer hover:bg-[#fee2e2] disabled:opacity-50">Still an issue</button>
                  <button onClick={handleConfirmResolved} disabled={busy} className="flex-1 py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50">{busy ? 'Submitting…' : 'Yes, Resolved'}</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <textarea value={reopenReason} onChange={e => setReopenReason(e.target.value)} rows={3} placeholder="What's still unresolved?" className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
                  <div className="flex gap-3">
                    <button onClick={() => setShowReopen(false)} className="flex-1 py-2.5 text-sm font-bold text-[#64748b] bg-[#f1f5f9] rounded-[8px] border-none cursor-pointer">Cancel</button>
                    <button onClick={handleReopen} disabled={busy} className="flex-1 py-2.5 text-sm font-bold text-white bg-[#dc2626] rounded-[8px] border-none cursor-pointer hover:bg-[#b91c1c] disabled:opacity-50">{busy ? 'Submitting…' : 'Reopen Dispute'}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EXCHANGE milestone panel ── */}
          {dispute.status === 'exchange' && (
            <div className="border-t border-[#f1f5f9] pt-4">
              {/* Exchange stepper */}
              <div className="flex items-center justify-between mb-4">
                {EXCHANGE_STEPS.filter(s => dispute.requiresReturn || s.key !== 'awaiting_return').map((s, i, arr) => {
                  const active = exchangeStepIndex(dispute.exchangeStage);
                  const myIdx = EXCHANGE_STEPS.findIndex(x => x.key === s.key);
                  const reached = myIdx <= active;
                  return (
                    <React.Fragment key={s.key}>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${reached ? 'bg-[#0284c7] text-white' : 'bg-[#f1f5f9] text-[#94a3b8]'}`}>{i + 1}</div>
                        <span className={`text-[9px] font-bold ${reached ? 'text-[#0f172a]' : 'text-[#94a3b8]'}`}>{s.label}</span>
                      </div>
                      {i < arr.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${myIdx < active ? 'bg-[#0284c7]' : 'bg-[#e2e8f0]'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Return tracking shown */}
              {dispute.returnTracking && (
                <p className="text-xs text-[#64748b] m-0 mb-2">Return: <strong className="text-[#0f172a]">{dispute.returnCourier} · {dispute.returnTracking}</strong></p>
              )}
              {dispute.replacementTracking && (
                <p className="text-xs text-[#64748b] m-0 mb-2">Replacement: <strong className="text-[#0f172a]">{dispute.replacementCourier} · {dispute.replacementTracking}</strong></p>
              )}

              {/* STAGE: awaiting_return */}
              {dispute.exchangeStage === 'awaiting_return' && (() => {
                const pickup = dispute.returnMode === 'supplier_pickup';
                const hasTracking = !!dispute.returnTracking;
                const handedOver = !!dispute.returnShippedAt;

                // ── Buyer ships back ──
                if (!pickup) {
                  return !isSupplier ? (
                    handedOver ? (
                      <p className="text-xs text-[#0284c7] m-0 flex items-center gap-1.5"><Clock size={13} /> Return shipped — waiting for the supplier to inspect it.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-bold text-[#0f172a] m-0">Ship the original back</p>
                        <input value={exCourier} onChange={e => setExCourier(e.target.value)} placeholder="Return courier *" className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
                        <input value={exTracking} onChange={e => setExTracking(e.target.value)} placeholder="Return tracking number *" className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase" />
                        <button onClick={handleReturnShipment} disabled={busy} className="py-2.5 text-sm font-bold text-white bg-[#0284c7] rounded-[8px] border-none cursor-pointer hover:bg-[#0369a1] disabled:opacity-50">{busy ? 'Saving…' : 'I\'ve Shipped the Return'}</button>
                      </div>
                    )
                  ) : (
                    handedOver ? (
                      <button onClick={handleReturnReceived} disabled={busy} className="w-full py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50">{busy ? 'Working…' : 'Mark Return Received'}</button>
                    ) : (
                      <p className="text-xs text-[#a16207] m-0 flex items-center gap-1.5"><Clock size={13} /> Waiting for the buyer to ship the original back.</p>
                    )
                  );
                }

                // ── Supplier arranges pickup ──
                return !isSupplier ? (
                  !hasTracking ? (
                    <p className="text-xs text-[#a16207] m-0 flex items-center gap-1.5"><Clock size={13} /> The supplier is arranging a courier to pick up the original.</p>
                  ) : handedOver ? (
                    <p className="text-xs text-[#0284c7] m-0 flex items-center gap-1.5"><Clock size={13} /> Handed over — waiting for the supplier to inspect it.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-bold text-[#0f172a] m-0">Pickup arranged</p>
                      <p className="text-xs text-[#475569] m-0">Courier: <strong>{dispute.returnCourier}</strong> · Tracking: <strong>{dispute.returnTracking}</strong></p>
                      <button onClick={handleConfirmHandover} disabled={busy} className="py-2.5 text-sm font-bold text-white bg-[#0284c7] rounded-[8px] border-none cursor-pointer hover:bg-[#0369a1] disabled:opacity-50">{busy ? 'Saving…' : 'I\'ve Handed Over the Item'}</button>
                    </div>
                  )
                ) : (
                  !hasTracking ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-bold text-[#0f172a] m-0">Arrange the return pickup</p>
                      <input value={exCourier} onChange={e => setExCourier(e.target.value)} placeholder="Pickup courier *" className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
                      <input value={exTracking} onChange={e => setExTracking(e.target.value)} placeholder="Pickup tracking number *" className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase" />
                      <button onClick={handlePickupTracking} disabled={busy} className="py-2.5 text-sm font-bold text-white bg-primary rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50">{busy ? 'Saving…' : 'Send Pickup Tracking'}</button>
                    </div>
                  ) : !handedOver ? (
                    <p className="text-xs text-[#a16207] m-0 flex items-center gap-1.5"><Clock size={13} /> Pickup tracking sent ({dispute.returnTracking}). Waiting for the buyer to hand over the item.</p>
                  ) : (
                    <button onClick={handleReturnReceived} disabled={busy} className="w-full py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50">{busy ? 'Working…' : 'Mark Return Received'}</button>
                  )
                );
              })()}

              {/* STAGE: return_received → supplier dispatches replacement */}
              {dispute.exchangeStage === 'return_received' && (
                isSupplier ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-bold text-[#0f172a] m-0">Dispatch the replacement</p>
                    <input value={exCourier} onChange={e => setExCourier(e.target.value)} placeholder="Courier *" className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
                    <input value={exTracking} onChange={e => setExTracking(e.target.value)} placeholder="Tracking number *" className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase" />
                    <button onClick={handleDispatchReplacement} disabled={busy} className="py-2.5 text-sm font-bold text-white bg-primary rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50">{busy ? 'Dispatching…' : 'Dispatch Replacement'}</button>
                  </div>
                ) : (
                  <p className="text-xs text-[#0284c7] m-0 flex items-center gap-1.5"><Clock size={13} /> Supplier is preparing your replacement.</p>
                )
              )}

              {/* STAGE: replacement_shipped → buyer confirms */}
              {dispute.exchangeStage === 'replacement_shipped' && (
                !isSupplier ? (
                  !reportIssue ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-bold text-[#0f172a] m-0">Replacement on the way — confirm once it arrives & passes inspection.</p>
                      <div className="flex gap-3">
                        <button onClick={() => setReportIssue(true)} disabled={busy} className="flex-1 py-2.5 text-sm font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fca5a5] rounded-[8px] cursor-pointer hover:bg-[#fee2e2] disabled:opacity-50">Issue with Replacement</button>
                        <button onClick={handleConfirmExchange} disabled={busy} className="flex-1 py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50">{busy ? 'Submitting…' : 'Confirm Exchange Done'}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} rows={3} placeholder="What's wrong with the replacement?" className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
                      <div className="flex gap-3">
                        <button onClick={() => setReportIssue(false)} className="flex-1 py-2.5 text-sm font-bold text-[#64748b] bg-[#f1f5f9] rounded-[8px] border-none cursor-pointer">Cancel</button>
                        <button onClick={handleReportReplacement} disabled={busy} className="flex-1 py-2.5 text-sm font-bold text-white bg-[#dc2626] rounded-[8px] border-none cursor-pointer hover:bg-[#b91c1c] disabled:opacity-50">{busy ? 'Submitting…' : 'Report Issue'}</button>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-xs text-[#9333ea] m-0 flex items-center gap-1.5"><Clock size={13} /> Replacement dispatched — waiting for the buyer to confirm (auto-completes in 7 days).</p>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SUPPLIER action panel (non-dispute) ────────────────────────────── */}
      {isSupplier && order.status !== 'disputed' && (
        <div className={`${card} p-5`}>
          <p className={sectionTitle}>Actions</p>
          {['pending', 'paid', 'processing'].includes(order.status) && (
            <div className="flex flex-col gap-3">
              <button onClick={handlePack} disabled={busy} className="flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-[#0891b2] bg-[#ecfeff] border border-[#a5f3fc] rounded-[8px] cursor-pointer hover:bg-[#cffafe] disabled:opacity-50">
                <Boxes size={15} /> {busy ? 'Working…' : 'Mark Packed (optional)'}
              </button>
              {renderDispatchBlock()}
            </div>
          )}
          {order.status === 'packed' && renderDispatchBlock()}
          {order.status === 'shipped' && (
            isOwnShipping ? (
              <button onClick={handleMarkDelivered} disabled={busy} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-[#7c3aed] rounded-[8px] border-none cursor-pointer hover:bg-[#6d28d9] disabled:opacity-50">
                <CheckCircle size={15} /> {busy ? 'Working…' : 'Mark Delivered'}
              </button>
            ) : (
              <p className="text-sm text-[#64748b] m-0 flex items-center gap-1.5"><Truck size={14} /> Dispatched via AMJSTAR. Waiting for the buyer to confirm delivery.</p>
            )
          )}
          {order.status === 'awaiting_confirmation' && <p className="text-sm text-[#9333ea] m-0 flex items-center gap-1.5"><Clock size={14} /> Delivered — waiting for buyer confirmation (auto-completes in 72h).</p>}
          {(order.status === 'completed' || order.status === 'delivered') && <p className="text-sm text-[#15803d] m-0 flex items-center gap-1.5"><CheckCircle size={14} /> Order completed. Commission released.</p>}
          {order.status === 'cancelled' && <p className="text-sm text-[#dc2626] m-0">This order was cancelled.</p>}
        </div>
      )}

      {/* ── BUYER action panel (non-dispute) ───────────────────────────────── */}
      {!isSupplier && ['shipped', 'awaiting_confirmation', 'delivered'].includes(order.status) && (
        <div className={`${card} p-5`}>
          <p className={sectionTitle}>Confirm Your Order</p>
          {order.status === 'awaiting_confirmation' && (
            <div className="flex items-center gap-2 bg-[#faf5ff] border border-[#d8b4fe] rounded-[8px] px-3 py-2 text-xs text-[#7e22ce] font-semibold mb-3">
              <Clock size={13} /> The supplier marked this delivered. Please confirm within 72 hours.
            </div>
          )}
          {confirmMode === 'idle' && (
            <div className="flex gap-3">
              <button onClick={() => setConfirmMode('ticket')} className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-[#fca5a5] bg-[#fef2f2] rounded-[12px] cursor-pointer hover:bg-[#fee2e2]">
                <AlertTriangle size={26} className="text-[#dc2626]" /><span className="text-sm font-bold text-[#b91c1c]">I have an issue</span>
              </button>
              <button onClick={() => setConfirmMode('rating')} className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-[#86efac] bg-[#f0fdf4] rounded-[12px] cursor-pointer hover:bg-[#dcfce7]">
                <CheckCircle size={26} className="text-[#16a34a]" /><span className="text-sm font-bold text-[#15803d]">Received, all good</span>
              </button>
            </div>
          )}

          {/* Rating (inline) */}
          {confirmMode === 'rating' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wide">Overall Rating</span>
                <StarRow value={rating} onChange={setRating} />
              </div>
              <div className="flex flex-col gap-2 bg-[#f8fafc] rounded-[10px] p-3 border border-[#eef2f6]">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wide">Rate by Category (optional)</span>
                <StarRow label="Product Quality" value={dimQuality} onChange={setDimQuality} size={16} />
                <StarRow label="Packaging" value={dimPackaging} onChange={setDimPackaging} size={16} />
                <StarRow label="Communication" value={dimComm} onChange={setDimComm} size={16} />
                <StarRow label="On-time Delivery" value={dimOnTime} onChange={setDimOnTime} size={16} />
              </div>
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} maxLength={500} placeholder="Any comments for the supplier? (optional)" className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
              <div className="flex gap-3">
                <button onClick={() => setConfirmMode('idle')} className="flex-1 py-2.5 text-sm font-bold text-[#64748b] bg-[#f1f5f9] rounded-[8px] border-none cursor-pointer">Back</button>
                <button onClick={() => handleConfirmGood(true)} disabled={busy || rating === 0} className="flex-1 py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer disabled:opacity-50">{busy ? 'Submitting…' : 'Submit & Complete'}</button>
              </div>
              <button onClick={() => handleConfirmGood(false)} disabled={busy} className="text-xs text-[#94a3b8] underline bg-transparent border-none cursor-pointer hover:text-[#64748b] self-center">Skip rating and just confirm</button>
            </div>
          )}

          {/* Ticket (inline) */}
          {confirmMode === 'ticket' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-[#64748b] m-0">Tell us what went wrong. Our team reviews every ticket before the supplier acts.</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0f172a]">Issue Type <span className="text-[#dc2626]">*</span></label>
                <select value={issueType} onChange={e => setIssueType(e.target.value)} className="border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="">Select…</option>
                  <option value="quantity">Wrong Quantity</option>
                  <option value="quality">Quality Issue</option>
                  <option value="damaged">Damaged / Broken</option>
                  <option value="missing">Missing Item</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0f172a]">Description <span className="text-[#dc2626]">*</span></label>
                <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} rows={3} placeholder="Describe the issue in detail…" className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0f172a]">Photo Evidence <span className="text-[#dc2626]">*</span> <span className="text-[#94a3b8] font-normal">(up to 5)</span></label>
                <div className="flex flex-wrap gap-2">
                  {evidenceUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-[8px] overflow-hidden border border-[#e2e8f0]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setEvidenceUrls(p => p.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-black/60 text-white border-none cursor-pointer"><X size={10} /></button>
                    </div>
                  ))}
                  {evidenceUrls.length < 5 && (
                    <label className="w-16 h-16 rounded-[8px] border-2 border-dashed border-[#cbd5e1] flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-primary text-[#94a3b8] hover:text-primary">
                      {uploading ? <div className="w-4 h-4 border-2 border-[#e2e8f0] border-t-primary rounded-full animate-spin" /> : <><Upload size={16} /><span className="text-[9px] font-bold">Add</span></>}
                      <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e => { handleEvidenceUpload(e.target.files); e.target.value = ''; }} />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmMode('idle')} className="flex-1 py-2.5 text-sm font-bold text-[#64748b] bg-[#f1f5f9] rounded-[8px] border-none cursor-pointer">Back</button>
                <button onClick={handleRaiseTicket} disabled={busy || !issueType || !issueDesc.trim() || evidenceUrls.length === 0 || uploading} className="flex-1 py-2.5 text-sm font-bold text-white bg-[#dc2626] rounded-[8px] border-none cursor-pointer disabled:opacity-50">{busy ? 'Submitting…' : 'Raise Ticket'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buyer: rate after completed */}
      {!isSupplier && order.status === 'completed' && !order.hasReview && !order._reviewSubmitted && confirmMode !== 'rating' && (
        <div className={`${card} p-5`}>
          <p className={sectionTitle}>Rate Your Supplier</p>
          <button onClick={() => setConfirmMode('rating')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-[#d97706] bg-[#fffbeb] border border-[#fcd34d] rounded-[8px] cursor-pointer hover:bg-[#fef3c7]">
            <Star size={15} /> Leave a Rating
          </button>
        </div>
      )}
      {!isSupplier && order.status === 'completed' && (order.hasReview || order._reviewSubmitted) && confirmMode !== 'rating' && (
        <div className={`${card} p-5 flex items-center gap-2 text-sm text-[#15803d]`}>
          <CheckCircle size={16} className="text-[#16a34a]" /> You have already rated this supplier for this order.
        </div>
      )}
      {!isSupplier && order.status === 'completed' && confirmMode === 'rating' && (
        <div className={`${card} p-5 flex flex-col gap-4`}>
          <p className={sectionTitle}>Rate Your Supplier</p>
          <StarRow value={rating} onChange={setRating} />
          <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} maxLength={500} placeholder="Comments (optional)" className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
          <button
            onClick={async () => {
              if (!rating) { toast.error('Pick a rating'); return; }
              setBusy(true);
              try {
                await orderApi.submitReview(order._id, { rating, dimensions: {}, comment: reviewComment.trim() || undefined });
                sync({ _reviewSubmitted: true }); toast.success('Thanks for your feedback!'); setConfirmMode('idle');
              } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
              finally { setBusy(false); }
            }}
            disabled={busy || !rating}
            className="py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer disabled:opacity-50">
            {busy ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      )}
    </div>
  );

  // ── Dispatch block (supplier) ──
  function renderDispatchBlock() {
    return (
      <div className="flex flex-col gap-3">
        {isOwnShipping && (
          <div className="bg-[#f5f3ff] border border-[#c4b5fd] rounded-[10px] px-4 py-4 flex flex-col gap-3">
            <p className="text-xs font-bold text-[#6d28d9] m-0 uppercase tracking-wider flex items-center gap-1.5"><Wifi size={12} /> Your Shipping Details</p>
            <input value={courierName} onChange={e => setCourierName(e.target.value)} placeholder="Courier / Transport name *" className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Tracking / Docket number *" className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase" />
            <input value={trackingURL} onChange={e => setTrackingURL(e.target.value)} placeholder="Tracking URL (optional)" className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        )}
        <button onClick={handleDispatch} disabled={busy || (isOwnShipping && (!courierName.trim() || !trackingNumber.trim()))} className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-[8px] text-sm font-bold hover:opacity-90 disabled:opacity-50 border-none cursor-pointer">
          <Truck size={15} /> {busy ? 'Dispatching…' : 'Mark Dispatched'}
        </button>
      </div>
    );
  }
};

export default OrderManage;
