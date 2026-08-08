import React, { useState, useEffect, useRef } from 'react';
import { Search, Inbox, ArrowLeft, Check, CheckCheck, FileText, MoreVertical, Trash2, Phone, Clock, X, Eraser, Upload, FileImage } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { chatApi } from '@/features/chat/services/chat.api';
import supplierService from '@/features/supplier/services/supplier.service';
import { quotationApi } from '@/features/supplier/services/quotation.api';
import { useChat } from '@/shared/hooks/useChat';
import { useSocket } from '@/shared/contexts/SocketContext';
import { POReviewModal } from './POReviewModal';
import { removeWhiteBackground } from '@/shared/utils/removeBackground';
import apiClient from '@/api/client';
import SignatureCanvas from 'react-signature-canvas';
import uploadService from '@/features/product/services/upload.service';

type Filter = 'all' | 'unread';
type GstType = 'CGST_SGST' | 'IGST' | 'exempt';

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors";
const labelCls = "text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5";

// ── Phone unlock animation ──────────────────────────────────────────────────
const PhoneReveal = ({ phone, label }: { phone: string; label: string }) => {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 700);
    const t2 = setTimeout(() => setPhase(2), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const fmt = (p: string) => {
    const d = p.replace(/\D/g, '').slice(-10);
    return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : p;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-1.5">
      <Phone size={11} className="text-[#059669] shrink-0" />
      <span className="text-[10px] font-semibold text-[#059669]">{label}:</span>
      <div style={{ position: 'relative', minWidth: '120px', height: '18px', display: 'inline-flex', alignItems: 'center' }}>
        <span style={{
          position: 'absolute', left: 0, fontSize: '13px',
          opacity: phase === 2 ? 0 : 1,
          transform: phase === 1 ? 'rotate(-22deg) scale(1.35)' : 'rotate(0deg) scale(1)',
          transition: phase === 2 ? 'opacity 0.35s ease' : 'transform 0.3s cubic-bezier(.36,.07,.19,.97)',
          display: 'inline-block',
        }}>
          {phase === 0 ? '🔒' : '🔓'}
        </span>
        <span style={{
          position: 'absolute', left: 0, fontSize: '11px', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap',
          opacity: phase === 2 ? 1 : 0,
          transform: phase === 2 ? 'translateX(0)' : 'translateX(-8px)',
          transition: 'all 0.45s ease',
        }}>
          {fmt(phone)}
        </span>
      </div>
    </div>
  );
};

// ── Quote preview card (static) ─────────────────────────────────────────────
const QuotePreviewCard = ({
  form, gstAmount, grandTotal,
}: {
  form: { itemName: string; hsnCode: string; quantity: number; price: number; gstType: GstType; gstRate: number; shipping: number; deliveryTimeline: string; terms: string; transportationTerms?: string };
  gstAmount: number;
  grandTotal: number;
}) => {
  const courierGst = (form.transportationTerms === 'Third-Party Courier (Prepaid)' && form.shipping > 0) ? Math.round(form.shipping * 0.18) : 0;
  return (
  <div className="bg-white border border-[#eef2f6] rounded-[10px] overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 bg-[#f8fafc] border-b border-[#f1f5f9]">
      <span className="text-xs font-extrabold text-[#0f172a]">Quotation</span>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#a16207]">Awaiting Response</span>
    </div>
    <div className="px-4 py-3 flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-[#475569]">
        <span className="font-medium">{form.itemName}{form.hsnCode ? ` (HSN: ${form.hsnCode})` : ''}</span>
      </div>
      <div className="flex justify-between text-xs text-[#94a3b8] pl-2">
        <span>Unit Price</span>
        <span>₹{form.price.toLocaleString('en-IN')}</span>
      </div>
      <div className="flex justify-between text-xs text-[#94a3b8] pl-2">
        <span>Qty</span>
        <span>{form.quantity}</span>
      </div>
      <div className="flex justify-between text-xs text-[#475569] pt-1.5 border-t border-[#f1f5f9]">
        <span>Total Price (before GST)</span>
        <span className="font-semibold">₹{(form.price * form.quantity).toLocaleString('en-IN')}</span>
      </div>
      {form.gstType !== 'exempt' ? (
        form.gstType === 'IGST' ? (
          <div className="flex justify-between text-xs text-[#0369a1]">
            <span>IGST @ {form.gstRate}%</span>
            <span className="font-semibold">₹{gstAmount.toLocaleString('en-IN')}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-xs text-[#0369a1]">
              <span>CGST @ {form.gstRate / 2}%</span>
              <span className="font-semibold">₹{(gstAmount / 2).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-[#0369a1]">
              <span>SGST @ {form.gstRate / 2}%</span>
              <span className="font-semibold">₹{(gstAmount / 2).toLocaleString('en-IN')}</span>
            </div>
          </>
        )
      ) : (
        <div className="flex justify-between text-xs text-[#94a3b8]"><span>GST</span><span>Exempt / Nil</span></div>
      )}
      {form.shipping > 0 && (
        <div className="flex justify-between text-xs text-[#475569]">
          <span>Shipping</span>
          <span className="font-semibold">₹{form.shipping.toLocaleString('en-IN')}</span>
        </div>
      )}
      {courierGst > 0 && (
        <div className="flex justify-between text-xs text-[#0369a1]">
          <span>Courier GST (18%)</span>
          <span className="font-semibold">₹{courierGst.toLocaleString('en-IN')}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-extrabold text-[#0f172a] pt-2 border-t border-[#f1f5f9]">
        <span>Grand Total</span>
        <span>₹{grandTotal.toLocaleString('en-IN')}</span>
      </div>
      {form.deliveryTimeline && (
        <p className="text-[10px] text-[#94a3b8] m-0">Delivery: {form.deliveryTimeline}</p>
      )}
      {form.terms && <p className="text-[10px] text-[#94a3b8] m-0">Terms: {form.terms}</p>}
    </div>
  </div>
);
};

// ── Quick reply presets ─────────────────────────────────────────────────────
const BUYER_QR = [
  { label: '📦 Order status?', text: 'Hi, could you please share the current status of my order?' },
  { label: '⏳ No update till date', text: "I haven't received any update on my order." },
  { label: '✅ Order received', text: 'I have received my order. Thank you!' },
  { label: '❓ Have a question', text: 'I have a question regarding my order. Could you please assist?' },
];
const SUPPLIER_QR = [
  { label: '⏳ Processing', text: 'Your order is currently being processed. We will update you soon.' },
  { label: '🚚 Shipped', text: 'Your order has been shipped and is on the way. You should receive it shortly.' },
  { label: '📬 Confirm delivery', text: 'Could you please confirm if you have received the order?' },
  { label: '🕐 Update in 24 hrs', text: 'We will provide an update on your order status within 24 hours.' },
];

// ── Main component ──────────────────────────────────────────────────────────
const QuotationCard = ({ isLatestQuoteMsg = true, msg, onActiveChange, user, socket, loadMessages, product, onSupplierAction }: { isLatestQuoteMsg?: boolean; msg: any; onActiveChange?: (isActive: boolean) => void; user: any; socket: any; loadMessages: () => void; product?: any; onSupplierAction?: (quote: any, isAccept: boolean) => void; }) => {
  const isSupplier = user?.role === 'supplier';
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '');
  const handleAcceptQuote = async (quoteId: string, paymentMethod: 'direct' | 'amjstar' = 'direct', buyerSignature?: string) => {
    const loadingToast = toast.loading(isSupplier ? 'Accepting offer...' : 'Confirming deal...');
    try {
      await quotationApi.acceptQuotation(quoteId, paymentMethod, buyerSignature);
      loadMessages();
      toast.success(isSupplier ? 'Agreed to price! Waiting for buyer to confirm.' : 'Deal Confirmed! Order created.', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm deal', { id: loadingToast });
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try { await quotationApi.rejectQuotation(quoteId); loadMessages(); }
    catch (err) { console.error('Failed to reject quote', err); }
  };

  const formatTimeline = (v: string) => {
    if (!v) return v;
    if (/day|week|month|hour/i.test(v)) return v;
    return v.replace(/-/g, '–') + ' days';
  };

  const [quote, setQuote] = useState<any>(null);
  const [quoteNotFound, setQuoteNotFound] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterTimeline, setCounterTimeline] = useState('');
  const [counterPaymentTerms, setCounterPaymentTerms] = useState('');
  const [counterTransportationTerms, setCounterTransportationTerms] = useState('');
  const [counterSubmitting, setCounterSubmitting] = useState(false);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const hasFetchedContact = useRef(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'decline' | null>(null);
  const [payMethod, setPayMethod] = useState<'direct' | 'amjstar'>('direct');
  const [directAck, setDirectAck] = useState(false);
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAck, setReviewAck] = useState(false);
  // Removed buyerSignature

  const fetchQuote = () => {
    if (msg.quotationId) {
      if (typeof msg.quotationId === 'object' && msg.quotationId._id) {
        setQuoteNotFound(false);
        setQuote(msg.quotationId);
      } else {
        const id = typeof msg.quotationId === 'string' ? msg.quotationId : (msg.quotationId as any)?._id;
        if (id) {
          quotationApi.getQuotation(id)
            .then(q => { setQuoteNotFound(false); setQuote(q); })
            .catch(() => setQuoteNotFound(true));
        }
      }
    }
  };

  useEffect(() => { fetchQuote(); }, [msg.quotationId]);

  useEffect(() => {
    if (!socket) return;
    const handler = (notif: any) => {
      if (notif.type === 'QUOTATION_UPDATE') fetchQuote();
    };
    socket.on('new_notification', handler);
    return () => { socket.off('new_notification', handler); };
  }, [socket, msg.quotationId]);

  // Fetch contact phone once deal is confirmed
  useEffect(() => {
    if (quote?.status === 'accepted' && quote.orderId?._id && !hasFetchedContact.current) {
      hasFetchedContact.current = true;
      apiClient.get(`/orders/${quote.orderId._id}`).then(res => {
        const snap = res.data.data?.snapshot || {};
        const phone = isSupplier ? snap.buyerPhone : snap.supplierPhone;
        if (phone) setContactPhone(phone);
      }).catch(() => { });
    }
  }, [quote?.status, quote?.orderId?._id]);

  const isActive = quote ? (quote.status === 'negotiation_pending' || quote.status === 'counter_offer_sent') : false;
  useEffect(() => {
    if (onActiveChange) onActiveChange(isActive);
  }, [isActive, onActiveChange]);

  if (quoteNotFound) return null;
  if (!quote) return null;

  const msgTime = msg.createdAt ? new Date(msg.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  const timeRow = (
    <div className={`flex items-center gap-1 mt-1 justify-end`}>
      <span className="text-[10px] text-[#94a3b8]">{msgTime}</span>
    </div>
  );

  const statusMeta: Record<string, { label: string; cls: string }> = {
    negotiation_pending: { label: 'Awaiting Response', cls: 'bg-[#fffbeb] text-[#a16207]' },
    counter_offer_sent: { label: 'Counter Offered', cls: 'bg-[#eff6ff] text-[#2563eb]' },
    supplier_accepted: { label: 'Supplier Agreed', cls: 'bg-[#ecfdf5] text-[#059669]' },
    quotation_accepted: { label: 'Deal Confirmed ✅', cls: 'bg-[#ecfdf5] text-[#059669]' },
    cancelled: { label: 'Declined / Cancelled', cls: 'bg-[#fef2f2] text-[#dc2626]' },
  };
  const meta = statusMeta[quote.status] || { label: quote.status, cls: 'bg-[#f1f5f9] text-[#475569]' };

  const taxableAmt = quote.taxableAmount ?? quote.totalAmount ?? 0;
  const actualRetailTotal = quote.items?.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0) || taxableAmt;
  const gstAmt = quote.gstAmount ?? 0;
  const shipCost = quote.shippingCost ?? 0;
  const grandTotal = taxableAmt + gstAmt + shipCost;
  const halfRate = (quote.gstRate ?? 0) / 2;

  const submitCounter = async () => {
    if (!counterPrice) return;
    const cp = Number(counterPrice);
    if (cp < actualRetailTotal * 0.5 || cp > actualRetailTotal) return;

    setCounterSubmitting(true);
    try {
      await quotationApi.counterOffer(quote._id, {
        price: cp,
        deliveryTimeline: counterTimeline || undefined,
        paymentTerms: counterPaymentTerms || undefined,
        transportationTerms: counterTransportationTerms || undefined,
      });
      loadMessages();
      setShowCounter(false);
      setCounterPrice('');
      setCounterTimeline('');
      setCounterPaymentTerms('');
      setCounterTransportationTerms('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send counter');
    } finally { setCounterSubmitting(false); }
  };

  const canSupplierCancel = isLatestQuoteMsg && isSupplier && (quote.status === 'negotiation_pending' || quote.status === 'counter_offer_sent' || quote.status === 'supplier_accepted');
  const canBuyerCancel = isLatestQuoteMsg && !isSupplier && (quote.status === 'negotiation_pending' || quote.status === 'counter_offer_sent' || quote.status === 'supplier_accepted');

  // Action buttons — rendered outside the card so faded wrapper never blocks them
  const handleCancelEnquiry = async () => {
    if (!cancelReason.trim()) return;
    setCancelSubmitting(true);
    try {
      await quotationApi.cancelQuotation(quote._id, cancelReason.trim());
      loadMessages();
      setShowCancelInput(false);
      toast.success('Enquiry cancelled.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    } finally { setCancelSubmitting(false); }
  };

  const actionButtons = canSupplierCancel && (
    <div className="min-w-[260px] max-w-[340px]">
      {!showCancelInput ? (
        <div className="flex flex-col gap-1.5 mt-1.5">
          <button
            onClick={() => setShowCancelInput(true)}
            className="w-full py-1.5 text-xs font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-[6px] cursor-pointer hover:bg-[#fee2e2]"
          >🚫 Cancel Enquiry</button>
        </div>
      ) : (
        <div className="mt-1.5 flex flex-col gap-2">
          <textarea
            autoFocus
            rows={2}
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation (required)"
            className="border border-[#fecaca] rounded-[6px] px-2.5 py-2 text-xs outline-none focus:border-[#dc2626] resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => { setShowCancelInput(false); setCancelReason(''); }}
              className="flex-1 py-1.5 text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:bg-[#f1f5f9]">
              Back
            </button>
            <button onClick={handleCancelEnquiry} disabled={cancelSubmitting || !cancelReason.trim()}
              className="flex-1 py-1.5 text-xs font-bold text-white bg-[#dc2626] rounded-[6px] border-none cursor-pointer disabled:opacity-50">
              {cancelSubmitting ? 'Cancelling…' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const cardContent = (
    <div className="bg-white border border-[#eef2f6] rounded-[10px] overflow-hidden min-w-[260px] max-w-[340px]">
      <div className="flex items-center justify-between px-4 py-3 bg-[#f8fafc] border-b border-[#f1f5f9]">
        <span className="text-xs font-extrabold text-[#0f172a]">Quotation</span>
        <div className="flex items-center gap-1.5">
          {quote.priceTag && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-700 uppercase tracking-wide border border-red-200">
              {quote.priceTag}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
        </div>
      </div>


      {msg.messageType === 'buyer_counter_offer' ? (
        <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#f1f5f9]">
          <div className="text-[13px] text-[#334155] whitespace-pre-wrap leading-[1.6]">
            <span className="font-extrabold flex items-center gap-1.5 text-[#0f172a]">
              📦 Counter Offer: {product?.name || 'Product'}
            </span>
            <div className="mt-1.5">
              Quantity: {quote.items?.[0]?.quantity || 0} {quote.items?.[0]?.unit || 'pcs'}<br />
              Price: ₹{(quote.counterOffer?.price || quote.proposedPrice).toLocaleString('en-IN')}<br />
              Delivery Timeline: {quote.counterOffer?.deliveryTimeline || quote.deliveryTimePreference || 'Standard'}<br />
              {quote.paymentTerms && <>Payment: {quote.paymentTerms}<br /></>}
              {quote.transportationTerms && <>Transport: {quote.transportationTerms}<br /></>}
              {quote.shippingAddress && (
                <>Ship to: {[quote.shippingAddress.addressLine1, quote.shippingAddress.city, quote.shippingAddress.state, quote.shippingAddress.pincode].filter(Boolean).join(', ')}<br /></>
              )}
              {quote.terms && <>Requirements: {quote.terms}</>}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 py-3 flex flex-col gap-1.5">
            {quote.items.map((item: any, i: number) => (
              <div key={i} className="flex flex-col gap-0.5">
                <div className="flex justify-between text-xs text-[#475569]">
                  <span className="font-medium">{item.name}{item.hsnCode ? ` (HSN: ${item.hsnCode})` : ''}</span>
                </div>
                <div className="flex justify-between text-xs text-[#94a3b8] pl-2">
                  <span>Unit Price</span>
                  <span>₹{item.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-[#94a3b8] pl-2">
                  <span>Qty</span>
                  <span>{item.quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between text-xs text-[#475569] font-semibold">
                  <span>Total Price</span>
                  <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-xs text-[#475569] pt-1.5 border-t border-[#f1f5f9]">
              <span>Amount (before GST)</span>
              <span className="font-semibold">₹{taxableAmt.toLocaleString('en-IN')}</span>
            </div>
            {quote.gstType && quote.gstType !== 'exempt' && gstAmt > 0 ? (
              quote.gstType === 'IGST' ? (
                <div className="flex justify-between text-xs text-[#0369a1]">
                  <span>IGST @ {quote.gstRate}%</span>
                  <span className="font-semibold">₹{gstAmt.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-[#0369a1]">
                    <span>CGST @ {halfRate}%</span>
                    <span className="font-semibold">₹{(gstAmt / 2).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#0369a1]">
                    <span>SGST @ {halfRate}%</span>
                    <span className="font-semibold">₹{(gstAmt / 2).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )
            ) : (
              <div className="flex justify-between text-xs text-[#94a3b8]"><span>GST</span><span>Exempt / Nil</span></div>
            )}
            {shipCost > 0 && (
              <div className="flex justify-between text-xs text-[#475569]">
                <span>Shipping</span>
                <span className="font-semibold">₹{shipCost.toLocaleString('en-IN')}</span>
              </div>
            )}
            {quote.transportationTerms === 'Third-Party Courier (Prepaid)' && shipCost > 0 && (
              <div className="flex justify-between text-xs text-[#0369a1]">
                <span>Courier GST (18%)</span>
                <span className="font-semibold">₹{Math.round(shipCost * 0.18).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-[#0f172a] pt-2 border-t border-[#f1f5f9]">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
            {quote.deliveryTimeline && <p className="text-[10px] text-[#94a3b8] m-0">Delivery: {quote.deliveryTimeline}</p>}
            {quote.terms && <p className="text-[10px] text-[#94a3b8] m-0">Terms: {quote.terms}</p>}
          </div>
        </>
      )}

      {msg.messageType !== 'buyer_counter_offer' && quote.counterOffer && (
        <div className="mx-4 mb-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] px-3 py-2 text-xs text-[#1d4ed8]">
          <span className="font-bold block mb-1.5">Counter Offer from {quote.initiatedBy === 'buyer' ? 'Buyer' : 'Supplier'}</span>
          {quote.counterOffer.price ? (
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[#3b82f6]">Requested Price</span>
              <span className="font-bold">₹{quote.counterOffer.price.toLocaleString('en-IN')} <span className="text-[#93c5fd] font-normal">(excl. GST &amp; shipping)</span></span>
            </div>
          ) : null}
          {quote.counterOffer.deliveryTimeline ? (
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[#3b82f6]">Requested Timeline</span>
              <span className="font-bold">{formatTimeline(quote.counterOffer.deliveryTimeline)}</span>
            </div>
          ) : null}
          {quote.counterOffer.note && (
            <p className="text-[#3b82f6] mt-1 m-0 border-t border-[#bfdbfe] pt-1">{quote.counterOffer.note}</p>
          )}
        </div>
      )}

      {/* Waiting for other party */}
      {isLatestQuoteMsg && quote.currentTurn !== (isSupplier ? 'supplier' : 'buyer') && (quote.status === 'negotiation_pending' || quote.status === 'supplier_accepted' || (quote.status === 'counter_offer_sent' && msg.messageType === 'buyer_counter_offer')) && (
        <div className="px-4 pb-3">
          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[6px] px-3 py-2">
            <p className="text-[10px] text-[#2563eb] font-bold m-0 text-center">
              {quote.status === 'supplier_accepted'
                ? "Waiting for buyer to confirm payment method."
                : `Awaiting ${isSupplier ? "buyer's" : "supplier's"} response.`}
            </p>
          </div>
        </div>
      )}

      {/* Actions: only when it's user's turn and this is the latest quotation message */}
      {isLatestQuoteMsg && quote.currentTurn === (isSupplier ? 'supplier' : 'buyer') && (quote.status === 'negotiation_pending' || quote.status === 'supplier_accepted' || (quote.status === 'counter_offer_sent' && msg.messageType === 'buyer_counter_offer')) && !showCounter && (
        <>
          <div className="flex gap-2 px-4 pb-3">
            <button className="flex-1 py-2 text-xs font-bold text-white bg-[#059669] rounded-[6px] border-none cursor-pointer hover:bg-[#047857]"
              onClick={() => isSupplier ? (onSupplierAction ? onSupplierAction(quote, true) : null) : setConfirmAction('accept')}>Accept Deal</button>

            {quote.status !== 'supplier_accepted' && (
              <>
                <button className="flex-1 py-2 text-xs font-bold text-[#2563eb] bg-[#eff6ff] rounded-[6px] border-none cursor-pointer hover:bg-[#dbeafe]"
                  onClick={() => isSupplier ? (onSupplierAction ? onSupplierAction(quote, false) : null) : setShowCounter(true)}>Revise Terms</button>
                <button className="flex-1 py-2 text-xs font-bold text-[#dc2626] bg-[#fef2f2] rounded-[6px] border-none cursor-pointer hover:bg-[#fee2e2]"
                  onClick={() => setConfirmAction('decline')}>Decline</button>
              </>
            )}
          </div>

          {/* Decline confirmation popup */}
          {confirmAction === 'decline' && (
            <div className="mx-4 mb-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] p-3.5">
              <p className="text-xs font-extrabold text-[#dc2626] m-0 mb-1">Decline this quote?</p>
              <p className="text-[11px] text-[#475569] m-0 mb-2.5">
                The supplier will be notified. You can request a new quotation anytime.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-1.5 text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:bg-[#f1f5f9]">
                  Cancel
                </button>
                <button
                  onClick={() => { setConfirmAction(null); handleRejectQuote(quote._id); }}
                  className="flex-1 py-1.5 text-xs font-bold text-white rounded-[6px] border-none cursor-pointer bg-[#dc2626] hover:bg-[#b91c1c]">
                  Yes, Decline
                </button>
              </div>
            </div>
          )}

          {/* Accept → payment method picker */}
          {confirmAction === 'accept' && (
            <div className="mx-4 mb-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] p-3.5">
              <p className="text-xs font-extrabold text-[#0f172a] m-0 mb-2">Choose how you'll pay</p>

              {/* Direct */}
              <button
                onClick={() => setPayMethod('direct')}
                className={`w-full text-left mb-2 p-2.5 rounded-[8px] border cursor-pointer transition-colors ${payMethod === 'direct' ? 'border-[#059669] bg-[#f0fdf4]' : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${payMethod === 'direct' ? 'border-[#059669] bg-[#059669]' : 'border-[#cbd5e1]'}`} />
                  <span className="text-xs font-bold text-[#0f172a]">Direct Payment to Supplier</span>
                </div>
                <p className="text-[10px] text-[#64748b] m-0 mt-1 ml-[22px] leading-relaxed">
                  You pay the supplier directly (UPI / bank / cash). Phone numbers unlock so you can coordinate.
                </p>
              </button>

              {/* AMJSTAR — coming soon */}
              <div className="w-full mb-2 p-2.5 rounded-[8px] border border-dashed border-[#e2e8f0] bg-[#fafafa] opacity-70 cursor-not-allowed">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-[#cbd5e1] shrink-0" />
                  <span className="text-xs font-bold text-[#94a3b8]">Pay Through AMJSTAR (Escrow)</span>
                  <span className="text-[9px] font-bold text-[#d97706] bg-[#fffbeb] border border-[#fcd34d] px-1.5 py-0.5 rounded-full ml-auto">COMING SOON</span>
                </div>
                <p className="text-[10px] text-[#94a3b8] m-0 mt-1 ml-[22px] leading-relaxed">
                  AMJSTAR holds your payment safely until you confirm delivery. Launching soon.
                </p>
              </div>

              {/* Direct disclaimer + ack */}
              {payMethod === 'direct' && (
                <label className="flex items-start gap-2 mb-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={directAck}
                    onChange={e => {
                      if (e.target.checked) {
                        setShowReviewModal(true);
                        setReviewAck(false);
                      } else {
                        setDirectAck(false);
                      }
                    }}
                    className="mt-0.5 accent-[#059669] shrink-0"
                  />
                  <span className="text-[10px] text-[#475569] leading-relaxed">
                    I understand that payment is handled <strong>directly between me and the supplier</strong>, and AMJSTAR is not responsible for the payment or its settlement.
                  </span>
                </label>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setConfirmAction(null); setDirectAck(false); }}
                  className="flex-1 py-1.5 text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:bg-[#f1f5f9]">
                  Cancel
                </button>
                <button
                  disabled={payMethod === 'direct' && !directAck}
                  onClick={() => {
                    setConfirmAction(null);
                    setDirectAck(false);
                    handleAcceptQuote(quote._id, payMethod, user?.savedSignature || undefined);
                  }}
                  className="flex-1 py-1.5 text-xs font-bold text-white rounded-[6px] border-none cursor-pointer bg-[#059669] hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed">
                  Confirm &amp; Generate PO
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* PO Review Modal */}
      {showReviewModal && (
        <POReviewModal
          quote={quote}
          product={product}
          payMethod={payMethod}
          reviewAck={reviewAck}
          setReviewAck={setReviewAck}
          onClose={() => setShowReviewModal(false)}
          onConfirm={() => {
            setShowReviewModal(false);
            setDirectAck(true);
          }}
        />
      )}

      {/* Counter form — only when it's user's turn */}
      {isLatestQuoteMsg && quote.currentTurn === (isSupplier ? 'supplier' : 'buyer') && (quote.status === 'negotiation_pending' || quote.status === 'counter_offer_sent') && showCounter && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          <p className="text-[10px] font-bold text-[#475569] uppercase tracking-wide m-0">Counter Offer</p>
          {/* Price counter */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-[#64748b] font-semibold">Counter Total Price (excl. GST &amp; shipping)</label>
            <div className="flex items-center border border-[#e2e8f0] rounded-[6px] bg-white focus-within:border-primary">
              <span className="px-2 py-2 text-xs text-[#94a3b8] border-r border-[#e2e8f0]">₹</span>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={counterPrice}
                onChange={e => setCounterPrice(e.target.value.replace(/\D/g, ''))}
                placeholder={`e.g. ${taxableAmt}`}
                className="flex-1 border-none outline-none px-2 py-2 text-xs bg-transparent"
              />
            </div>

            {counterPrice && Number(counterPrice) > 0 && Number(counterPrice) < actualRetailTotal * 0.5 && (
              <p className="text-[10px] text-[#dc2626] m-0 mt-0.5">
                Counter price cannot be less than 50% of the original price (₹{Math.round(actualRetailTotal * 0.5).toLocaleString('en-IN')})
              </p>
            )}
            {counterPrice && Number(counterPrice) > 0 && Number(counterPrice) > actualRetailTotal && (
              <p className="text-[10px] text-[#dc2626] m-0 mt-0.5">
                Counter price cannot be higher than the original price (₹{actualRetailTotal.toLocaleString('en-IN')})
              </p>
            )}

            {counterPrice && Number(counterPrice) > 0 && (
              <div className="mt-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] p-2 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-[#64748b]">
                  <span>Amount (before GST)</span>
                  <span>₹{Number(counterPrice).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#64748b]">
                  <span>GST @ {quote.gstRate ?? 18}%</span>
                  <span>₹{Math.round(Number(counterPrice) * (quote.gstRate ?? 18) / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-[#0f172a] pt-1 border-t border-[#e2e8f0]">
                  <span>Grand Total</span>
                  <span>₹{Math.round(Number(counterPrice) + (Number(counterPrice) * (quote.gstRate ?? 18) / 100) + shipCost).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => { setShowCounter(false); setCounterPrice(''); }}
              className="flex-1 py-2 text-xs font-bold text-[#64748b] bg-[#f8fafc] rounded-[6px] border border-[#e2e8f0] cursor-pointer"
            >Cancel</button>
            <button
              onClick={submitCounter}
              disabled={counterSubmitting || !counterPrice || Number(counterPrice) < actualRetailTotal * 0.5 || Number(counterPrice) > actualRetailTotal}
              className="flex-1 py-2 text-xs font-bold text-white bg-[#2563eb] rounded-[6px] border-none cursor-pointer disabled:opacity-50"
            >
              {counterSubmitting ? 'Sending…' : 'Send Counter'}
            </button>
          </div>
        </div>
      )}

      {/* Deal Confirmed */}
      {quote.status === 'quotation_accepted' && (
        <div className="px-4 pb-3">
          <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-[8px] px-3 py-2 text-center">
            <p className="text-xs font-extrabold text-[#059669] m-0">🎉 Deal Confirmed!</p>
            <p className="text-[10px] text-[#047857] m-0 mt-1">Order created. Proceed as per agreed terms.</p>

            {/* Phone reveal animation */}
            {contactPhone && (
              <div className="mt-2 pt-2 border-t border-[#a7f3d0]">
                <PhoneReveal
                  phone={contactPhone}
                  label={isSupplier ? "Buyer's Phone" : "Supplier's Phone"}
                />
              </div>
            )}

            {quote.orderId?._id ? (
              <a
                href={`${apiBase}/api/orders/${quote.orderId._id}/po-download`}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-[#059669] text-white text-[10px] font-bold rounded-[6px] no-underline hover:bg-[#047857]"
              >
                <FileText size={11} /> Download PO {quote.orderId.poNumber ? `(${quote.orderId.poNumber})` : ''}
              </a>
            ) : (
              <p className="text-[10px] text-[#6ee7b7] m-0 mt-1">Order being processed…</p>
            )}
          </div>
        </div>
      )}

      {quote.status === 'ordered' && (
        <div className="px-4 pb-3 text-xs font-bold text-[#059669]">Order Created ✅</div>
      )}

      {quote.status === 'cancelled' && (
        <div className="mx-4 mb-3 bg-[#fef2f2] border border-[#fecaca] rounded-[8px] px-3 py-2.5">
          <p className="text-xs font-bold text-[#dc2626] m-0 mb-1">
            Cancelled by {quote.cancelledBy === 'supplier' ? 'Supplier' : 'Buyer'}
          </p>
          {quote.cancellationReason && (
            <p className="text-[11px] text-[#7f1d1d] m-0 leading-relaxed">
              Reason: {quote.cancellationReason}
            </p>
          )}
        </div>
      )}

      {/* Supplier cancel UI — for counter_offered state (edit/retract not shown there) */}
      {canSupplierCancel && quote.status === 'counter_offered' && (
        <div className="px-4 pb-3">
          {!showCancelInput ? (
            <button
              onClick={() => setShowCancelInput(true)}
              className="w-full py-1.5 text-xs font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-[6px] cursor-pointer hover:bg-[#fee2e2]"
            >
              🚫 Cancel Enquiry
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                autoFocus
                rows={2}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (required)"
                className="border border-[#fecaca] rounded-[6px] px-2.5 py-2 text-xs outline-none focus:border-[#dc2626] resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowCancelInput(false); setCancelReason(''); }}
                  className="flex-1 py-1.5 text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:bg-[#f1f5f9]">
                  Back
                </button>
                <button onClick={handleCancelEnquiry} disabled={cancelSubmitting || !cancelReason.trim()}
                  className="flex-1 py-1.5 text-xs font-bold text-white bg-[#dc2626] rounded-[6px] border-none cursor-pointer disabled:opacity-50">
                  {cancelSubmitting ? 'Cancelling…' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buyer cancel UI */}
      {canBuyerCancel && !showCounter && !confirmAction && (
        <div className="px-4 pb-3">
          {!showCancelInput ? (
            <button
              onClick={() => setShowCancelInput(true)}
              className="w-full py-1 text-[11px] font-semibold text-[#dc2626] bg-transparent border border-[#fecaca] rounded-[6px] cursor-pointer hover:bg-[#fef2f2]"
            >
              🚫 Cancel Enquiry
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-[#dc2626] m-0">Cancel this enquiry?</p>
              <textarea
                autoFocus
                rows={2}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (required)"
                className="border border-[#fecaca] rounded-[6px] px-2.5 py-2 text-xs outline-none focus:border-[#dc2626] resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowCancelInput(false); setCancelReason(''); }}
                  className="flex-1 py-1.5 text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:bg-[#f1f5f9]">
                  Back
                </button>
                <button onClick={handleCancelEnquiry} disabled={cancelSubmitting || !cancelReason.trim()}
                  className="flex-1 py-1.5 text-xs font-bold text-white bg-[#dc2626] rounded-[6px] border-none cursor-pointer disabled:opacity-50">
                  {cancelSubmitting ? 'Cancelling…' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (quote.status === 'held' && isSupplier) {
    return (
      <div className="flex flex-col">
        <div className="relative" style={{ opacity: 0.55 }}>
          {cardContent}
          <div className="absolute bottom-2 right-2 bg-[#fbbf24] rounded-full p-1 shadow-md">
            <Clock size={12} className="text-white" />
          </div>
        </div>
        {actionButtons}
        {timeRow}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {cardContent}
      {actionButtons}
      {timeRow}
    </div>
  );
};

const ChatInbox: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isAcceptingBuyerPrice, setIsAcceptingBuyerPrice] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [supplierSignature, setSupplierSignature] = useState<string | null>(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentMsgContext, setPaymentMsgContext] = useState<any>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [supplierProfileData, setSupplierProfileData] = useState<any>(null);
  const supplierSigCanvas = useRef<any>(null);

  useEffect(() => {
    if (user?.role === 'supplier') {
      supplierService.getProfile().then(data => {
        if (data?.supplier) {
          setSupplierProfileData(data.supplier);
        } else if (data && !data.success) {
          setSupplierProfileData(data); // Fallback if structure is different
        }
      }).catch(() => { });
    }
  }, [user?.role]);

  const updateSignatureMutation = useMutation({
    mutationFn: supplierService.updateSignature,
    onSuccess: () => {
      // Refresh profile data to get the new signature
      supplierService.getProfile().then(data => {
        if (data?.supplier) setSupplierProfileData(data.supplier);
        else if (data && !data.success) setSupplierProfileData(data);
      }).catch(() => { });
    }
  });

  const [quoteForm, setQuoteForm] = useState({
    itemName: '',
    hsnCode: '',
    quantity: 1,
    price: 0,
    gstType: 'CGST_SGST' as GstType,
    gstRate: 18,
    shipping: 0,
    deliveryTimeline: '',
    shippingNotes: '',
    terms: 'Standard delivery terms apply.',
    priceTag: '' as '' | 'Best Price' | 'Last Price',
    paymentTerms: '',
    transportationTerms: '',
    cartItems: [] as Array<{ productId: string, name: string, quantity: number, price: number, unit?: string, hsnCode?: string }>,
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [customMsgOpen, setCustomMsgOpen] = useState(false);
  const [supplierPaymentAck, setSupplierPaymentAck] = useState(false);
  const [customMsgText, setCustomMsgText] = useState('');

  const { messages, isTyping, loadMessages, sendMessage } = useChat(activeConv?._id);
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [quoteFormErrors, setQuoteFormErrors] = useState<{ price?: string; deliveryTimeline?: string }>({});
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  const heldToastIdRef = useRef<string | null>(null);

  useEffect(() => {
    const onHide = () => {
      if (document.hidden && heldToastIdRef.current) {
        toast.dismiss(heldToastIdRef.current);
        heldToastIdRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      if (heldToastIdRef.current) toast.dismiss(heldToastIdRef.current);
    };
  }, []);

  const computedTotalPrice = quoteForm.cartItems.length > 0 
    ? quoteForm.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    : quoteForm.price * quoteForm.quantity;
  const computedGstAmount = quoteForm.gstType === 'exempt'
    ? 0
    : Math.round(computedTotalPrice * quoteForm.gstRate) / 100;
  const computedCourierGst = (quoteForm.transportationTerms === 'Third-Party Courier (Prepaid)' && quoteForm.shipping > 0) ? Math.round(quoteForm.shipping * 0.18) : 0;
  const computedGrandTotal = computedTotalPrice + computedGstAmount + quoteForm.shipping + computedCourierGst;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteConv = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    setDeletingId(convId);
    setOpenMenuId(null);
    try {
      await chatApi.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c._id !== convId));
      if (activeConv?._id === convId) setActiveConv(null);
      toast.success('Enquiry deleted');
    } catch {
      toast.error('Failed to delete enquiry');
    } finally {
      setDeletingId(null);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  useEffect(() => { if (user) loadConversations(); }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notif: any) => {
      if (notif.type === 'CHAT_MESSAGE' || notif.type === 'QUOTATION_UPDATE') {
        loadConversations();
        if (activeConv?._id === notif.conversationId) loadMessages();
      }
    };
    socket.on('new_notification', handleNotification);
    return () => { socket.off('new_notification', handleNotification); };
  }, [socket, activeConv]);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  const getOtherParticipant = (conv: any) => {
    const currentUserId = user?._id || user?.id;
    const buyerId = conv?.buyerId?._id || conv?.buyerId;
    if (buyerId?.toString() === currentUserId?.toString()) return conv?.supplierId;
    return conv?.buyerId;
  };

  const getUnread = (conv: any) => {
    const uid = user?._id || user?.id;
    return conv.unreadCount?.[uid] || conv.unreadCount?.[user?.id] || 0;
  };

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    const otherName = other?.name || 'User';
    return (
      otherName.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'all' || getUnread(conv) > 0)
    );
  });

  const handleSelectConv = (conv: any) => {
    setActiveConv(conv);
    // Clear the unread dot/badge for this conversation immediately
    const uid = user?._id || user?.id;
    setConversations(prev => prev.map(c =>
      c._id === conv._id ? { ...c, unreadCount: { ...(c.unreadCount || {}), [uid]: 0, [user?.id]: 0 } } : c
    ));
    socket?.emit('mark_read', conv._id);
    const quantity = conv.initialEnquiry?.quantity || 1;
    setQuoteForm(prev => ({
      ...prev,
      itemName: conv.productId?.name || '',
      hsnCode: conv.productId?.hsnCode || '',
      quantity: quantity,
      price: conv.initialEnquiry?.targetPrice ? (conv.initialEnquiry.targetPrice / quantity) : 0,
      deliveryTimeline: conv.initialEnquiry?.deliveryTimeline || '',
      paymentTerms: conv.initialEnquiry?.paymentTerms || '100% Advance',
      transportationTerms: conv.initialEnquiry?.transportationTerms || 'FOR',
      cartItems: conv.initialEnquiry?.cartItems || [],
    }));
  };

  const handleCreateQuotation = async () => {
    if (!activeConv || isSendingQuote) return;
    setIsSendingQuote(true);

    let finalSignature = supplierProfileData?.savedSignature || user?.savedSignature;

    if (!finalSignature) {
      if (supplierSigCanvas.current && !supplierSigCanvas.current.isEmpty()) {
        finalSignature = supplierSigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        // Save it permanently to their profile so they never have to do it again
        updateSignatureMutation.mutate(finalSignature);
      } else if (supplierSignature) {
        finalSignature = supplierSignature;
        updateSignatureMutation.mutate(finalSignature);
      } else {
        toast.error("Please draw or upload your signature.");
        setIsSendingQuote(false);
        return;
      }
    }

    const other = getOtherParticipant(activeConv);
    const buyerId = typeof other === 'string' ? other : other?._id || other?.id;
    try {
      const itemsToQuote = quoteForm.cartItems.length > 0 
        ? quoteForm.cartItems.map(it => ({
            name: it.name,
            quantity: it.quantity,
            price: Number(it.price),
            hsnCode: it.hsnCode || undefined,
            unit: it.unit || 'pcs'
          }))
        : [{
            name: quoteForm.itemName,
            quantity: quoteForm.quantity,
            price: Number(quoteForm.price),
            hsnCode: quoteForm.hsnCode || undefined,
          }];

      const payload = await quotationApi.createQuotation({
        conversationId: activeConv._id,
        buyerId,
        isAcceptingBuyerPrice,
        items: itemsToQuote,
        taxableAmount: computedTotalPrice,
        totalAmount: computedGrandTotal,
        gstType: quoteForm.gstType,
        gstRate: quoteForm.gstType === 'exempt' ? 0 : Number(quoteForm.gstRate),
        gstAmount: computedGstAmount,
        shippingCost: Number(quoteForm.shipping),
        deliveryTimeline: quoteForm.deliveryTimeline || undefined,
        shippingNotes: quoteForm.shippingNotes || undefined,
        terms: quoteForm.terms,
        deliveryAddressSnapshot: activeConv.buyerAddress,
        priceTag: quoteForm.priceTag || undefined,
        paymentTerms: quoteForm.paymentTerms,
        transportationTerms: quoteForm.transportationTerms,
        supplierSignature: finalSignature || undefined,
      });
      setIsQuoteModalOpen(false);
      setShowPreview(false);
      setEditingQuoteId(null);
      setSupplierSignature(null);
      setHasDrawnSignature(false);
      setSupplierPaymentAck(false);
      loadMessages();
      if (payload?.held) {
        const tid = toast.custom(t => (
          <div className={`flex items-start gap-3 bg-white border border-[#fcd34d] rounded-[12px] shadow-lg px-4 py-3 max-w-sm w-full ${t.visible ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-2xl shrink-0">⏸️</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#92400e] m-0">Quotation held — insufficient balance</p>
              <div className="mt-1.5 bg-[#fffbeb] border border-[#fde68a] rounded-[6px] px-2.5 py-2 text-xs text-[#92400e] flex flex-col gap-0.5">
                <div className="flex justify-between"><span>Commission required</span><span className="font-bold">₹{Number(payload.commission).toFixed(2)}</span></div>
                <div className="flex justify-between text-[#b45309]"><span>Your balance</span><span className="font-bold">₹{Number(payload.availableBalance).toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-[#fde68a] pt-1 mt-0.5 text-[#dc2626]"><span className="font-bold">Shortfall</span><span className="font-bold">₹{Math.max(0, payload.commission - payload.availableBalance).toFixed(2)}</span></div>
              </div>
              <p className="text-xs text-[#b45309] mt-1.5 m-0">Top up ₹{Math.max(0, payload.commission - payload.availableBalance).toFixed(2)} and it will be sent to the buyer automatically.</p>
              <a
                href="/supplier/dashboard?tab=wallet"
                onClick={() => toast.dismiss(t.id)}
                className="inline-block mt-2 text-xs font-bold text-[#e65c00] underline underline-offset-2 hover:text-[#c94f00]"
              >
                Top up wallet →
              </a>
            </div>
            <button onClick={() => toast.dismiss(t.id)} className="text-[#94a3b8] bg-transparent border-none cursor-pointer text-lg p-0 shrink-0">×</button>
          </div>
        ), { duration: Infinity, position: 'top-right' });
        heldToastIdRef.current = tid;
      } else {
        toast.success(editingQuoteId ? 'Quotation updated!' : 'Quotation sent successfully!');
      }
    } catch (err: any) {
      console.error('Failed to create quotation', err);
      toast.error(err?.response?.data?.message || 'Failed to send quotation');
    } finally {
      setIsSendingQuote(false);
    }
  };



  const handleQuickReply = (text: string) => {
    if (!activeConv) return;
    const other = getOtherParticipant(activeConv);
    const receiverId = other?._id || other?.id;
    if (!receiverId) return;
    sendMessage(text, receiverId);
  };


  // ── Quotation card ────────────────────────────────────────────────────────

  let isNegotiationDead = false;
  for (let i = messages.length - 1; i >= 0; i--) {
    const txt = messages[i].text || '';
    if (txt.includes('Enquiry:') && messages[i].messageType !== 'system') {
      isNegotiationDead = false;
      break;
    }
    if (txt.includes('Negotiation rejected') || txt.includes('Negotiation Cancelled') || txt.includes('Purchase Order Generated')) {
      isNegotiationDead = true;
      break;
    }
  }

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`w-[300px] max-lg:w-full border-r border-[#f1f5f9] flex flex-col shrink-0 ${activeConv ? 'max-lg:hidden' : ''}`}>
        <div className="px-6 pt-10 pb-4 border-b border-[#f1f5f9]">
          <h1 className="text-xl font-extrabold text-[#0f172a] m-0 mb-4">Enquiries</h1>
          <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2 focus-within:border-primary bg-[#f8fafc]">
            <Search size={14} className="text-[#94a3b8] shrink-0" />
            <input className="border-none outline-none text-sm bg-transparent flex-1 text-[#1e293b] placeholder:text-[#94a3b8]"
              placeholder="Search enquiries…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex border-b border-[#f1f5f9]">
          {(['all', 'unread'] as Filter[]).map(f => (
            <button key={f}
              className={`flex-1 py-2.5 text-xs font-bold capitalize cursor-pointer border-none transition-colors ${filter === f ? 'text-primary border-b-2 border-primary bg-[#fff7ed]' : 'text-[#94a3b8] bg-transparent hover:text-[#475569]'}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#94a3b8] gap-2">
              <Inbox size={32} strokeWidth={1.5} />
              <p className="text-xs m-0">No conversations yet.</p>
            </div>
          ) : filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const unread = getUnread(conv);
            const isActive = activeConv?._id === conv._id;
            const isMenuOpen = openMenuId === conv._id;
            const isDeleting = deletingId === conv._id;
            return (
              <div key={conv._id}
                className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-[#f8fafc] ${isActive ? 'bg-[#fff7ed]' : 'hover:bg-[#f8fafc]'} ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                onClick={() => handleSelectConv(conv)}>
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold ${isActive ? 'bg-primary text-white' : 'bg-[#f1f5f9] text-[#475569]'}`}>
                    {other?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  {(() => {
                    const label = conv.productId?.name ||
                      (conv.lastMessage?.match(/^Quotation sent:\s*(.+)/i)?.[1]);
                    return label ? (
                      <span className="text-[10px] font-bold text-primary bg-[#fff7ed] px-1.5 py-0.5 rounded-full">{label}</span>
                    ) : null;
                  })()}
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`text-sm truncate ${unread > 0 ? 'font-extrabold text-[#0f172a]' : 'font-semibold text-[#0f172a]'}`}>{other?.name || 'User'}</span>
                    <span className="text-[10px] text-[#94a3b8] shrink-0 mr-5">{new Date(conv.lastMessageAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={`text-xs truncate ${unread > 0 ? 'font-bold text-[#475569]' : 'text-[#94a3b8]'}`}>
                      {(() => {
                        if (!conv.lastMessage) return 'Start of conversation';
                        if (conv.lastMessage === 'Quotation sent' && user?.role === 'buyer') {
                          return 'Quotation received';
                        }
                        if (conv.lastMessage === 'Supplier accepted the offer.' && user?.role === 'supplier') {
                          return 'You accepted the offer.';
                        }
                        return conv.lastMessage;
                      })()}
                    </span>
                    {unread > 0 && <span className="text-[10px] font-extrabold bg-primary text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0 mr-5">{unread}</span>}
                  </div>
                </div>
                <button
                  className="absolute right-2 top-3 w-7 h-7 flex items-center justify-center rounded-full text-[#94a3b8] bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-[#f1f5f9] hover:text-[#475569] transition-opacity"
                  onClick={e => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : conv._id); }}>
                  <MoreVertical size={15} />
                </button>
                {isMenuOpen && (
                  <div ref={menuRef} className="absolute right-2 top-9 z-50 bg-white border border-[#e2e8f0] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.1)] py-1 min-w-[140px]" onClick={e => e.stopPropagation()}>
                    <button className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-[#dc2626] bg-transparent border-none cursor-pointer hover:bg-[#fef2f2] transition-colors"
                      onClick={e => handleDeleteConv(e, conv._id)}>
                      <Trash2 size={13} /> Delete Enquiry
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Chat area */}
      <main className={`flex-1 flex flex-col min-w-0 ${!activeConv ? 'max-lg:hidden' : ''}`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center p-8">
              <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center text-[#94a3b8]"><Inbox size={32} strokeWidth={1.5} /></div>
              <h3 className="text-base font-extrabold text-[#0f172a] m-0">Your Enquiries</h3>
              <p className="text-sm text-[#64748b] m-0 max-w-[300px]">Select an enquiry from the list to view the conversation.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-6 pt-10 pb-5 border-b border-[#f1f5f9] bg-white">
              <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] text-[#475569] border-none cursor-pointer bg-transparent" onClick={() => setActiveConv(null)}>
                <ArrowLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-extrabold shrink-0">
                {getOtherParticipant(activeConv)?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#0f172a]">{getOtherParticipant(activeConv)?.name || 'User'}</div>
                <div className="text-xs text-[#94a3b8]">
                  {isTyping ? 'Typing…' : (() => {
                    if (activeConv.productId?.name) return `Re: ${activeConv.productId.name}`;
                    const qMsg = messages.find(m => m.messageType === 'quotation' && m.text);
                    if (qMsg?.text) return `Re: ${qMsg.text.replace(/^Quotation sent:\s*/i, '')}`;
                    return 'General Enquiry';
                  })()}
                </div>
              </div>
              {user?.role === 'supplier' && (() => {
                return (
                  <button
                    disabled={isNegotiationDead}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] ${isNegotiationDead ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#ffedd5]'}`}
                    onClick={() => { setIsQuoteModalOpen(true); setIsAcceptingBuyerPrice(false); setQuoteFormErrors({}); }}>
                    <FileText size={14} /> Send Quotation
                  </button>
                );
              })()}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-[#f8fafc]">
              {messages.map((msg, idx) => {
                const isMine = (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString();
                return (
                  <div key={msg._id || idx} className={`flex flex-col ${msg.messageType === 'system' ? 'items-center w-full' : isMine ? 'items-end' : 'items-start'}`}>
                    {msg.messageType === 'quotation' || msg.messageType === 'buyer_counter_offer' ? (
                      <QuotationCard isLatestQuoteMsg={!messages.slice(idx + 1).some(m => m.messageType === 'quotation' || m.messageType === 'buyer_counter_offer')} msg={msg} user={user} socket={socket} loadMessages={loadMessages} product={activeConv?.productId} onSupplierAction={(quote, isAccept) => {
                        setQuoteForm(prev => {
                          const quantity = quote.items?.[0]?.quantity || prev.quantity || 1;
                          const latestPrice = quote.counterOffer?.price || quote.proposedPrice;
                          const unitPrice = latestPrice ? Number(latestPrice) / quantity : prev.price;
                          return {
                            ...prev,
                            price: unitPrice,
                            quantity: quantity,
                            deliveryTimeline: quote.counterOffer?.deliveryTimeline || quote.deliveryTimePreference || prev.deliveryTimeline,
                            paymentTerms: quote.paymentTerms || prev.paymentTerms,
                            transportationTerms: quote.transportationTerms || prev.transportationTerms,
                            shipping: quote.shippingCost || prev.shipping
                          };
                        });
                        setIsAcceptingBuyerPrice(isAccept);
                        setIsQuoteModalOpen(true);
                        setQuoteFormErrors({});
                      }} />
                    ) : msg.messageType === 'po_supplier_approval_request' ? (
                      <div className="w-full flex justify-center py-2">
                        <div className="w-[85%] bg-[#fff7ed] border border-[#fed7aa] rounded-[12px] p-4 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#f97316]"></div>
                          <p className="text-[11px] font-bold text-[#ea580c] uppercase tracking-wide m-0 mb-1">Final Approval Required</p>
                          <p className="text-sm text-[#431407] m-0 mb-3">{msg.text}</p>
                          {user?.role === 'supplier' && (() => {
                            const isLatest = messages.filter(m => m.messageType === 'po_supplier_approval_request').pop()?._id === msg._id;
                            const msgIdx = messages.findIndex(m => m._id === msg._id);
                            const hasPO = messages.slice(msgIdx + 1).some(m => m.text?.includes('Purchase Order Generated'));
                            if (isLatest && !hasPO) {
                              return (
                                <button
                                  onClick={async (e) => {
                                    const btn = e.currentTarget;
                                    btn.disabled = true;
                                    btn.innerText = 'Approving...';
                                    try {
                                      const qId = typeof msg.quotationId === 'object' ? (msg.quotationId as any)._id : msg.quotationId;
                                      await quotationApi.supplierApprove(qId);
                                      loadMessages();
                                    } catch (err: any) {
                                      btn.disabled = false;
                                      btn.innerText = '✓ Approve PO';
                                      toast.error(err.response?.data?.message || 'Failed to approve');
                                    }
                                  }}
                                  className="w-full py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold rounded-[8px] cursor-pointer border-none transition-colors disabled:opacity-50"
                                >
                                  ✓ Approve PO
                                </button>
                              );
                            }
                            return <p className="text-xs font-bold text-[#ea580c] m-0 italic">Approved</p>;
                          })()}
                        </div>
                      </div>
                    ) : msg.messageType === 'system' ? (
                      <div className="w-full flex items-center gap-2 py-1">
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-4 py-2.5 text-center max-w-[320px]">
                          {msg.text.split('\n').map((line: string, i: number) => (
                            <p key={i} className={`m-0 ${i === 0 ? 'text-xs font-extrabold text-[#0f172a]' : 'text-[11px] text-[#64748b] mt-0.5'}`}>{line}</p>
                          ))}
                          {msg.text.includes('Purchase Order Generated') && user?.role === 'supplier' && (() => {
                            const hasRequested = messages.some(m => m.messageType === 'payment_request' && new Date(m.createdAt) > new Date(msg.createdAt));
                            if (!hasRequested) {
                              return (
                                <button
                                  onClick={async (e) => {
                                    const btn = e.currentTarget;
                                    btn.disabled = true;
                                    btn.innerText = 'Requesting...';
                                    try {
                                      const anyQuoteWithOrder = messages.slice().reverse().find(m => m.messageType === 'quotation' && (m.quotationId as any)?.orderId);
                                      const fallbackOrderId = (anyQuoteWithOrder?.quotationId as any)?.orderId?._id || (anyQuoteWithOrder?.quotationId as any)?.orderId;
                                      const orderId = (msg.quotationId as any)?.orderId?._id || (msg.quotationId as any)?.orderId || fallbackOrderId;
                                      if (!orderId) throw new Error('Order ID not found in Chat');
                                      await apiClient.post(`/orders/${orderId}/payment-request`);
                                      toast.success('Payment requested successfully');
                                      loadMessages();
                                    } catch (err: any) {
                                      btn.disabled = false;
                                      btn.innerText = 'Request Payment';
                                      toast.error(err.response?.data?.message || 'Failed to request payment');
                                    }
                                  }}
                                  className="w-full mt-3 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold rounded-[8px] cursor-pointer border-none transition-colors"
                                >
                                  Request Payment
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                      </div>
                    ) : msg.messageType === 'payment_request' ? (
                      <div className="w-full flex justify-center py-2">
                        <div className="w-[85%] bg-[#fefce8] border border-[#fef08a] rounded-[12px] p-4 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#eab308]"></div>
                          <p className="text-[11px] font-bold text-[#ca8a04] uppercase tracking-wide m-0 mb-1">Payment Required</p>
                          <p className="text-sm text-[#713f12] m-0 mb-3">{msg.text}</p>
                          {user?.role === 'buyer' && (() => {
                            const isLatest = messages.filter(m => m.messageType === 'payment_request').pop()?._id === msg._id;
                            const hasProof = messages.some(m => m.messageType === 'payment_proof' && new Date(m.createdAt) > new Date(msg.createdAt));
                            if (isLatest && !hasProof) {
                              return (
                                <button
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*,application/pdf';
                                    input.onchange = async (e: any) => {
                                      const file = e.target.files[0];
                                      if (!file) return;
                                      
                                      setPaymentProofFile(file);
                                      setPaymentMsgContext(msg);
                                      setShowPaymentProofModal(true);
                                      setPaymentUtr('');
                                    };
                                    input.click();
                                  }}
                                  className="w-full py-2 bg-[#eab308] hover:bg-[#ca8a04] text-white text-xs font-bold rounded-[8px] cursor-pointer border-none transition-colors"
                                >
                                  Upload Payment Proof
                                </button>
                              );
                            }
                            return <p className="text-xs font-bold text-[#ca8a04] m-0 italic">Proof Uploaded</p>;
                          })()}
                        </div>
                      </div>
                    ) : msg.messageType === 'payment_proof' ? (
                      <div className="w-full flex justify-center py-2">
                        <div className="w-[85%] bg-[#f0fdf4] border border-[#bbf7d0] rounded-[12px] p-4 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#22c55e]"></div>
                          <p className="text-[11px] font-bold text-[#166534] uppercase tracking-wide m-0 mb-1">Payment Proof Uploaded</p>
                          <p className="text-sm text-[#14532d] m-0 mb-3">{msg.text}</p>
                          {user?.role === 'supplier' && (() => {
                            const isLatest = messages.filter(m => m.messageType === 'payment_proof').pop()?._id === msg._id;
                            const isVerified = messages.some(m => m.messageType === 'payment_verified' && new Date(m.createdAt) > new Date(msg.createdAt));
                            if (isLatest && !isVerified) {
                              return (
                                <button
                                  onClick={async (e) => {
                                    const btn = e.currentTarget;
                                    btn.disabled = true;
                                    btn.innerText = 'Verifying...';
                                    try {
                                      const anyQuoteWithOrder = messages.slice().reverse().find(m => m.messageType === 'quotation' && (m.quotationId as any)?.orderId);
                                      const fallbackOrderId = (anyQuoteWithOrder?.quotationId as any)?.orderId?._id || (anyQuoteWithOrder?.quotationId as any)?.orderId;
                                      const orderId = (msg.quotationId as any)?.orderId?._id || (msg.quotationId as any)?.orderId || fallbackOrderId;
                                      if (!orderId) throw new Error('Order ID not found in Chat');
                                      
                                      await apiClient.post(`/orders/${orderId}/payment-verify`);
                                      toast.success('Payment verified successfully');
                                      loadMessages();
                                    } catch (err: any) {
                                      btn.disabled = false;
                                      btn.innerText = 'Verify Payment';
                                      toast.error(err.response?.data?.message || 'Failed to verify payment');
                                    }
                                  }}
                                  className="w-full py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold rounded-[8px] cursor-pointer border-none transition-colors disabled:opacity-50"
                                >
                                  Verify Payment
                                </button>
                              );
                            }
                            return <p className="text-xs font-bold text-[#166534] m-0 italic">Payment Verified</p>;
                          })()}
                        </div>
                      </div>
                    ) : msg.messageType === 'payment_verified' ? (
                      <div className="w-full flex justify-center py-2">
                        <div className="w-[85%] bg-[#ecfdf5] border border-[#a7f3d0] rounded-[12px] p-4 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#10b981]"></div>
                          <p className="text-[11px] font-bold text-[#047857] uppercase tracking-wide m-0 mb-1">Payment Verified</p>
                          <p className="text-sm text-[#064e3b] m-0">{msg.text}</p>
                        </div>
                      </div>
                    ) : (
                      <div className={`whitespace-pre-wrap leading-relaxed max-w-[75%] px-4 py-2.5 rounded-[12px] text-sm ${isMine ? 'bg-primary text-white rounded-br-[4px]' : 'bg-white text-[#334155] border border-[#eef2f6] rounded-bl-[4px]'}`}>
                        {msg.text}
                        {msg.text.includes('Enquiry:') && user?.role === 'supplier' && (() => {
                          let showActions = false;
                          // Show actions only if this is the LATEST enquiry and there's no active negotiation after it
                          const msgIdx = messages.findIndex(m => m._id === msg._id);
                          if (msgIdx !== -1) {
                            const isLatestEnquiry = !messages.slice(msgIdx + 1).some(m => m.text.includes('Enquiry:'));
                            const hasQuotationAfter = messages.slice(msgIdx + 1).some(m => m.messageType === 'quotation');
                            showActions = isLatestEnquiry && !hasQuotationAfter && !isNegotiationDead;
                          }

                          if (!showActions) return null;

                          // Parse target price
                          const match = msg.text.match(/Target budget: ₹([0-9,]+)/);
                          const targetPriceStr = match ? match[1].replace(/,/g, '') : null;
                          const parsedTargetPrice = targetPriceStr ? Number(targetPriceStr) : null;

                          return (
                            <div className="mt-3 w-full flex flex-col gap-2 border-t border-[#e2e8f0]/40 pt-3">
                              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Your Action</span>
                              <div className="grid grid-cols-2 gap-2">
                                {(parsedTargetPrice || msg.text.includes('Price: As listed')) && (
                                  <button
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-green-600 rounded-[8px] cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-50"
                                    disabled={isSendingQuote}
                                    onClick={() => {
                                      if (parsedTargetPrice) {
                                        const qtyMatch = msg.text.match(/Quantity: (\d+)/);
                                        const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
                                        setQuoteForm(prev => ({ ...prev, price: parsedTargetPrice / qty, quantity: qty }));
                                      } else {
                                        const qtyMatch = msg.text.match(/Quantity: (\d+)/);
                                        const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
                                        setQuoteForm(prev => ({ ...prev, price: activeConv?.productId?.basePrice || 0, quantity: qty, priceTag: '' as any }));
                                      }
                                      setIsAcceptingBuyerPrice(true);
                                      setIsQuoteModalOpen(true);
                                      setQuoteFormErrors({});
                                    }}>
                                    <Check size={14} /> Accept
                                  </button>
                                )}
                                <button
                                  className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold ${(!parsedTargetPrice && !msg.text.includes('Price: As listed')) ? 'col-span-2 text-white bg-primary hover:bg-primary/90' : 'text-[#475569] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc]'} rounded-[8px] cursor-pointer transition-colors`}
                                  onClick={() => {
                                    const qtyMatch = msg.text.match(/Quantity: (\d+)/);
                                    if (qtyMatch) {
                                      setQuoteForm(prev => ({ ...prev, quantity: Number(qtyMatch[1]) }));
                                    }
                                    setIsAcceptingBuyerPrice(false);
                                    setIsQuoteModalOpen(true);
                                    setQuoteFormErrors({});
                                  }}>
                                  <FileText size={14} /> Negotiate
                                </button>
                              </div>
                              <button
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-[8px] cursor-pointer hover:bg-red-100 transition-colors"
                                onClick={() => {
                                  if (!activeConv?._id) return;
                                  chatApi.cancelEnquiry(activeConv._id, 'Supplier rejected the enquiry terms.').then(() => {
                                    handleQuickReply("Thank you for your enquiry. Unfortunately, we are unable to fulfill this request at the specified terms.");
                                    loadMessages();
                                  });
                                }}>
                                <X size={14} /> Reject Enquiry
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {msg.messageType !== 'system' && msg.messageType !== 'quotation' && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-[#94a3b8]">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {isMine && (msg.isRead ? <CheckCheck size={13} className="text-[#38bdf8]" /> : <Check size={13} className="text-[#94a3b8]" />)}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {(() => {
              const lastEnquiryIdx = messages.findLastIndex(m => m.text?.includes('Enquiry:'));
              const lastPOIdx = messages.findLastIndex(m => m.text?.includes('Purchase Order Generated'));
              const lastDeliveredIdx = messages.findLastIndex(m => m.text?.includes('marked delivered by the supplier'));
              const isPOActive = lastPOIdx !== -1 && lastPOIdx > lastEnquiryIdx;
              const isDelivered = lastDeliveredIdx !== -1 && lastDeliveredIdx > lastPOIdx;
              const canType = isPOActive && !isDelivered;
              return canType;
            })() && (
                <div className="border-t border-[#f1f5f9] bg-white px-4 py-2.5 shrink-0">
                  {customMsgOpen ? (
                    /* ── Custom message input ── */
                    <div className="flex flex-col gap-2">
                      <textarea
                        autoFocus
                        rows={2}
                        value={customMsgText}
                        onChange={e => setCustomMsgText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const t = customMsgText.trim();
                            if (t) { handleQuickReply(t); setCustomMsgText(''); setCustomMsgOpen(false); }
                          }
                        }}
                        placeholder={user?.role === 'supplier' ? 'Type your reply…' : 'Type your question…'}
                        className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#1e293b] outline-none focus:border-primary resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setCustomMsgOpen(false); setCustomMsgText(''); }}
                          className="px-3 py-1.5 text-xs font-semibold text-[#64748b] bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:bg-[#f1f5f9]">
                          Cancel
                        </button>
                        <button
                          disabled={!customMsgText.trim()}
                          onClick={() => {
                            const t = customMsgText.trim();
                            if (t) { handleQuickReply(t); setCustomMsgText(''); setCustomMsgOpen(false); }
                          }}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-primary rounded-[6px] border-none cursor-pointer disabled:opacity-40">
                          Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Quick reply pills ── */
                    true ? (
                      <>
                        <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider m-0 mb-2">Quick Replies</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {(user?.role === 'supplier' ? SUPPLIER_QR : BUYER_QR).map(qr => (
                            <button
                              key={qr.label}
                              onClick={() => {
                                if (qr.label.startsWith('❓') || qr.label.startsWith('✏️')) {
                                  setCustomMsgOpen(true);
                                } else {
                                  handleQuickReply(qr.text);
                                }
                              }}
                              className="shrink-0 px-3 py-1.5 text-[11px] font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-full cursor-pointer hover:border-primary hover:text-primary hover:bg-[#fff7ed] transition-colors whitespace-nowrap"
                            >
                              {qr.label}
                            </button>
                          ))}
                          {/* Supplier custom reply button */}
                          {user?.role === 'supplier' && (
                            <button
                              onClick={() => setCustomMsgOpen(true)}
                              className="shrink-0 px-3 py-1.5 text-[11px] font-semibold text-primary bg-[#fff7ed] border border-[#fed7aa] rounded-full cursor-pointer hover:bg-[#ffedd5] transition-colors whitespace-nowrap">
                              ✏️ Write your reply
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Show write reply button directly if no PO yet */
                      <button
                        onClick={() => setCustomMsgOpen(true)}
                        className="w-full flex justify-center items-center gap-2 px-3 py-2 text-[11px] font-bold text-primary bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] cursor-pointer hover:bg-[#ffedd5] transition-colors">
                        ✏️ Type Message
                      </button>
                    )
                  )}
                </div>
              )}
          </>
        )}
      </main>

      {/* ── Quote Form Modal ─────────────────────────────────────────────── */}
      {isQuoteModalOpen && !showPreview && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-50 flex items-center justify-center px-4" onClick={() => setIsQuoteModalOpen(false)}>
          <div className="bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 w-full max-w-[480px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-5">{editingQuoteId ? 'Edit Quotation' : 'Send Quotation'}</h2>
            <div className="flex flex-col gap-4">
              {quoteForm.cartItems.length > 0 ? (
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  <label className={labelCls}>Items Requesting Quotation</label>
                  {quoteForm.cartItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px]">
                      <p className="text-[13px] font-bold text-[#0f172a] m-0 mb-2">{item.name}</p>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <label className={labelCls}>HSN Code</label>
                          <input type="text" value={item.hsnCode || '—'} readOnly className={inputCls + " bg-[#f1f5f9] cursor-default text-[#64748b]"} />
                        </div>
                        <div>
                          <label className={labelCls}>Quantity</label>
                          <input type="text" value={item.quantity} readOnly className={inputCls + " bg-[#f1f5f9] cursor-default text-[#64748b]"} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Per Unit Price ₹ <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.price || ''}
                          onChange={e => {
                            const v = Number(e.target.value.replace(/\D/g, ''));
                            const newItems = [...quoteForm.cartItems];
                            newItems[idx].price = v;
                            setQuoteForm({ ...quoteForm, cartItems: newItems });
                            if (quoteFormErrors.price) setQuoteFormErrors(prev => ({ ...prev, price: undefined }));
                          }}
                          className={inputCls + (quoteFormErrors.price ? ' border-red-400' : '')}
                          placeholder="Price per unit"
                        />
                        {item.price > 0 && item.quantity > 0 && (
                          <p className="text-[11px] text-[#059669] font-semibold mt-1 m-0">
                            Item Total: ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {quoteFormErrors.price && <p className="text-[11px] text-red-500 mt-1 m-0">{quoteFormErrors.price}</p>}
                </div>
              ) : (
                <>
                  <div>
                    <label className={labelCls}>Item Name</label>
                    <input type="text" value={quoteForm.itemName} readOnly className={inputCls + " bg-[#f8fafc] cursor-default text-[#64748b]"} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>HSN Code</label>
                      <input type="text" value={quoteForm.hsnCode || '—'} readOnly className={inputCls + " bg-[#f8fafc] cursor-default text-[#64748b]"} />
                    </div>
                    <div>
                      <label className={labelCls}>Quantity</label>
                      <input
                        type="text"
                        value={quoteForm.quantity}
                        readOnly
                        className={inputCls + " bg-[#f8fafc] cursor-default text-[#64748b]"}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Per Unit Price ₹ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quoteForm.price || ''}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '');
                        setQuoteForm({ ...quoteForm, price: v === '' ? 0 : Number(v) });
                        if (quoteFormErrors.price) setQuoteFormErrors(prev => ({ ...prev, price: undefined }));
                      }}
                      className={inputCls + (quoteFormErrors.price ? ' border-red-400' : '')}
                      placeholder="Price per unit"
                    />
                    {quoteForm.price > 0 && quoteForm.quantity > 1 && (
                      <p className="text-[11px] text-[#059669] font-semibold mt-1 m-0">
                        Total: ₹{computedTotalPrice.toLocaleString('en-IN')} ({quoteForm.quantity} × ₹{quoteForm.price.toLocaleString('en-IN')})
                      </p>
                    )}
                    {quoteFormErrors.price && <p className="text-[11px] text-red-500 mt-1 m-0">{quoteFormErrors.price}</p>}
                  </div>
                </>
              )}
              <div>
                <label className={labelCls}>GST Type</label>
                <div className="flex gap-2">
                  {(['CGST_SGST', 'IGST', 'exempt'] as const).map(t => (
                    <button key={t} type="button"
                      className={`flex-1 py-2 text-xs font-bold rounded-[6px] border cursor-pointer transition-colors ${quoteForm.gstType === t ? 'bg-primary text-white border-primary' : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary'}`}
                      onClick={() => setQuoteForm({ ...quoteForm, gstType: t })}>
                      {t === 'CGST_SGST' ? 'CGST + SGST' : t === 'IGST' ? 'IGST' : 'Exempt'}
                    </button>
                  ))}
                </div>
              </div>
              {quoteForm.gstType !== 'exempt' && (
                <div>
                  <label className={labelCls}>GST Rate</label>
                  <div className="flex gap-2">
                    {[5, 12, 18, 28].map(r => (
                      <button key={r} type="button"
                        className={`flex-1 py-2 text-xs font-bold rounded-[6px] border cursor-pointer transition-colors ${quoteForm.gstRate === r ? 'bg-primary text-white border-primary' : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary'}`}
                        onClick={() => setQuoteForm({ ...quoteForm, gstRate: r })}>{r}%</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Shipping Cost ₹</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={quoteForm.transportationTerms.includes('Ex.') || quoteForm.transportationTerms.includes('To Pay') || quoteForm.transportationTerms === 'FOR'}
                    value={quoteForm.shipping || ''}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      setQuoteForm({ ...quoteForm, shipping: v === '' ? 0 : Number(v) });
                    }}
                    placeholder="0"
                    className={inputCls + (quoteForm.transportationTerms.includes('Ex.') || quoteForm.transportationTerms.includes('To Pay') || quoteForm.transportationTerms === 'FOR' ? ' opacity-50 bg-gray-100 cursor-not-allowed' : '')}
                  />
                </div>
                <div>
                  <label className={labelCls}>Delivery Timeline <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={quoteForm.deliveryTimeline}
                    onChange={e => {
                      setQuoteForm({ ...quoteForm, deliveryTimeline: e.target.value });
                      if (quoteFormErrors.deliveryTimeline) setQuoteFormErrors(prev => ({ ...prev, deliveryTimeline: undefined }));
                    }}
                    onBlur={e => {
                      const raw = e.target.value.trim();
                      if (!raw) return;
                      // Normalise bare numbers: "7" → "7 days", "7-10" → "7–10 days"
                      const hasUnit = /day|week|month|hour/i.test(raw);
                      if (!hasUnit) {
                        const normalised = raw.replace(/-/g, '–') + ' days';
                        setQuoteForm(prev => ({ ...prev, deliveryTimeline: normalised }));
                      }
                    }}
                    placeholder="e.g. 7–10 days"
                    className={inputCls + (quoteFormErrors.deliveryTimeline ? ' border-red-400' : '')}
                  />
                  {quoteFormErrors.deliveryTimeline && <p className="text-[11px] text-red-500 mt-1 m-0">{quoteFormErrors.deliveryTimeline}</p>}
                </div>
              </div>
              <div>
                <label className={labelCls}>Shipping Notes</label>
                <input type="text" value={quoteForm.shippingNotes} onChange={e => setQuoteForm({ ...quoteForm, shippingNotes: e.target.value })} placeholder="e.g. Ex-factory, door delivery included" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Terms & Conditions</label>
                <textarea rows={2} value={quoteForm.terms} onChange={e => setQuoteForm({ ...quoteForm, terms: e.target.value })} className={inputCls + " resize-none"} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Payment Terms <span className="text-red-500">*</span></label>
                  <select value={quoteForm.paymentTerms} onChange={e => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })} className={inputCls}>
                      <option value="100% Advance">100% Advance</option>
                      <option value="50% Advance">50% Advance</option>
                      <option value="COD">Cash on Delivery (COD)</option>
                      <option value="Credit (7 Days)">Credit (7 Days)</option>
                      <option value="Credit (15 Days)">Credit (15 Days)</option>
                      <option value="Credit (30 Days)">Credit (30 Days)</option>
                    </select>
                </div>
                <div>
                  <label className={labelCls}>Transportation <span className="text-red-500">*</span></label>
                  <select 
                    value={quoteForm.transportationTerms} 
                    onChange={e => {
                      const val = e.target.value;
                      const updates: any = { transportationTerms: val };
                      if (val.includes('Ex.') || val.includes('To Pay') || val === 'FOR') {
                        updates.shipping = 0;
                      }
                      setQuoteForm({ ...quoteForm, ...updates });
                    }} 
                    className={inputCls}
                  >
                    <option value="FOR">FOR (Supplier delivers - Free)</option>
                    <option value="Ex. Factory">Ex. Factory (Buyer picks up)</option>
                    <option value="Ex. Godown">Ex. Godown (Buyer picks up)</option>
                    <option value="To Pay">To Pay (Buyer pays freight to courier)</option>
                    <option value="Third-Party Courier (Prepaid)">Third-Party Courier (Prepaid)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Price Highlight (Optional)</label>
                <div className="flex gap-2">
                  {(['', 'Best Price', 'Last Price'] as const).map(t => (
                    <button key={t || 'none'} type="button"
                      className={`flex-1 py-2 text-xs font-bold rounded-[6px] border cursor-pointer transition-colors ${quoteForm.priceTag === t ? 'bg-primary text-white border-primary' : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary'}`}
                      onClick={() => setQuoteForm({ ...quoteForm, priceTag: t })}>
                      {t || 'None'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Live breakdown */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-3 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-[#94a3b8]">
                  <span>Unit Price × Qty</span>
                  <span>₹{quoteForm.price.toLocaleString('en-IN')} × {quoteForm.quantity}</span>
                </div>
                <div className="flex justify-between text-xs text-[#475569]">
                  <span>Total Price (before GST)</span><span className="font-semibold">₹{computedTotalPrice.toLocaleString('en-IN')}</span>
                </div>
                {quoteForm.gstType !== 'exempt' ? (
                  quoteForm.gstType === 'IGST' ? (
                    <div className="flex justify-between text-xs text-[#0369a1]"><span>IGST @ {quoteForm.gstRate}%</span><span className="font-semibold">₹{computedGstAmount.toLocaleString('en-IN')}</span></div>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-[#0369a1]"><span>CGST @ {quoteForm.gstRate / 2}%</span><span className="font-semibold">₹{(computedGstAmount / 2).toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between text-xs text-[#0369a1]"><span>SGST @ {quoteForm.gstRate / 2}%</span><span className="font-semibold">₹{(computedGstAmount / 2).toLocaleString('en-IN')}</span></div>
                    </>
                  )
                ) : <div className="flex justify-between text-xs text-[#94a3b8]"><span>GST</span><span>Exempt / Nil</span></div>}
                {quoteForm.shipping > 0 && <div className="flex justify-between text-xs text-[#475569]"><span>Shipping</span><span className="font-semibold">₹{quoteForm.shipping.toLocaleString('en-IN')}</span></div>}
                {computedCourierGst > 0 && <div className="flex justify-between text-xs text-[#0369a1]"><span>Courier GST (18%)</span><span className="font-semibold">₹{computedCourierGst.toLocaleString('en-IN')}</span></div>}
                <div className="flex justify-between text-sm font-extrabold text-[#0f172a] pt-1.5 border-t border-[#e2e8f0]">
                  <span>Grand Total</span><span>₹{computedGrandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button className="px-4 py-2 text-sm font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:bg-[#f1f5f9]" onClick={() => { setIsQuoteModalOpen(false); setEditingQuoteId(null); }}>Cancel</button>
              <button
                className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-[8px] border-none cursor-pointer hover:opacity-90"
                onClick={() => {
                  const errors: { price?: string; deliveryTimeline?: string } = {};
                  if (!quoteForm.price || quoteForm.price <= 0) errors.price = 'Per unit price is required';
                  if (!quoteForm.deliveryTimeline.trim()) errors.deliveryTimeline = 'Delivery timeline is required';
                  if (Object.keys(errors).length > 0) { setQuoteFormErrors(errors); return; }
                  setQuoteFormErrors({});
                  setShowPreview(true);
                }}
              >
                {editingQuoteId ? 'Preview & Update →' : 'Preview & Send →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quote Preview / Confirm Modal ────────────────────────────────── */}
      {isQuoteModalOpen && showPreview && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.65)] z-50 flex items-center justify-center px-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-[16px] shadow-[0_24px_64px_rgba(0,0,0,0.22)] w-full max-w-[750px] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Preview header */}
            <div className="px-5 py-4 bg-[#f8fafc] border-b border-[#f1f5f9]">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest m-0 mb-1">How the buyer will see this</p>
              <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Confirm & Send Quotation</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-5 p-5">
              {/* Left Column: Quote Preview */}
              <div className="flex-[1.2] flex flex-col min-w-0">
                <QuotePreviewCard form={quoteForm} gstAmount={computedGstAmount} grandTotal={computedGrandTotal} />
              </div>

              {/* Right Column: Payment Ack + Signature */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Payment Method Info for Supplier */}
                <label className="flex items-start gap-2 bg-[#f0fdf4] border border-[#059669] rounded-[8px] p-3 cursor-pointer hover:bg-[#e6fcf0] transition-colors">
                  <input
                    type="checkbox"
                    checked={supplierPaymentAck}
                    onChange={e => setSupplierPaymentAck(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#059669] shrink-0 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#0f172a]">Direct Payment to Supplier</span>
                    </div>
                    <p className="text-[10px] text-[#047857] m-0 leading-relaxed">
                      I acknowledge that the buyer will pay me directly (UPI / bank / cash), and phone numbers will unlock so we can coordinate.
                    </p>
                  </div>
                </label>

                {/* Signature Pad */}
                <div>
                  {(supplierProfileData?.savedSignature || user?.savedSignature) ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide m-0">Authorized Signature</p>
                      <div className="border border-[#e2e8f0] rounded-[8px] p-4 flex justify-center bg-white w-full h-[80px]">
                        <img src={supplierProfileData?.savedSignature || user?.savedSignature} alt="Your Signature" className="max-w-full max-h-full object-contain" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[#475569] uppercase tracking-wide m-0">Authorized Signature <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-2 text-xs">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" checked={signatureMode === 'draw'} onChange={() => setSignatureMode('draw')} />
                            Draw
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" checked={signatureMode === 'upload'} onChange={() => setSignatureMode('upload')} />
                            Upload
                          </label>
                        </div>
                      </div>
                      {signatureMode === 'draw' ? (
                        <div className="border border-[#e2e8f0] rounded-[8px] bg-white relative">
                          <SignatureCanvas
                            ref={supplierSigCanvas}
                            penColor="#0f172a"
                            canvasProps={{ className: 'w-full h-[80px] rounded-[8px]', style: { cursor: 'crosshair' } }}
                            onEnd={() => setHasDrawnSignature(true)}
                          />
                          <button className="absolute top-2 right-2 p-1.5 bg-[#f1f5f9] text-[#64748b] rounded-[6px] hover:bg-[#e2e8f0]" onClick={() => { supplierSigCanvas.current?.clear(); setHasDrawnSignature(false); }}>
                            <Eraser size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-[#cbd5e1] rounded-[8px] p-4 flex flex-col items-center justify-center bg-[#f8fafc] relative min-h-[80px]">
                          {supplierSignature ? (
                            <>
                              <img src={supplierSignature} alt="Uploaded" className="max-w-full max-h-[70px] object-contain" />
                              <button className="absolute top-2 right-2 p-1 text-red-500 bg-white rounded-full shadow-sm hover:bg-red-50" onClick={() => setSupplierSignature(null)}>
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Upload size={24} className="text-[#94a3b8] mb-2" />
                              <span className="text-xs font-semibold text-[#475569]">Click to upload signature</span>
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const reader = new FileReader();
                                    reader.onload = async (ev) => {
                                      const result = ev.target?.result as string;
                                      try {
                                        const processed = await removeWhiteBackground(result);
                                        setSupplierSignature(processed);
                                      } catch {
                                        setSupplierSignature(result);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }
                              }} />
                            </>
                          )}
                        </div>
                      )}
                      <p className="text-[10px] text-primary m-0 italic">This signature will be saved to your profile for all future quotations.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action strip */}
            <div className="px-5 py-4 bg-[#f8fafc] border-t border-[#f1f5f9] flex gap-3 justify-end">
              <button
                className="px-6 py-2.5 text-sm font-semibold text-[#475569] bg-white border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                onClick={() => { setShowPreview(false); setSupplierSignature(null); setHasDrawnSignature(false); setSupplierPaymentAck(false); }}>
                Cancel Edit
              </button>
              <button
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#059669] rounded-[8px] border-none cursor-pointer hover:bg-[#047857] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateQuotation}
                disabled={isSendingQuote || !supplierPaymentAck || (!(supplierProfileData?.savedSignature || user?.savedSignature) && !hasDrawnSignature && !supplierSignature)}
              >
                {isSendingQuote ? 'Sending...' : '✓ Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {showPaymentProofModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[100] flex items-center justify-center px-4" onClick={() => !isUploadingProof && setShowPaymentProofModal(false)}>
          <div className="bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 w-full max-w-[400px]" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-5">Upload Payment Proof</h2>
            
            <div className="flex flex-col gap-4">
              {paymentProofFile && (
                <div className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px]">
                  <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary">
                    <FileImage size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] m-0 truncate">{paymentProofFile.name}</p>
                    <p className="text-xs text-[#64748b] m-0">{(paymentProofFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wide mb-1.5">UTR / Transaction Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={paymentUtr}
                  onChange={e => setPaymentUtr(e.target.value)}
                  placeholder="e.g. UTR123456789"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={() => setShowPaymentProofModal(false)}
                disabled={isUploadingProof}
                className="flex-1 py-2.5 bg-white border border-[#e2e8f0] rounded-[8px] text-sm font-bold text-[#475569] hover:bg-[#f8fafc] cursor-pointer"
              >
                Cancel
              </button>
              <button 
                disabled={!paymentUtr.trim() || isUploadingProof}
                onClick={async () => {
                  if (!paymentProofFile || !paymentUtr.trim() || !paymentMsgContext) return;
                  setIsUploadingProof(true);
                  try {
                    const res = await uploadService.uploadImage(paymentProofFile);
                    // Handle Cloudinary response object properly
                    const proofUrl = typeof res === 'object' && res.url ? res.url : res;

                    const anyQuoteWithOrder = messages.slice().reverse().find(m => m.messageType === 'quotation' && (m.quotationId as any)?.orderId);
                    const fallbackOrderId = (anyQuoteWithOrder?.quotationId as any)?.orderId?._id || (anyQuoteWithOrder?.quotationId as any)?.orderId;
                    const orderId = (paymentMsgContext.quotationId as any)?.orderId?._id || (paymentMsgContext.quotationId as any)?.orderId || fallbackOrderId;
                    
                    if (!orderId) throw new Error('Order ID not found in Chat');

                    await apiClient.post(`/orders/${orderId}/payment-proof`, {
                      paymentProofUrl: proofUrl,
                      paymentUtrNumber: paymentUtr
                    });
                    
                    toast.success('Payment proof uploaded successfully');
                    setShowPaymentProofModal(false);
                    loadMessages();
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to upload proof');
                  } finally {
                    setIsUploadingProof(false);
                  }
                }}
                className={`flex-1 py-2.5 rounded-[8px] text-sm font-bold text-white transition-colors border-none ${(!paymentUtr.trim() || isUploadingProof) ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-[#cc5200] cursor-pointer'}`}
              >
                {isUploadingProof ? 'Uploading...' : 'Submit Proof'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInbox;
