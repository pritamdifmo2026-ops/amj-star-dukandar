import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { orderApi } from '@/features/order/services/order.api';
import { chatApi } from '@/features/chat/services/chat.api';
import apiClient from '@/api/client';
import {
  ArrowLeft, Phone, Mail, Package, Truck, Boxes, CheckCircle, AlertTriangle,
  Clock, XCircle, Download, Star, Upload, X, ShieldCheck, Wifi, Link2, MapPin,
  Video, CreditCard, Copy, Check, Store, MessageSquare, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '@/shared/contexts/SocketContext';
import { uploadVideoInChunks, type ChunkedUploadProgress } from '@/shared/utils/chunkedVideoUpload';

// ─── Status meta ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.FC<any> }> = {
  pending_approval: { label: 'Pending Approval', color: '#ea580c', bg: '#fff7ed', border: '#fdba74', Icon: Clock },
  pending: { label: 'Processing', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', Icon: Clock },
  paid: { label: 'Pending Dispatch', color: '#a16207', bg: '#fefce8', border: '#fde047', Icon: Clock },
  processing: { label: 'Pending Dispatch', color: '#a16207', bg: '#fefce8', border: '#fde047', Icon: Clock },
  packed: { label: 'Packed', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', Icon: Boxes },
  shipped: { label: 'Dispatched', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', Icon: Truck },
  awaiting_confirmation: { label: 'Awaiting Confirmation', color: '#9333ea', bg: '#faf5ff', border: '#d8b4fe', Icon: Clock },
  completed: { label: 'Completed', color: '#15803d', bg: '#f0fdf4', border: '#86efac', Icon: CheckCircle },
  delivered: { label: 'Delivered', color: '#15803d', bg: '#f0fdf4', border: '#86efac', Icon: CheckCircle },
  disputed: { label: 'Disputed', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', Icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', Icon: XCircle },
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
  { key: 'awaiting_return', label: 'Return Shipped' },
  { key: 'return_received', label: 'Inspected' },
  { key: 'replacement_shipped', label: 'Replacement Sent' },
  { key: 'done', label: 'Confirmed' },
];

const REFUND_RETURN_STEPS = [
  { key: 'awaiting_return', label: 'Return Shipped' },
  { key: 'refund_pending', label: 'Inspected' },
  { key: 'refund_sent', label: 'Refund Issued' },
  { key: 'done', label: 'Confirmed' },
];

const exchangeStepIndex = (stage?: string, isRefund?: boolean, dispute?: any) => {
  if (isRefund) {
    if (stage === 'awaiting_return') return dispute?.returnShippedAt ? 0 : -1;
    if (stage === 'refund_pending' || stage === 'return_received') return 1;
    if (dispute?.status === 'supplier_resolved' || dispute?.refundTransactionId) return 2;
    if (dispute?.buyerConfirmedAt || dispute?.status === 'resolved') return 3;
    return 0;
  }
  if (stage === 'awaiting_return') return dispute?.returnShippedAt ? 0 : -1;
  if (stage === 'return_received') return 1;
  if (stage === 'replacement_shipped') return 2;
  if (dispute?.buyerConfirmedAt || dispute?.status === 'resolved') return 3;
  return 0;
};

const METHOD_META: Record<string, { label: string; icon: string }> = {
  refund: { label: 'Refund', icon: '💰' },
  replacement: { label: 'Replacement', icon: '📦' },
  partial: { label: 'Partial Settlement', icon: '⚖️' },
  other: { label: 'Other Resolution', icon: '🤝' },
};

// Lifecycle stepper steps
const STEPPER = [
  { key: 'placed', label: 'Ordered' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Dispatched' },
  { key: 'awaiting', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
];
const stepIndex = (status: string) => {
  if (['pending_approval', 'pending', 'paid', 'processing'].includes(status)) return 0;
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
  const navigate = useNavigate();
  const { user } = useSelector((state: any) => state.auth);
  const [order, setOrder] = useState<any>(initialOrder);
  const { socket } = useSocket();

  // Re-sync when the parent refetches (e.g. a real-time order_update arrives)
  useEffect(() => { setOrder(initialOrder); }, [initialOrder]);

  // Fetch fresh dispute data on mount and listen to real-time dispute events
  useEffect(() => {
    if (order?._id) {
      orderApi.getDispute(order._id).then(fresh => {
        if (fresh) setOrder((prev: any) => ({ ...prev, _dispute: fresh }));
      }).catch(() => { });
    }
  }, [order?._id]);

  useEffect(() => {
    if (!socket || !order?._id) return;
    const handleDisputeUpdate = () => {
      orderApi.getDispute(order._id).then(fresh => {
        if (fresh) setOrder((prev: any) => ({ ...prev, _dispute: fresh }));
      }).catch(() => { });
      if (onRefresh) onRefresh();
    };
    socket.on('dispute_update', handleDisputeUpdate);
    socket.on('order_update', handleDisputeUpdate);
    return () => {
      socket.off('dispute_update', handleDisputeUpdate);
      socket.off('order_update', handleDisputeUpdate);
    };
  }, [socket, order?._id, onRefresh]);

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
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');

  // ── Supplier: resolve ──
  const [resolveMethod, setResolveMethod] = useState<'refund' | 'replacement' | 'partial' | 'other' | ''>('');
  const [resolveNote, setResolveNote] = useState('');
  const [requiresReturn, setRequiresReturn] = useState<boolean | null>(null);
  const [returnMode, setReturnMode] = useState<'buyer_ships' | 'supplier_pickup' | null>(null);
  const [refundTxId, setRefundTxId] = useState('');
  const [postReturnRefundTxId, setPostReturnRefundTxId] = useState('');
  const [postReturnRefundNote, setPostReturnRefundNote] = useState('');

  // ── Exchange: courier/tracking inputs (return + replacement) ──
  const [returnShipmentType, setReturnShipmentType] = useState<'courier' | 'own_truck'>('courier');
  const [pickupShipmentType, setPickupShipmentType] = useState<'courier' | 'own_truck'>('own_truck');
  const [replacementShipmentType, setReplacementShipmentType] = useState<'courier' | 'own_truck'>('own_truck');
  const [returnVehicleNumber, setReturnVehicleNumber] = useState('');
  const [returnDriverPhone, setReturnDriverPhone] = useState('');
  const [returnTrackingURL, setReturnTrackingURL] = useState('');
  const [exCourier, setExCourier] = useState('');
  const [exTracking, setExTracking] = useState('');
  const [reportIssue, setReportIssue] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // ── Reject direct order modal ──
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderRejectReason, setOrderRejectReason] = useState('');

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
  const [requestedResolution, setRequestedResolution] = useState<'refund' | 'replacement' | 'partial_replacement' | ''>('');
  const [affectedQuantity, setAffectedQuantity] = useState<string>('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [refundBankDetails, setRefundBankDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });

  const [reopenReason, setReopenReason] = useState('');
  const [showReopen, setShowReopen] = useState(false);

  const sync = (patch: any) => { setOrder((o: any) => ({ ...o, ...patch })); onRefresh(); };
  const syncDispute = (patch: any) => { setOrder((o: any) => ({ ...o, _dispute: { ...o._dispute, ...patch } })); onRefresh(); };

  const handleApproveOrder = async () => {
    setBusy(true);
    try {
      const res = await apiClient.put(`/orders/${order._id}/approve`);
      sync({ status: 'pending', poNumber: res.data.order?.poNumber });
      toast.success('Order approved and PO generated.');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to approve order'); }
    finally { setBusy(false); }
  };

  const handleRejectOrder = async () => {
    if (!orderRejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setBusy(true);
    try {
      await apiClient.put(`/orders/${order._id}/reject`, { reason: orderRejectReason.trim() });
      sync({ status: 'cancelled' });
      setShowRejectModal(false);
      setOrderRejectReason('');
      toast.success('Order rejected.');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to reject order'); }
    finally { setBusy(false); }
  };

  const handlePack = async () => {
    setBusy(true);
    try { await orderApi.markPacked(order._id); sync({ status: 'packed' }); toast.success('Marked as packed.'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const transportTerms = String(
    order.transportationTerms ||
    snap.transportationTerms ||
    (typeof order.quotationId === 'object' && (order.quotationId as any)?.transportationTerms) ||
    ''
  ).trim();
  const isExFactory = /ex[.\s-]*factory|ex[.\s-]*godown|ex[.\s-]*mill|self[.\s-]*pickup/i.test(transportTerms);
  const isFOR = /^for$/i.test(transportTerms) || /free on road|door delivery/i.test(transportTerms);

  const handleDispatch = async () => {
    if (!isExFactory && !isFOR && (!courierName.trim() || !trackingNumber.trim())) {
      toast.error('Enter courier name and tracking number.');
      return;
    }
    if (isFOR && !driverPhone.trim()) {
      toast.error('Enter driver/dispatcher mobile number for direct delivery.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        dispatchMode: isExFactory ? 'ex_factory' : isFOR ? 'for' : 'courier',
        courierName: isExFactory ? (courierName.trim() || 'Ex-Factory (Self Pickup)') : isFOR ? (courierName.trim() || 'Supplier Direct Delivery (FOR)') : courierName.trim(),
        trackingNumber: trackingNumber.trim(),
        trackingURL: trackingURL.trim(),
        driverPhone: driverPhone.trim(),
        vehicleNumber: vehicleNumber.trim(),
        dispatchNote: dispatchNote.trim(),
      };
      const res = await orderApi.dispatch(order._id, payload);
      sync({
        status: 'shipped',
        trackingId: res.trackingId,
        courierName: res.courierName,
        driverPhone: driverPhone.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        dispatchNote: dispatchNote.trim() || undefined,
      });
      toast.success(isExFactory ? 'Marked ready for pickup / dispatched.' : isFOR ? 'Order marked out for delivery (FOR).' : 'Order dispatched. Buyer notified.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to dispatch');
    } finally {
      setBusy(false);
    }
  };

  const handleMarkDelivered = async () => {
    setBusy(true);
    try { await orderApi.markDelivered(order._id); sync({ status: 'awaiting_confirmation' }); toast.success('Marked delivered. Buyer has 72h to confirm.'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const handleRequestPayment = async (type: string) => {
    setBusy(true);
    try {
      await apiClient.post(`/orders/${order._id}/payment-request`);
      toast.success(`${type} payment requested successfully`);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to request payment');
    } finally {
      setBusy(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveMethod) { toast.error('Choose a resolution method.'); return; }
    if (resolveMethod === 'replacement' && requiresReturn === null) { toast.error('Choose whether the original must be returned.'); return; }
    if (resolveMethod === 'replacement' && requiresReturn === true && returnMode === null) { toast.error('Choose who arranges the return courier.'); return; }
    if (resolveMethod === 'refund' && requiresReturn === null) { toast.error('Choose whether the buyer needs to return the goods first.'); return; }
    if (resolveMethod === 'refund' && requiresReturn === false && !refundTxId.trim()) { toast.error('Enter the refund Transaction ID (UTR).'); return; }
    setBusy(true);
    try {
      await orderApi.supplierResolveDispute(
        dispute._id,
        resolveMethod as any,
        resolveNote.trim(),
        requiresReturn !== null ? !!requiresReturn : undefined,
        resolveMethod === 'refund' && !requiresReturn ? refundTxId.trim() : undefined,
        requiresReturn ? (returnMode || 'buyer_ships') : undefined
      );
      if (resolveMethod === 'replacement' || (resolveMethod === 'refund' && requiresReturn)) {
        syncDispute({
          status: 'exchange',
          resolutionMethod: resolveMethod,
          requiresReturn: !!requiresReturn,
          returnMode: 'buyer_ships',
          exchangeStage: 'awaiting_return'
        });
        toast.success(resolveMethod === 'refund' ? 'Return & Refund started. Buyer notified to ship goods.' : 'Exchange started. Buyer notified.');
      } else {
        syncDispute({
          status: 'supplier_resolved',
          resolutionMethod: resolveMethod,
          resolutionNote: resolveNote.trim(),
          refundTransactionId: resolveMethod === 'refund' ? refundTxId.trim() : undefined
        });
        toast.success('Resolution submitted. Buyer has 72h to confirm.');
      }
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  // ── Exchange milestone handlers ──
  const exReset = () => {
    setExCourier('');
    setExTracking('');
    setReturnVehicleNumber('');
    setReturnDriverPhone('');
    setReturnTrackingURL('');
  };
  const handleReturnShipment = async () => {
    if (returnShipmentType === 'own_truck') {
      if (!returnVehicleNumber.trim()) {
        toast.error('Please enter the vehicle / truck number');
        return;
      }
      if (!returnDriverPhone.trim()) {
        toast.error('Please enter the driver / transporter phone number');
        return;
      }
    } else {
      if (!exCourier.trim()) {
        toast.error('Please enter the courier / logistics service name');
        return;
      }
      if (!exTracking.trim()) {
        toast.error('Please enter the return tracking / docket number');
        return;
      }
    }

    setBusy(true);
    try {
      const courierVal = returnShipmentType === 'own_truck'
        ? `Own Truck (${returnVehicleNumber.trim()})`
        : exCourier.trim();
      const trackingVal = returnShipmentType === 'own_truck'
        ? returnVehicleNumber.trim()
        : exTracking.trim();

      await orderApi.submitReturnShipment({
        disputeId: dispute._id,
        courier: courierVal,
        tracking: trackingVal,
        shipmentType: returnShipmentType,
        vehicleNumber: returnVehicleNumber.trim() || undefined,
        driverPhone: returnDriverPhone.trim() || undefined,
        trackingURL: returnTrackingURL.trim() || undefined,
      });

      syncDispute({
        returnCourier: courierVal,
        returnTracking: trackingVal,
        returnShipmentType,
        returnVehicleNumber: returnVehicleNumber.trim() || undefined,
        returnDriverPhone: returnDriverPhone.trim() || undefined,
        returnTrackingURL: returnTrackingURL.trim() || undefined,
        returnShippedAt: new Date().toISOString(),
      });
      exReset();
      toast.success('Return shipment recorded.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to submit return shipment');
    } finally {
      setBusy(false);
    }
  };
  const handlePickupTracking = async () => {
    if (pickupShipmentType === 'own_truck') {
      if (!returnVehicleNumber.trim()) {
        toast.error('Please enter the vehicle / truck number');
        return;
      }
      if (!returnDriverPhone.trim()) {
        toast.error('Please enter the driver / transporter phone number');
        return;
      }
    } else {
      if (!exCourier.trim()) {
        toast.error('Please enter the pickup courier name');
        return;
      }
      if (!exTracking.trim()) {
        toast.error('Please enter the pickup tracking number');
        return;
      }
    }

    setBusy(true);
    try {
      const courierVal = pickupShipmentType === 'own_truck'
        ? `Own Truck (${returnVehicleNumber.trim()})`
        : exCourier.trim();
      const trackingVal = pickupShipmentType === 'own_truck'
        ? returnVehicleNumber.trim()
        : exTracking.trim();

      await orderApi.setPickupTracking({
        disputeId: dispute._id,
        shipmentType: pickupShipmentType,
        courier: courierVal,
        tracking: trackingVal,
        vehicleNumber: returnVehicleNumber.trim() || undefined,
        driverPhone: returnDriverPhone.trim() || undefined,
        trackingURL: returnTrackingURL.trim() || undefined,
      });

      syncDispute({
        returnCourier: courierVal,
        returnTracking: trackingVal,
        returnShipmentType: pickupShipmentType,
        returnVehicleNumber: returnVehicleNumber.trim() || undefined,
        returnDriverPhone: returnDriverPhone.trim() || undefined,
        returnTrackingURL: returnTrackingURL.trim() || undefined,
      });
      exReset();
      toast.success('Pickup details saved. Buyer notified.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save pickup details');
    } finally {
      setBusy(false);
    }
  };
  const handleConfirmHandover = async () => {
    setBusy(true);
    try { await orderApi.confirmHandover(dispute._id); syncDispute({ returnShippedAt: new Date().toISOString() }); toast.success('Handover confirmed.'); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };
  const handleReturnReceived = async () => {
    setBusy(true);
    try {
      await orderApi.markReturnReceived(dispute._id);
      if (dispute.resolutionMethod === 'refund') {
        syncDispute({ exchangeStage: 'refund_pending', returnReceivedAt: new Date().toISOString() });
        toast.success('Return received & validated. Please enter the refund UTR.');
      } else {
        syncDispute({ exchangeStage: 'return_received', returnReceivedAt: new Date().toISOString() });
        toast.success('Return received. Now dispatch the replacement.');
      }
    }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); } finally { setBusy(false); }
  };
  const handlePostReturnRefund = async () => {
    if (!postReturnRefundTxId.trim()) {
      toast.error('Enter the refund Transaction ID (UTR).');
      return;
    }
    setBusy(true);
    try {
      await orderApi.submitRefundAfterReturn(dispute._id, postReturnRefundTxId.trim(), postReturnRefundNote.trim());
      syncDispute({
        status: 'supplier_resolved',
        refundTransactionId: postReturnRefundTxId.trim(),
        resolutionNote: postReturnRefundNote.trim() || dispute.resolutionNote,
        supplierResolvedAt: new Date().toISOString(),
      });
      toast.success('Refund submitted! Buyer has been notified to verify receipt.');
      setPostReturnRefundTxId('');
      setPostReturnRefundNote('');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to submit refund');
    } finally {
      setBusy(false);
    }
  };
  const handleGoToChatForPayment = async () => {
    let convId = (order.quotationId as any)?.conversationId?._id
      || (order.quotationId as any)?.conversationId
      || (order as any).conversationId;

    if (!convId) {
      try {
        const convs = await chatApi.getConversations();
        const buyerIdStr = typeof order.buyerId === 'object' ? order.buyerId?._id : order.buyerId;
        const matched = convs.find((c: any) => {
          const cBuyerId = typeof c.buyerId === 'object' ? c.buyerId?._id : c.buyerId;
          return String(cBuyerId) === String(buyerIdStr);
        });
        if (matched) convId = matched._id;
      } catch (err) {
        console.error('Failed to resolve conversation for order', err);
      }
    }

    const isSupplierUser = isSupplier || user?.role === 'supplier';
    const targetUrl = isSupplierUser
      ? (convId ? `/supplier/dashboard?tab=enquiry&conversationId=${convId}` : `/supplier/dashboard?tab=enquiry`)
      : (convId ? `/buyer/profile?tab=messages&conversationId=${convId}` : `/buyer/profile?tab=messages`);
    navigate(targetUrl);
  };
  const handleDispatchReplacement = async () => {
    if (replacementShipmentType === 'own_truck') {
      if (!returnVehicleNumber.trim()) {
        toast.error('Please enter the vehicle / truck number');
        return;
      }
      if (!returnDriverPhone.trim()) {
        toast.error('Please enter the driver / transporter phone number');
        return;
      }
    } else {
      if (!exCourier.trim()) {
        toast.error('Please enter the courier name');
        return;
      }
      if (!exTracking.trim()) {
        toast.error('Please enter the tracking number');
        return;
      }
    }

    setBusy(true);
    try {
      const courierVal = replacementShipmentType === 'own_truck'
        ? `Own Truck (${returnVehicleNumber.trim()})`
        : exCourier.trim();
      const trackingVal = replacementShipmentType === 'own_truck'
        ? returnVehicleNumber.trim()
        : exTracking.trim();

      await orderApi.dispatchReplacement({
        disputeId: dispute._id,
        shipmentType: replacementShipmentType,
        courier: courierVal,
        tracking: trackingVal,
        vehicleNumber: returnVehicleNumber.trim() || undefined,
        driverPhone: returnDriverPhone.trim() || undefined,
        trackingURL: returnTrackingURL.trim() || undefined,
      });

      syncDispute({
        exchangeStage: 'replacement_shipped',
        replacementCourier: courierVal,
        replacementTracking: trackingVal,
        replacementShipmentType,
        replacementVehicleNumber: returnVehicleNumber.trim() || undefined,
        replacementDriverPhone: returnDriverPhone.trim() || undefined,
        replacementTrackingURL: returnTrackingURL.trim() || undefined,
        replacementShippedAt: new Date().toISOString(),
      });
      exReset();
      toast.success('Replacement dispatched. Buyer notified.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to dispatch replacement');
    } finally {
      setBusy(false);
    }
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

  const handleVideoUpload = async (files: FileList | null) => {
    if (!files?.[0]) return;
    const file = files[0];
    if (file.size > 40 * 1024 * 1024) {
      toast.error('Video size must be 40MB or less.');
      return;
    }
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const url = await uploadVideoInChunks(file, (p: ChunkedUploadProgress) => {
        setVideoProgress(p.percent);
      });
      setVideoUrl(url);
      toast.success('Video uploaded successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Video upload failed. Try again.');
    } finally {
      setVideoUploading(false);
      setVideoProgress(null);
    }
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
    if (evidenceUrls.length === 0 && !videoUrl) { toast.error('Attach at least one photo or video evidence.'); return; }
    if (uploading || videoUploading) { toast.error('Please wait for media to finish uploading.'); return; }

    const combinedEvidence: { url: string; type: 'image' | 'video' }[] = [
      ...evidenceUrls.map(url => ({ url, type: 'image' as const })),
      ...(videoUrl ? [{ url: videoUrl, type: 'video' as const }] : []),
    ];

    const hasBank = refundBankDetails.accountNumber.trim() || refundBankDetails.upiId.trim();
    const cleanRefund = hasBank ? {
      accountHolderName: refundBankDetails.accountHolderName.trim() || undefined,
      bankName: refundBankDetails.bankName.trim() || undefined,
      accountNumber: refundBankDetails.accountNumber.trim() || undefined,
      ifscCode: refundBankDetails.ifscCode.trim().toUpperCase() || undefined,
      upiId: refundBankDetails.upiId.trim() || undefined,
    } : undefined;

    setBusy(true);
    try {
      const qtyNum = affectedQuantity ? parseFloat(affectedQuantity) : undefined;
      await orderApi.raiseDispute(order._id, {
        issueType,
        description: issueDesc.trim(),
        evidence: combinedEvidence,
        requestedResolution: (requestedResolution || undefined) as any,
        affectedQuantity: qtyNum && !isNaN(qtyNum) ? qtyNum : undefined,
        buyerRefundDetails: cleanRefund,
      });
      sync({
        status: 'disputed',
        _dispute: {
          status: 'open',
          issueType,
          description: issueDesc.trim(),
          evidence: combinedEvidence,
          requestedResolution: requestedResolution || undefined,
          affectedQuantity: qtyNum && !isNaN(qtyNum) ? qtyNum : undefined,
          buyerRefundDetails: cleanRefund,
        }
      });
      toast.success('Ticket raised. Our team will review it shortly.');
      setConfirmMode('idle');
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const handleConfirmResolved = async () => {
    setBusy(true);
    try {
      await orderApi.buyerConfirmResolved(dispute._id);
      if (dispute.resolutionMethod === 'refund') {
        // Refund: buyer only acknowledges. The order is NOT completed here — an admin must
        // verify the refund before the supplier's commission is released.
        syncDispute({ buyerConfirmedAt: new Date().toISOString() });
        toast.success('Refund confirmed. Our team will verify it and close the ticket shortly.');
      } else {
        sync({ status: 'completed', _dispute: { ...dispute, status: 'resolved' } });
        toast.success('Confirmed. Order completed!');
      }
    }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const handleReopen = async () => {
    setBusy(true);
    try { await orderApi.buyerReopenDispute(dispute._id, reopenReason.trim()); syncDispute({ status: 'reopened' }); toast.success('Reopened. Supplier notified.'); setShowReopen(false); setReopenReason(''); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '');
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
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span className="text-sm font-extrabold text-[#0f172a] bg-[#e2e8f0] px-3 py-1 rounded-full">{order.orderNumber}</span>
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border" style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
            <StatusIcon size={12} /> {cfg.label}
          </span>
        </div>
        <button
          onClick={() => {
            const url = `${window.location.origin}/orders/${order._id}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(url)
                .then(() => toast.success('Order link copied!'))
                .catch((err) => {
                  console.error('Clipboard error:', err);
                  toast.error('Failed to copy link.');
                });
            } else {
              try {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                toast.success('Order link copied!');
              } catch (err) {
                console.error('Fallback copy error:', err);
                toast.error('Failed to copy link.');
              }
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-[#475569] bg-white border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:bg-[#f8fafc] shrink-0"
          title="Copy shareable link"
        >
          <Link2 size={14} /> Share
        </button>
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

      {/* Delivery address — supplier needs this to ship the order */}
      {isSupplier && (
        <div className={`${card} p-5`}>
          <p className={sectionTitle}>Delivery Address</p>
          {snap.buyerAddress?.fullAddress || snap.buyerAddress?.city ? (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-[#059669]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0f172a] m-0 mb-1">{snap.buyerAddress?.fullName || contactName}</p>
                <p className="text-sm text-[#475569] m-0 leading-relaxed">
                  {snap.buyerAddress?.fullAddress}
                  {snap.buyerAddress?.city && <>, {snap.buyerAddress.city}</>}
                  {snap.buyerAddress?.state && <>, {snap.buyerAddress.state}</>}
                  {snap.buyerAddress?.pincode && <> - {snap.buyerAddress.pincode}</>}
                </p>
                {snap.buyerAddress?.phone && (
                  <p className="text-xs text-[#64748b] m-0 mt-1.5">📞 {snap.buyerAddress.phone}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#94a3b8] m-0">No delivery address on file for this order.</p>
          )}
        </div>
      )}

      {/* Order summary */}
      <div className={`${card} p-5`}>
        <p className={sectionTitle}>Order Summary</p>
        <div className="flex flex-col gap-4 mb-4">
          {order.items?.map((it: any, i: number) => {
            const itemImage = it.image || it.imageUrl || (i === 0 ? productImage : '');
            return (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-[#f8fafc] border border-[#eef2f6] shrink-0 flex items-center justify-center shadow-inner">
                  {itemImage ? (
                    <img src={itemImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={20} className="text-[#cbd5e1]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-[#0f172a] m-0 line-clamp-2">{it.name}</p>
                  <p className="text-xs text-[#64748b] m-0 mt-1 flex items-center flex-wrap gap-1.5">
                    <span>₹{it.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{it.unit || 'pcs'} · Qty {it.quantity} {it.unit || 'pcs'}</span>
                    {it.gstRate !== undefined && (
                      <span className="text-[10px] font-semibold text-[#0369a1] bg-[#e0f2fe] border border-[#bae6fd] px-1.5 py-0.5 rounded">
                        GST({it.gstRate}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cost breakdown */}
        <div className="bg-[#f8fafc] rounded-[10px] border border-[#eef2f6] divide-y divide-[#f1f5f9]">
          {(() => {
            const taxable = snap.taxableAmount ?? order.subtotal ?? 0;
            const gstAmt = snap.gstAmount ?? 0;
            const shipping = order.shippingCost ?? 0;
            const courierGst = order.courierGST ?? 0;
            const gstType = snap.gstType;
            const gstRate = snap.gstRate ?? 0;
            const showGst = gstType && gstType !== 'exempt' && gstAmt > 0;
            const gstLines = (snap.gstBreakdown || []).filter((l: any) => l.rate > 0 && l.gst > 0);
            return (
              <>
                <div className="flex items-center justify-between px-4 py-2 text-xs text-[#64748b]"><span>Taxable Amount</span><span className="font-medium text-[#0f172a]">₹{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                {showGst && gstLines.length > 0 ? (
                  gstLines.map((line: any, idx: number) => (
                    gstType === 'IGST' ? (
                      <div key={idx} className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]">
                        <span>IGST @ {line.rate}%</span>
                        <span>₹{line.gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ) : (
                      <React.Fragment key={idx}>
                        <div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]">
                          <span>CGST @ {line.rate / 2}%</span>
                          <span>₹{(line.gst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]">
                          <span>SGST @ {line.rate / 2}%</span>
                          <span>₹{(line.gst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </React.Fragment>
                    )
                  ))
                ) : showGst ? (
                  gstType === 'IGST' ? (
                    <div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]">
                      <span>IGST @ {gstRate}%</span>
                      <span>₹{gstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]">
                        <span>CGST @ {gstRate / 2}%</span>
                        <span>₹{(gstAmt / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]">
                        <span>SGST @ {gstRate / 2}%</span>
                        <span>₹{(gstAmt / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )
                ) : (
                  <div className="flex items-center justify-between px-4 py-2 text-xs text-[#94a3b8]"><span>GST</span><span>Exempt / Nil</span></div>
                )}
                {shipping > 0 && <div className="flex items-center justify-between px-4 py-2 text-xs text-[#64748b]"><span>Shipping</span><span className="font-medium text-[#0f172a]">₹{shipping.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>}
                {courierGst > 0 && <div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]"><span>Courier GST (18%)</span><span className="font-medium">₹{courierGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>}
              </>
            );
          })()}
          <div className="flex items-center justify-between px-4 py-3 bg-[#fff7ed]"><span className="text-sm font-bold text-[#0f172a]">Grand Total</span><span className="text-base font-extrabold text-primary">₹{order.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>

        {(snap.deliveryTimeline || snap.shippingNotes) && (
          <div className="mt-3 text-xs text-[#64748b] flex flex-col gap-1">
            {snap.deliveryTimeline && <p className="m-0">Delivery: <strong className="text-[#0f172a]">{snap.deliveryTimeline}</strong></p>}
            {snap.shippingNotes && <p className="m-0">Notes: <span className="text-[#475569]">{snap.shippingNotes}</span></p>}
          </div>
        )}

        {order.poNumber && (
          <a href={`${apiBase}/api/orders/${order._id}/po-download`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs font-bold text-[#0369a1] bg-[#eff6ff] border border-[#bfdbfe] rounded-[6px] no-underline hover:bg-[#dbeafe]">
            <Download size={12} /> Download PO
          </a>
        )}
      </div>

      {/* Tracking / Pickup */}
      {['shipped', 'awaiting_confirmation', 'completed', 'disputed'].includes(order.status) && (
        isExFactory ? (
          <div className={`${card} p-5 border-[#fde68a] bg-[#fffdf7]`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-[#b45309] m-0 uppercase tracking-wider flex items-center gap-1.5">
                <Store size={14} /> Warehouse Pickup (Ex-Factory)
              </p>
              <span className="text-[10px] font-bold bg-[#fef3c7] text-[#92400e] px-2.5 py-0.5 rounded-full">Buyer Self Pickup</span>
            </div>
            <p className="text-sm font-semibold text-[#0f172a] m-0">Order is ready for collection at supplier factory/warehouse.</p>
            <p className="text-xs text-[#78350f] m-0 mt-1">Please arrange transportation from the supplier's warehouse.</p>
            <div className="mt-3 pt-3 border-t border-[#fde68a] flex flex-col gap-1 text-xs text-[#475569]">
              {order.trackingId && <p className="m-0">Ref / Pickup ID: <strong className="text-[#0f172a]">{order.trackingId}</strong></p>}
              {order.vehicleNumber && <p className="m-0">Vehicle No: <strong className="text-[#0f172a]">{order.vehicleNumber}</strong></p>}
              {order.driverPhone && (
                <p className="m-0 flex items-center gap-1.5">
                  Driver Contact: <a href={`tel:${order.driverPhone}`} className="text-primary font-bold hover:underline">{order.driverPhone}</a>
                </p>
              )}
              {order.dispatchNote && <p className="m-0">Pickup Note: <span className="text-[#0f172a]">{order.dispatchNote}</span></p>}
            </div>
          </div>
        ) : isFOR ? (
          <div className={`${card} p-5 border-[#bfdbfe] bg-[#f8fbff]`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-[#1d4ed8] m-0 uppercase tracking-wider flex items-center gap-1.5">
                <Truck size={14} /> Direct Delivery (FOR)
              </p>
              <span className="text-[10px] font-bold bg-[#dbeafe] text-[#1e40af] px-2.5 py-0.5 rounded-full">Delivered by Supplier</span>
            </div>
            <p className="text-sm font-semibold text-[#0f172a] m-0">Supplier is delivering this order directly to your address.</p>
            <div className="mt-3 pt-3 border-t border-[#bfdbfe] flex flex-col gap-1 text-xs text-[#475569]">
              {order.driverPhone && (
                <p className="m-0 flex items-center gap-1.5 text-sm font-bold text-[#0f172a]">
                  <Phone size={14} className="text-primary" /> Driver / Contact: <a href={`tel:${order.driverPhone}`} className="text-primary font-extrabold hover:underline">{order.driverPhone}</a>
                </p>
              )}
              {order.trackingId && <p className="m-0">Delivery Ref: <strong className="text-[#0f172a]">{order.trackingId}</strong></p>}
              {order.vehicleNumber && <p className="m-0">Vehicle / Tempo No: <strong className="text-[#0f172a]">{order.vehicleNumber}</strong></p>}
              {order.dispatchNote && <p className="m-0">Delivery Note: <span className="text-[#0f172a]">{order.dispatchNote}</span></p>}
            </div>
          </div>
        ) : order.trackingId ? (
          <div className={`${card} p-5`}>
            <p className={sectionTitle}>Shipment Details</p>
            <p className="text-sm text-[#0f172a] m-0">Courier: <strong>{order.courierName || 'AMJSTAR COURIER SERVICES'}</strong></p>
            <p className="text-sm text-[#0f172a] m-0">Tracking / Docket: <strong>{order.trackingId}</strong></p>
            {order.trackingURL && <a href={order.trackingURL} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1d4ed8] hover:underline mt-1 inline-block">Track shipment →</a>}
          </div>
        ) : null
      )}

      {/* ── DISPUTE PANEL ──────────────────────────────────────────────────── */}
      {dispute && (
        <div className={`${card} p-5 border-[#fca5a5]`}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#dc2626] m-0 flex items-center gap-1.5"><AlertTriangle size={14} /> Dispute</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {dispute.adminRefundVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803d] bg-[#dcfce7] border border-[#86efac] px-2.5 py-0.5 rounded-full">
                  <CheckCircle size={11} /> Admin Verified Refund
                </span>
              ) : dispute.status === 'resolved' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803d] bg-[#dcfce7] border border-[#86efac] px-2.5 py-0.5 rounded-full">
                  <CheckCircle size={11} /> Resolved
                </span>
              ) : dispute.buyerConfirmedAt ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0284c7] bg-[#f0f9ff] border border-[#bae6fd] px-2.5 py-0.5 rounded-full">
                  <CheckCircle size={11} /> Buyer Confirmed Refund — Awaiting Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#b91c1c] bg-[#fef2f2] border border-[#fca5a5] px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={11} /> {DISPUTE_LABEL[dispute.status] || dispute.status}
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[8px] px-4 py-3 mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-[#b91c1c] m-0 capitalize">{dispute.issueType} issue</p>
              {dispute.requestedResolution && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
                  Requested: {dispute.requestedResolution === 'refund' ? 'Refund' : dispute.requestedResolution === 'partial_replacement' ? 'Partial Replacement' : 'Full Replacement'}
                  {dispute.affectedQuantity ? ` (${dispute.affectedQuantity} qty)` : ''}
                </span>
              )}
            </div>
            <p className="text-sm text-[#7f1d1d] m-0 whitespace-pre-wrap">{dispute.description}</p>
          </div>

          {/* Transportation Policy Banner in Dispute Card */}
          {(dispute.resolutionMethod === 'refund' || dispute.requestedResolution === 'refund') ? (
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[8px] p-2.5 mb-3 text-xs text-[#92400e] flex items-start gap-2">
              <Truck size={15} className="shrink-0 mt-0.5 text-[#d97706]" />
              <div>
                <p className="m-0 font-bold">Transportation Policy (Refund):</p>
                <p className="m-0 mt-0.5 text-[11px] leading-relaxed">
                  Return freight charges will be borne by the <strong>Buyer</strong>. Goods must be dispatched from buyer factory to supplier. Supplier inspects material quality & quantity upon arrival before issuing refund. Deal closes once buyer confirms payment receipt.
                </p>
              </div>
            </div>
          ) : (dispute.resolutionMethod === 'replacement' || dispute.requestedResolution === 'replacement' || dispute.requestedResolution === 'partial_replacement') ? (
            <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] p-2.5 mb-3 text-xs text-[#1e40af] flex items-start gap-2">
              <Truck size={15} className="shrink-0 mt-0.5 text-[#2563eb]" />
              <div>
                <p className="m-0 font-bold">Transportation Policy (Replacement):</p>
                <p className="m-0 mt-0.5 text-[11px] leading-relaxed">
                  Return and replacement freight charges will be borne by the <strong>Supplier</strong>. Buyer dispatches defective material back → Supplier validates quality &amp; quantity upon receipt → Supplier dispatches replacement → Buyer confirms receipt to close deal.
                </p>
              </div>
            </div>
          ) : null}

          {dispute.evidence?.length > 0 && (
            <div className="flex flex-wrap gap-2.5 mb-3">
              {dispute.evidence.map((ev: any, i: number) => (
                ev.type === 'video' ? (
                  <div key={i} className="relative rounded-[8px] overflow-hidden border border-[#e2e8f0] bg-black w-48 h-28 flex flex-col justify-center">
                    <video src={ev.url} controls className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-[8px] overflow-hidden border border-[#e2e8f0]">
                    <img src={ev.url} alt="" className="w-full h-full object-cover" />
                  </a>
                )
              ))}
            </div>
          )}

          {/* Buyer Refund Account Details (shown to Supplier & Buyer) */}
          {dispute.buyerRefundDetails && (dispute.buyerRefundDetails.accountNumber || dispute.buyerRefundDetails.upiId) && (
            <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] p-3 mb-3 text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1e40af] flex items-center gap-1.5">
                  <CreditCard size={14} /> Buyer's Refund Account Details
                </span>
                {isSupplier && <span className="text-[10px] text-[#2563eb] font-semibold">Transfer refund to this account</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-[#334155]">
                {dispute.buyerRefundDetails.accountHolderName && (
                  <p className="m-0">Holder: <strong>{dispute.buyerRefundDetails.accountHolderName}</strong></p>
                )}
                {dispute.buyerRefundDetails.bankName && (
                  <p className="m-0">Bank: <strong>{dispute.buyerRefundDetails.bankName}</strong></p>
                )}
                {dispute.buyerRefundDetails.accountNumber && (
                  <p className="m-0 flex items-center gap-1">
                    Account: <strong className="font-mono">{dispute.buyerRefundDetails.accountNumber}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(dispute.buyerRefundDetails.accountNumber);
                        setCopiedField('acc');
                        setTimeout(() => setCopiedField(null), 2000);
                        toast.success('Account number copied!');
                      }}
                      className="text-[#2563eb] hover:underline bg-transparent border-none p-0 cursor-pointer text-[10px]"
                    >
                      {copiedField === 'acc' ? <Check size={11} className="text-green-600 inline" /> : <Copy size={11} className="inline" />}
                    </button>
                  </p>
                )}
                {dispute.buyerRefundDetails.ifscCode && (
                  <p className="m-0 flex items-center gap-1">
                    IFSC: <strong className="font-mono">{dispute.buyerRefundDetails.ifscCode}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(dispute.buyerRefundDetails.ifscCode);
                        setCopiedField('ifsc');
                        setTimeout(() => setCopiedField(null), 2000);
                        toast.success('IFSC code copied!');
                      }}
                      className="text-[#2563eb] hover:underline bg-transparent border-none p-0 cursor-pointer text-[10px]"
                    >
                      {copiedField === 'ifsc' ? <Check size={11} className="text-green-600 inline" /> : <Copy size={11} className="inline" />}
                    </button>
                  </p>
                )}
                {dispute.buyerRefundDetails.upiId && (
                  <p className="m-0 sm:col-span-2 flex items-center gap-1">
                    UPI ID: <strong className="font-mono text-[#0284c7]">{dispute.buyerRefundDetails.upiId}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(dispute.buyerRefundDetails.upiId);
                        setCopiedField('upi');
                        setTimeout(() => setCopiedField(null), 2000);
                        toast.success('UPI ID copied!');
                      }}
                      className="text-[#2563eb] hover:underline bg-transparent border-none p-0 cursor-pointer text-[10px]"
                    >
                      {copiedField === 'upi' ? <Check size={11} className="text-green-600 inline" /> : <Copy size={11} className="inline" />}
                    </button>
                  </p>
                )}
              </div>
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
              {dispute.buyerConfirmedAt && (
                <div className="mt-2.5 pt-2 border-t border-[#bbf7d0] flex items-center justify-between text-xs text-[#15803d]">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle size={14} className="text-[#16a34a]" /> Buyer confirmed receipt of refund
                  </span>
                  <span className="text-[11px] text-[#166534]">
                    {new Date(dispute.buyerConfirmedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SUPPLIER resolve panel */}
          {isSupplier && ['validated', 'reopened'].includes(dispute.status) && (
            <div className="border-t border-[#f1f5f9] pt-4">
              <p className="text-sm font-bold text-[#0f172a] m-0 mb-1">Resolve this dispute</p>
              <p className="text-xs text-[#64748b] m-0 mb-3">Coordinate with the buyer (call / mail above), then pick how you'll resolve it.</p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {resolveOptions.map(m => (
                  <button key={m} type="button" onClick={() => {
                    setResolveMethod(m);
                    if (m === 'replacement' || m === 'refund') {
                      setRequiresReturn(true);
                      setReturnMode(m === 'refund' ? 'buyer_ships' : null);
                    } else {
                      setRequiresReturn(null);
                      setReturnMode(null);
                    }
                  }}
                    className={`text-left p-3 rounded-[8px] border cursor-pointer transition-colors ${resolveMethod === m ? 'border-[#059669] bg-[#f0fdf4]' : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'}`}>
                    <span className="text-sm font-bold text-[#0f172a]">{METHOD_META[m].icon} {METHOD_META[m].label}</span>
                  </button>
                ))}
              </div>

              {/* Replacement → ask about return logistics */}
              {resolveMethod === 'replacement' && (
                <div className="mb-3 p-3 bg-[#f8fafc] border border-[#eef2f6] rounded-[8px]">
                  <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[6px] p-2.5 mb-2.5 text-xs text-[#1e40af] flex items-start gap-2">
                    <Truck size={14} className="shrink-0 mt-0.5 text-[#2563eb]" />
                    <div>
                      <p className="m-0 font-bold">Transportation Policy Note (Replacement):</p>
                      <p className="m-0 mt-0.5 text-[11px] leading-relaxed">
                        Return and replacement freight charges are borne by the <strong>Supplier</strong>. Buyer ships defective goods back first → you inspect quality &amp; quantity → dispatch replacement.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-[#0f172a] m-0 mb-2">Does the buyer need to return the original first?</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRequiresReturn(true)}
                      className={`flex-1 p-2.5 rounded-[8px] border text-xs font-bold cursor-pointer ${requiresReturn === true ? 'border-[#059669] bg-[#f0fdf4] text-[#15803d]' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                      Yes — return required first
                    </button>
                    <button type="button" onClick={() => { setRequiresReturn(false); setReturnMode(null); }}
                      className={`flex-1 p-2.5 rounded-[8px] border text-xs font-bold cursor-pointer ${requiresReturn === false ? 'border-[#059669] bg-[#f0fdf4] text-[#15803d]' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                      No — replace directly
                    </button>
                  </div>

                  {/* Who arranges the return courier? */}
                  {requiresReturn === true && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-[#0f172a] m-0 mb-2">Who arranges the return courier? (Cost borne by Supplier)</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setReturnMode('buyer_ships')}
                          className={`flex-1 p-2.5 rounded-[8px] border text-xs font-bold cursor-pointer ${returnMode === 'buyer_ships' ? 'border-[#059669] bg-[#f0fdf4] text-[#15803d]' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                          🚚 Buyer ships it back
                        </button>
                        <button type="button" onClick={() => setReturnMode('supplier_pickup')}
                          className={`flex-1 p-2.5 rounded-[8px] border text-xs font-bold cursor-pointer ${returnMode === 'supplier_pickup' ? 'border-[#059669] bg-[#f0fdf4] text-[#15803d]' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                          📦 I'll send a courier/vehicle to pick up
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Refund → ask about return first vs immediate refund */}
              {resolveMethod === 'refund' && (
                <div className="mb-3 p-3 bg-[#f8fafc] border border-[#eef2f6] rounded-[8px]">
                  <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[6px] p-2.5 mb-2.5 text-xs text-[#92400e] flex items-start gap-2">
                    <Truck size={14} className="shrink-0 mt-0.5 text-[#d97706]" />
                    <div>
                      <p className="m-0 font-bold">Transportation Policy Note (Refund):</p>
                      <p className="m-0 mt-0.5 text-[11px] leading-relaxed">
                        Return freight charges will be borne by the <strong>Buyer</strong>. Material is dispatched from buyer factory to supplier.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-[#0f172a] m-0 mb-2">Does the buyer need to return the goods to your factory first?</p>
                  <div className="flex gap-2 mb-2.5">
                    <button type="button" onClick={() => { setRequiresReturn(true); setReturnMode('buyer_ships'); }}
                      className={`flex-1 p-2.5 rounded-[8px] border text-xs font-bold cursor-pointer ${requiresReturn === true ? 'border-[#059669] bg-[#f0fdf4] text-[#15803d]' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                      Yes — return required first (Buyer ships)
                    </button>
                    <button type="button" onClick={() => setRequiresReturn(false)}
                      className={`flex-1 p-2.5 rounded-[8px] border text-xs font-bold cursor-pointer ${requiresReturn === false ? 'border-[#059669] bg-[#f0fdf4] text-[#15803d]' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                      No — direct refund without return
                    </button>
                  </div>

                  {requiresReturn === true && (
                    <p className="text-[11px] text-[#475569] m-0 bg-white p-2.5 rounded-[6px] border border-[#e2e8f0] leading-relaxed">
                      📦 <strong>Process:</strong> Buyer ships material back from their factory (bearing return freight). Once you receive and validate the material quality & quantity, you will submit the refund UTR.
                    </p>
                  )}

                  {requiresReturn === false && (
                    <div className="mt-2">
                      <label className="text-xs font-bold text-[#0f172a] block mb-1">Refund Transaction ID / UTR <span className="text-[#dc2626]">*</span></label>
                      <input value={refundTxId} onChange={e => setRefundTxId(e.target.value)} placeholder="e.g. UTR 1234567890 / UPI ref"
                        className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary uppercase font-mono" />
                      <p className="text-[11px] text-[#94a3b8] m-0 mt-1">The buyer sees this to verify the direct refund hit their account.</p>
                    </div>
                  )}
                </div>
              )}

              {!(resolveMethod === 'replacement' || (resolveMethod === 'refund' && requiresReturn === true)) && (
                <textarea value={resolveNote} onChange={e => setResolveNote(e.target.value)} rows={3}
                  placeholder={resolveMethod === 'refund' ? 'Optional note for the buyer…' : "Details shared with the buyer — e.g. 'Settled ₹X by mutual agreement'"}
                  className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary resize-none mb-3" />
              )}
              <button onClick={handleResolve}
                disabled={busy || !resolveMethod || (resolveMethod === 'replacement' && requiresReturn === null) || (resolveMethod === 'replacement' && requiresReturn === true && returnMode === null) || (resolveMethod === 'refund' && requiresReturn === null) || (resolveMethod === 'refund' && requiresReturn === false && !refundTxId.trim())}
                className="w-full py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50">
                {busy ? 'Submitting…' : (resolveMethod === 'replacement' || (resolveMethod === 'refund' && requiresReturn === true)) ? 'Approve Return & Resolution' : 'Submit Resolution'}
              </button>
            </div>
          )}

          {isSupplier && dispute.status === 'open' && <p className="text-xs text-[#a16207] m-0 flex items-center gap-1.5"><Clock size={13} /> Awaiting AMJSTAR review before you act.</p>}
          {isSupplier && dispute.status === 'supplier_resolved' && (
            dispute.buyerConfirmedAt ? (
              <div className="p-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-[8px] flex items-start gap-2.5 text-xs text-[#0369a1]">
                <CheckCircle size={16} className="text-[#0284c7] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0c4a6e] m-0 text-sm">Buyer Confirmed Refund Receipt</p>
                  <p className="text-[#0369a1] m-0 mt-0.5">The buyer has confirmed receiving the refund. AMJSTAR admin is verifying the transaction (UTR: <strong className="font-mono">{dispute.refundTransactionId}</strong>) to unfreeze and release your commission.</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#9333ea] m-0 flex items-center gap-1.5"><Clock size={13} /> Awaiting buyer confirmation (72h window).</p>
            )
          )}

          {/* BUYER confirm / reopen panel (refund/partial/other) */}
          {!isSupplier && dispute.status === 'open' && <p className="text-xs text-[#a16207] m-0 flex items-center gap-1.5"><Clock size={13} /> Our team is reviewing your ticket.</p>}
          {!isSupplier && ['validated', 'reopened'].includes(dispute.status) && <p className="text-xs text-[#0284c7] m-0 flex items-center gap-1.5"><Clock size={13} /> Verified — the supplier is resolving it. Coordinate via call / mail above.</p>}
          {!isSupplier && dispute.status === 'supplier_resolved' && dispute.resolutionMethod === 'refund' && dispute.buyerConfirmedAt && (
            <div className="border-t border-[#f1f5f9] pt-4">
              <p className="text-xs text-[#059669] m-0 flex items-center gap-1.5"><Clock size={13} /> You confirmed the refund. Our team will verify it and close the ticket shortly.</p>
            </div>
          )}

          {!isSupplier && dispute.status === 'supplier_resolved' && !(dispute.resolutionMethod === 'refund' && dispute.buyerConfirmedAt) && (
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
                {(dispute.resolutionMethod === 'refund' ? REFUND_RETURN_STEPS : EXCHANGE_STEPS.filter(s => dispute.requiresReturn || s.key !== 'awaiting_return')).map((s, i, arr) => {
                  const active = exchangeStepIndex(dispute.exchangeStage);
                  const stepList = dispute.resolutionMethod === 'refund' ? REFUND_RETURN_STEPS : EXCHANGE_STEPS;
                  const myIdx = stepList.findIndex(x => x.key === s.key);
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

              {/* Transportation Policy Note */}
              {dispute.resolutionMethod === 'refund' ? (
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[8px] p-2.5 mb-3 text-xs text-[#92400e] flex items-start gap-2">
                  <Truck size={15} className="shrink-0 mt-0.5 text-[#d97706]" />
                  <div>
                    <p className="m-0 font-bold">Transportation Policy (Refund):</p>
                    <p className="m-0 mt-0.5 text-[11px] leading-relaxed">
                      Return freight charges are borne by the <strong>Buyer</strong>. Goods are dispatched from buyer factory to supplier. Supplier inspects quantity &amp; quality upon arrival before issuing refund. Deal closes after buyer confirms refund payment receipt.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] p-2.5 mb-3 text-xs text-[#1e40af] flex items-start gap-2">
                  <Truck size={15} className="shrink-0 mt-0.5 text-[#2563eb]" />
                  <div>
                    <p className="m-0 font-bold">Transportation Policy (Replacement):</p>
                    <p className="m-0 mt-0.5 text-[11px] leading-relaxed">
                      Return &amp; replacement freight charges are borne by the <strong>Supplier</strong>. Buyer ships defective goods back first → Supplier validates quality &amp; quantity upon arrival → Supplier dispatches replacement → Buyer confirms receipt to close deal.
                    </p>
                  </div>
                </div>
              )}

              {/* Return tracking shown */}
              {dispute.returnTracking && (
                dispute.returnShipmentType === 'own_truck' || dispute.returnVehicleNumber ? (
                  <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-[8px] p-3 mb-3 text-xs text-[#0369a1] flex items-start gap-2.5">
                    <Truck size={16} className="shrink-0 mt-0.5 text-[#0284c7]" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[#0c4a6e] block text-xs">Return Dispatched via Own Truck:</span>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span>Vehicle / Truck No: <strong className="text-[#0f172a] font-mono font-bold">{dispute.returnVehicleNumber || dispute.returnTracking}</strong></span>
                        {dispute.returnDriverPhone && (
                          <span>Driver / Contact: <a href={`tel:${dispute.returnDriverPhone}`} className="text-primary font-bold hover:underline">{dispute.returnDriverPhone}</a></span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-[8px] p-3 mb-3 text-xs text-[#0369a1] flex items-start gap-2.5">
                    <Package size={16} className="shrink-0 mt-0.5 text-[#0284c7]" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[#0c4a6e] block text-xs">Return Dispatched via Courier:</span>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span>Courier: <strong className="text-[#0f172a] font-bold">{dispute.returnCourier}</strong></span>
                        <span>Tracking: <strong className="text-[#0f172a] font-mono font-bold">{dispute.returnTracking}</strong></span>
                        {dispute.returnTrackingURL && (
                          <a
                            href={dispute.returnTrackingURL.startsWith('http') ? dispute.returnTrackingURL : `https://${dispute.returnTrackingURL}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#0284c7] font-bold hover:underline"
                          >
                            <ExternalLink size={12} /> Track Package
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
              {dispute.replacementTracking && (
                dispute.replacementShipmentType === 'own_truck' || dispute.replacementVehicleNumber ? (
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] p-3 mb-3 text-xs text-[#166534] flex items-start gap-2.5">
                    <Truck size={16} className="shrink-0 mt-0.5 text-[#16a34a]" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[#14532d] block text-xs">Replacement Dispatched via Supplier's Own Truck:</span>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span>Vehicle / Truck No: <strong className="text-[#0f172a] font-mono font-bold">{dispute.replacementVehicleNumber || dispute.replacementTracking}</strong></span>
                        {dispute.replacementDriverPhone && (
                          <span>Driver / Contact: <a href={`tel:${dispute.replacementDriverPhone}`} className="text-primary font-bold hover:underline">{dispute.replacementDriverPhone}</a></span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] p-3 mb-3 text-xs text-[#166534] flex items-start gap-2.5">
                    <Package size={16} className="shrink-0 mt-0.5 text-[#16a34a]" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[#14532d] block text-xs">Replacement Dispatched via Courier:</span>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span>Courier: <strong className="text-[#0f172a] font-bold">{dispute.replacementCourier}</strong></span>
                        <span>Tracking: <strong className="text-[#0f172a] font-mono font-bold">{dispute.replacementTracking}</strong></span>
                        {dispute.replacementTrackingURL && (
                          <a
                            href={dispute.replacementTrackingURL.startsWith('http') ? dispute.replacementTrackingURL : `https://${dispute.replacementTrackingURL}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#0284c7] font-bold hover:underline"
                          >
                            <ExternalLink size={12} /> Track Package
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
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
                      <div className="flex flex-col gap-3 p-3.5 bg-white border border-[#e2e8f0] rounded-[10px] shadow-2xs">
                        <div>
                          <p className="text-sm font-bold text-[#0f172a] m-0">Ship the original back</p>
                          <p className="text-xs text-[#64748b] m-0 mt-0.5">Select how you are dispatching the return goods to the supplier:</p>
                        </div>

                        {/* Choice Tabs: Own Truck vs Courier */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px]">
                          <button
                            type="button"
                            onClick={() => setReturnShipmentType('own_truck')}
                            className={`py-2 px-3 rounded-[6px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${returnShipmentType === 'own_truck'
                              ? 'bg-white text-[#0f172a] shadow-xs border border-[#cbd5e1]'
                              : 'text-[#64748b] hover:text-[#0f172a] border border-transparent'
                              }`}
                          >
                            <Truck size={14} className={returnShipmentType === 'own_truck' ? 'text-primary' : 'text-[#94a3b8]'} />
                            <span>Own Truck / Vehicle</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReturnShipmentType('courier')}
                            className={`py-2 px-3 rounded-[6px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${returnShipmentType === 'courier'
                              ? 'bg-white text-[#0f172a] shadow-xs border border-[#cbd5e1]'
                              : 'text-[#64748b] hover:text-[#0f172a] border border-transparent'
                              }`}
                          >
                            <Package size={14} className={returnShipmentType === 'courier' ? 'text-primary' : 'text-[#94a3b8]'} />
                            <span>Courier Service</span>
                          </button>
                        </div>

                        {/* Own Truck Inputs */}
                        {returnShipmentType === 'own_truck' ? (
                          <div className="flex flex-col gap-2.5 pt-1">
                            <div>
                              <label className="text-xs font-bold text-[#475569] block mb-1">
                                Vehicle / Truck Number <span className="text-rose-500">*</span>
                              </label>
                              <input
                                value={returnVehicleNumber}
                                onChange={e => setReturnVehicleNumber(e.target.value)}
                                placeholder="e.g. DL 01 AB 1234 / UP 16 XY 9876"
                                className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-[#475569] block mb-1">
                                Driver / Transporter Phone Number <span className="text-rose-500">*</span>
                              </label>
                              <input
                                value={returnDriverPhone}
                                onChange={e => setReturnDriverPhone(e.target.value)}
                                placeholder="e.g. +91 9876543210"
                                className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                        ) : (
                          /* Courier Service Inputs */
                          <div className="flex flex-col gap-2.5 pt-1">
                            <div>
                              <label className="text-xs font-bold text-[#475569] block mb-1">
                                Courier / Logistics Service Name <span className="text-rose-500">*</span>
                              </label>
                              <input
                                value={exCourier}
                                onChange={e => setExCourier(e.target.value)}
                                placeholder="e.g. Delhivery, Blue Dart, TCI Freight, VRL..."
                                className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-[#475569] block mb-1">
                                Tracking / Docket / LR Number <span className="text-rose-500">*</span>
                              </label>
                              <input
                                value={exTracking}
                                onChange={e => setExTracking(e.target.value)}
                                placeholder="e.g. AWB123456789 / DKT-9988"
                                className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-[#475569] block mb-1">
                                Tracking URL / Website <span className="text-[#94a3b8] font-normal">(optional)</span>
                              </label>
                              <input
                                value={returnTrackingURL}
                                onChange={e => setReturnTrackingURL(e.target.value)}
                                placeholder="e.g. https://www.delhivery.com/track/package/..."
                                className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleReturnShipment}
                          disabled={busy}
                          className="mt-1 py-2.5 text-sm font-bold text-white bg-[#0284c7] rounded-[8px] border-none cursor-pointer hover:bg-[#0369a1] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xs"
                        >
                          <Truck size={16} />
                          {busy ? 'Recording return…' : "I've Shipped the Return"}
                        </button>
                      </div>
                    )
                  ) : (
                    handedOver ? (
                      <button onClick={handleReturnReceived} disabled={busy} className="w-full py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50">{busy ? 'Working…' : 'Validate & Mark Return Received (Quality/Quantity OK)'}</button>
                    ) : (
                      <p className="text-xs text-[#a16207] m-0 flex items-center gap-1.5"><Clock size={13} /> Waiting for the buyer to ship the original back.</p>
                    )
                  );
                }

                // ── Supplier arranges pickup ──
                return !isSupplier ? (
                  !hasTracking ? (
                    <p className="text-xs text-[#a16207] m-0 flex items-center gap-1.5"><Clock size={13} /> The supplier is arranging transport (own truck or courier) to pick up the original.</p>
                  ) : handedOver ? (
                    <p className="text-xs text-[#0284c7] m-0 flex items-center gap-1.5"><Clock size={13} /> Handed over — waiting for the supplier to inspect it.</p>
                  ) : (
                    <div className="flex flex-col gap-2.5 p-3.5 bg-white border border-[#e2e8f0] rounded-[10px] shadow-2xs">
                      <div className="flex items-center gap-2">
                        {dispute.returnShipmentType === 'own_truck' || dispute.returnVehicleNumber ? (
                          <Truck size={16} className="text-primary" />
                        ) : (
                          <Package size={16} className="text-primary" />
                        )}
                        <p className="text-sm font-bold text-[#0f172a] m-0">
                          {dispute.returnShipmentType === 'own_truck' || dispute.returnVehicleNumber
                            ? 'Pickup Arranged (Supplier\'s Own Truck)'
                            : 'Pickup Arranged (Courier Service)'}
                        </p>
                      </div>

                      {dispute.returnShipmentType === 'own_truck' || dispute.returnVehicleNumber ? (
                        <div className="text-xs text-[#475569] flex flex-col gap-1 p-2.5 bg-[#f8fafc] rounded-[6px] border border-[#f1f5f9]">
                          <p className="m-0">Vehicle / Truck No: <strong className="text-[#0f172a] font-mono">{dispute.returnVehicleNumber || dispute.returnTracking}</strong></p>
                          {dispute.returnDriverPhone && (
                            <p className="m-0">Driver Contact: <a href={`tel:${dispute.returnDriverPhone}`} className="text-primary font-bold hover:underline">{dispute.returnDriverPhone}</a></p>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-[#475569] flex flex-col gap-1 p-2.5 bg-[#f8fafc] rounded-[6px] border border-[#f1f5f9]">
                          <p className="m-0">Courier: <strong className="text-[#0f172a]">{dispute.returnCourier}</strong> · Tracking: <strong className="font-mono text-[#0f172a]">{dispute.returnTracking}</strong></p>
                          {dispute.returnTrackingURL && (
                            <a
                              href={dispute.returnTrackingURL.startsWith('http') ? dispute.returnTrackingURL : `https://${dispute.returnTrackingURL}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#0284c7] font-bold hover:underline mt-0.5"
                            >
                              <ExternalLink size={12} /> Track Pickup
                            </a>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleConfirmHandover}
                        disabled={busy}
                        className="py-2.5 text-sm font-bold text-white bg-[#0284c7] rounded-[8px] border-none cursor-pointer hover:bg-[#0369a1] disabled:opacity-50 mt-1"
                      >
                        {busy ? 'Saving…' : dispute.returnShipmentType === 'own_truck' || dispute.returnVehicleNumber ? "I've Handed Over the Item to Driver" : "I've Handed Over the Item to Courier"}
                      </button>
                    </div>
                  )
                ) : (
                  !hasTracking ? (
                    <div className="flex flex-col gap-3 p-3.5 bg-white border border-[#e2e8f0] rounded-[10px] shadow-2xs">
                      <div>
                        <p className="text-sm font-bold text-[#0f172a] m-0">Arrange the return pickup</p>
                        <p className="text-xs text-[#64748b] m-0 mt-0.5">Choose whether to send your own vehicle/truck or arrange a courier service to pick up from buyer:</p>
                      </div>

                      {/* Pickup Logistics Mode Toggle */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-[#f1f5f9] rounded-[8px]">
                        <button
                          type="button"
                          onClick={() => setPickupShipmentType('own_truck')}
                          className={`py-2 px-3 rounded-[6px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${pickupShipmentType === 'own_truck'
                            ? 'bg-white text-[#0f172a] shadow-xs border border-[#cbd5e1]'
                            : 'text-[#64748b] hover:text-[#0f172a] border border-transparent'
                            }`}
                        >
                          <Truck size={14} className={pickupShipmentType === 'own_truck' ? 'text-primary' : 'text-[#94a3b8]'} />
                          <span>Own Truck / Vehicle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPickupShipmentType('courier')}
                          className={`py-2 px-3 rounded-[6px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${pickupShipmentType === 'courier'
                            ? 'bg-white text-[#0f172a] shadow-xs border border-[#cbd5e1]'
                            : 'text-[#64748b] hover:text-[#0f172a] border border-transparent'
                            }`}
                        >
                          <Package size={14} className={pickupShipmentType === 'courier' ? 'text-primary' : 'text-[#94a3b8]'} />
                          <span>Courier Service</span>
                        </button>
                      </div>

                      {/* Own Truck Inputs */}
                      {pickupShipmentType === 'own_truck' ? (
                        <div className="flex flex-col gap-2.5 pt-1">
                          <div>
                            <label className="text-xs font-bold text-[#475569] block mb-1">
                              Vehicle / Truck Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                              value={returnVehicleNumber}
                              onChange={e => setReturnVehicleNumber(e.target.value)}
                              placeholder="e.g. DL 01 AB 1234 / UP 16 XY 9876"
                              className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-[#475569] block mb-1">
                              Driver / Transporter Phone Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                              value={returnDriverPhone}
                              onChange={e => setReturnDriverPhone(e.target.value)}
                              placeholder="e.g. +91 9876543210"
                              className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Courier Service Inputs */
                        <div className="flex flex-col gap-2.5 pt-1">
                          <div>
                            <label className="text-xs font-bold text-[#475569] block mb-1">
                              Pickup Courier / Logistics Service <span className="text-rose-500">*</span>
                            </label>
                            <input
                              value={exCourier}
                              onChange={e => setExCourier(e.target.value)}
                              placeholder="e.g. Delhivery, Blue Dart, TCI Freight..."
                              className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-[#475569] block mb-1">
                              Pickup Tracking / Docket Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                              value={exTracking}
                              onChange={e => setExTracking(e.target.value)}
                              placeholder="e.g. AWB123456789 / DKT-9988"
                              className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-[#475569] block mb-1">
                              Tracking URL / Website <span className="text-[#94a3b8] font-normal">(optional)</span>
                            </label>
                            <input
                              value={returnTrackingURL}
                              onChange={e => setReturnTrackingURL(e.target.value)}
                              placeholder="e.g. https://www.delhivery.com/track/..."
                              className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handlePickupTracking}
                        disabled={busy}
                        className="py-2.5 text-sm font-bold text-white bg-primary rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xs mt-1"
                      >
                        <Truck size={16} />
                        {busy ? 'Saving…' : pickupShipmentType === 'own_truck' ? 'Send Pickup Details' : 'Send Pickup Tracking'}
                      </button>
                    </div>
                  ) : !handedOver ? (
                    <p className="text-xs text-[#a16207] m-0 flex items-center gap-1.5">
                      <Clock size={13} />
                      {dispute.returnShipmentType === 'own_truck' || dispute.returnVehicleNumber
                        ? `Pickup truck details sent (${dispute.returnVehicleNumber || dispute.returnTracking}). Waiting for the buyer to hand over the item.`
                        : `Pickup tracking sent (${dispute.returnTracking}). Waiting for the buyer to hand over the item.`}
                    </p>
                  ) : (
                    <button onClick={handleReturnReceived} disabled={busy} className="w-full py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50">{busy ? 'Working…' : 'Validate & Mark Return Received (Quality/Quantity OK)'}</button>
                  )
                );
              })()}

              {/* STAGE: refund_pending → supplier inputs refund UTR after return received */}
              {(dispute.exchangeStage === 'refund_pending' || (dispute.resolutionMethod === 'refund' && dispute.exchangeStage === 'return_received')) && (
                isSupplier ? (
                  <div className="flex flex-col gap-3 p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px]">
                    <div className="flex items-start gap-2 text-xs text-[#166534]">
                      <CheckCircle size={16} className="text-[#16a34a] shrink-0 mt-0.5" />
                      <div>
                        <p className="m-0 font-bold text-sm text-[#14532d]">Return Received &amp; Validated</p>
                        <p className="m-0 mt-0.5 text-[11px] text-[#15803d]">
                          Please verify that the returned material matches the original quality &amp; quantity. Once satisfied, initiate the refund to the buyer's account and submit the UTR / transaction ID below.
                        </p>
                      </div>
                    </div>

                    {dispute.buyerRefundDetails && (dispute.buyerRefundDetails.accountNumber || dispute.buyerRefundDetails.upiId) && (
                      <div className="p-2.5 bg-white border border-[#bbf7d0] rounded-[6px] text-xs">
                        <p className="font-bold text-[#14532d] m-0 mb-1">Buyer's Refund Account:</p>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-[#334155]">
                          {dispute.buyerRefundDetails.accountHolderName && <div>Name: <strong>{dispute.buyerRefundDetails.accountHolderName}</strong></div>}
                          {dispute.buyerRefundDetails.bankName && <div>Bank: <strong>{dispute.buyerRefundDetails.bankName}</strong></div>}
                          {dispute.buyerRefundDetails.accountNumber && <div>A/C: <strong className="font-mono">{dispute.buyerRefundDetails.accountNumber}</strong></div>}
                          {dispute.buyerRefundDetails.ifscCode && <div>IFSC: <strong className="font-mono uppercase">{dispute.buyerRefundDetails.ifscCode}</strong></div>}
                          {dispute.buyerRefundDetails.upiId && <div className="col-span-2">UPI: <strong className="font-mono">{dispute.buyerRefundDetails.upiId}</strong></div>}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0f172a]">
                        Refund Transaction ID / UTR <span className="text-[#dc2626]">*</span>
                      </label>
                      <input
                        value={postReturnRefundTxId}
                        onChange={e => setPostReturnRefundTxId(e.target.value)}
                        placeholder="e.g. UTR1234567890 / IMPS / UPI ref"
                        className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase font-mono"
                      />
                      <input
                        value={postReturnRefundNote}
                        onChange={e => setPostReturnRefundNote(e.target.value)}
                        placeholder="Optional payment note for buyer..."
                        className="border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                      <button
                        onClick={handlePostReturnRefund}
                        disabled={busy || !postReturnRefundTxId.trim()}
                        className="py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50 mt-1"
                      >
                        {busy ? 'Submitting…' : 'Submit Refund UTR & Notify Buyer'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-[8px] flex items-start gap-2.5 text-xs text-[#0369a1]">
                    <Clock size={16} className="text-[#0284c7] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#0c4a6e] m-0">Return Received by Supplier</p>
                      <p className="text-[#0369a1] m-0 mt-0.5">
                        Supplier has validated the received material. They are now issuing your refund. You will be prompted to confirm once the payment UTR is provided.
                      </p>
                    </div>
                  </div>
                )
              )}

              {/* STAGE: return_received → supplier dispatches replacement */}
              {dispute.exchangeStage === 'return_received' && dispute.resolutionMethod !== 'refund' && (
                isSupplier ? (
                  <div className="flex flex-col gap-3 p-3.5 bg-white border border-[#e2e8f0] rounded-[10px] shadow-2xs">
                    <div>
                      <p className="text-sm font-bold text-[#0f172a] m-0">Dispatch the replacement</p>
                      <p className="text-xs text-[#64748b] m-0 mt-0.5">Select how you are dispatching the replacement goods to the buyer:</p>
                    </div>

                    {/* Replacement Logistics Mode Toggle */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-[#f1f5f9] rounded-[8px]">
                      <button
                        type="button"
                        onClick={() => setReplacementShipmentType('own_truck')}
                        className={`py-2 px-3 rounded-[6px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${replacementShipmentType === 'own_truck'
                          ? 'bg-white text-[#0f172a] shadow-xs border border-[#cbd5e1]'
                          : 'text-[#64748b] hover:text-[#0f172a] border border-transparent'
                          }`}
                      >
                        <Truck size={14} className={replacementShipmentType === 'own_truck' ? 'text-primary' : 'text-[#94a3b8]'} />
                        <span>Own Truck / Vehicle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplacementShipmentType('courier')}
                        className={`py-2 px-3 rounded-[6px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${replacementShipmentType === 'courier'
                          ? 'bg-white text-[#0f172a] shadow-xs border border-[#cbd5e1]'
                          : 'text-[#64748b] hover:text-[#0f172a] border border-transparent'
                          }`}
                      >
                        <Package size={14} className={replacementShipmentType === 'courier' ? 'text-primary' : 'text-[#94a3b8]'} />
                        <span>Courier Service</span>
                      </button>
                    </div>

                    {/* Own Truck Inputs */}
                    {replacementShipmentType === 'own_truck' ? (
                      <div className="flex flex-col gap-2.5 pt-1">
                        <div>
                          <label className="text-xs font-bold text-[#475569] block mb-1">
                            Vehicle / Truck Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            value={returnVehicleNumber}
                            onChange={e => setReturnVehicleNumber(e.target.value)}
                            placeholder="e.g. DL 01 AB 1234 / UP 16 XY 9876"
                            className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#475569] block mb-1">
                            Driver / Transporter Phone Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            value={returnDriverPhone}
                            onChange={e => setReturnDriverPhone(e.target.value)}
                            placeholder="e.g. +91 9876543210"
                            className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Courier Service Inputs */
                      <div className="flex flex-col gap-2.5 pt-1">
                        <div>
                          <label className="text-xs font-bold text-[#475569] block mb-1">
                            Courier / Logistics Service <span className="text-rose-500">*</span>
                          </label>
                          <input
                            value={exCourier}
                            onChange={e => setExCourier(e.target.value)}
                            placeholder="e.g. Delhivery, Blue Dart, TCI Freight..."
                            className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#475569] block mb-1">
                            Tracking / Docket Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            value={exTracking}
                            onChange={e => setExTracking(e.target.value)}
                            placeholder="e.g. AWB123456789 / DKT-9988"
                            className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#475569] block mb-1">
                            Tracking URL / Website <span className="text-[#94a3b8] font-normal">(optional)</span>
                          </label>
                          <input
                            value={returnTrackingURL}
                            onChange={e => setReturnTrackingURL(e.target.value)}
                            placeholder="e.g. https://www.delhivery.com/track/..."
                            className="w-full border border-[#e2e8f0] rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleDispatchReplacement}
                      disabled={busy}
                      className="py-2.5 text-sm font-bold text-white bg-primary rounded-[8px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xs mt-1"
                    >
                      <Truck size={16} />
                      {busy ? 'Dispatching…' : replacementShipmentType === 'own_truck' ? 'Dispatch via Own Truck' : 'Dispatch Replacement'}
                    </button>
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

          {dispute.status === 'resolved' && (
            <div className="border-t border-[#f1f5f9] pt-3">
              <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] flex items-start gap-2 text-xs text-[#15803d]">
                <CheckCircle size={15} className="text-[#16a34a] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#14532d] m-0">Dispute Resolved and Closed</p>
                  <p className="text-[#166534] m-0 mt-0.5">
                    {dispute.adminRefundVerified
                      ? 'Admin verified the refund payment. Platform commission has been unfrozen and returned to your wallet.'
                      : 'The issue has been verified, settled, and this dispute is closed.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUPPLIER action panel (non-dispute) ────────────────────────────── */}
      {isSupplier && order.status !== 'disputed' && (
        <div className={`${card} p-5`}>
          <p className={sectionTitle}>Actions</p>
          {order.status === 'pending_approval' && (
            <div className="flex flex-col gap-3">
              <div className="bg-[#fff7ed] border border-[#fdba74] p-3 rounded-[8px] mb-2">
                <p className="text-xs text-[#c2410c] m-0 font-semibold flex items-center gap-2"><Clock size={14} /> Buyer has requested to place a direct order.</p>
                <p className="text-[10px] text-[#ea580c] m-0 mt-1">Please review the details and approve to generate the Purchase Order. Commission is currently frozen.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setOrderRejectReason('');
                    setShowRejectModal(true);
                  }}
                  disabled={busy}
                  className="flex-1 py-2.5 text-sm font-bold text-[#64748b] bg-[#f1f5f9] rounded-[8px] border-none cursor-pointer hover:bg-[#e2e8f0] disabled:opacity-50"
                >
                  Reject
                </button>
                <button onClick={handleApproveOrder} disabled={busy} className="flex-2 py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircle size={15} /> Approve Order
                </button>
              </div>
            </div>
          )}
          {/* Check if Advance Payment is required & unpaid */}
          {(() => {
            const paymentTerms = order.paymentTerms || '';
            const isCOD = paymentTerms.includes('COD');
            const isCredit = paymentTerms.includes('Credit');
            const isAdvance = paymentTerms.includes('Advance') || (!isCOD && !isCredit && (order.advanceAmountRequired || 0) > 0);
            const isAdvancePending = isAdvance && !order.advancePaid;

            const totalAmount = Number(order.totalAmount || 0);
            const termsMatch = paymentTerms.match(/(\d+)%/);
            const advancePercent = termsMatch ? parseInt(termsMatch[1]) : (totalAmount > 0 && order.advanceAmountRequired ? Math.round((order.advanceAmountRequired / totalAmount) * 100) : 100);
            const advanceAmount = Number(order.advanceAmountRequired || Math.round(totalAmount * (advancePercent / 100)));
            const advanceLabel = advancePercent > 0 && advancePercent < 100
              ? `${advancePercent}% (₹${advanceAmount.toLocaleString('en-IN')})`
              : `₹${advanceAmount.toLocaleString('en-IN')}`;

            if (isAdvancePending && ['pending', 'processing', 'paid', 'packed'].includes(order.status)) {
              return (
                <div className="p-4 bg-[#fffbeb] border border-[#fde68a] rounded-[10px] flex flex-col gap-3 mb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#b45309]">
                    <AlertTriangle size={18} className="text-[#d97706] shrink-0" />
                    Advance Payment Required Before Packing &amp; Dispatch
                  </div>
                  <p className="text-xs text-[#92400e] m-0 leading-relaxed">
                    Deal terms require an advance payment of <strong>{advanceLabel}</strong>. Order preparation, packing, and dispatch are locked until payment is confirmed.
                  </p>

                  <div className="p-3 bg-white border border-[#fde68a] rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs font-bold text-[#0f172a] m-0">
                        {(order.paymentProofUrl || order.paymentTransactionId) ? 'Buyer submitted payment proof' : 'Payment Approval Required in Deal Chat'}
                      </p>
                      <p className="text-[11px] text-[#64748b] m-0">
                        {(order.paymentProofUrl || order.paymentTransactionId) ? (
                          <>UTR / Ref: <strong className="font-mono text-[#0f172a]">{order.paymentTransactionId || 'Receipt uploaded'}</strong></>
                        ) : (
                          'All payment receipts (Advance, COD, or Credit) must be reviewed and accepted in Chat to unlock order.'
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleGoToChatForPayment}
                      className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-[6px] border-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm"
                    >
                      <MessageSquare size={14} /> Open Chat to Confirm &amp; Unlock &rarr;
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <>
                {['pending', 'paid', 'processing'].includes(order.status) && (
                  <div className="flex flex-col gap-3">
                    <button onClick={handlePack} disabled={busy} className="flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-[#0891b2] bg-[#ecfeff] border border-[#a5f3fc] rounded-[8px] cursor-pointer hover:bg-[#cffafe] disabled:opacity-50">
                      <Boxes size={15} /> {busy ? 'Working…' : 'Mark Packed (optional)'}
                    </button>
                    {renderDispatchBlock()}
                  </div>
                )}
                {order.status === 'packed' && renderDispatchBlock()}
              </>
            );
          })()}
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

          {/* Supplier Payment Request Actions */}
          {order.paymentStatus !== 'completed' && (() => {
            const paymentTerms = order.paymentTerms || '';
            const isCOD = paymentTerms.includes('COD');
            const isCredit = paymentTerms.includes('Credit');
            const isAdvance = paymentTerms.includes('Advance') || (!isCOD && !isCredit && (order.advanceAmountRequired || 0) > 0);

            const totalAmount = Number(order.totalAmount || 0);
            const termsMatch = paymentTerms.match(/(\d+)%/);
            const advancePercent = termsMatch ? parseInt(termsMatch[1]) : (totalAmount > 0 && order.advanceAmountRequired ? Math.round((order.advanceAmountRequired / totalAmount) * 100) : 100);
            const remainingPercent = Math.max(0, 100 - advancePercent);
            const advanceAmount = Number(order.advanceAmountRequired || Math.round(totalAmount * (advancePercent / 100)));
            const remainingAmount = Math.max(0, totalAmount - advanceAmount);

            const hasRequested = !!order.paymentRequestedAt;

            const openChatConfirmBtn = (
              <button
                onClick={handleGoToChatForPayment}
                className="w-full mt-2 py-2 text-xs font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] rounded-[6px] cursor-pointer hover:bg-[#d1fae5] flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare size={13} /> Payment received? Open Chat to Confirm Receipt &rarr;
              </button>
            );

            if (isCOD && ['awaiting_confirmation', 'delivered', 'completed'].includes(order.status)) {
              const codLabel = `₹${totalAmount.toLocaleString('en-IN')}`;
              return (
                <div className="mt-3 flex flex-col gap-1.5">
                  <button
                    onClick={() => !hasRequested && handleRequestPayment('COD')}
                    disabled={busy || hasRequested}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-[8px] border-none transition-colors ${hasRequested ? 'bg-[#94a3b8] cursor-not-allowed' : 'bg-[#2563eb] hover:bg-[#1d4ed8] cursor-pointer disabled:opacity-50'}`}
                  >
                    <Clock size={15} /> {busy ? 'Requesting…' : (hasRequested ? `COD Payment Requested (${codLabel})` : `Request COD Payment (${codLabel})`)}
                  </button>
                  {hasRequested && openChatConfirmBtn}
                </div>
              );
            }

            if (isCredit) {
              const isCreditDue = order.creditPaymentDue || (order.creditDueDate && new Date(order.creditDueDate) <= new Date());
              const creditLabel = `₹${totalAmount.toLocaleString('en-IN')}`;
              return (
                <div className="mt-3 flex flex-col gap-1.5">
                  {isCreditDue ? (
                    <button
                      onClick={() => !hasRequested && handleRequestPayment('Credit')}
                      disabled={busy || hasRequested}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-[8px] border-none transition-colors ${hasRequested ? 'bg-[#94a3b8] cursor-not-allowed' : 'bg-[#4f46e5] hover:bg-[#4338ca] cursor-pointer disabled:opacity-50'}`}
                    >
                      <Clock size={15} /> {busy ? 'Requesting…' : (hasRequested ? `Credit Payment Requested (${creditLabel})` : `Request Credit Payment (${creditLabel})`)}
                    </button>
                  ) : (
                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-[8px] text-xs text-indigo-700 font-medium">
                      ⏳ Credit Period Active ({order.creditDays || 7} Days • {creditLabel}) — payment request unlocks once due.
                    </div>
                  )}
                  {hasRequested && openChatConfirmBtn}
                </div>
              );
            }

            if (isAdvance) {
              const advanceLabel = advancePercent > 0 && advancePercent < 100
                ? `${advancePercent}% • ₹${advanceAmount.toLocaleString('en-IN')}`
                : `₹${advanceAmount.toLocaleString('en-IN')}`;
              const remainingLabel = remainingPercent > 0
                ? `${remainingPercent}% • ₹${remainingAmount.toLocaleString('en-IN')}`
                : `₹${remainingAmount.toLocaleString('en-IN')}`;

              if (!order.advancePaid && ['pending', 'pending_approval'].includes(order.status)) {
                return (
                  <div className="mt-3 flex flex-col gap-1.5">
                    <button
                      onClick={() => !hasRequested && handleRequestPayment('Advance')}
                      disabled={busy || hasRequested}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-[8px] border-none transition-colors ${hasRequested ? 'bg-[#94a3b8] cursor-not-allowed' : 'bg-[#0ea5e9] hover:bg-[#0284c7] cursor-pointer disabled:opacity-50'}`}
                    >
                      <Clock size={15} /> {busy ? 'Requesting…' : (hasRequested ? `Advance Payment Requested (${advanceLabel})` : `Request Advance Payment (${advanceLabel})`)}
                    </button>
                    {hasRequested && openChatConfirmBtn}
                  </div>
                );
              }
              if (order.advancePaid) {
                const isDelivered = ['awaiting_confirmation', 'delivered', 'completed'].includes(order.status) || !!order.awaitingConfirmationAt;
                if (!isDelivered) {
                  return (
                    <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-[8px] text-xs text-amber-700 font-medium">
                      🚚 Advance Payment Received ({advancePercent > 0 && advancePercent < 100 ? `${advancePercent}% • ` : ''}₹{advanceAmount.toLocaleString('en-IN')}). Remaining balance request ({remainingLabel}) will unlock once the product is delivered.
                    </div>
                  );
                }
                return (
                  <div className="mt-3 flex flex-col gap-1.5">
                    <button
                      onClick={() => !hasRequested && handleRequestPayment('Remaining Balance')}
                      disabled={busy || hasRequested}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-[8px] border-none transition-colors ${hasRequested ? 'bg-[#94a3b8] cursor-not-allowed' : 'bg-[#f59e0b] hover:bg-[#d97706] cursor-pointer disabled:opacity-50'}`}
                    >
                      <Clock size={15} /> {busy ? 'Requesting…' : (hasRequested ? `Remaining Balance Requested (${remainingLabel})` : `Request Remaining Balance (${remainingLabel})`)}
                    </button>
                    {hasRequested && openChatConfirmBtn}
                  </div>
                );
              }
            }

            return null;
          })()}
        </div>
      )}

      {/* ── BUYER action panel (non-dispute) ───────────────────────────────── */}
      {!isSupplier && order.status === 'pending_approval' && (
        <div className={`${card} p-5`}>
          <p className={sectionTitle}>Awaiting Supplier Approval</p>
          <div className="flex items-center gap-2 bg-[#fff7ed] border border-[#fdba74] rounded-[8px] px-3 py-2 text-xs text-[#c2410c] font-semibold">
            <Clock size={13} /> The supplier is reviewing your direct order. You will be notified once they approve it.
          </div>
        </div>
      )}

      {!isSupplier && order.status === 'awaiting_confirmation' && (
        <div className={`${card} p-5`}>
          <p className={sectionTitle}>Confirm Your Order</p>
          <div className="flex items-center gap-2 bg-[#faf5ff] border border-[#d8b4fe] rounded-[8px] px-3 py-2 text-xs text-[#7e22ce] font-semibold mb-3">
            <Clock size={13} /> The supplier marked this delivered. Please confirm within 72 hours.
          </div>
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
                <label className="text-xs font-bold text-[#0f172a]">Requested Resolution <span className="text-[#dc2626]">*</span></label>
                <select value={requestedResolution} onChange={e => setRequestedResolution(e.target.value as any)} className="border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="">Select resolution preference…</option>
                  <option value="refund">Refund (Return material &amp; get money refunded)</option>
                  <option value="replacement">Full Replacement (Return defective lot &amp; receive replacement)</option>
                  <option value="partial_replacement">Partial Replacement (Replace specific defective quantity)</option>
                </select>
              </div>

              {(requestedResolution === 'partial_replacement' || issueType === 'quantity') && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0f172a]">Defective / Return Quantity <span className="text-[#dc2626]">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={affectedQuantity}
                    onChange={e => setAffectedQuantity(e.target.value)}
                    placeholder="Enter quantity of units to be replaced/returned"
                    className="border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Dynamic Transportation Policy Note in Ticket Form */}
              {requestedResolution === 'refund' && (
                <div className="p-3 bg-[#fffbeb] border border-[#fde68a] rounded-[8px] text-xs text-[#92400e] flex items-start gap-2">
                  <Truck size={15} className="shrink-0 mt-0.5 text-[#d97706]" />
                  <div>
                    <p className="m-0 font-bold">Transportation Policy Note (Refund):</p>
                    <p className="m-0 mt-0.5 text-[11px] leading-relaxed">
                      Return freight charges will be borne by the <strong>Buyer</strong>. Goods are dispatched from your factory back to the supplier. Supplier inspects quantity &amp; quality upon arrival before releasing refund. Deal closes once you confirm receipt of the refund payment.
                    </p>
                  </div>
                </div>
              )}

              {(requestedResolution === 'replacement' || requestedResolution === 'partial_replacement') && (
                <div className="p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] text-xs text-[#1e40af] flex items-start gap-2">
                  <Truck size={15} className="shrink-0 mt-0.5 text-[#2563eb]" />
                  <div>
                    <p className="m-0 font-bold">Transportation Policy Note (Replacement):</p>
                    <p className="m-0 mt-0.5 text-[11px] leading-relaxed">
                      Return and replacement freight charges will be borne by the <strong>Supplier</strong>. Defective goods are shipped back first → Supplier validates quantity &amp; quality upon receipt → Supplier dispatches replacement → You verify &amp; confirm to close deal.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0f172a]">Description <span className="text-[#dc2626]">*</span></label>
                <textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} rows={3} placeholder="Describe the issue in detail…" className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0f172a]">
                  Evidence <span className="text-[#dc2626]">*</span> <span className="text-[#94a3b8] font-normal">(Photos up to 5, and optional video up to 40MB)</span>
                </label>

                <div className="flex flex-wrap gap-2.5 items-start">
                  {/* Photos */}
                  {evidenceUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-[8px] overflow-hidden border border-[#e2e8f0]">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setEvidenceUrls(p => p.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-black/60 text-white border-none cursor-pointer"><X size={10} /></button>
                    </div>
                  ))}
                  {evidenceUrls.length < 5 && (
                    <label className="w-16 h-16 rounded-[8px] border-2 border-dashed border-[#cbd5e1] flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-primary text-[#94a3b8] hover:text-primary">
                      {uploading ? <div className="w-4 h-4 border-2 border-[#e2e8f0] border-t-primary rounded-full animate-spin" /> : <><Upload size={16} /><span className="text-[9px] font-bold">Photo</span></>}
                      <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e => { handleEvidenceUpload(e.target.files); e.target.value = ''; }} />
                    </label>
                  )}

                  {/* Video Uploader */}
                  {videoUrl ? (
                    <div className="relative w-28 h-16 rounded-[8px] overflow-hidden border border-[#e2e8f0] bg-black flex items-center justify-center">
                      <video src={videoUrl} className="w-full h-full object-cover" />
                      <button onClick={() => setVideoUrl(null)} className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-black/70 text-white border-none cursor-pointer hover:bg-black"><X size={10} /></button>
                      <span className="absolute bottom-1 left-1 px-1 py-0.5 text-[9px] font-bold bg-black/70 text-white rounded">Video</span>
                    </div>
                  ) : (
                    <label className="h-16 px-3 rounded-[8px] border-2 border-dashed border-[#cbd5e1] flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-primary text-[#94a3b8] hover:text-primary">
                      {videoUploading ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-4 h-4 border-2 border-[#e2e8f0] border-t-primary rounded-full animate-spin" />
                          <span className="text-[9px] font-bold">{videoProgress != null ? `${videoProgress}%` : 'Uploading…'}</span>
                        </div>
                      ) : (
                        <>
                          <Video size={16} />
                          <span className="text-[9px] font-bold">Add Video (≤40MB)</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/mp4,video/mov,video/webm,video/*"
                        className="hidden"
                        disabled={videoUploading}
                        onChange={e => { handleVideoUpload(e.target.files); e.target.value = ''; }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Bank / UPI Details for Refund */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                    <CreditCard size={14} className="text-[#0284c7]" /> Refund Bank / UPI Details
                  </span>
                  <span className="text-[10px] text-[#64748b]">(Optional)</span>
                </div>
                <p className="text-[11px] text-[#64748b] m-0 leading-relaxed">
                  Provide your account details so the supplier can issue a direct refund to you if approved.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={refundBankDetails.accountHolderName}
                    onChange={e => setRefundBankDetails(p => ({ ...p, accountHolderName: e.target.value }))}
                    className="border border-[#e2e8f0] rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:border-primary bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={refundBankDetails.bankName}
                    onChange={e => setRefundBankDetails(p => ({ ...p, bankName: e.target.value }))}
                    className="border border-[#e2e8f0] rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:border-primary bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={refundBankDetails.accountNumber}
                    onChange={e => setRefundBankDetails(p => ({ ...p, accountNumber: e.target.value }))}
                    className="border border-[#e2e8f0] rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:border-primary bg-white"
                  />
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={refundBankDetails.ifscCode}
                    onChange={e => setRefundBankDetails(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                    className="border border-[#e2e8f0] rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:border-primary bg-white uppercase"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#64748b] uppercase">Or UPI ID:</span>
                  <input
                    type="text"
                    placeholder="e.g. mobile@upi or username@bank"
                    value={refundBankDetails.upiId}
                    onChange={e => setRefundBankDetails(p => ({ ...p, upiId: e.target.value }))}
                    className="flex-1 border border-[#e2e8f0] rounded-[6px] px-2.5 py-1.5 text-xs outline-none focus:border-primary bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setConfirmMode('idle')} className="flex-1 py-2.5 text-sm font-bold text-[#64748b] bg-[#f1f5f9] rounded-[8px] border-none cursor-pointer">Back</button>
                <button
                  onClick={handleRaiseTicket}
                  disabled={busy || !issueType || !issueDesc.trim() || (evidenceUrls.length === 0 && !videoUrl) || uploading || videoUploading}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-[#dc2626] rounded-[8px] border-none cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Submitting…' : 'Raise Ticket'}
                </button>
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

      {/* Custom Reject Direct Order Modal (replaces browser window.prompt) */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-[16px] shadow-2xl p-6 w-full max-w-[440px] border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold">
                  <X size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 m-0">Reject Direct Order</h3>
                  <p className="text-xs text-slate-500 m-0">State why you are unable to fulfill this order</p>
                </div>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600 p-1 border-none bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quick Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Out of stock',
                    'Cannot fulfill quantity requested',
                    'Unable to ship to buyer location',
                    'Price / cost discrepancy'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOrderRejectReason(preset)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${orderRejectReason === preset
                        ? 'bg-red-50 border-red-300 text-red-700 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  autoFocus
                  rows={3}
                  value={orderRejectReason}
                  onChange={e => setOrderRejectReason(e.target.value)}
                  placeholder="Type rejection reason here (required)..."
                  className="w-full border border-slate-200 rounded-[8px] p-2.5 text-xs outline-none focus:border-red-500 resize-none bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setOrderRejectReason('');
                }}
                disabled={busy}
                className="flex-1 py-2.5 bg-white border border-slate-200 rounded-[8px] text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectOrder}
                disabled={busy || !orderRejectReason.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-[8px] text-xs font-bold transition-colors border-none cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Dispatch block (supplier) ──
  function renderDispatchBlock() {
    return (
      <div className="flex flex-col gap-3">
        {isExFactory ? (
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[10px] px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#b45309] m-0 uppercase tracking-wider flex items-center gap-1.5">
                <Store size={14} /> Ex-Factory / Self Pickup Dispatch
              </p>
              <span className="text-[10px] font-bold bg-[#fef3c7] text-[#92400e] px-2 py-0.5 rounded-full">Buyer Arranges Transport</span>
            </div>
            <p className="text-xs text-[#78350f] m-0">
              Buyer will collect the goods from your factory/godown. You do not need a courier tracking number.
            </p>
            <input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="Buyer Vehicle / Truck No. (optional)" className="border border-[#e2e8f0] bg-white rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase" />
            <input value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="Buyer Driver / Contact Phone (optional)" className="border border-[#e2e8f0] bg-white rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={dispatchNote} onChange={e => setDispatchNote(e.target.value)} placeholder="Gate Pass / Pickup Note (optional)" className="border border-[#e2e8f0] bg-white rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        ) : isFOR ? (
          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#1d4ed8] m-0 uppercase tracking-wider flex items-center gap-1.5">
                <Truck size={14} /> Direct Delivery (FOR)
              </p>
              <span className="text-[10px] font-bold bg-[#dbeafe] text-[#1e40af] px-2 py-0.5 rounded-full">Delivered by Supplier</span>
            </div>
            <p className="text-xs text-[#1e3a8a] m-0">
              You are delivering directly to the buyer via your own vehicle, tempo, or driver.
            </p>
            <input value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="Driver / Dispatcher Mobile Number *" className="border border-[#e2e8f0] bg-white rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="Vehicle / Tempo Number (optional)" className="border border-[#e2e8f0] bg-white rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase" />
            <input value={dispatchNote} onChange={e => setDispatchNote(e.target.value)} placeholder="Delivery Note / Driver Name (optional)" className="border border-[#e2e8f0] bg-white rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        ) : (
          <div className="bg-[#f5f3ff] border border-[#c4b5fd] rounded-[10px] px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#6d28d9] m-0 uppercase tracking-wider flex items-center gap-1.5"><Wifi size={12} /> Courier / Transport Details</p>
              <span className="text-[10px] font-bold bg-[#ede9fe] text-[#5b21b6] px-2 py-0.5 rounded-full">Third-Party Logistics</span>
            </div>
            <input value={courierName} onChange={e => setCourierName(e.target.value)} placeholder="Courier / Transport company name *" className="border border-[#e2e8f0] bg-white rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Tracking / Docket (LR) number *" className="border border-[#e2e8f0] bg-white rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary uppercase" />
            <input value={trackingURL} onChange={e => setTrackingURL(e.target.value)} placeholder="Tracking URL (optional)" className="border border-[#e2e8f0] bg-white rounded-[6px] px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        )}
        <button
          onClick={handleDispatch}
          disabled={busy || (!isExFactory && !isFOR && (!courierName.trim() || !trackingNumber.trim())) || (isFOR && !driverPhone.trim())}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-[8px] text-sm font-bold hover:opacity-90 disabled:opacity-50 border-none cursor-pointer"
        >
          <Truck size={15} /> {busy ? 'Processing…' : isExFactory ? 'Confirm Ready for Pickup / Handover' : isFOR ? 'Mark Out for Delivery (FOR)' : 'Mark Dispatched'}
        </button>
      </div>
    );
  }
};

export default OrderManage;
