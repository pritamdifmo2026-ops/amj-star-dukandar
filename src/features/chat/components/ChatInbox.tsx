import React, { useState, useEffect, useRef } from 'react';
import { Search, Inbox, ArrowLeft, Check, CheckCheck, FileText, MoreVertical, Trash2, Phone, Clock, X, Eraser, Upload, FileImage, Package } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
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
import { buildGstBreakdown } from '@/shared/utils/calculateGST';

type Filter = 'all' | 'unread';
type GstType = 'CGST_SGST' | 'IGST' | 'exempt';

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors";
const labelCls = "text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5";

type GstBreakLine = { rate: number; taxable: number; gst: number };

// Turn a quotation's GST into display rows. When a per-rate breakdown is present
// (multi-GST) it renders one row per rate — IGST @ x%, or a CGST/SGST pair. When it
// is absent (legacy single-rate quotes/counters) it falls back to the single
// gstRate/gstAmount, reproducing the previous single-line behaviour exactly.
function gstDisplayLines(
  gstType: string | undefined,
  breakdown: GstBreakLine[] | undefined | null,
  fallbackRate: number,
  fallbackGst: number,
): Array<{ label: string; value: number }> {
  if (gstType === 'exempt') return [];
  const lines = (breakdown || []).filter(l => l && l.rate > 0 && l.gst > 0);
  const src: GstBreakLine[] = lines.length > 0
    ? lines
    : (fallbackRate > 0 && fallbackGst > 0 ? [{ rate: fallbackRate, taxable: 0, gst: fallbackGst }] : []);
  const out: Array<{ label: string; value: number }> = [];
  for (const l of src) {
    if (gstType === 'IGST') {
      out.push({ label: `IGST @ ${l.rate}%`, value: l.gst });
    } else {
      out.push({ label: `CGST @ ${l.rate / 2}%`, value: Math.round((l.gst / 2) * 100) / 100 });
      out.push({ label: `SGST @ ${l.rate / 2}%`, value: Math.round((l.gst / 2) * 100) / 100 });
    }
  }
  return out;
}

const inr2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

// ── Payment Terms Parser ───────────────────────────────────────────────────
function parsePaymentTerms(terms?: string) {
  if (!terms) return { paymentType: 'Advance', advancePercent: 100, creditDays: 7, paymentTerms: '100% Advance' };
  const t = terms.trim();
  if (t === 'COD' || t.includes('COD')) {
    return { paymentType: 'COD', advancePercent: 100, creditDays: 7, paymentTerms: 'COD' };
  }
  if (t.includes('Credit')) {
    const daysMatch = t.match(/(\d+)/);
    const creditDays = daysMatch ? Number(daysMatch[1]) : 7;
    return { paymentType: 'Credit', advancePercent: 100, creditDays, paymentTerms: `Credit (${creditDays} Days)` };
  }
  if (t.includes('Advance')) {
    const pctMatch = t.match(/(\d+)%/);
    const advancePercent = pctMatch ? Number(pctMatch[1]) : 100;
    return { paymentType: 'Advance', advancePercent, creditDays: 7, paymentTerms: `${advancePercent}% Advance` };
  }
  return { paymentType: 'Advance', advancePercent: 100, creditDays: 7, paymentTerms: t };
}

// ── Quote preview card (static) ─────────────────────────────────────────────
const QuotePreviewCard = ({
  form, gstAmount, grandTotal,
}: {
  form: { itemName: string; hsnCode: string; quantity: number; price: number; gstType: GstType; gstRate: number; shipping: number; deliveryTimeline: string; terms: string; transportationTerms?: string; cartItems?: any[]; paymentTerms?: string; paymentType?: string; advancePercent?: number; creditDays?: number };
  gstAmount: number;
  grandTotal: number;
}) => {
  const courierGst = (form.transportationTerms === 'Third-Party Courier' && form.shipping > 0) ? (Math.round((form.shipping * 0.18) * 100) / 100) : 0;

  const totalPriceBeforeGst = form.cartItems && form.cartItems.length > 0
    ? form.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    : form.price * form.quantity;

  // Per-rate GST split for the preview. Each item uses its own slab when known,
  // otherwise the rate chosen on the form. Exempt => no GST rows.
  const previewItems = (form.cartItems && form.cartItems.length > 0)
    ? form.cartItems.map(it => ({ price: Number(it.price) || 0, quantity: Number(it.quantity) || 0, gstRate: form.gstType === 'exempt' ? 0 : (it.gstRate ?? form.gstRate), gstIncluded: false }))
    : [{ price: form.price, quantity: form.quantity, gstRate: form.gstType === 'exempt' ? 0 : form.gstRate, gstIncluded: false }];
  const previewBreak = buildGstBreakdown(previewItems);
  const previewGstLines = gstDisplayLines(form.gstType, previewBreak.lines, form.gstRate, gstAmount);
  return (
    <div className="bg-white border border-[#eef2f6] rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#f8fafc] border-b border-[#f1f5f9]">
        <span className="text-xs font-extrabold text-[#0f172a]">Quotation</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#a16207]">Awaiting Response</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-1.5">
        {form.cartItems && form.cartItems.length > 0 ? (
          <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-2 divide-y divide-[#f1f5f9]">
            {form.cartItems.map((item, i) => (
              <div key={i} className="pt-2 first:pt-0">
                <div className="flex justify-between text-xs text-[#475569]">
                  <span className="font-semibold text-[#0f172a]">{item.name}{item.hsnCode && item.hsnCode !== '—' ? ` (HSN: ${item.hsnCode})` : ''}</span>
                </div>
                <div className="flex justify-between text-xs text-[#64748b] pl-2 mt-0.5">
                  <span>Unit Price (Excl. GST)</span>
                  <span>₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-[#64748b] pl-2">
                  <span>Qty</span>
                  <span>{item.quantity} {item.unit || 'pcs'}</span>
                </div>
                {form.gstType !== 'exempt' && (
                  <div className="flex justify-between text-xs text-[#64748b] pl-2">
                    <span>GST</span>
                    <span className="font-semibold text-[#0369a1]">GST({item.gstRate ?? form.gstRate}%)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex justify-between text-xs text-[#475569]">
              <span className="font-medium">{form.itemName}{form.hsnCode ? ` (HSN: ${form.hsnCode})` : ''}</span>
            </div>
            <div className="flex justify-between text-xs text-[#94a3b8] pl-2">
              <span>Unit Price (Excl. GST)</span>
              <span>₹{form.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs text-[#94a3b8] pl-2">
              <span>Qty</span>
              <span>{form.quantity}</span>
            </div>
            {form.gstType !== 'exempt' && (
              <div className="flex justify-between text-xs text-[#94a3b8] pl-2">
                <span>GST Rate</span>
                <span>{form.gstRate}%</span>
              </div>
            )}
          </>
        )}
        <div className="flex justify-between text-xs text-[#475569] pt-1.5 border-t border-[#f1f5f9]">
          <span>Total Price (before GST)</span>
          <span className="font-semibold">₹{totalPriceBeforeGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {form.gstType !== 'exempt' ? (
          previewGstLines.map((ln, li) => (
            <div key={li} className="flex justify-between text-xs text-[#0369a1]">
              <span>{ln.label}</span>
              <span className="font-semibold">₹{inr2(ln.value)}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between text-xs text-[#94a3b8]"><span>GST</span><span>Exempt / Nil</span></div>
        )}
        {form.shipping > 0 && (
          <div className="flex justify-between text-xs text-[#475569]">
            <span>Shipping</span>
            <span className="font-semibold">₹{form.shipping.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        {courierGst > 0 && (
          <div className="flex justify-between text-xs text-[#0369a1]">
            <span>Courier GST (18%)</span>
            <span className="font-semibold">₹{courierGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-extrabold text-[#0f172a] pt-2 border-t border-[#f1f5f9]">
          <span>Grand Total</span>
          <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {form.deliveryTimeline && (
          <p className="text-[10px] text-[#94a3b8] m-0">Delivery: {form.deliveryTimeline}</p>
        )}
        {form.paymentType && (
          <p className="text-[10px] text-[#94a3b8] m-0">
            Payment: {form.paymentType === 'Advance' ? `${form.advancePercent}% Advance` : form.paymentType === 'COD' ? 'COD' : `Credit (${form.creditDays} Days)`}
          </p>
        )}
        {form.transportationTerms && (
          <p className="text-[10px] text-[#94a3b8] m-0">Transport: {form.transportationTerms}</p>
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
];
const SUPPLIER_QR = [
  { label: '⏳ Processing', text: 'Your order is currently being processed. We will update you soon.' },
  { label: '🚚 Shipped', text: 'Your order has been shipped and is on the way. You should receive it shortly.' },
  { label: '📬 Confirm delivery', text: 'Could you please confirm if you have received the order?' },
  { label: '🕐 Update in 24 hrs', text: 'We will provide an update on your order status within 24 hours.' },
];

// ── Main component ──────────────────────────────────────────────────────────
const QuotationCard = ({ isLatestQuoteMsg = true, msg, onActiveChange, user, socket, loadMessages, product, onSupplierAction }: { isLatestQuoteMsg?: boolean; msg: any; onActiveChange?: (isActive: boolean) => void; user: any; socket: any; loadMessages: () => void; product?: any; onSupplierAction?: (quote: any, isAccept: boolean, targetMsg?: any) => void; }) => {
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
  const [counterItemPrices, setCounterItemPrices] = useState<Record<string, number>>({});
  const [counterTimeline, setCounterTimeline] = useState('');
  const [counterPaymentTerms, setCounterPaymentTerms] = useState('');
  const [counterTransportationTerms, setCounterTransportationTerms] = useState('');
  const [counterReason, setCounterReason] = useState('');
  const [counterCourierName, setCounterCourierName] = useState('');
  const [counterShippingCost, setCounterShippingCost] = useState('');
  const [counterPriceTag, setCounterPriceTag] = useState<'' | 'Best Price' | 'Last Price'>('');
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

  useEffect(() => {
    if (showCounter && quote?.items?.length) {
      if (quote.items.length === 1) {
        const item = quote.items[0];
        const defaultUnitPrice = Math.round(Number(item.price) * 0.9 * 100) / 100;
        setCounterPrice(prev => prev || defaultUnitPrice.toString());
      } else {
        const initialPrices: Record<string, number> = {};
        let total = 0;
        quote.items.forEach((it: any) => {
          const defaultPrice = counterItemPrices[it._id] ?? (Math.round(Number(it.price) * 0.9 * 100) / 100);
          initialPrices[it._id] = defaultPrice;
          total += defaultPrice * (it.quantity || 1);
        });
        setCounterItemPrices(initialPrices);
        setCounterPrice(prev => prev || total.toString());
      }
    }
  }, [showCounter, quote?._id]);

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

  // Derive display items: prefer immutable snapshot from msg.metadata if available (preserves original quotation prices even if db record was updated)
  const displayItems = (msg?.metadata?.items && Array.isArray(msg.metadata.items) && msg.metadata.items.length > 0)
    ? msg.metadata.items
    : (quote.items || []);

  const itemsDerivedTotal = displayItems.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0);
  const taxableAmt = (msg?.metadata?.taxableAmount !== undefined)
    ? Number(msg.metadata.taxableAmount)
    : (itemsDerivedTotal > 0 ? itemsDerivedTotal : (Number(quote.taxableAmount) || Number(quote.totalAmount) || 0));
  const actualRetailTotal = taxableAmt;
  const gstRate = Number(quote.gstRate) || 0;
  const gstAmt = (msg?.metadata?.gstAmount !== undefined)
    ? Number(msg.metadata.gstAmount)
    : (quote.gstType === 'exempt' ? 0 : (gstRate > 0 ? (Math.round((taxableAmt * gstRate / 100) * 100) / 100) : (Number(quote.gstAmount) || 0)));
  const shipCost = (msg?.metadata?.shippingCost !== undefined)
    ? Number(msg.metadata.shippingCost)
    : (Number(quote.shippingCost) || 0);
  const courierGst = quote.transportationTerms?.includes('Courier') ? (Math.round((shipCost * 0.18) * 100) / 100) : 0;
  const grandTotal = (msg?.metadata?.totalAmount !== undefined)
    ? Number(msg.metadata.totalAmount)
    : (taxableAmt + gstAmt + shipCost + courierGst);
  // Per-rate GST rows: prefer the immutable snapshot on the message, then the live
  // quotation, else fall back to the single rate/amount (legacy quotes).
  const quoteGstBreakdown: GstBreakLine[] = (msg?.metadata?.gstBreakdown && msg.metadata.gstBreakdown.length > 0)
    ? msg.metadata.gstBreakdown
    : (quote.gstBreakdown || []);
  const quoteGstLines = gstDisplayLines(quote.gstType, quoteGstBreakdown, gstRate, gstAmt);

  const effectivePriceTag = quote?.priceTag || msg.metadata?.priceTag || '';
  const isFinalPrice = effectivePriceTag === 'Last Price';

  const isSingleItem = displayItems.length === 1;
  const totalQty = displayItems.reduce((acc: number, item: any) => acc + Number(item.quantity), 0) || 1;
  const unit = isSingleItem ? displayItems[0]?.unit || 'pcs' : 'items';

  const submitCounter = async () => {
    if (!counterPrice) return;
    const cp = isSingleItem ? (Number(counterPrice) * totalQty) : Number(counterPrice);
    if (cp < actualRetailTotal * 0.5 || cp > actualRetailTotal) return;

    setCounterSubmitting(true);
    try {
      const payload: any = {
        price: cp,
        deliveryTimeline: counterTimeline || undefined,
        paymentTerms: counterPaymentTerms || undefined,
        transportationTerms: counterTransportationTerms || undefined,
        reason: counterReason || undefined,
        shippingCost: counterTransportationTerms === 'Third-Party Courier' ? Number(counterShippingCost) || 0 : (counterTransportationTerms && counterTransportationTerms !== 'Third-Party Courier') ? 0 : undefined,
        shippingNotes: counterTransportationTerms === 'Third-Party Courier' ? counterCourierName || undefined : undefined,
      };

      if (isSupplier && counterPriceTag) {
        payload.priceTag = counterPriceTag;
      }

      if (!isSingleItem) {
        payload.itemPrices = quote.items.map((it: any) => ({
          productId: it._id,
          price: counterItemPrices[it._id] !== undefined ? counterItemPrices[it._id] : (Math.round((it.price * 0.9) * 100) / 100)
        }));
      } else {
        payload.itemPrices = [{
          productId: quote.items[0]._id,
          price: Number(counterPrice)
        }];
      }

      await quotationApi.counterOffer(quote._id, payload);
      loadMessages();
      setShowCounter(false);
      setCounterPrice('');
      setCounterItemPrices({});
      setCounterPriceTag('');
      setCounterTimeline('');
      setCounterPaymentTerms('');
      setCounterTransportationTerms('');
      setCounterReason('');
      setCounterCourierName('');
      setCounterShippingCost('');
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
          {effectivePriceTag && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-[4px] uppercase tracking-wider border flex items-center gap-1 shadow-xs ${effectivePriceTag === 'Best Price'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-indigo-600 text-white border-indigo-700'
              }`}>
              {effectivePriceTag === 'Best Price' ? '⚡ Best Price' : '🏷️ Last Price'}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
        </div>
      </div>


      {msg.messageType === 'buyer_counter_offer' ? (
        <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#f1f5f9]">
          <div className="text-[13px] text-[#334155] whitespace-pre-wrap leading-[1.6]">
            <span className="font-extrabold flex items-center gap-1.5 text-[#0f172a]">
              📦 Counter Offer: {quote.items?.length > 1 ? `${quote.items.length} Products` : (product?.name || 'Product')}
            </span>
            <div className="mt-1.5">
              {quote.items?.length === 1 ? (
                <>
                  Quantity: {quote.items[0]?.quantity || 0} {quote.items[0]?.unit || 'pcs'}<br />
                  Price: ₹{((quote.counterOffer?.price || quote.proposedPrice) / (quote.items[0]?.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} x {quote.items[0]?.quantity || 1} = ₹{(quote.counterOffer?.price || quote.proposedPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br />
                </>
              ) : (
                <div className="flex flex-col gap-1 my-1.5 border-y border-[#f1f5f9] py-1.5">
                  {quote.items?.map((it: any, idx: number) => {
                    const counterIt = quote.counterOffer?.itemPrices?.find((cip: any) => cip.productId?.toString() === it._id?.toString() || cip.productId?.toString() === it.productId?.toString());
                    const unitPrice = counterIt?.price ?? it.price;
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs text-[#334155]">
                        <span className="line-clamp-1 flex-1 pr-2">
                          {it.name} ({it.quantity} {it.unit || 'pcs'})
                          {quote.gstType !== 'exempt' && (
                            <span className="ml-1 text-[9px] font-bold text-[#0369a1] bg-[#e0f2fe] border border-[#bae6fd] px-1 py-0.2 rounded">
                              GST({(it as any).gstRate ?? gstRate}%)
                            </span>
                          )}
                        </span>
                        <span className="font-semibold shrink-0">₹{(unitPrice * it.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-xs font-bold text-[#0f172a] pt-1 border-t border-[#f1f5f9]">
                    <span>Total Counter Price:</span>
                    <span>₹{(quote.counterOffer?.price || quote.proposedPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
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
          <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#f1f5f9] flex flex-col gap-2">
            {displayItems.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[4px] bg-[#e2e8f0] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={14} className="text-[#94a3b8]" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a] m-0 line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-[#64748b] m-0 flex items-center flex-wrap gap-1">
                      <span>{item.quantity} {item.unit || 'pcs'} × ₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      {item.hsnCode && <span className="text-[#94a3b8]">(HSN: {item.hsnCode})</span>}
                      {quote.gstType !== 'exempt' && (
                        <span className="text-[9px] font-bold text-[#0369a1] bg-[#e0f2fe] border border-[#bae6fd] px-1.5 py-0.2 rounded">
                          GST({item.gstRate ?? gstRate}%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-[#0f172a] shrink-0">
                  ₹{(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-[#475569]">
              <span>Taxable Amount</span>
              <span className="font-semibold">₹{taxableAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {quote.gstType && quote.gstType !== 'exempt' && gstAmt > 0 ? (
              quoteGstLines.map((ln, li) => (
                <div key={li} className="flex justify-between text-xs text-[#0369a1]">
                  <span>{ln.label}</span>
                  <span className="font-semibold">₹{inr2(ln.value)}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-xs text-[#94a3b8]"><span>GST</span><span>Exempt / Nil</span></div>
            )}
            {shipCost > 0 && (
              <div className="flex justify-between text-xs text-[#475569]">
                <span>Shipping {quote.shippingNotes ? `(${quote.shippingNotes})` : ''}</span>
                <span className="font-semibold">₹{shipCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            {quote.transportationTerms?.includes('Courier') && shipCost > 0 && (
              <div className="flex justify-between text-xs text-[#0369a1]">
                <span>Courier GST (18%)</span>
                <span className="font-semibold">₹{(Math.round((shipCost * 0.18) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-[#0f172a] pt-2 border-t border-[#f1f5f9]">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {quote.paymentTerms && (() => {
              const advMatch = quote.paymentTerms.match(/(\d+)%\s*Advance/i);
              const advPercent = advMatch ? parseInt(advMatch[1]) : null;
              const advAmount = advPercent !== null ? (Math.round((grandTotal * advPercent / 100) * 100) / 100) : null;
              return (
                <p className="text-[10px] text-[#94a3b8] m-0">
                  Payment: {quote.paymentTerms}
                  {advAmount !== null && advPercent !== 100 && (
                    <span className="ml-1 text-[#f97316] font-bold">
                      (Advance: ₹{advAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  )}
                  {advAmount !== null && advPercent === 100 && (
                    <span className="ml-1 text-[#f97316] font-bold">
                      (₹{advAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  )}
                </p>
              );
            })()}
            {quote.transportationTerms && <p className="text-[10px] text-[#94a3b8] m-0">Transport: {quote.transportationTerms}</p>}
            {quote.deliveryTimeline && <p className="text-[10px] text-[#94a3b8] m-0">Delivery: {quote.deliveryTimeline}</p>}
            {quote.terms && <p className="text-[10px] text-[#94a3b8] m-0">Terms: {quote.terms}</p>}
          </div>
        </>
      )}

      {msg.messageType !== 'buyer_counter_offer' && isLatestQuoteMsg && quote.status !== 'cancelled' && quote.counterOffer && (quote.counterOffer.price || quote.counterOffer.deliveryTimeline || quote.counterOffer.note || (quote.counterOffer.itemPrices && quote.counterOffer.itemPrices.length > 0)) && (() => {
        const counterAuthor = quote.counterOffer.counteredBy
          ? (quote.counterOffer.counteredBy === 'buyer' ? 'Buyer' : 'Supplier')
          : (quote.currentTurn === 'supplier' ? 'Buyer' : (quote.currentTurn === 'buyer' ? 'Supplier' : (quote.initiatedBy === 'buyer' ? 'Buyer' : 'Supplier')));

        return (
          <div className="mx-4 mb-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] px-3 py-2 text-xs text-[#1d4ed8]">
            <span className="font-bold block mb-1.5">Counter Offer from {counterAuthor}</span>
            {quote.items?.length > 1 ? (
              <div className="flex flex-col gap-1 my-1.5 border-y border-[#bfdbfe] py-1.5">
                {quote.items.map((it: any, idx: number) => {
                  const counterIt = quote.counterOffer?.itemPrices?.find((cip: any) =>
                    cip.productId?.toString() === it._id?.toString() ||
                    cip.productId?.toString() === it.productId?.toString()
                  );
                  const unitPrice = counterIt?.price ?? it.price;
                  return (
                    <div key={idx} className="flex justify-between text-xs text-[#1e40af]">
                      <span className="line-clamp-1 flex-1 pr-2">{it.name} ({it.quantity} {it.unit || 'pcs'})</span>
                      <span className="font-semibold shrink-0">₹{(unitPrice * it.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[#93c5fd] font-normal">(₹{unitPrice}/{it.unit || 'pcs'})</span></span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-xs font-bold text-[#1d4ed8] pt-1 border-t border-[#bfdbfe]">
                  <span>Total Counter Price:</span>
                  <span>₹{Number(quote.counterOffer.price || quote.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[#93c5fd] font-normal">(excl. GST &amp; shipping)</span></span>
                </div>
              </div>
            ) : quote.counterOffer.price ? (
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[#3b82f6]">Requested Price</span>
                <span className="font-bold">
                  ₹{quote.counterOffer.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {quote.items?.[0]?.quantity > 1 && (
                    <span className="text-[#93c5fd] font-normal ml-1">
                      (₹{(quote.counterOffer.price / quote.items[0].quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{quote.items[0].unit || 'pcs'})
                    </span>
                  )}
                  <span className="text-[#93c5fd] font-normal"> (excl. GST &amp; shipping)</span>
                </span>
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
        );
      })()}

      {/* Price Highlight / Final Offer Banner */}
      {effectivePriceTag === 'Last Price' && (
        <div className="mx-4 mb-3 p-2.5 rounded-[8px] bg-amber-50/90 border border-amber-200 flex items-start gap-2 shadow-xs">
          <span className="text-sm shrink-0 leading-none mt-0.5">🔒</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-amber-900 m-0">🏷️ Last Price Offered</p>
            <p className="text-[10px] text-amber-700 m-0 mt-0.5 leading-snug">
              This is the supplier's final price. Negotiation is closed—you can only accept or decline this offer.
            </p>
          </div>
        </div>
      )}
      {effectivePriceTag === 'Best Price' && (
        <div className="mx-4 mb-3 p-2.5 rounded-[8px] bg-amber-50/60 border border-amber-200/80 flex items-start gap-2 shadow-xs">
          <span className="text-sm shrink-0 leading-none mt-0.5">⚡</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-amber-900 m-0">Best Price Offered</p>
            <p className="text-[10px] text-amber-700 m-0 mt-0.5 leading-snug">
              The supplier has highlighted this as their best price. You can accept this offer or propose a counter-offer.
            </p>
          </div>
        </div>
      )}

      {/* Waiting for other party */}
      {isLatestQuoteMsg && quote.currentTurn !== (isSupplier ? 'supplier' : 'buyer') && (quote.status === 'negotiation_pending' || quote.status === 'supplier_accepted' || quote.status === 'counter_offer_sent') && (
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
      {isLatestQuoteMsg && quote.currentTurn === (isSupplier ? 'supplier' : 'buyer') && (quote.status === 'negotiation_pending' || quote.status === 'supplier_accepted' || quote.status === 'counter_offer_sent') && !showCounter && (
        <>
          <div className="flex gap-2 px-4 pb-3">
            <button className="flex-1 py-2 text-xs font-bold text-white bg-[#059669] rounded-[6px] border-none cursor-pointer hover:bg-[#047857]"
              onClick={() => isSupplier ? (onSupplierAction ? onSupplierAction(quote, true, msg) : null) : setConfirmAction('accept')}>Accept Deal</button>

            {quote.status !== 'supplier_accepted' && (
              <>
                {(!(!isSupplier && isFinalPrice)) && (
                  <button className="flex-1 py-2 text-xs font-bold text-[#2563eb] bg-[#eff6ff] rounded-[6px] border-none cursor-pointer hover:bg-[#dbeafe]"
                    onClick={() => isSupplier ? (onSupplierAction ? onSupplierAction(quote, false, msg) : null) : setShowCounter(true)}>Revise Terms</button>
                )}
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
      {isLatestQuoteMsg && quote.currentTurn === (isSupplier ? 'supplier' : 'buyer') && (quote.status === 'negotiation_pending' || quote.status === 'counter_offer_sent') && showCounter && !(!isSupplier && isFinalPrice) && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          <p className="text-[10px] font-bold text-[#475569] uppercase tracking-wide m-0">Counter Offer</p>
          <div className="flex flex-col gap-0.5">
            {isSingleItem ? (
              <>
                <label className="text-[10px] text-[#64748b] font-semibold">Your Counter Price per {unit}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={Math.ceil((actualRetailTotal / totalQty) * 0.5)}
                    max={actualRetailTotal / totalQty}
                    value={counterPrice || (Math.round(((actualRetailTotal / totalQty) * 0.9) * 100) / 100)}
                    onChange={e => setCounterPrice(e.target.value)}
                    className="flex-1 accent-[#2563eb] cursor-pointer h-1.5 bg-[#e2e8f0] rounded-lg appearance-none"
                  />
                  <div className="flex items-center border border-[#e2e8f0] rounded-[6px] bg-white focus-within:border-primary w-[90px] shrink-0">
                    <span className="px-1.5 py-1.5 text-xs text-[#94a3b8] border-r border-[#e2e8f0]">₹</span>
                    <input
                      type="number"
                      min={Math.ceil((actualRetailTotal / totalQty) * 0.5)}
                      max={actualRetailTotal / totalQty}
                      value={counterPrice}
                      onChange={e => setCounterPrice(e.target.value)}
                      placeholder={`${(Math.round(((actualRetailTotal / totalQty) * 0.9) * 100) / 100)}`}
                      className="w-full border-none outline-none px-1.5 py-1.5 text-xs bg-transparent"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                {quote.items?.map((item: any) => {
                  const maxPrice = Number(item.price);
                  const minPrice = Math.ceil(maxPrice * 0.5);
                  const currentVal = counterItemPrices[item._id] || (Math.round((maxPrice * 0.9) * 100) / 100);
                  return (
                    <div key={item._id} className="flex flex-col gap-1 border-b border-[#f1f5f9] pb-2 last:border-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[10px] font-bold text-[#475569] m-0 line-clamp-1">{item.name}</p>
                        {quote.gstType !== 'exempt' && (
                          <span className="text-[9px] font-bold text-[#0369a1] bg-[#e0f2fe] border border-[#bae6fd] px-1.5 py-0.2 rounded shrink-0">
                            GST({item.gstRate ?? quote.gstRate ?? 18}%)
                          </span>
                        )}
                      </div>
                      <label className="text-[10px] text-[#64748b] font-semibold">Counter Price per {item.unit || 'pcs'}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={minPrice}
                          max={maxPrice}
                          value={currentVal}
                          onChange={e => {
                            setCounterItemPrices(prev => ({ ...prev, [item._id]: Number(e.target.value) }));
                            // Automatically update the total counter price
                            const updatedPrices: Record<string, number> = { ...counterItemPrices, [item._id]: Number(e.target.value) };
                            const newTotal = quote.items.reduce((acc: number, it: any) => acc + (updatedPrices[it._id as string] || (Math.round((it.price * 0.9) * 100) / 100)) * it.quantity, 0);
                            setCounterPrice(newTotal.toString());
                          }}
                          className="flex-1 accent-[#2563eb] cursor-pointer h-1.5 bg-[#e2e8f0] rounded-lg appearance-none"
                        />
                        <div className="flex items-center border border-[#e2e8f0] rounded-[6px] bg-white focus-within:border-primary w-[90px] shrink-0">
                          <span className="px-1.5 py-1.5 text-xs text-[#94a3b8] border-r border-[#e2e8f0]">₹</span>
                          <input
                            type="number"
                            min={minPrice}
                            max={maxPrice}
                            value={currentVal}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setCounterItemPrices(prev => ({ ...prev, [item._id]: val }));
                              const updatedPrices: Record<string, number> = { ...counterItemPrices, [item._id]: val };
                              const newTotal = quote.items.reduce((acc: number, it: any) => acc + (updatedPrices[it._id as string] || (Math.round((it.price * 0.9) * 100) / 100)) * it.quantity, 0);
                              setCounterPrice(newTotal.toString());
                            }}
                            className="w-full border-none outline-none px-1.5 py-1.5 text-xs bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(() => {
              const cpNum = Number(counterPrice) || 0;
              const cpTotal = isSingleItem ? cpNum * totalQty : cpNum;

              if (!cpNum || cpNum <= 0) return null;

              const counterGstInputs = (quote.items || []).map((it: any) => {
                const itPrice = isSingleItem ? cpNum : (counterItemPrices[it._id] !== undefined ? counterItemPrices[it._id] : (Math.round((it.price * 0.9) * 100) / 100));
                return {
                  price: Number(itPrice) || 0,
                  quantity: Number(it.quantity) || 1,
                  gstRate: quote.gstType === 'exempt' ? 0 : (Number(it.gstRate) || Number(quote.gstRate) || 0),
                  gstIncluded: false,
                };
              });
              const counterBreak = buildGstBreakdown(counterGstInputs);
              const counterGstAmt = quote.gstType === 'exempt' ? 0 : counterBreak.totalGst;
              const counterGstLines = gstDisplayLines(quote.gstType, counterBreak.lines, quote.gstRate, counterGstAmt);
              const effectiveShipping = counterTransportationTerms === 'Third-Party Courier' ? (Number(counterShippingCost) || 0) : (counterTransportationTerms && counterTransportationTerms !== 'Third-Party Courier') ? 0 : shipCost;
              const effectiveCourierGst = (counterTransportationTerms === 'Third-Party Courier' || (!counterTransportationTerms && quote.transportationTerms?.includes('Courier'))) ? (Math.round((effectiveShipping * 0.18) * 100) / 100) : 0;
              const counterGrandTotal = cpTotal + counterGstAmt + effectiveShipping + effectiveCourierGst;

              return (
                <>
                  {cpTotal < actualRetailTotal * 0.5 && (
                    <p className="text-[10px] text-[#dc2626] m-0 mt-0.5">
                      Counter price cannot be less than 50% of the original price
                    </p>
                  )}
                  {cpTotal > actualRetailTotal && (
                    <p className="text-[10px] text-[#dc2626] m-0 mt-0.5">
                      Counter price cannot be higher than the original price
                    </p>
                  )}
                  <div className="mt-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] p-2 flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-[#64748b]">
                      <span>Total Amount (excl. GST)</span>
                      <span>₹{cpTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {quote.gstType !== 'exempt' && counterGstLines.map((ln, li) => (
                      <div key={li} className="flex justify-between text-[10px] text-[#0369a1]">
                        <span>{ln.label}</span>
                        <span>₹{inr2(ln.value)}</span>
                      </div>
                    ))}
                    {quote.gstType !== 'exempt' && counterGstLines.length > 1 && (
                      <div className="flex justify-between text-[10px] text-[#0369a1] font-bold border-t border-[#e2e8f0] pt-0.5">
                        <span>Total GST</span>
                        <span>₹{inr2(counterGstAmt)}</span>
                      </div>
                    )}
                    {effectiveShipping > 0 && (
                      <div className="flex justify-between text-[10px] text-[#64748b]">
                        <span>Shipping</span>
                        <span>₹{effectiveShipping.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {effectiveCourierGst > 0 && (
                      <div className="flex justify-between text-[10px] text-[#0369a1]">
                        <span>Courier GST (18%)</span>
                        <span>₹{effectiveCourierGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px] font-bold text-[#0f172a] pt-1 border-t border-[#e2e8f0]">
                      <span>Grand Total</span>
                      <span>₹{counterGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-[#64748b] font-semibold">Delivery Option (Optional)</label>
            <select
              value={counterTransportationTerms}
              onChange={e => {
                const val = e.target.value;
                setCounterTransportationTerms(val);
                setCounterReason('');
                if (val !== 'Third-Party Courier') {
                  setCounterCourierName('');
                  setCounterShippingCost('');
                }
              }}
              className="border border-[#e2e8f0] rounded-[6px] bg-white px-2 py-2 text-xs text-[#334155] focus:border-primary outline-none"
            >
              <option value="">No Change (Keep Original)</option>
              <option value="FOR">FOR (Supplier delivers - Free)</option>
              <option value="Ex. Factory">Ex. Factory (Buyer picks up)</option>
              <option value="Ex. Godown">Ex. Godown (Buyer picks up)</option>
              <option value="Third-Party Courier">Third-Party Courier</option>
            </select>
          </div>

          {counterTransportationTerms === 'Third-Party Courier' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-[#64748b] font-semibold">Courier Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. BlueDart"
                  value={counterCourierName}
                  onChange={e => setCounterCourierName(e.target.value)}
                  className="border border-[#e2e8f0] rounded-[6px] bg-white px-2 py-2 text-xs text-[#334155] focus:border-primary outline-none"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-[#64748b] font-semibold">Shipping Cost (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={counterShippingCost}
                  onChange={e => setCounterShippingCost(e.target.value)}
                  className="border border-[#e2e8f0] rounded-[6px] bg-white px-2 py-2 text-xs text-[#334155] focus:border-primary outline-none"
                />
              </div>
              {Number(counterShippingCost) > 0 && (
                <div className="col-span-2 bg-[#f0f9ff] border border-[#bae6fd] rounded-[6px] px-2 py-1.5 text-[10px] text-[#0369a1]">
                  Courier GST (18%): ₹{(Math.round((Number(counterShippingCost) * 0.18) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • Total Shipping: ₹{(Math.round((Number(counterShippingCost) * 1.18) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          )}

          {counterTransportationTerms && (
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-[#64748b] font-semibold">Reason (Optional)</label>
              <select
                value={counterReason}
                onChange={e => setCounterReason(e.target.value)}
                className="border border-[#e2e8f0] rounded-[6px] bg-white px-2 py-2 text-xs text-[#334155] focus:border-primary outline-none"
              >
                <option value="">Select a reason...</option>
                {user?.role === 'supplier' ? (
                  counterTransportationTerms === 'Third-Party Courier' ? (
                    <>
                      <option value="FOR delivery not available for your location">FOR delivery not available for your location</option>
                      <option value="Courier provides better tracking & safety">Courier provides better tracking & safety</option>
                      <option value="Faster delivery via third-party courier">Faster delivery via third-party courier</option>
                    </>
                  ) : counterTransportationTerms === 'FOR' ? (
                    <>
                      <option value="We can deliver directly at no extra cost">We can deliver directly at no extra cost</option>
                      <option value="Free delivery available for your area">Free delivery available for your area</option>
                    </>
                  ) : (
                    <>
                      <option value="FOR not available — your location is out of range">FOR not available — your location is out of range</option>
                      <option value="This option is more cost-effective for you">This option is more cost-effective for you</option>
                    </>
                  )
                ) : (
                  counterTransportationTerms === 'Third-Party Courier' ? (
                    <>
                      <option value="We need tracked & insured delivery">We need tracked & insured delivery</option>
                      <option value="Prefer courier for faster shipping">Prefer courier for faster shipping</option>
                    </>
                  ) : counterTransportationTerms === 'FOR' ? (
                    <>
                      <option value="We prefer delivery to our location">We prefer delivery to our location</option>
                      <option value="More convenient for our warehouse">More convenient for our warehouse</option>
                    </>
                  ) : (
                    <>
                      <option value="We have our own transport arrangement">We have our own transport arrangement</option>
                      <option value="Trying to reduce overall shipping costs">Trying to reduce overall shipping costs</option>
                    </>
                  )
                )}
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {isSupplier && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#64748b] font-semibold">Price Highlight (Optional)</label>
              <div className="flex gap-2">
                {(['', 'Best Price', 'Last Price'] as const).map(t => (
                  <button
                    key={t || 'none'}
                    type="button"
                    className={`flex-1 py-1.5 text-xs font-bold rounded-[6px] border cursor-pointer transition-colors ${counterPriceTag === t ? 'bg-primary text-white border-primary' : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary'
                      }`}
                    onClick={() => setCounterPriceTag(t)}
                  >
                    {t || 'None'}
                  </button>
                ))}
              </div>
              {counterPriceTag === 'Last Price' && (
                <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-[5px] p-1.5 mt-1 m-0 flex items-start gap-1">
                  <span>🔒</span>
                  <span><strong>Final Offer:</strong> Selecting <strong>Last Price</strong> closes further negotiations. Buyer can only accept or decline.</span>
                </p>
              )}
              {counterPriceTag === 'Best Price' && (
                <p className="text-[10px] text-amber-800 bg-amber-50/60 border border-amber-200/70 rounded-[5px] p-1.5 mt-1 m-0 flex items-start gap-1">
                  <span>⚡</span>
                  <span><strong>Highlight:</strong> Displays a <strong>Best Price</strong> badge to the buyer while keeping negotiations open.</span>
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => { setShowCounter(false); setCounterPrice(''); }}
              className="flex-1 py-2 text-xs font-bold text-[#64748b] bg-[#f8fafc] rounded-[6px] border border-[#e2e8f0] cursor-pointer"
            >Cancel</button>
            <button
              onClick={submitCounter}
              disabled={counterSubmitting || !counterPrice || (isSingleItem ? Number(counterPrice) * totalQty : Number(counterPrice)) < actualRetailTotal * 0.5 || (isSingleItem ? Number(counterPrice) * totalQty : Number(counterPrice)) > actualRetailTotal}
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

      {quote.status === 'cancelled' && (() => {
        let label = 'Superseded by new quotation';
        if (quote.cancellationReason === 'Superseded by new quotation') {
          label = 'Superseded by new quotation';
        } else if (quote.cancellationReason && /counter|sugg/i.test(quote.cancellationReason)) {
          label = `Superseded due to ${quote.cancellationReason}`;
        } else if (quote.cancelledBy === 'system') {
          label = 'Superseded by new quotation';
        } else if (quote.cancelledBy) {
          label = `Cancelled by ${quote.cancelledBy === 'supplier' ? 'Supplier' : 'Buyer'}`;
        }

        return (
          <div className="mx-4 mb-3 bg-[#fef2f2] border border-[#fecaca] rounded-[8px] px-3 py-2.5">
            <p className="text-xs font-bold text-[#dc2626] m-0">
              {label}
            </p>
            {quote.cancellationReason && quote.cancellationReason !== 'Superseded by new quotation' && !label.includes(quote.cancellationReason) && (
              <p className="text-[11px] text-[#7f1d1d] m-0 mt-1 leading-relaxed">
                Reason: {quote.cancellationReason}
              </p>
            )}
          </div>
        );
      })()}

      {!isLatestQuoteMsg && quote.status !== 'cancelled' && quote.status !== 'ordered' && (
        <div className="mx-4 mb-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2">
          <p className="text-xs font-semibold text-[#64748b] m-0">
            {quote.counterOffer?.counteredBy === 'buyer' || quote.status === 'counter_offer_sent'
              ? 'Superseded due to new counter offer from buyer'
              : 'Superseded by new quotation'}
          </p>
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

// ── Quotation Revision / Counter Offer Card ─────────────────────────────────
interface QuotationRevisionCardProps {
  msg: any;
  messages: any[];
  isMine: boolean;
  user: any;
  activeConv: any;
  isNegotiationDead: boolean;
  handleOpenQuotationAction: (quote: any, isAccept: boolean, targetMsg?: any) => void;
  loadMessages: () => void;
}

const QuotationRevisionCard: React.FC<QuotationRevisionCardProps> = ({
  msg,
  messages,
  isMine,
  user,
  activeConv,
  isNegotiationDead,
  handleOpenQuotationAction,
  loadMessages,
}) => {
  const isSupplier = user?.role === 'supplier';

  // 1. Resolve quote
  const targetQuoteId = typeof msg.quotationId === 'object'
    ? (msg.quotationId as any)?._id?.toString()
    : msg.quotationId?.toString();
  const quoteMsg = messages.slice().reverse().find(m => {
    const qId = typeof m.quotationId === 'object' ? (m.quotationId as any)?._id?.toString() : m.quotationId?.toString();
    return (m.messageType === 'quotation' || m.messageType === 'quotation_revision') && qId && targetQuoteId && qId === targetQuoteId;
  });
  const quote = (quoteMsg && typeof quoteMsg.quotationId === 'object')
    ? (quoteMsg.quotationId as any)
    : (typeof msg.quotationId === 'object' ? msg.quotationId : null);

  const effectivePriceTag = quote?.priceTag || msg.metadata?.priceTag || '';
  const isFinalPrice = effectivePriceTag === 'Last Price';

  // 2. Determine author
  const counteredBy = msg.metadata?.counteredBy || (isMine ? (isSupplier ? 'supplier' : 'buyer') : (isSupplier ? 'buyer' : 'supplier'));
  const authorTitle = isMine ? 'You' : (counteredBy === 'buyer' ? 'Buyer' : 'Supplier');

  // 3. Parse items & price differences
  interface ItemDiff {
    name: string;
    quantity: number;
    unit: string;
    oldPrice: number;
    newPrice: number;
    oldTotal: number;
    newTotal: number;
    priceDiff: number;
    percentDiff: number;
    totalDiff: number;
    isDecrease: boolean;
    isIncrease: boolean;
  }

  const items: ItemDiff[] = [];

  // Match single item from text: "• Price: ₹225 x 2 = ₹450 ➡️ ₹220 x 2 = ₹440" or "• Price: ₹225 ➡️ ₹220"
  const singleMatch = msg.text?.match(/•\s*Price:\s*₹([0-9,.]+)(?:\s*[x×]\s*(\d+))?(?:\s*=\s*₹([0-9,.]+))?\s*➡️\s*₹([0-9,.]+)(?:\s*[x×]\s*(\d+))?(?:\s*=\s*₹([0-9,.]+))?/i);

  if (singleMatch) {
    const oldPrice = Number(singleMatch[1].replace(/,/g, ''));
    const newPrice = Number(singleMatch[4].replace(/,/g, ''));
    const qty = Number(singleMatch[2] || singleMatch[5] || msg.metadata?.items?.[0]?.quantity || quote?.items?.[0]?.quantity || 1);
    const oldTotal = singleMatch[3] ? Number(singleMatch[3].replace(/,/g, '')) : (oldPrice * qty);
    const newTotal = singleMatch[6] ? Number(singleMatch[6].replace(/,/g, '')) : (newPrice * qty);
    const name = msg.metadata?.items?.[0]?.name || quote?.items?.[0]?.name || activeConv?.productId?.name || 'Product';
    const unit = msg.metadata?.items?.[0]?.unit || quote?.items?.[0]?.unit || 'pcs';
    const priceDiff = newPrice - oldPrice;
    const percentDiff = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
    const totalDiff = newTotal - oldTotal;
    items.push({
      name,
      quantity: qty,
      unit,
      oldPrice,
      newPrice,
      oldTotal,
      newTotal,
      priceDiff,
      percentDiff,
      totalDiff,
      isDecrease: priceDiff < -0.01,
      isIncrease: priceDiff > 0.01,
    });
  } else {
    // Check for multi-item breakdown: "- Smart Watch: ₹225 ➡️ ₹220 (x2)"
    const multiMatches = [...(msg.text?.matchAll(/-\s*([^:]+):\s*₹([0-9,.]+)\s*➡️\s*₹([0-9,.]+)(?:\s*\([x×](\d+)\))?/gi) || [])];
    if (multiMatches.length > 0) {
      multiMatches.forEach((m: any) => {
        const name = m[1].trim();
        const oldPrice = Number(m[2].replace(/,/g, ''));
        const newPrice = Number(m[3].replace(/,/g, ''));
        const qty = m[4] ? Number(m[4]) : 1;
        const oldTotal = oldPrice * qty;
        const newTotal = newPrice * qty;
        const priceDiff = newPrice - oldPrice;
        const percentDiff = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
        const totalDiff = newTotal - oldTotal;
        const metaItem = msg.metadata?.items?.find((it: any) => it.name?.toLowerCase().trim() === name.toLowerCase());
        const unit = metaItem?.unit || 'pcs';
        items.push({
          name,
          quantity: qty,
          unit,
          oldPrice,
          newPrice,
          oldTotal,
          newTotal,
          priceDiff,
          percentDiff,
          totalDiff,
          isDecrease: priceDiff < -0.01,
          isIncrease: priceDiff > 0.01,
        });
      });
    } else if (msg.metadata?.items && msg.metadata.items.length > 0) {
      // Fallback to metadata items compared with quote items
      msg.metadata.items.forEach((it: any) => {
        const quoteItem = quote?.items?.find((qi: any) =>
          (qi.productId && it.productId && qi.productId.toString() === it.productId.toString()) ||
          (qi._id && it.productId && qi._id.toString() === it.productId.toString()) ||
          (qi.name?.toLowerCase().trim() === it.name?.toLowerCase().trim())
        );
        const oldPrice = quoteItem?.price !== undefined ? Number(quoteItem.price) : Number(it.price);
        const newPrice = Number(it.price);
        const qty = Number(it.quantity) || 1;
        const oldTotal = oldPrice * qty;
        const newTotal = newPrice * qty;
        const priceDiff = newPrice - oldPrice;
        const percentDiff = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
        const totalDiff = newTotal - oldTotal;
        items.push({
          name: it.name,
          quantity: qty,
          unit: it.unit || 'pcs',
          oldPrice,
          newPrice,
          oldTotal,
          newTotal,
          priceDiff,
          percentDiff,
          totalDiff,
          isDecrease: priceDiff < -0.01,
          isIncrease: priceDiff > 0.01,
        });
      });
    }
  }

  // Totals across items
  const totalOld = items.reduce((s, it) => s + it.oldTotal, 0);
  const totalNew = items.reduce((s, it) => s + it.newTotal, 0);
  const overallDiff = totalNew - totalOld;
  const isOverallDecrease = overallDiff < -0.01;
  const isOverallIncrease = overallDiff > 0.01;

  // 4. Parse delivery option, timeline, and other terms ONLY IF THEY CHANGED
  interface TermChange {
    label: string;
    oldVal?: string;
    newVal: string;
    icon: 'timeline' | 'delivery' | 'payment' | 'shipping';
  }
  const terms: TermChange[] = [];

  // Delivery Option (Transportation Terms)
  if (msg.metadata?.changedTerms?.transportationTerms) {
    const ch = msg.metadata.changedTerms.transportationTerms;
    terms.push({
      label: 'Delivery Option',
      oldVal: ch.from && ch.from !== 'None' ? ch.from : undefined,
      newVal: ch.to,
      icon: 'delivery'
    });
  } else {
    // Strictly require arrow '➡️' in text to indicate a real change
    const ttMatch = msg.text?.match(/•\s*(?:Delivery|Transportation|Delivery\s*Option):\s*([^➡️\n]+)\s*➡️\s*([^\n]+)/i);
    if (ttMatch) {
      const rawOld = ttMatch[1]?.trim();
      const rawNew = ttMatch[2]?.trim();
      if (rawNew && rawNew !== rawOld) {
        terms.push({
          label: 'Delivery Option',
          oldVal: rawOld && rawOld !== 'None' ? rawOld : undefined,
          newVal: rawNew,
          icon: 'delivery'
        });
      }
    }
  }

  // Delivery Timeline / Date
  if (msg.metadata?.changedTerms?.deliveryTimeline) {
    const ch = msg.metadata.changedTerms.deliveryTimeline;
    terms.push({
      label: 'Delivery Timeline / Date',
      oldVal: ch.from && ch.from !== 'None' ? ch.from : undefined,
      newVal: ch.to,
      icon: 'timeline'
    });
  } else {
    // Strictly require arrow '➡️' in text to indicate a real change
    const dtMatch = msg.text?.match(/•\s*(?:Timeline|Delivery\s*Timeline|Delivery\s*Date|Timeline\s*\/\s*Date):\s*([^➡️\n]+)\s*➡️\s*([^\n]+)/i);
    if (dtMatch) {
      const rawOld = dtMatch[1]?.trim();
      const rawNew = dtMatch[2]?.trim();
      if (rawNew && rawNew !== rawOld) {
        terms.push({
          label: 'Delivery Timeline / Date',
          oldVal: rawOld && rawOld !== 'None' ? rawOld : undefined,
          newVal: rawNew,
          icon: 'timeline'
        });
      }
    }
  }

  // Payment Terms
  if (msg.metadata?.changedTerms?.paymentTerms) {
    const ch = msg.metadata.changedTerms.paymentTerms;
    terms.push({
      label: 'Payment Terms',
      oldVal: ch.from && ch.from !== 'None' ? ch.from : undefined,
      newVal: ch.to,
      icon: 'payment'
    });
  } else {
    const ptMatch = msg.text?.match(/•\s*Payment\s*Terms:\s*([^➡️\n]+)\s*➡️\s*([^\n]+)/i);
    if (ptMatch) {
      const rawOld = ptMatch[1]?.trim();
      const rawNew = ptMatch[2]?.trim();
      if (rawNew && rawNew !== rawOld) {
        terms.push({
          label: 'Payment Terms',
          oldVal: rawOld && rawOld !== 'None' ? rawOld : undefined,
          newVal: rawNew,
          icon: 'payment'
        });
      }
    }
  }

  // Shipping Cost
  if (msg.metadata?.changedTerms?.shippingCost) {
    const ch = msg.metadata.changedTerms.shippingCost;
    terms.push({
      label: 'Shipping Cost',
      oldVal: ch.from !== undefined ? `₹${Number(ch.from).toLocaleString('en-IN')}` : undefined,
      newVal: `₹${Number(ch.to).toLocaleString('en-IN')}`,
      icon: 'shipping'
    });
  } else {
    const scMatch = msg.text?.match(/•\s*Shipping\s*Cost:\s*₹?([0-9,.]+)\s*➡️\s*₹([0-9,.]+)/i);
    if (scMatch) {
      terms.push({
        label: 'Shipping Cost',
        oldVal: scMatch[1] ? `₹${scMatch[1].trim()}` : undefined,
        newVal: `₹${scMatch[2].trim()}`,
        icon: 'shipping'
      });
    }
  }

  const reasonMatch = msg.text?.match(/↳\s*Reason:\s*([^\n]+)/i);
  const reason = reasonMatch ? reasonMatch[1].trim() : (msg.metadata?.reason || '');

  // 5. Actions visibility
  const msgIdx = messages.findIndex(m => m._id === msg._id);
  const isLatestRevision = msgIdx !== -1 && !messages.slice(msgIdx + 1).some(m => m.messageType === 'quotation' || m.messageType === 'quotation_revision' || m.messageType === 'buyer_counter_offer');
  const showActions = !isMine && isSupplier && isLatestRevision && !isNegotiationDead;

  return (
    <div className={`max-w-[88%] sm:max-w-[390px] w-full rounded-[10px] shadow-xs border bg-white border-[#e2e8f0] p-3 text-xs text-[#0f172a] ${isMine ? 'rounded-br-[2px]' : 'rounded-bl-[2px]'}`}>
      {/* Simple Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#f1f5f9]">
        <div className="flex items-center gap-1.5 font-bold text-[#0f172a] text-xs">
          <span>{isOverallDecrease ? '📉' : isOverallIncrease ? '📈' : '🤝'}</span>
          <span>{isMine ? 'You requested changes:' : `${authorTitle} requested changes:`}</span>
        </div>
        {items.length > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isOverallDecrease ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isOverallIncrease ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
            {isOverallDecrease ? `↓ ₹${Math.abs(overallDiff).toLocaleString('en-IN')} Off` : isOverallIncrease ? `↑ +₹${Math.abs(overallDiff).toLocaleString('en-IN')}` : 'Terms'}
          </span>
        )}
      </div>

      {/* Pricing: 1 or 2 lines for single item */}
      {items.length === 1 ? (
        (() => {
          const item = items[0];
          return (
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] p-2 flex flex-col gap-1 mb-2">
              <div className="flex items-center justify-between font-semibold text-[#0f172a]">
                <span className="truncate mr-2 font-bold">• {item.name}</span>
                <span className="text-[11px] text-[#64748b] shrink-0 font-normal">Qty: {item.quantity} {item.unit}</span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-1 text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="text-[#64748b]">Price:</span>
                  <span className="line-through text-[#94a3b8]">₹{item.oldPrice.toLocaleString('en-IN')}</span>
                  <span className="text-[#64748b]">➡️</span>
                  <span className={`font-bold ${item.isDecrease ? 'text-emerald-700' : item.isIncrease ? 'text-amber-800' : 'text-[#0f172a]'}`}>
                    ₹{item.newPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[#64748b]">/ {item.unit}</span>
                  <span className="text-[#64748b] font-medium">• Total: ₹{item.newTotal.toLocaleString('en-IN')}</span>
                </div>
                {item.isDecrease && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                    Save ₹{Math.abs(item.totalDiff).toLocaleString('en-IN')} (↓ ₹{Math.abs(item.priceDiff)})
                  </span>
                )}
                {item.isIncrease && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                    +₹{item.totalDiff.toLocaleString('en-IN')} (↑ ₹{item.priceDiff})
                  </span>
                )}
              </div>
            </div>
          );
        })()
      ) : items.length > 1 ? (
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] p-2 flex flex-col gap-1.5 mb-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex flex-col text-[11px] border-b border-[#e2e8f0]/60 last:border-b-0 pb-1 last:pb-0">
              <div className="flex items-center justify-between font-semibold text-[#0f172a]">
                <span className="truncate mr-2 font-bold">• {it.name}</span>
                <span className="text-[10px] text-[#64748b] shrink-0 font-normal">× {it.quantity} {it.unit}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex items-center gap-1 text-[#64748b]">
                  <span className="line-through text-[#94a3b8]">₹{it.oldPrice.toLocaleString('en-IN')}</span>
                  <span>➡️</span>
                  <span className={`font-bold ${it.isDecrease ? 'text-emerald-700' : it.isIncrease ? 'text-amber-800' : 'text-[#0f172a]'}`}>
                    ₹{it.newPrice.toLocaleString('en-IN')}
                  </span>
                  <span>= ₹{it.newTotal.toLocaleString('en-IN')}</span>
                </div>
                {it.isDecrease && <span className="text-[10px] font-bold text-emerald-700">↓ ₹{Math.abs(it.priceDiff)}</span>}
                {it.isIncrease && <span className="text-[10px] font-bold text-amber-800">↑ ₹{it.priceDiff}</span>}
              </div>
            </div>
          ))}

          {/* Subtotal line */}
          <div className="flex items-center justify-between pt-1 border-t border-[#cbd5e1] text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="text-[#64748b] font-medium">Subtotal:</span>
              <span className="line-through text-[#94a3b8] font-normal">₹{totalOld.toLocaleString('en-IN')}</span>
              <span>➡️</span>
              <span className="text-[#0f172a]">₹{totalNew.toLocaleString('en-IN')}</span>
            </div>
            {isOverallDecrease && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                Save ₹{Math.abs(overallDiff).toLocaleString('en-IN')}
              </span>
            )}
            {isOverallIncrease && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                +₹{overallDiff.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-[#334155] whitespace-pre-wrap leading-relaxed mb-2">
          {msg.text}
        </div>
      )}

      {/* Delivery and Requested Terms changes */}
      {terms.length > 0 && (
        <div className="flex flex-col gap-1 py-1.5 border-t border-[#f1f5f9] text-[11px]">
          {terms.map((t, idx) => (
            <div key={idx} className="flex items-center justify-between text-[#334155]">
              <span className="text-[#64748b] font-medium flex items-center gap-1">
                <span>{t.icon === 'delivery' ? '🚚 Delivery Option:' : t.icon === 'timeline' ? '📅 Delivery Timeline / Date:' : t.icon === 'payment' ? '💳 Payment Terms:' : '📦 Shipping Cost:'}</span>
              </span>
              <span className="font-semibold text-right">
                {t.oldVal && <span className="line-through text-[#94a3b8] font-normal mr-1">{t.oldVal} ➡️</span>}
                <span className="text-[#0f172a]">{t.newVal}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Note / Reason if any */}
      {reason && (
        <div className="mt-1 bg-amber-50/70 border border-amber-200/50 rounded-[6px] px-2 py-1 text-[11px] text-amber-900 flex items-start gap-1">
          <span className="font-bold shrink-0">💬 Note:</span>
          <span className="italic">{reason}</span>
        </div>
      )}

      {/* Action Buttons for Supplier */}
      {showActions && (
        <div className="mt-2.5 pt-2 border-t border-[#e2e8f0] flex flex-col gap-2">
          {isFinalPrice && (
            <div className="p-1.5 rounded-[6px] bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold flex items-center gap-1">
              <span>🔒</span>
              <span>🏷️ Last Price offered. Further negotiation is closed.</span>
            </div>
          )}
          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Your Action</span>
          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-white bg-green-600 rounded-[6px] cursor-pointer hover:bg-green-700 transition-colors"
              onClick={() => handleOpenQuotationAction(quote, true, msg)}
            >
              <Check size={13} /> Accept Deal
            </button>
            {(!(!isSupplier && isFinalPrice)) && (
              <button
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-[#2563eb] bg-[#eff6ff] rounded-[6px] border border-[#bfdbfe] cursor-pointer hover:bg-[#dbeafe] transition-colors"
                onClick={() => handleOpenQuotationAction(quote, false, msg)}
              >
                <FileText size={13} /> Negotiate
              </button>
            )}
            <button
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-[#dc2626] bg-[#fef2f2] rounded-[6px] border border-[#fecaca] cursor-pointer hover:bg-[#fee2e2] transition-colors"
              onClick={async () => {
                const qId = quote?._id || targetQuoteId;
                if (!qId) return;
                try {
                  await quotationApi.rejectQuotation(qId);
                  toast.success('Quotation rejected');
                  loadMessages();
                } catch (err) {
                  toast.error('Failed to reject quotation');
                }
              }}
            >
              <X size={13} /> Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatInbox: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);
  const [searchParams] = useSearchParams();
  const targetConvId = searchParams.get('conversationId') || searchParams.get('convId');

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
    paymentType: 'Advance',
    advancePercent: 100,
    creditDays: 7,
    paymentTerms: '100% Advance',
    transportationTerms: '',
    cartItems: [] as Array<{ productId: string, name: string, quantity: number, price: number, unit?: string, hsnCode?: string, gstRate?: number }>,
  });

  useEffect(() => {
    if (activeConv?.productId?.gstRate !== undefined) {
      setQuoteForm(prev => ({ ...prev, gstRate: activeConv.productId.gstRate }));
    }
  }, [activeConv?.productId?.gstRate]);

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

  const [showSupplierRejectModal, setShowSupplierRejectModal] = useState(false);
  const [supplierRejectReason, setSupplierRejectReason] = useState('');
  const [supplierRejectTargetMsg, setSupplierRejectTargetMsg] = useState<any>(null);

  const [showTransportReasonModal, setShowTransportReasonModal] = useState(false);
  const [pendingTransportValue, setPendingTransportValue] = useState('');
  const [transportChangeReason, setTransportChangeReason] = useState('');

  const [showWalletCommissionModal, setShowWalletCommissionModal] = useState(false);
  const [commissionPreview, setCommissionPreview] = useState<any>(null);
  const [isConfirmingPO, setIsConfirmingPO] = useState(false);
  const [walletCommissionTargetMsg, setWalletCommissionTargetMsg] = useState<any>(null);

  const heldToastIdRef = useRef<string | null>(null);

  const handleOpenQuotationAction = (quote: any, isAccept: boolean, targetMsg?: any) => {
    // 1. Resolve effective target quote & message
    const targetQuoteId = quote?._id ||
      (typeof targetMsg?.quotationId === 'object' ? (targetMsg?.quotationId as any)?._id?.toString() : targetMsg?.quotationId?.toString());

    const effMsg = targetMsg?.metadata?.items
      ? targetMsg
      : messages.slice().reverse().find(m =>
        (m.messageType === 'quotation_revision' || m.messageType === 'buyer_counter_offer') &&
        ((typeof m.quotationId === 'object' ? (m.quotationId as any)?._id?.toString() : m.quotationId?.toString()) === targetQuoteId)
      ) || targetMsg;

    const effQuote = (quote && typeof quote === 'object' && quote._id)
      ? quote
      : (typeof targetMsg?.quotationId === 'object' ? targetMsg.quotationId : null);

    setQuoteForm(prev => {
      // 2. Base items from quote or revision message or previous cart items or initial enquiry
      const rawItems: any[] = (effQuote?.items && effQuote.items.length > 0)
        ? effQuote.items
        : (effMsg?.metadata?.items && effMsg.metadata.items.length > 0)
          ? effMsg.metadata.items
          : (prev.cartItems && prev.cartItems.length > 0)
            ? prev.cartItems
            : (activeConv?.initialEnquiry?.cartItems && activeConv.initialEnquiry.cartItems.length > 0)
              ? activeConv.initialEnquiry.cartItems
              : [];

      // Helper to retrieve counter price for a specific item
      const getCounterItemPrice = (it: any, index: number): number | undefined => {
        // Priority A: target revision message metadata.items
        if (effMsg?.metadata?.items && effMsg.metadata.items.length > 0) {
          const matchMsgItem = effMsg.metadata.items.find((mi: any, miIdx: number) => {
            const itPid = it.productId?.toString() || it._id?.toString();
            const miPid = mi.productId?.toString() || mi._id?.toString();
            if (itPid && miPid && itPid === miPid) return true;
            if (mi.name && it.name && mi.name.toLowerCase().trim() === it.name.toLowerCase().trim()) return true;
            return miIdx === index && effMsg.metadata.items.length === rawItems.length;
          });
          if (matchMsgItem?.price !== undefined) return Number(matchMsgItem.price);
        }

        // Priority B: quote.counterOffer.itemPrices
        if (effQuote?.counterOffer?.itemPrices && effQuote.counterOffer.itemPrices.length > 0) {
          const matchCip = effQuote.counterOffer.itemPrices.find((cip: any, cipIdx: number) => {
            const itPid = it.productId?.toString() || it._id?.toString();
            const cipPid = cip.productId?.toString();
            if (itPid && cipPid && itPid === cipPid) return true;
            return cipIdx === index && effQuote.counterOffer.itemPrices.length === rawItems.length;
          });
          if (matchCip?.price !== undefined) return Number(matchCip.price);
        }

        // Priority C: single item overall counter price / quantity
        if (rawItems.length <= 1) {
          const singleTotal = effMsg?.metadata?.price !== undefined
            ? effMsg.metadata.price
            : (effMsg?.metadata?.taxableAmount !== undefined
              ? effMsg.metadata.taxableAmount
              : effQuote?.counterOffer?.price);
          if (singleTotal !== undefined && singleTotal !== null) {
            const q = Number(it.quantity) || Number(effMsg?.metadata?.items?.[0]?.quantity) || Number(effQuote?.items?.[0]?.quantity) || 1;
            return Number(singleTotal) / q;
          }
        }

        return undefined;
      };

      const isCartOrder = prev.cartItems.length > 0 || rawItems.length > 1 || (activeConv?.initialEnquiry?.cartItems && activeConv.initialEnquiry.cartItems.length > 0);

      const resolvedCartItems = rawItems.map((it: any, idx: number) => {
        const counterPrice = getCounterItemPrice(it, idx);
        const price = counterPrice !== undefined
          ? counterPrice
          : (it.price !== undefined ? Number(it.price) : (activeConv?.productId?.basePrice || 0));

        return {
          productId: (it.productId || it._id || activeConv?.productId?._id)?.toString(),
          name: it.name || activeConv?.productId?.name || 'Item',
          quantity: Number(it.quantity) || 1,
          price,
          unit: it.unit || 'pcs',
          hsnCode: it.hsnCode || '—',
          image: it.image || it.imageUrl || activeConv?.productId?.images?.[0],
          gstRate: it.gstRate ?? activeConv?.productId?.gstRate,
        };
      });

      const firstItem = rawItems[0] || {};
      const singleCounterPrice = getCounterItemPrice(firstItem, 0);
      const quantity = Number(firstItem.quantity) || Number(effMsg?.metadata?.items?.[0]?.quantity) || prev.quantity || 1;
      const unitPrice = singleCounterPrice !== undefined
        ? singleCounterPrice
        : (firstItem.price !== undefined
          ? Number(firstItem.price)
          : (effQuote?.proposedPrice ? Number(effQuote.proposedPrice) / quantity : prev.price));

      const deliveryTimeline = effMsg?.metadata?.deliveryTimeline ||
        effQuote?.counterOffer?.deliveryTimeline ||
        activeConv?.initialEnquiry?.deliveryTimeline ||
        effQuote?.deliveryTimePreference ||
        prev.deliveryTimeline;

      const rawPay = effMsg?.metadata?.paymentTerms || effQuote?.counterOffer?.paymentTerms || effQuote?.paymentTerms || prev.paymentTerms;
      const parsedPay = parsePaymentTerms(rawPay);

      const transportationTerms = effMsg?.metadata?.transportationTerms || effQuote?.counterOffer?.transportationTerms || effQuote?.transportationTerms || prev.transportationTerms;

      const shipping = (effMsg?.metadata?.shippingCost !== undefined)
        ? Number(effMsg.metadata.shippingCost)
        : (effQuote?.shippingCost !== undefined ? Number(effQuote.shippingCost) : prev.shipping);

      const priceTag = effQuote?.priceTag || effMsg?.metadata?.priceTag || (prev.priceTag as any) || '';

      return {
        ...prev,
        itemName: firstItem.name || prev.itemName,
        hsnCode: firstItem.hsnCode || prev.hsnCode,
        price: unitPrice,
        quantity: quantity,
        cartItems: isCartOrder ? resolvedCartItems : [],
        deliveryTimeline,
        paymentTerms: parsedPay.paymentTerms,
        paymentType: parsedPay.paymentType,
        advancePercent: parsedPay.advancePercent,
        creditDays: parsedPay.creditDays,
        transportationTerms,
        shipping,
        priceTag
      };
    });
    setIsAcceptingBuyerPrice(isAccept);
    setEditingQuoteId(targetQuoteId || null);
    setIsQuoteModalOpen(true);
    setQuoteFormErrors({});
  };

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
  // Per-rate GST: each item uses its own slab when known, else the rate chosen on the
  // form. For a single-rate quote this equals the previous single-rate calculation.
  const computedGstItems = quoteForm.cartItems.length > 0
    ? quoteForm.cartItems.map(it => ({ price: Number(it.price) || 0, quantity: Number(it.quantity) || 0, gstRate: quoteForm.gstType === 'exempt' ? 0 : ((it as any).gstRate ?? quoteForm.gstRate), gstIncluded: false }))
    : [{ price: quoteForm.price, quantity: quoteForm.quantity, gstRate: quoteForm.gstType === 'exempt' ? 0 : quoteForm.gstRate, gstIncluded: false }];
  const computedGstBreak = buildGstBreakdown(computedGstItems);
  const computedGstAmount = quoteForm.gstType === 'exempt' ? 0 : computedGstBreak.totalGst;
  const computedCourierGst = (quoteForm.transportationTerms === 'Third-Party Courier' && quoteForm.shipping > 0) ? (Math.round((quoteForm.shipping * 0.18) * 100) / 100) : 0;
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
    const handleOrderUpdate = () => {
      loadConversations();
      loadMessages();
    };
    socket.on('new_notification', handleNotification);
    socket.on('order_update', handleOrderUpdate);
    return () => {
      socket.off('new_notification', handleNotification);
      socket.off('order_update', handleOrderUpdate);
    };
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

  useEffect(() => {
    if (targetConvId && conversations.length > 0) {
      const match = conversations.find(c => c._id === targetConvId);
      if (match && activeConv?._id !== match._id) {
        handleSelectConv(match);
      }
    }
  }, [targetConvId, conversations]);

  const handleSelectConv = (conv: any) => {
    setActiveConv(conv);
    // Clear the unread dot/badge for this conversation immediately
    const uid = user?._id || user?.id;
    setConversations(prev => prev.map(c =>
      c._id === conv._id ? { ...c, unreadCount: { ...(c.unreadCount || {}), [uid]: 0, [user?.id]: 0 } } : c
    ));
    socket?.emit('mark_read', conv._id);
    const quantity = conv.initialEnquiry?.quantity || 1;
    const parsedPay = parsePaymentTerms(conv.initialEnquiry?.paymentTerms);
    setQuoteForm(prev => ({
      ...prev,
      itemName: conv.productId?.name || '',
      hsnCode: conv.productId?.hsnCode || '',
      quantity: quantity,
      price: conv.initialEnquiry?.targetPrice ? (conv.initialEnquiry.targetPrice / quantity) : (conv.productId?.basePrice || 0),
      deliveryTimeline: conv.initialEnquiry?.deliveryTimeline || '',
      paymentTerms: parsedPay.paymentTerms,
      paymentType: parsedPay.paymentType,
      advancePercent: parsedPay.advancePercent,
      creditDays: parsedPay.creditDays,
      transportationTerms: conv.initialEnquiry?.transportationTerms || 'FOR',
      cartItems: (conv.initialEnquiry?.cartItems || []).map((it: any) => ({
        ...it,
        gstRate: it.gstRate ?? conv.productId?.gstRate
      })),
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
          productId: (it as any).productId || undefined,
          name: it.name,
          quantity: it.quantity,
          price: Number(it.price),
          hsnCode: it.hsnCode || undefined,
          unit: it.unit || 'pcs',
          image: (it as any).imageUrl || (it as any).image,
          gstRate: quoteForm.gstType === 'exempt' ? 0 : ((it as any).gstRate ?? quoteForm.gstRate),
        }))
        : [{
          productId: activeConv?.productId?._id || undefined,
          name: quoteForm.itemName,
          quantity: quoteForm.quantity,
          price: Number(quoteForm.price),
          hsnCode: quoteForm.hsnCode || undefined,
          image: activeConv?.productId?.images?.[0] || undefined,
          gstRate: quoteForm.gstType === 'exempt' ? 0 : quoteForm.gstRate,
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
        paymentTerms: quoteForm.paymentType === 'Advance' ? `${quoteForm.advancePercent}% Advance` : quoteForm.paymentType === 'COD' ? 'COD' : `Credit (${quoteForm.creditDays} Days)`,
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
    if ((txt.includes('Enquiry:') || txt.includes('Order Request')) && messages[i].messageType !== 'system') {
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
                    onClick={() => {
                      if (activeConv?.initialEnquiry) {
                        const parsedPay = parsePaymentTerms(activeConv.initialEnquiry.paymentTerms);
                        setQuoteForm(prev => ({
                          ...prev,
                          deliveryTimeline: activeConv.initialEnquiry.deliveryTimeline || prev.deliveryTimeline,
                          paymentTerms: parsedPay.paymentTerms,
                          paymentType: parsedPay.paymentType,
                          advancePercent: parsedPay.advancePercent,
                          creditDays: parsedPay.creditDays,
                          transportationTerms: activeConv.initialEnquiry.transportationTerms || prev.transportationTerms,
                        }));
                      }
                      setIsQuoteModalOpen(true);
                      setIsAcceptingBuyerPrice(false);
                      setQuoteFormErrors({});
                    }}>
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
                      <QuotationCard isLatestQuoteMsg={!messages.slice(idx + 1).some(m => m.messageType === 'quotation' || m.messageType === 'buyer_counter_offer' || m.messageType === 'quotation_revision')} msg={msg} user={user} socket={socket} loadMessages={loadMessages} product={activeConv?.productId} onSupplierAction={handleOpenQuotationAction} />
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
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSupplierRejectTargetMsg(msg);
                                      setSupplierRejectReason('');
                                      setShowSupplierRejectModal(true);
                                    }}
                                    className="flex-1 py-2 bg-white border border-[#f97316] text-[#ea580c] hover:bg-[#fff7ed] text-xs font-bold rounded-[8px] cursor-pointer transition-colors"
                                  >
                                    ✕ Reject PO
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      const btn = e.currentTarget;
                                      const originalText = btn.innerText;
                                      btn.disabled = true;
                                      btn.innerText = 'Loading...';
                                      try {
                                        const qId = typeof msg.quotationId === 'object' ? (msg.quotationId as any)._id : msg.quotationId;
                                        const preview = await quotationApi.getCommissionPreview(qId);
                                        setCommissionPreview(preview);
                                        setWalletCommissionTargetMsg(msg);
                                        setShowWalletCommissionModal(true);
                                      } catch (err: any) {
                                        toast.error(err.response?.data?.message || 'Failed to fetch wallet info');
                                      } finally {
                                        btn.disabled = false;
                                        btn.innerText = originalText;
                                      }
                                    }}
                                    className="flex-1 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold rounded-[8px] cursor-pointer border-none transition-colors disabled:opacity-50"
                                  >
                                    ✓ Accept PO
                                  </button>
                                </div>
                              );
                            }
                            return <p className="text-xs font-bold text-[#ea580c] m-0 italic">Approved</p>;
                          })()}
                        </div>
                      </div>
                    ) : msg.messageType === 'system' ? (
                      <div className="w-full flex items-center gap-2 py-1">
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-4 py-3 max-w-[360px]">
                          {msg.text.split('\n').map((line: string, i: number) => (
                            <p key={i} className={`m-0 ${i === 0 ? 'text-xs font-extrabold text-[#0f172a] text-center pb-1' : 'text-[11.5px] text-[#334155] mt-0.5 text-left'}`}>{line || '\u00A0'}</p>
                          ))}

                        </div>
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                      </div>
                    ) : msg.messageType === 'payment_request' ? (
                      (() => {
                        const isCOD = msg.metadata?.requestType === 'cod' || msg.text?.includes('COD');
                        const isCredit = msg.metadata?.requestType === 'credit' || msg.text?.includes('Credit');
                        const isBalance = msg.metadata?.requestType === 'balance' || msg.text?.includes('Balance');
                        const title = isCOD ? 'COD Payment Required' : isCredit ? 'Credit Payment Required' : isBalance ? 'Balance Payment Required' : 'Advance Payment Required';
                        const badgeColor = isCOD ? 'bg-blue-500' : isCredit ? 'bg-indigo-500' : isBalance ? 'bg-amber-500' : 'bg-[#eab308]';
                        const textColor = isCOD ? 'text-blue-700' : isCredit ? 'text-indigo-700' : isBalance ? 'text-amber-700' : 'text-[#ca8a04]';
                        const bgColor = isCOD ? 'bg-blue-50 border-blue-200' : isCredit ? 'bg-indigo-50 border-indigo-200' : isBalance ? 'bg-amber-50 border-amber-200' : 'bg-[#fefce8] border-[#fef08a]';
                        const btnBg = isCOD ? 'bg-blue-600 hover:bg-blue-700' : isCredit ? 'bg-indigo-600 hover:bg-indigo-700' : isBalance ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#eab308] hover:bg-[#ca8a04]';

                        return (
                          <div className="w-full flex justify-center py-2">
                            <div className={`w-[85%] ${bgColor} border rounded-[12px] p-4 shadow-sm relative overflow-hidden`}>
                              <div className={`absolute top-0 left-0 w-1 h-full ${badgeColor}`}></div>
                              <p className={`text-[11px] font-bold ${textColor} uppercase tracking-wide m-0 mb-1`}>{title}</p>
                              <p className="text-sm text-[#334155] m-0 mb-3 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
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
                                      className={`w-full py-2 ${btnBg} text-white text-xs font-bold rounded-[8px] cursor-pointer border-none transition-colors`}
                                    >
                                      Upload Payment Proof
                                    </button>
                                  );
                                }
                                return <p className={`text-xs font-bold ${textColor} m-0 italic`}>Proof Uploaded</p>;
                              })()}
                            </div>
                          </div>
                        );
                      })()
                    ) : msg.messageType === 'payment_proof' ? (
                      <div className="w-full flex justify-center py-2">
                        <div className="w-[85%] bg-[#f0fdf4] border border-[#bbf7d0] rounded-[12px] p-4 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#22c55e]"></div>
                          <p className="text-[11px] font-bold text-[#166534] uppercase tracking-wide m-0 mb-2">Payment Proof Uploaded</p>
                          {msg.metadata?.paymentUtrNumber && (
                            <p className="text-sm font-semibold text-[#14532d] m-0 mb-2">
                              UTR: <span className="font-mono bg-[#dcfce7] px-1.5 py-0.5 rounded text-[#166534] border border-[#bbf7d0]">{msg.metadata.paymentUtrNumber}</span>
                            </p>
                          )}
                          {msg.metadata?.paymentProofUrl && (
                            <div className="mb-3 rounded-[8px] overflow-hidden border border-[#bbf7d0]">
                              <a href={msg.metadata.paymentProofUrl} target="_blank" rel="noreferrer" className="block text-center py-3 bg-[#dcfce7] text-[#166534] text-xs font-bold hover:bg-[#bbf7d0] transition-colors no-underline">
                                📄 View Payment Proof
                              </a>
                            </div>
                          )}
                          {user?.role === 'supplier' && (() => {
                            const isLatest = messages.filter(m => m.messageType === 'payment_proof').pop()?._id === msg._id;
                            const isVerified = messages.some(m => m.messageType === 'payment_verified' && new Date(m.createdAt) > new Date(msg.createdAt));
                            if (isLatest && !isVerified) {
                              return (
                                <button
                                  onClick={async (e) => {
                                    const btn = e.currentTarget;
                                    btn.disabled = true;
                                    btn.innerText = 'Confirming...';
                                    try {
                                      const anyQuoteWithOrder = messages.slice().reverse().find(m => m.messageType === 'quotation' && (m.quotationId as any)?.orderId);
                                      const fallbackOrderId = (anyQuoteWithOrder?.quotationId as any)?.orderId?._id || (anyQuoteWithOrder?.quotationId as any)?.orderId;
                                      const orderId = msg.metadata?.orderId || (msg.quotationId as any)?.orderId?._id || (msg.quotationId as any)?.orderId || fallbackOrderId;
                                      if (!orderId) throw new Error('Order ID not found in Chat');

                                      await apiClient.post(`/orders/${orderId}/payment-verify`);
                                      toast.success('Payment confirmed successfully');
                                      loadMessages();
                                    } catch (err: any) {
                                      btn.disabled = false;
                                      btn.innerText = 'Confirm Payment Received';
                                      toast.error(err.response?.data?.message || 'Failed to confirm payment');
                                    }
                                  }}
                                  className="w-full py-2 bg-[#22c55e] hover:bg-[#16a34a] text-white text-xs font-bold rounded-[8px] cursor-pointer border-none transition-colors disabled:opacity-50"
                                >
                                  Confirm Payment Received
                                </button>
                              );
                            }
                            return <p className="text-xs font-bold text-[#166534] m-0 italic">Payment Confirmed</p>;
                          })()}
                        </div>
                      </div>
                    ) : msg.messageType === 'payment_verified' ? (
                      (() => {
                        const isCOD = msg.text?.includes('COD');
                        const isCredit = msg.text?.includes('Credit');
                        const title = isCOD ? 'COD Payment Confirmed' : isCredit ? 'Credit Payment Confirmed' : 'Payment Confirmed';
                        const badgeColor = isCOD ? 'bg-blue-500' : isCredit ? 'bg-indigo-500' : 'bg-[#10b981]';
                        const textColor = isCOD ? 'text-blue-700' : isCredit ? 'text-indigo-700' : 'text-[#047857]';
                        const bgColor = isCOD ? 'bg-blue-50 border-blue-200' : isCredit ? 'bg-indigo-50 border-indigo-200' : 'bg-[#ecfdf5] border-[#a7f3d0]';
                        return (
                          <div className="w-full flex justify-center py-2">
                            <div className={`w-[85%] ${bgColor} border rounded-[12px] p-4 shadow-sm relative overflow-hidden`}>
                              <div className={`absolute top-0 left-0 w-1 h-full ${badgeColor}`}></div>
                              <p className={`text-[11px] font-bold ${textColor} uppercase tracking-wide m-0 mb-1`}>{title}</p>
                              <p className="text-sm text-[#334155] m-0 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })()
                    ) : (msg.messageType === 'quotation_revision' || msg.messageType === 'buyer_counter_offer') ? (
                      <QuotationRevisionCard
                        msg={msg}
                        messages={messages}
                        isMine={isMine}
                        user={user}
                        activeConv={activeConv}
                        isNegotiationDead={isNegotiationDead}
                        handleOpenQuotationAction={handleOpenQuotationAction}
                        loadMessages={loadMessages}
                      />
                    ) : (
                      <div className={`max-w-[85%] px-4 py-3 rounded-[12px] text-sm ${isMine ? 'bg-primary text-white rounded-br-[4px]' : 'bg-white text-[#334155] border border-[#eef2f6] rounded-bl-[4px]'}`}>
                        <div className="flex flex-col gap-2.5">
                          {(msg.metadata?.images && msg.metadata.images.length > 0) ? (
                            <div className="flex flex-wrap gap-2">
                              {msg.metadata.images.slice(0, 5).map((img: string, idx: number) => (
                                <div key={idx} className={`shrink-0 rounded-[6px] overflow-hidden border ${isMine ? 'border-white/20 bg-white/10' : 'border-[#e2e8f0]/60 bg-white'} p-1 w-14 h-14 flex items-center justify-center`}>
                                  <img src={img} alt="Product" className="max-w-full max-h-full object-contain rounded-[2px]" />
                                </div>
                              ))}
                              {msg.metadata.images.length > 5 && (
                                <div className={`shrink-0 rounded-[6px] border ${isMine ? 'border-white/20 bg-white/10 text-white' : 'border-[#e2e8f0]/60 bg-[#f8fafc] text-[#64748b]'} w-14 h-14 flex items-center justify-center text-xs font-bold`}>
                                  +{msg.metadata.images.length - 5}
                                </div>
                              )}
                            </div>
                          ) : msg.metadata?.imageUrl && (
                            <div className={`shrink-0 rounded-[6px] overflow-hidden border ${isMine ? 'border-white/20 bg-white/10' : 'border-[#e2e8f0]/60 bg-white'} p-1 w-14 h-14 flex items-center justify-center`}>
                              <img src={msg.metadata.imageUrl} alt="Product" className="max-w-full max-h-full object-contain rounded-[2px]" />
                            </div>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </div>
                        </div>
                        {(msg.text.includes('Enquiry:') || msg.text.includes('Order Request') || msg.text.includes('Negotiation Request')) && user?.role === 'supplier' && (() => {
                          let showActions = false;
                          // Show actions only if this is the LATEST enquiry/request and there's no active negotiation after it
                          const msgIdx = messages.findIndex(m => m._id === msg._id);
                          if (msgIdx !== -1) {
                            const isLatestEnquiry = !messages.slice(msgIdx + 1).some(m => m.text.includes('Enquiry:') || m.text.includes('Order Request') || m.text.includes('Negotiation Request'));
                            const hasQuotationAfter = messages.slice(msgIdx + 1).some(m => m.messageType === 'quotation');
                            showActions = isLatestEnquiry && !hasQuotationAfter && !isNegotiationDead;
                          }

                          if (!showActions) return null;

                          // Parse target price
                          // Support new format (₹2,500 x 20 = ₹50,000) and old format (₹50,000 total)
                          const newFormatMatch = msg.text.match(/Target budget: ₹([0-9,.]+)\s*x/);
                          const oldFormatMatch = msg.text.match(/Target budget: ₹([0-9,.]+)\s*total/);

                          let parsedUnitPrice: number | null = null;

                          if (newFormatMatch) {
                            parsedUnitPrice = Number(newFormatMatch[1].replace(/,/g, ''));
                          } else if (oldFormatMatch) {
                            const total = Number(oldFormatMatch[1].replace(/,/g, ''));
                            const qtyMatch = msg.text.match(/(?:Quantity|\bQty):\s*(\d+)/);
                            const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
                            parsedUnitPrice = total / qty;
                          }

                          // For showing the accept button, we just need to know if there's a target budget
                          const hasTargetBudget = !!parsedUnitPrice;
                          const hasNegotiationItems = Array.isArray(msg.metadata?.negotiationItems) && msg.metadata.negotiationItems.length > 0;

                          const dtMatch = msg.text.match(/(?:Delivery Terms|Delivery Timeline):\s*([^\n]+)/i);
                          const ptMatch = msg.text.match(/Payment Terms:\s*([^\n]+)/i);
                          const ttMatch = msg.text.match(/Transportation:\s*([^\n]+)/i);

                          const rawDeliveryTimeline = dtMatch?.[1]?.trim() || msg.metadata?.deliveryTimeline || activeConv?.initialEnquiry?.deliveryTimeline || '';
                          const rawPaymentTerms = ptMatch?.[1]?.trim() || msg.metadata?.paymentTerms || activeConv?.initialEnquiry?.paymentTerms || '100% Advance';
                          const rawTransportation = ttMatch?.[1]?.trim() || msg.metadata?.transportationTerms || activeConv?.initialEnquiry?.transportationTerms || 'FOR';

                          const parsedPay = parsePaymentTerms(rawPaymentTerms);

                          return (
                            <div className="mt-3 w-full flex flex-col gap-2 border-t border-[#e2e8f0]/40 pt-3">
                              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Your Action</span>
                              <div className="grid grid-cols-2 gap-2">
                                {(hasTargetBudget || msg.text.includes('Price: As listed') || msg.text.includes('Order Request (Checkout)') || hasNegotiationItems) && (
                                  <button
                                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-green-600 rounded-[8px] cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-50 ${(msg.text.includes('Order Request (Checkout)') || hasNegotiationItems) ? 'col-span-2' : ''}`}
                                    disabled={isSendingQuote}
                                    onClick={() => {
                                      if (hasNegotiationItems) {
                                        setQuoteForm(prev => ({
                                          ...prev,
                                          cartItems: msg.metadata.negotiationItems.map((it: any) => ({
                                            productId: it.productId,
                                            name: it.name,
                                            price: it.price,
                                            quantity: it.quantity,
                                            unit: it.unit || 'pcs',
                                            hsnCode: it.hsnCode,
                                            gstRate: it.gstRate,
                                          })),
                                          deliveryTimeline: rawDeliveryTimeline || prev.deliveryTimeline,
                                          paymentTerms: parsedPay.paymentTerms,
                                          paymentType: parsedPay.paymentType,
                                          advancePercent: parsedPay.advancePercent,
                                          creditDays: parsedPay.creditDays,
                                          transportationTerms: rawTransportation || prev.transportationTerms,
                                        }));
                                      } else if (hasTargetBudget && parsedUnitPrice) {
                                        const qtyMatch = msg.text.match(/Quantity: (\d+)/);
                                        const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
                                        setQuoteForm(prev => ({
                                          ...prev,
                                          price: parsedUnitPrice!,
                                          quantity: qty,
                                          deliveryTimeline: rawDeliveryTimeline || prev.deliveryTimeline,
                                          paymentTerms: parsedPay.paymentTerms,
                                          paymentType: parsedPay.paymentType,
                                          advancePercent: parsedPay.advancePercent,
                                          creditDays: parsedPay.creditDays,
                                          transportationTerms: rawTransportation || prev.transportationTerms,
                                        }));
                                      } else {
                                        const qtyMatch = msg.text.match(/(?:Quantity|\bQty):\s*(\d+)/);
                                        const qty = qtyMatch ? Number(qtyMatch[1]) : 1;

                                        const priceMatch = msg.text.match(/@\s*₹?([0-9,]+)/);
                                        const unitPrice = priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : (activeConv?.productId?.basePrice || 0);

                                        setQuoteForm(prev => ({
                                          ...prev,
                                          price: unitPrice,
                                          quantity: qty,
                                          priceTag: '' as any,
                                          deliveryTimeline: rawDeliveryTimeline || prev.deliveryTimeline,
                                          paymentTerms: parsedPay.paymentTerms,
                                          paymentType: parsedPay.paymentType,
                                          advancePercent: parsedPay.advancePercent,
                                          creditDays: parsedPay.creditDays,
                                          transportationTerms: rawTransportation || prev.transportationTerms,
                                        }));
                                      }
                                      setIsAcceptingBuyerPrice(true);
                                      setIsQuoteModalOpen(true);
                                      setQuoteFormErrors({});
                                    }}>
                                    <Check size={14} /> Accept
                                  </button>
                                )}
                                {!msg.text.includes('Order Request (Checkout)') && (
                                  <button
                                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold ${(!hasTargetBudget && !msg.text.includes('Price: As listed')) ? 'col-span-2 text-white bg-primary hover:bg-primary/90' : 'text-[#475569] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc]'} rounded-[8px] cursor-pointer transition-colors`}
                                    onClick={() => {
                                      if (hasNegotiationItems) {
                                        setQuoteForm(prev => ({
                                          ...prev,
                                          cartItems: msg.metadata.negotiationItems.map((it: any) => ({
                                            productId: it.productId,
                                            name: it.name,
                                            price: it.price,
                                            quantity: it.quantity,
                                            unit: it.unit || 'pcs',
                                            hsnCode: it.hsnCode,
                                            gstRate: it.gstRate,
                                          })),
                                          deliveryTimeline: rawDeliveryTimeline || prev.deliveryTimeline,
                                          paymentTerms: parsedPay.paymentTerms,
                                          paymentType: parsedPay.paymentType,
                                          advancePercent: parsedPay.advancePercent,
                                          creditDays: parsedPay.creditDays,
                                          transportationTerms: rawTransportation || prev.transportationTerms,
                                        }));
                                      } else {
                                        const qtyMatch = msg.text.match(/(?:Quantity|\bQty):\s*(\d+)/);
                                        const qty = qtyMatch ? Number(qtyMatch[1]) : 1;

                                        const unitPrice = parsedUnitPrice || (activeConv?.productId?.basePrice || 0);

                                        setQuoteForm(prev => ({
                                          ...prev,
                                          quantity: qty,
                                          price: unitPrice,
                                          priceTag: '' as any,
                                          deliveryTimeline: rawDeliveryTimeline || prev.deliveryTimeline,
                                          paymentTerms: parsedPay.paymentTerms,
                                          paymentType: parsedPay.paymentType,
                                          advancePercent: parsedPay.advancePercent,
                                          creditDays: parsedPay.creditDays,
                                          transportationTerms: rawTransportation || prev.transportationTerms,
                                        }));
                                      }
                                      setIsAcceptingBuyerPrice(false);
                                      setIsQuoteModalOpen(true);
                                      setQuoteFormErrors({});
                                    }}>
                                    <FileText size={14} /> Negotiate
                                  </button>
                                )}
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

              {(() => {
                if (user?.role !== 'supplier') return null;
                const poMsg = messages.slice().reverse().find(m => m.text?.includes('Purchase Order Generated'));
                if (!poMsg) return null;

                const anyQuoteWithOrder = messages.slice().reverse().find(m => m.messageType === 'quotation' && (m.quotationId as any)?.orderId);
                const orderObj: any = (poMsg.quotationId as any)?.orderId || anyQuoteWithOrder?.quotationId?.orderId;
                if (!orderObj || orderObj.paymentStatus === 'completed') return null;

                const paymentTerms = (poMsg.quotationId as any)?.paymentTerms || orderObj?.paymentTerms || activeConv?.initialEnquiry?.paymentTerms || '';
                const isCOD = paymentTerms.includes('COD');
                const isCredit = paymentTerms.includes('Credit');
                const isAdvance = paymentTerms.includes('Advance') || (!isCOD && !isCredit);

                const fallbackOrderId = (anyQuoteWithOrder?.quotationId as any)?.orderId?._id || (anyQuoteWithOrder?.quotationId as any)?.orderId;
                const orderId = orderObj?._id || fallbackOrderId;

                const totalAmount = Number(orderObj?.totalAmount || (poMsg.quotationId as any)?.grandTotal || 0);
                const termsMatch = paymentTerms.match(/(\d+)%/);
                const advancePercent = termsMatch ? parseInt(termsMatch[1]) : (totalAmount > 0 && orderObj?.advanceAmountRequired ? Math.round((orderObj.advanceAmountRequired / totalAmount) * 100) : 100);
                const remainingPercent = Math.max(0, 100 - advancePercent);
                const advanceAmount = Number(orderObj?.advanceAmountRequired || Math.round(totalAmount * (advancePercent / 100)));
                const remainingAmount = Math.max(0, totalAmount - advanceAmount);

                const lastPaymentRequestMsg = messages.filter(m => m.messageType === 'payment_request').pop();
                const lastPaymentVerifiedMsg = messages.filter(m => m.messageType === 'payment_verified').pop();
                const isPendingPaymentResponse = !!lastPaymentRequestMsg && (!lastPaymentVerifiedMsg || new Date(lastPaymentRequestMsg.createdAt) > new Date(lastPaymentVerifiedMsg.createdAt));

                const hasRequested = !!orderObj?.paymentRequestedAt || isPendingPaymentResponse;
                const advancePaid = !!orderObj?.advancePaid || messages.some(m => m.messageType === 'payment_verified' && m.text?.includes('Advance Payment Confirmed'));
                const paymentCompleted = orderObj?.paymentStatus === 'completed' || messages.some(m => m.messageType === 'payment_verified' && (m.text?.includes('Balance Payment Confirmed') || m.text?.includes('COD Payment Confirmed') || m.text?.includes('Credit Payment Confirmed') || m.text?.includes('fully settled')));

                if (paymentCompleted) return null;

                const isDelivered = ['awaiting_confirmation', 'delivered', 'completed'].includes(orderObj?.status) || !!orderObj?.awaitingConfirmationAt || messages.some(m => m.text?.includes('marked delivered by the supplier'));

                let actionUi = null;

                if (isAdvance && !advancePaid) {
                  const advanceLabel = advancePercent > 0 && advancePercent < 100
                    ? `${advancePercent}% • ₹${advanceAmount.toLocaleString('en-IN')}`
                    : `₹${advanceAmount.toLocaleString('en-IN')}`;
                  actionUi = (
                    <button
                      onClick={async (e) => {
                        if (hasRequested) return;
                        const btn = e.currentTarget;
                        btn.disabled = true;
                        btn.innerText = 'Requesting Advance...';
                        try {
                          if (!orderId) throw new Error('Order ID not found in Chat');
                          await apiClient.post(`/orders/${orderId}/payment-request`);
                          toast.success('Advance payment requested successfully');
                          loadMessages();
                        } catch (err: any) {
                          btn.disabled = false;
                          btn.innerText = `Request Advance Payment (${advanceLabel})`;
                          toast.error(err.response?.data?.message || 'Failed to request payment');
                        }
                      }}
                      disabled={hasRequested}
                      className={`w-full py-2.5 text-white text-xs font-bold rounded-[8px] border-none transition-colors shadow-sm ${hasRequested ? 'bg-[#94a3b8] cursor-not-allowed' : 'bg-[#0ea5e9] hover:bg-[#0284c7] cursor-pointer'}`}
                    >
                      {hasRequested ? `Advance Payment Requested (${advanceLabel})` : `Request Advance Payment (${advanceLabel})`}
                    </button>
                  );
                } else if (isCOD && !paymentCompleted) {
                  const codLabel = `₹${totalAmount.toLocaleString('en-IN')}`;
                  if (!isDelivered) {
                    actionUi = (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-[8px] text-[11px] text-blue-700 font-medium text-center shadow-sm">
                        🚚 <strong>COD Order Confirmed ({codLabel}).</strong> Please dispatch the order. Payment request will unlock once delivered.
                      </div>
                    );
                  } else {
                    actionUi = (
                      <button
                        onClick={async (e) => {
                          if (hasRequested) return;
                          const btn = e.currentTarget;
                          btn.disabled = true;
                          btn.innerText = 'Requesting COD...';
                          try {
                            if (!orderId) throw new Error('Order ID not found in Chat');
                            await apiClient.post(`/orders/${orderId}/payment-request`);
                            toast.success('COD payment requested successfully');
                            loadMessages();
                          } catch (err: any) {
                            btn.disabled = false;
                            btn.innerText = `Request COD Payment (${codLabel})`;
                            toast.error(err.response?.data?.message || 'Failed to request payment');
                          }
                        }}
                        disabled={hasRequested}
                        className={`w-full py-2.5 text-white text-xs font-bold rounded-[8px] border-none transition-colors shadow-sm ${hasRequested ? 'bg-[#94a3b8] cursor-not-allowed' : 'bg-[#2563eb] hover:bg-[#1d4ed8] cursor-pointer'}`}
                      >
                        {hasRequested ? `COD Payment Requested (${codLabel})` : `Request COD Payment (${codLabel})`}
                      </button>
                    );
                  }
                } else if (isCredit && !paymentCompleted) {
                  const creditDays = orderObj?.creditDays || (paymentTerms.match(/\d+/)?.[0] || '7');
                  const isCreditDue = orderObj?.creditPaymentDue || (orderObj?.creditDueDate && new Date(orderObj.creditDueDate) <= new Date());
                  const creditLabel = `₹${totalAmount.toLocaleString('en-IN')}`;
                  if (!isCreditDue) {
                    actionUi = (
                      <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-[8px] text-[11px] text-indigo-700 font-medium text-center shadow-sm">
                        ⏳ <strong>Credit Order Confirmed ({creditDays} Days • {creditLabel}).</strong> You will be notified when the credit period completes to request payment.
                      </div>
                    );
                  } else {
                    actionUi = (
                      <button
                        onClick={async (e) => {
                          if (hasRequested) return;
                          const btn = e.currentTarget;
                          btn.disabled = true;
                          btn.innerText = 'Requesting Credit...';
                          try {
                            if (!orderId) throw new Error('Order ID not found in Chat');
                            await apiClient.post(`/orders/${orderId}/payment-request`);
                            toast.success('Credit payment requested successfully');
                            loadMessages();
                          } catch (err: any) {
                            btn.disabled = false;
                            btn.innerText = `Request Credit Payment (${creditLabel})`;
                            toast.error(err.response?.data?.message || 'Failed to request payment');
                          }
                        }}
                        disabled={hasRequested}
                        className={`w-full py-2.5 text-white text-xs font-bold rounded-[8px] border-none transition-colors shadow-sm ${hasRequested ? 'bg-[#94a3b8] cursor-not-allowed' : 'bg-[#4f46e5] hover:bg-[#4338ca] cursor-pointer'}`}
                      >
                        {hasRequested ? `Credit Payment Requested (${creditLabel})` : `Request Credit Payment (${creditLabel})`}
                      </button>
                    );
                  }
                } else if (isAdvance && advancePaid && !paymentCompleted) {
                  const remainingLabel = remainingPercent > 0
                    ? `${remainingPercent}% • ₹${remainingAmount.toLocaleString('en-IN')}`
                    : `₹${remainingAmount.toLocaleString('en-IN')}`;
                  if (!isDelivered) {
                    actionUi = (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-[8px] text-[11px] text-amber-700 font-medium text-center shadow-sm">
                        🚚 <strong>Advance Payment Confirmed ({advancePercent > 0 && advancePercent < 100 ? `${advancePercent}% • ` : ''}₹{advanceAmount.toLocaleString('en-IN')}).</strong> Please dispatch and deliver the order. Remaining payment ({remainingLabel}) request will unlock once the product is delivered.
                      </div>
                    );
                  } else {
                    actionUi = (
                      <button
                        onClick={async (e) => {
                          if (hasRequested) return;
                          const btn = e.currentTarget;
                          btn.disabled = true;
                          btn.innerText = 'Requesting Balance...';
                          try {
                            if (!orderId) throw new Error('Order ID not found in Chat');
                            await apiClient.post(`/orders/${orderId}/payment-request`);
                            toast.success('Balance payment requested successfully');
                            loadMessages();
                          } catch (err: any) {
                            btn.disabled = false;
                            btn.innerText = `Request Remaining Balance (${remainingLabel})`;
                            toast.error(err.response?.data?.message || 'Failed to request payment');
                          }
                        }}
                        disabled={hasRequested}
                        className={`w-full py-2.5 text-white text-xs font-bold rounded-[8px] border-none transition-colors shadow-sm ${hasRequested ? 'bg-[#94a3b8] cursor-not-allowed' : 'bg-[#f59e0b] hover:bg-[#d97706] cursor-pointer'}`}
                      >
                        {hasRequested ? `Remaining Balance Requested (${remainingLabel})` : `Request Remaining Balance (${remainingLabel})`}
                      </button>
                    );
                  }
                }

                if (!actionUi) return null;

                return (
                  <div className="mx-4 mt-2 mb-4 shrink-0">
                    {actionUi}
                  </div>
                );
              })()}
              <div ref={messagesEndRef} />
            </div>

            {(() => {
              const lastEnquiryIdx = messages.findLastIndex(m => m.text?.includes('Enquiry:') || m.text?.includes('Order Request'));
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
                          {/* Supplier custom reply button removed as requested */}
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
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[9999] flex items-center justify-center px-4" onClick={() => setIsQuoteModalOpen(false)}>
          <div className="bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 w-full max-w-[480px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-5">{editingQuoteId ? 'Edit Quotation' : 'Send Quotation'}</h2>
            <div className="flex flex-col gap-4">
              {quoteForm.cartItems.length > 0 ? (
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  <label className={labelCls}>Items Requesting Quotation</label>
                  {quoteForm.cartItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px]">
                      <p className="text-[13px] font-bold text-[#0f172a] m-0 mb-2">{item.name}</p>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className={labelCls}>HSN Code</label>
                          <input type="text" value={item.hsnCode || '—'} readOnly className={inputCls + " bg-[#f1f5f9] cursor-default text-[#64748b]"} />
                        </div>
                        <div>
                          <label className={labelCls}>GST Slab</label>
                          <select
                            value={(item as any).gstRate !== undefined ? (item as any).gstRate : (quoteForm.gstRate ?? 18)}
                            onChange={e => {
                              const r = Number(e.target.value);
                              const newItems = [...quoteForm.cartItems];
                              (newItems[idx] as any).gstRate = r;
                              setQuoteForm({ ...quoteForm, cartItems: newItems });
                            }}
                            className={inputCls + " bg-white font-medium cursor-pointer"}
                          >
                            {[0, 5, 12, 18, 28].map(r => (
                              <option key={r} value={r}>{r}%</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Quantity</label>
                          <input type="text" value={item.quantity} readOnly className={inputCls + " bg-[#f1f5f9] cursor-default text-[#64748b]"} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-body/70 m-0">Per Unit Price ₹ <span className="text-red-500">*</span></label>
                          <span className="text-[10px] text-[#64748b] font-medium bg-[#f1f5f9] px-2 py-0.5 rounded">
                            Original: ₹{
                              activeConv?.initialEnquiry?.cartItems?.find((c: any) =>
                                (c.productId?._id || c.productId) === (item as any).productId
                              )?.price || activeConv?.productId?.basePrice || 0
                            }
                          </span>
                        </div>
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
                            Item Total: ₹{(item.quantity * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-body/70 m-0">Per Unit Price ₹ <span className="text-red-500">*</span></label>
                      <span className="text-[10px] text-[#64748b] font-medium bg-[#f1f5f9] px-2 py-0.5 rounded">Original: ₹{activeConv?.productId?.basePrice || 0}</span>
                    </div>
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
                        Total: ₹{computedTotalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({quoteForm.quantity} × ₹{quoteForm.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
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
              {quoteForm.gstType !== 'exempt' && quoteForm.cartItems.length === 0 && (
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
                    disabled={quoteForm.transportationTerms.includes('Ex.') || quoteForm.transportationTerms === 'FOR'}
                    value={quoteForm.shipping || ''}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      setQuoteForm({ ...quoteForm, shipping: v === '' ? 0 : Number(v) });
                    }}
                    placeholder="0"
                    className={inputCls + (quoteForm.transportationTerms.includes('Ex.') || quoteForm.transportationTerms === 'FOR' ? ' opacity-50 bg-gray-100 cursor-not-allowed' : '')}
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
                <label className={labelCls}>Terms & Conditions</label>
                <textarea rows={2} value={quoteForm.terms} onChange={e => setQuoteForm({ ...quoteForm, terms: e.target.value })} className={inputCls + " resize-none"} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Payment Terms <span className="text-red-500">*</span></label>
                  <select
                    value={quoteForm.paymentType}
                    onChange={e => setQuoteForm({ ...quoteForm, paymentType: e.target.value })}
                    className={inputCls + " mb-2"}
                  >
                    <option value="Advance">Advance Payment</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="Credit">Credit</option>
                  </select>

                  {quoteForm.paymentType === 'Advance' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1" max="100"
                        value={quoteForm.advancePercent}
                        onChange={e => setQuoteForm({ ...quoteForm, advancePercent: Number(e.target.value) })}
                        className={inputCls}
                        placeholder="%"
                      />
                      <span className="text-xs text-[#64748b] whitespace-nowrap">% Advance</span>
                    </div>
                  )}

                  {quoteForm.paymentType === 'Credit' && (
                    <div className="flex items-center gap-2">
                      <select
                        value={quoteForm.creditDays}
                        onChange={e => setQuoteForm({ ...quoteForm, creditDays: Number(e.target.value) })}
                        className={inputCls}
                      >
                        {![3, 7, 15, 30, 45, 60].includes(quoteForm.creditDays) && (
                          <option value={quoteForm.creditDays}>{quoteForm.creditDays} Days</option>
                        )}
                        <option value={3}>3 Days</option>
                        <option value={7}>7 Days</option>
                        <option value={15}>15 Days</option>
                        <option value={30}>30 Days</option>
                        <option value={45}>45 Days</option>
                        <option value={60}>60 Days</option>
                      </select>
                      <span className="text-xs text-[#64748b]">Days</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Transportation <span className="text-red-500">*</span></label>
                  <select
                    value={quoteForm.transportationTerms}
                    onChange={e => {
                      const val = e.target.value;
                      const original = activeConv?.initialEnquiry?.transportationTerms || '';

                      // If supplier changes it from what buyer requested, ask for reason
                      if (val !== original && original !== '') {
                        setPendingTransportValue(val);
                        setShowTransportReasonModal(true);
                      } else {
                        const updates: any = { transportationTerms: val };
                        if (val.includes('Ex.') || val === 'FOR') {
                          updates.shipping = 0;
                        }
                        setQuoteForm({ ...quoteForm, ...updates });
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="FOR">FOR (Supplier delivers - Free)</option>
                    <option value="Ex. Factory">Ex. Factory (Buyer picks up)</option>
                    <option value="Ex. Godown">Ex. Godown (Buyer picks up)</option>
                    <option value="Third-Party Courier">Third-Party Courier</option>
                  </select>
                </div>
              </div>

              {quoteForm.transportationTerms === 'Third-Party Courier' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Courier / Service Name <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="e.g. BlueDart" value={quoteForm.shippingNotes} onChange={e => setQuoteForm({ ...quoteForm, shippingNotes: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Shipping Cost (₹) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" value={quoteForm.shipping || ''} onChange={e => setQuoteForm({ ...quoteForm, shipping: Number(e.target.value) })} className={inputCls} />
                  </div>
                </div>
              )}

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
                {quoteForm.priceTag === 'Last Price' && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-[6px] p-2 mt-2 m-0 flex items-start gap-1.5">
                    <span>🔒</span>
                    <span><strong>Final Offer:</strong> Selecting <strong>Last Price</strong> marks this as your final price. The buyer will not be able to negotiate further—only accept or decline.</span>
                  </p>
                )}
                {quoteForm.priceTag === 'Best Price' && (
                  <p className="text-[11px] text-amber-800 bg-amber-50/60 border border-amber-200/70 rounded-[6px] p-2 mt-2 m-0 flex items-start gap-1.5">
                    <span>⚡</span>
                    <span><strong>Highlight:</strong> Selecting <strong>Best Price</strong> displays a prominent badge to the buyer while allowing further negotiations.</span>
                  </p>
                )}
              </div>
              {/* Live breakdown */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-3 flex flex-col gap-1.5">
                {quoteForm.cartItems.length === 0 && (
                  <div className="flex justify-between text-xs text-[#94a3b8]">
                    <span>Unit Price × Qty</span>
                    <span>₹{quoteForm.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {quoteForm.quantity}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-[#475569]">
                  <span>Total Price (before GST)</span><span className="font-semibold">₹{computedTotalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {quoteForm.gstType !== 'exempt' ? (
                  gstDisplayLines(quoteForm.gstType, computedGstBreak.lines, quoteForm.gstRate, computedGstAmount).map((ln, li) => (
                    <div key={li} className="flex justify-between text-xs text-[#0369a1]"><span>{ln.label}</span><span className="font-semibold">₹{inr2(ln.value)}</span></div>
                  ))
                ) : <div className="flex justify-between text-xs text-[#94a3b8]"><span>GST</span><span>Exempt / Nil</span></div>}
                {quoteForm.shipping > 0 && <div className="flex justify-between text-xs text-[#475569]"><span>Shipping {quoteForm.shippingNotes ? `(${quoteForm.shippingNotes})` : ''}</span><span className="font-semibold">₹{quoteForm.shipping.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>}
                {computedCourierGst > 0 && <div className="flex justify-between text-xs text-[#0369a1]"><span>Courier GST (18%)</span><span className="font-semibold">₹{computedCourierGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>}
                <div className="flex justify-between text-sm font-extrabold text-[#0f172a] pt-1.5 border-t border-[#e2e8f0]">
                  <span>Grand Total</span><span>₹{computedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button className="px-4 py-2 text-sm font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:bg-[#f1f5f9]" onClick={() => { setIsQuoteModalOpen(false); setEditingQuoteId(null); }}>Cancel</button>
              <button
                className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-[8px] border-none cursor-pointer hover:opacity-90"
                onClick={() => {
                  const errors: { price?: string; deliveryTimeline?: string; cartItems?: string } = {};

                  if (quoteForm.cartItems.length > 0) {
                    if (quoteForm.cartItems.some(it => !it.price || it.price <= 0)) {
                      errors.cartItems = 'Per unit price is required for all items';
                      toast.error('Per unit price is required for all items');
                    }
                  } else {
                    if (!quoteForm.price || quoteForm.price <= 0) errors.price = 'Per unit price is required';
                  }

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
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.65)] z-[9999] flex items-center justify-center px-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-[16px] shadow-[0_24px_64px_rgba(0,0,0,0.22)] w-full max-w-[780px] max-h-[90vh] overflow-hidden flex flex-col my-auto" onClick={e => e.stopPropagation()}>
            {/* Preview header */}
            <div className="px-5 py-3.5 bg-[#f8fafc] border-b border-[#f1f5f9] shrink-0">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest m-0 mb-0.5">How the buyer will see this</p>
              <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Confirm & Send Quotation</h3>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5">
              <div className="flex flex-col md:flex-row gap-5 items-start">
                {/* Left Column: Quote Preview */}
                <div className="flex-[1.2] flex flex-col min-w-0 w-full">
                  <QuotePreviewCard form={quoteForm} gstAmount={computedGstAmount} grandTotal={computedGrandTotal} />
                </div>

                {/* Right Column: Payment Ack + Signature (sticky on desktop) */}
                <div className="flex-1 flex flex-col gap-4 min-w-0 w-full md:sticky md:top-0">
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
                              backgroundColor="white"
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
            </div>

            {/* Action strip */}
            <div className="px-5 py-3.5 bg-[#f8fafc] border-t border-[#f1f5f9] flex gap-3 justify-end shrink-0">
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
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[9999] flex items-center justify-center px-4" onClick={() => !isUploadingProof && setShowPaymentProofModal(false)}>
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

      {/* Supplier Transport Term Reason Modal */}
      {showTransportReasonModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[9999] flex items-center justify-center px-4" onClick={() => setShowTransportReasonModal(false)}>
          <div className="bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 w-full max-w-[420px]" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-3">Reason for Changing Transportation</h2>
            <p className="text-xs text-[#64748b] mb-4 leading-relaxed">
              The buyer requested <strong>{activeConv?.initialEnquiry?.transportationTerms || 'a different method'}</strong>.
              Please select a reason for changing it to <strong>{pendingTransportValue}</strong>.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wide mb-1.5">Reason <span className="text-red-500">*</span></label>
                <select
                  value={transportChangeReason}
                  onChange={e => setTransportChangeReason(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select a reason</option>
                  <option value="Requested delivery location is out of our service area">Requested delivery location is out of our service area</option>
                  <option value="We do not support the requested delivery method">We do not support the requested delivery method</option>
                  <option value="Courier costs are too high for the requested method">Courier costs are too high for the requested method</option>
                  <option value="Better/faster delivery option available">Better/faster delivery option available</option>
                  <option value="Other logistical reasons">Other logistical reasons</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTransportReasonModal(false);
                  setTransportChangeReason('');
                }}
                className="flex-1 py-2.5 bg-white border border-[#e2e8f0] rounded-[8px] text-sm font-bold text-[#475569] hover:bg-[#f8fafc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!transportChangeReason}
                onClick={() => {
                  const updates: any = { transportationTerms: pendingTransportValue };
                  if (pendingTransportValue.includes('Ex.') || pendingTransportValue === 'FOR') {
                    updates.shipping = 0;
                  }

                  const newTerms = quoteForm.terms
                    ? `${quoteForm.terms}\nNote: Changed transportation to ${pendingTransportValue} because ${transportChangeReason.toLowerCase()}.`
                    : `Note: Changed transportation to ${pendingTransportValue} because ${transportChangeReason.toLowerCase()}.`;

                  updates.terms = newTerms;
                  setQuoteForm({ ...quoteForm, ...updates });
                  setShowTransportReasonModal(false);
                  setTransportChangeReason('');
                }}
                className={`flex-1 py-2.5 rounded-[8px] text-sm font-bold text-white transition-colors border-none ${!transportChangeReason ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-[#cc5200] cursor-pointer'}`}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Reject PO Modal */}
      {showSupplierRejectModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[9999] flex items-center justify-center px-4" onClick={() => setShowSupplierRejectModal(false)}>
          <div className="bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 w-full max-w-[400px]" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-5">Reject PO Generation</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#64748b] uppercase tracking-wide mb-1.5">Reason for Rejection <span className="text-red-500">*</span></label>
                <select
                  value={supplierRejectReason}
                  onChange={e => setSupplierRejectReason(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select a reason</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Cannot fulfill delivery timeline">Cannot fulfill delivery timeline</option>
                  <option value="Pricing issue">Pricing issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowSupplierRejectModal(false)}
                className="flex-1 py-2.5 bg-white border border-[#e2e8f0] rounded-[8px] text-sm font-bold text-[#475569] hover:bg-[#f8fafc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!supplierRejectReason}
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  btn.disabled = true;
                  btn.innerText = 'Rejecting...';
                  try {
                    const qId = typeof supplierRejectTargetMsg?.quotationId === 'object' ? (supplierRejectTargetMsg.quotationId as any)._id : supplierRejectTargetMsg?.quotationId;
                    await quotationApi.rejectQuotation(qId, supplierRejectReason);
                    setShowSupplierRejectModal(false);
                    loadMessages();
                  } catch (err: any) {
                    btn.disabled = false;
                    btn.innerText = 'Reject PO';
                    toast.error(err.response?.data?.message || 'Failed to reject PO');
                  }
                }}
                className={`flex-1 py-2.5 rounded-[8px] text-sm font-bold text-white transition-colors border-none ${!supplierRejectReason ? 'bg-red-500/50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'}`}
              >
                Reject PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Wallet Commission Preview Modal */}
      {showWalletCommissionModal && commissionPreview && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[9999] flex items-center justify-center px-4" onClick={() => setShowWalletCommissionModal(false)}>
          <div className="bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 w-full max-w-[400px]" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-5">Approve PO Generation</h2>

            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-4 mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#64748b]">Total Wallet Balance</span>
                <span className="font-bold text-[#0f172a]">₹{commissionPreview.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#64748b]">Total Product Cost</span>
                <span className="font-semibold text-[#0f172a]">₹{commissionPreview.taxableAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}</span>
              </div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-[#64748b]">Commission ({commissionPreview.commissionRate}%)</span>
                <span className="font-semibold text-[#0f172a]">₹{commissionPreview.commissionBase?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#64748b]">GST on Commission (18%)</span>
                <span className="font-semibold text-[#0f172a]">₹{commissionPreview.serviceGst?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}</span>
              </div>
              <div className="flex justify-between text-sm mb-2 mt-2 pt-2 border-t border-[#f1f5f9]">
                <span className="text-[#0f172a] font-bold">Total Freeze on Confirm</span>
                <span className="font-bold text-[#dc2626]">- ₹{commissionPreview.commissionFreezeAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-[#e2e8f0] mt-2">
                <span className="font-bold text-[#0f172a]">Remaining Balance</span>
                <span className={`font-bold ${commissionPreview.isSufficient ? 'text-[#059669]' : 'text-[#dc2626]'}`}>
                  ₹{(commissionPreview.walletBalance - commissionPreview.commissionFreezeAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {!commissionPreview.isSufficient && (
              <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[8px] p-3 mb-5">
                <p className="text-xs text-[#b91c1c] m-0 font-semibold mb-1">Insufficient Balance</p>
                <p className="text-[11px] text-[#991b1b] m-0 mb-2">Please top up your wallet to accept this PO generation.</p>
                <a href="/supplier/dashboard?tab=wallet" className="text-[11px] font-bold text-[#dc2626] hover:underline cursor-pointer block text-center bg-white border border-[#fca5a5] py-1.5 rounded-[6px]">
                  Top Up Wallet Now
                </a>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowWalletCommissionModal(false)}
                className="flex-1 py-2.5 bg-white border border-[#e2e8f0] rounded-[8px] text-sm font-bold text-[#475569] hover:bg-[#f8fafc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!commissionPreview.isSufficient || isConfirmingPO}
                onClick={async () => {
                  setIsConfirmingPO(true);
                  try {
                    const qId = typeof walletCommissionTargetMsg?.quotationId === 'object' ? (walletCommissionTargetMsg.quotationId as any)._id : walletCommissionTargetMsg?.quotationId;
                    await quotationApi.supplierApprove(qId);
                    setShowWalletCommissionModal(false);
                    loadMessages();
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to approve PO');
                  } finally {
                    setIsConfirmingPO(false);
                  }
                }}
                className={`flex-1 py-2.5 rounded-[8px] text-sm font-bold text-white transition-colors border-none ${(!commissionPreview.isSufficient || isConfirmingPO) ? 'bg-[#059669]/50 cursor-not-allowed' : 'bg-[#059669] hover:bg-[#047857] cursor-pointer'}`}
              >
                {isConfirmingPO ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInbox;
