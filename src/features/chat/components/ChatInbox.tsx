import React, { useState, useEffect, useRef } from 'react';
import { Search, Inbox, ArrowLeft, Check, CheckCheck, FileText, MoreVertical, Trash2, Phone, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { chatApi } from '@/features/chat/services/chat.api';
import { quotationApi } from '@/features/supplier/services/quotation.api';
import { useChat } from '@/shared/hooks/useChat';
import { useSocket } from '@/shared/contexts/SocketContext';
import apiClient from '@/api/client';

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
  form: { itemName: string; hsnCode: string; quantity: number; price: number; gstType: GstType; gstRate: number; shipping: number; deliveryTimeline: string; terms: string };
  gstAmount: number;
  grandTotal: number;
}) => (
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
const ChatInbox: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [customMsgOpen, setCustomMsgOpen] = useState(false);
  const [customMsgText, setCustomMsgText] = useState('');

  const { messages, isTyping, loadMessages, sendMessage } = useChat(activeConv?._id);
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isSendingQuote, setIsSendingQuote] = useState(false);
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

  const computedTotalPrice = quoteForm.price * quoteForm.quantity;
  const computedGstAmount = quoteForm.gstType === 'exempt'
    ? 0
    : Math.round(computedTotalPrice * quoteForm.gstRate) / 100;
  const computedGrandTotal = computedTotalPrice + computedGstAmount + quoteForm.shipping;

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

  const loadConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

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

  const getUnread = (conv: any) => conv.unreadCount?.[user?.id] || 0;

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
    setQuoteForm(prev => ({
      ...prev,
      itemName: conv.productId?.name || '',
      hsnCode: conv.productId?.hsnCode || '',
    }));
  };

  const handleCreateQuotation = async () => {
    if (!activeConv || isSendingQuote) return;
    setIsSendingQuote(true);
    const other = getOtherParticipant(activeConv);
    const buyerId = typeof other === 'string' ? other : other?._id || other?.id;
    const payload = {
      conversationId: activeConv._id,
      buyerId,
      items: [{
        name: quoteForm.itemName,
        quantity: quoteForm.quantity,
        price: quoteForm.price,
        hsnCode: quoteForm.hsnCode || undefined,
      }],
      taxableAmount: computedTotalPrice,
      totalAmount: computedTotalPrice,
      gstType: quoteForm.gstType,
      gstRate: quoteForm.gstType === 'exempt' ? 0 : quoteForm.gstRate,
      gstAmount: computedGstAmount,
      shippingCost: quoteForm.shipping,
      deliveryTimeline: quoteForm.deliveryTimeline || undefined,
      shippingNotes: quoteForm.shippingNotes || undefined,
      terms: quoteForm.terms,
      priceTag: quoteForm.priceTag || undefined,
    };
    try {
      const result = editingQuoteId
        ? await quotationApi.updateQuotation(editingQuoteId, payload)
        : await quotationApi.createQuotation(payload);
      setIsQuoteModalOpen(false);
      setShowPreview(false);
      setEditingQuoteId(null);
      loadMessages();
      if (result?.held) {
        const tid = toast.custom(t => (
          <div className={`flex items-start gap-3 bg-white border border-[#fcd34d] rounded-[12px] shadow-lg px-4 py-3 max-w-sm w-full ${t.visible ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-2xl shrink-0">⏸️</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#92400e] m-0">Quotation held — insufficient balance</p>
              <div className="mt-1.5 bg-[#fffbeb] border border-[#fde68a] rounded-[6px] px-2.5 py-2 text-xs text-[#92400e] flex flex-col gap-0.5">
                <div className="flex justify-between"><span>Commission required</span><span className="font-bold">₹{Number(result.commission).toFixed(2)}</span></div>
                <div className="flex justify-between text-[#b45309]"><span>Your balance</span><span className="font-bold">₹{Number(result.availableBalance).toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-[#fde68a] pt-1 mt-0.5 text-[#dc2626]"><span className="font-bold">Shortfall</span><span className="font-bold">₹{Math.max(0, result.commission - result.availableBalance).toFixed(2)}</span></div>
              </div>
              <p className="text-xs text-[#b45309] mt-1.5 m-0">Top up ₹{Math.max(0, result.commission - result.availableBalance).toFixed(2)} and it will be sent to the buyer automatically.</p>
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

  const handleAcceptQuote = async (quoteId: string) => {
    const loadingToast = toast.loading('Confirming deal...');
    try {
      await quotationApi.acceptQuotation(quoteId);
      loadMessages();
      toast.success('Deal Confirmed! Order created.', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm deal', { id: loadingToast });
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try { await quotationApi.rejectQuotation(quoteId); loadMessages(); }
    catch (err) { console.error('Failed to reject quote', err); }
  };

  const handleQuickReply = (text: string) => {
    if (!activeConv) return;
    const other = getOtherParticipant(activeConv);
    const receiverId = other?._id || other?.id;
    if (!receiverId) return;
    sendMessage(text, receiverId);
  };

  // ── Quotation card ────────────────────────────────────────────────────────
  const QuotationCard = ({ msg }: { msg: any }) => {
    const isMine = (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString();
    const isSupplier = user?.role === 'supplier';
    const [quote, setQuote] = useState<any>(null);
    const [quoteNotFound, setQuoteNotFound] = useState(false);
    const [showCounter, setShowCounter] = useState(false);
    const [counterPrice, setCounterPrice] = useState('');
    const [counterNote, setCounterNote] = useState('');
    const [counterSubmitting, setCounterSubmitting] = useState(false);
    const [contactPhone, setContactPhone] = useState<string | null>(null);
    const hasFetchedContact = useRef(false);
    const [confirmAction, setConfirmAction] = useState<'accept' | 'decline' | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchQuote = () => {
      if (msg.quotationId) {
        quotationApi.getQuotation(msg.quotationId)
          .then(q => { setQuoteNotFound(false); setQuote(q); })
          .catch(() => setQuoteNotFound(true));
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

    if (quoteNotFound) return null;
    if (!quote) return null;
    if (quote.status === 'held' && !isSupplier) return null;

    const msgTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const timeRow = (
      <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
        <span className="text-[10px] text-[#94a3b8]">{msgTime}</span>
        {isMine && (msg.isRead ? <CheckCheck size={12} className="text-[#38bdf8]" /> : <Check size={12} className="text-[#94a3b8]" />)}
      </div>
    );

    const statusMeta: Record<string, { label: string; cls: string }> = {
      pending: { label: 'Awaiting Response', cls: 'bg-[#fffbeb] text-[#a16207]' },
      held: { label: 'On Hold', cls: 'bg-[#fef3c7] text-[#92400e]' },
      counter_offered: { label: 'Counter Offered', cls: 'bg-[#eff6ff] text-[#2563eb]' },
      accepted: { label: 'Deal Confirmed ✅', cls: 'bg-[#ecfdf5] text-[#059669]' },
      rejected: { label: 'Declined', cls: 'bg-[#fef2f2] text-[#dc2626]' },
      expired: { label: 'Expired', cls: 'bg-[#f1f5f9] text-[#94a3b8]' },
      ordered: { label: 'Order Created', cls: 'bg-[#eff6ff] text-[#0369a1]' },
    };
    const meta = statusMeta[quote.status] || { label: quote.status, cls: 'bg-[#f1f5f9] text-[#475569]' };

    const taxableAmt = quote.taxableAmount ?? quote.totalAmount ?? 0;
    const gstAmt = quote.gstAmount ?? 0;
    const shipCost = quote.shippingCost ?? 0;
    const grandTotal = taxableAmt + gstAmt + shipCost;
    const halfRate = (quote.gstRate ?? 0) / 2;

    const submitCounter = async () => {
      if (!counterPrice || Number(counterPrice) <= 0) return;
      setCounterSubmitting(true);
      try {
        await quotationApi.counterOffer(quote._id, { price: Number(counterPrice), note: counterNote.trim() || undefined });
        loadMessages();
        setShowCounter(false);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to send counter');
      } finally { setCounterSubmitting(false); }
    };

    const canEdit = isSupplier && isMine && (quote.status === 'pending' || quote.status === 'held');

    const handleEdit = () => {
      setQuoteForm({
        itemName: quote.items?.[0]?.name || '',
        hsnCode: quote.items?.[0]?.hsnCode || '',
        quantity: quote.items?.[0]?.quantity || 1,
        price: quote.items?.[0]?.price ?? 0,
        gstType: quote.gstType || 'CGST_SGST',
        gstRate: quote.gstRate ?? 18,
        shipping: quote.shippingCost ?? 0,
        deliveryTimeline: quote.deliveryTimeline || '',
        shippingNotes: quote.shippingNotes || '',
        terms: quote.terms || 'Standard delivery terms apply.',
        priceTag: quote.priceTag || '',
      });
      setEditingQuoteId(quote._id);
      setQuoteFormErrors({});
      setIsQuoteModalOpen(true);
    };

    const handleDelete = async () => {
      setIsDeleting(true);
      try {
        await quotationApi.deleteQuotation(quote._id);
        loadMessages();
        toast.success('Quotation retracted.');
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to retract quotation');
      } finally {
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      }
    };

    // Action buttons — rendered outside the card so faded wrapper never blocks them
    const actionButtons = canEdit && (
      <div className="min-w-[260px] max-w-[340px]">
        {!showDeleteConfirm ? (
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={handleEdit}
              className="flex-1 py-1.5 text-xs font-bold text-[#2563eb] bg-[#eff6ff] border border-[#bfdbfe] rounded-[6px] cursor-pointer hover:bg-[#dbeafe]"
            >✏️ Edit</button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-1.5 text-xs font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-[6px] cursor-pointer hover:bg-[#fee2e2]"
            >✕ Retract</button>
          </div>
        ) : (
          <div className="mt-1.5 bg-[#fef2f2] border border-[#fecaca] rounded-[8px] px-3 py-2.5">
            <p className="text-xs font-extrabold text-[#dc2626] m-0 mb-1">Retract this quotation?</p>
            <p className="text-[11px] text-[#475569] m-0 mb-2.5 leading-relaxed">
              The quotation will be removed from the chat. The buyer will no longer see it.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-1.5 text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:bg-[#f1f5f9]"
              >Cancel</button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-1.5 text-xs font-bold text-white bg-[#dc2626] rounded-[6px] border-none cursor-pointer hover:bg-[#b91c1c] disabled:opacity-50"
              >{isDeleting ? 'Retracting…' : 'Yes, Retract'}</button>
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
          <div className="flex justify-between text-sm font-extrabold text-[#0f172a] pt-2 border-t border-[#f1f5f9]">
            <span>Grand Total</span>
            <span>₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
          {quote.deliveryTimeline && <p className="text-[10px] text-[#94a3b8] m-0">Delivery: {quote.deliveryTimeline}</p>}
          {quote.terms && <p className="text-[10px] text-[#94a3b8] m-0">Terms: {quote.terms}</p>}
        </div>

        {quote.counterOffer && (
          <div className="mx-4 mb-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] px-3 py-2 text-xs text-[#1d4ed8]">
            <span className="font-bold block mb-0.5">Counter Offer from Buyer</span>
            <span>₹{quote.counterOffer.price.toLocaleString('en-IN')} total <span className="text-[#93c5fd] font-normal">(excl. GST &amp; shipping)</span></span>
            {quote.counterOffer.note && <span className="block text-[#3b82f6] mt-0.5">{quote.counterOffer.note}</span>}
          </div>
        )}

        {!isSupplier && quote.status === 'counter_offered' && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-[#2563eb] font-semibold m-0 text-center bg-[#eff6ff] border border-[#bfdbfe] rounded-[6px] py-2">
              Counter sent — awaiting supplier's new quotation.
            </p>
          </div>
        )}

        {!isMine && !isSupplier && quote.status === 'pending' && !showCounter && (
          <>
            <div className="flex gap-2 px-4 pb-3">
              <button className="flex-1 py-2 text-xs font-bold text-white bg-[#059669] rounded-[6px] border-none cursor-pointer hover:bg-[#047857]"
                onClick={() => setConfirmAction('accept')}>Accept Deal</button>
              <button className="flex-1 py-2 text-xs font-bold text-[#2563eb] bg-[#eff6ff] rounded-[6px] border-none cursor-pointer hover:bg-[#dbeafe]"
                onClick={() => setShowCounter(true)}>Counter</button>
              <button className="flex-1 py-2 text-xs font-bold text-[#dc2626] bg-[#fef2f2] rounded-[6px] border-none cursor-pointer hover:bg-[#fee2e2]"
                onClick={() => setConfirmAction('decline')}>Decline</button>
            </div>

            {/* Confirmation popup */}
            {confirmAction && (
              <div className="mx-4 mb-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] p-3.5">
                {confirmAction === 'accept' ? (
                  <>
                    <p className="text-xs font-extrabold text-[#0f172a] m-0 mb-1">Confirm Order?</p>
                    <p className="text-[11px] text-[#475569] m-0 mb-2.5 leading-relaxed">
                      This will create a Purchase Order. Payment is settled directly with the supplier — contact them via phone after confirming.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-extrabold text-[#dc2626] m-0 mb-1">Decline this quote?</p>
                    <p className="text-[11px] text-[#475569] m-0 mb-2.5">
                      The supplier will be notified. You can request a new quotation anytime.
                    </p>
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-1.5 text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:bg-[#f1f5f9]">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setConfirmAction(null);
                      if (confirmAction === 'accept') handleAcceptQuote(quote._id);
                      else handleRejectQuote(quote._id);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold text-white rounded-[6px] border-none cursor-pointer ${confirmAction === 'accept' ? 'bg-[#059669] hover:bg-[#047857]' : 'bg-[#dc2626] hover:bg-[#b91c1c]'}`}>
                    {confirmAction === 'accept' ? 'Yes, Confirm Order' : 'Yes, Decline'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!isMine && !isSupplier && quote.status === 'pending' && showCounter && (
          <div className="px-4 pb-3 flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center border border-[#e2e8f0] rounded-[6px] bg-white focus-within:border-primary">
                <span className="px-2 py-2 text-xs text-[#94a3b8] border-r border-[#e2e8f0]">₹</span>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={counterPrice}
                  onChange={e => setCounterPrice(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter total amount"
                  className="flex-1 border-none outline-none px-2 py-2 text-xs bg-transparent"
                />
              </div>
              <p className="text-[10px] text-[#94a3b8] m-0">Excluding GST &amp; shipping charges</p>
            </div>
            <input type="text" value={counterNote} onChange={e => setCounterNote(e.target.value)}
              placeholder="Note (optional)" className="border border-[#e2e8f0] rounded-[6px] px-2 py-2 text-xs outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button onClick={() => setShowCounter(false)}
                className="flex-1 py-2 text-xs font-bold text-[#64748b] bg-[#f8fafc] rounded-[6px] border border-[#e2e8f0] cursor-pointer">Cancel</button>
              <button onClick={submitCounter} disabled={counterSubmitting || !counterPrice}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#2563eb] rounded-[6px] border-none cursor-pointer disabled:opacity-50">
                {counterSubmitting ? 'Sending…' : 'Send Counter'}
              </button>
            </div>
          </div>
        )}

        {isSupplier && quote.status === 'counter_offered' && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-[#2563eb] font-semibold m-0 text-center">
              Buyer has countered. Use "Send Quotation" above to respond with a new quote.
            </p>
          </div>
        )}

        {quote.status === 'accepted' && (
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
                  href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/api/orders/${quote.orderId._id}/po-download`}
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${isActive ? 'bg-primary text-white' : 'bg-[#f1f5f9] text-[#475569]'}`}>
                  {other?.name?.[0]?.toUpperCase() || '?'}
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
                    <span className="text-sm font-semibold text-[#0f172a] truncate">{other?.name || 'User'}</span>
                    <span className="text-[10px] text-[#94a3b8] shrink-0 mr-5">{new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-[#94a3b8] truncate">{conv.lastMessage || 'Start of conversation'}</span>
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
              {user?.role === 'supplier' && (
                <button
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] cursor-pointer hover:bg-[#ffedd5]"
                  onClick={() => { setIsQuoteModalOpen(true); setQuoteFormErrors({}); }}>
                  <FileText size={14} /> Send Quotation
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-[#f8fafc]">
              {messages.map((msg, idx) => {
                const isMine = (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString();
                return (
                  <div key={msg._id || idx} className={`flex flex-col ${msg.messageType === 'system' ? 'items-center w-full' : isMine ? 'items-end' : 'items-start'}`}>
                    {msg.messageType === 'quotation' ? (
                      <QuotationCard msg={msg} />
                    ) : msg.messageType === 'system' ? (
                      <div className="w-full flex items-center gap-2 py-1">
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] px-4 py-2.5 text-center max-w-[320px]">
                          {msg.text.split('\n').map((line: string, i: number) => (
                            <p key={i} className={`m-0 ${i === 0 ? 'text-xs font-extrabold text-[#0f172a]' : 'text-[11px] text-[#64748b] mt-0.5'}`}>{line}</p>
                          ))}
                        </div>
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                      </div>
                    ) : (
                      <div className={`whitespace-pre-wrap leading-relaxed max-w-[75%] px-4 py-2.5 rounded-[12px] text-sm ${isMine ? 'bg-primary text-white rounded-br-[4px]' : 'bg-white text-[#334155] border border-[#eef2f6] rounded-bl-[4px]'}`}>
                        {msg.text}
                      </div>
                    )}
                    {msg.messageType !== 'system' && msg.messageType !== 'quotation' && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-[#94a3b8]">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {isMine && (msg.isRead ? <CheckCheck size={13} className="text-[#38bdf8]" /> : <Check size={13} className="text-[#94a3b8]" />)}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {messages.some(m => m.messageType === 'system') && (
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quoteForm.quantity}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      setQuoteForm({ ...quoteForm, quantity: v === '' ? 1 : Number(v) });
                    }}
                    className={inputCls}
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
                    value={quoteForm.shipping || ''}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      setQuoteForm({ ...quoteForm, shipping: v === '' ? 0 : Number(v) });
                    }}
                    placeholder="0"
                    className={inputCls}
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
          <div className="bg-white rounded-[16px] shadow-[0_24px_64px_rgba(0,0,0,0.22)] w-full max-w-[400px] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Preview header */}
            <div className="px-5 py-4 bg-[#f8fafc] border-b border-[#f1f5f9]">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest m-0 mb-1">How the buyer will see this</p>
              <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Confirm & Send Quotation</h3>
            </div>

            {/* Quote card preview */}
            <div className="p-4">
              <QuotePreviewCard form={quoteForm} gstAmount={computedGstAmount} grandTotal={computedGrandTotal} />
            </div>

            {/* Action strip */}
            <div className="px-5 pb-5 pt-1 flex gap-3">
              <button
                className="flex-1 py-2.5 text-sm font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                onClick={() => setShowPreview(false)}>
                ← Edit
              </button>
              <button
                className="flex-1 py-2.5 text-sm font-bold text-white bg-primary rounded-[10px] border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleCreateQuotation}
                disabled={isSendingQuote}>
                {isSendingQuote ? 'Sending...' : '✓ Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInbox;
