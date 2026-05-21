import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  MessageCircle, X, ChevronDown, ArrowLeft,
  Check, CheckCheck, FileText, Phone
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../contexts/SocketContext';
import { useChat } from '../../hooks/useChat';
import { chatApi } from '@/features/chat/services/chat.api';
import { quotationApi } from '@/features/supplier/services/quotation.api';
import apiClient from '@/api/client';

type UIState = 'CLOSED' | 'MINIMIZED' | 'ACTIVE';
type ActivePanel = 'list' | 'chat';
type GstType = 'CGST_SGST' | 'IGST' | 'exempt';

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
    <div className="flex items-center justify-center gap-1 mt-1.5">
      <Phone size={10} className="text-[#059669] shrink-0" />
      <span className="text-[9px] font-semibold text-[#059669]">{label}:</span>
      <div style={{ position: 'relative', minWidth: '110px', height: '16px', display: 'inline-flex', alignItems: 'center' }}>
        <span style={{
          position: 'absolute', left: 0, fontSize: '12px',
          opacity: phase === 2 ? 0 : 1,
          transform: phase === 1 ? 'rotate(-22deg) scale(1.35)' : 'rotate(0deg) scale(1)',
          transition: phase === 2 ? 'opacity 0.35s ease' : 'transform 0.3s cubic-bezier(.36,.07,.19,.97)',
          display: 'inline-block',
        }}>
          {phase === 0 ? '🔒' : '🔓'}
        </span>
        <span style={{
          position: 'absolute', left: 0, fontSize: '10px', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap',
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

// ── Quote preview card (static, compact for FloatingChat) ───────────────────
const QuotePreviewCard = ({
  form, gstAmount, grandTotal,
}: {
  form: { itemName: string; hsnCode: string; quantity: number; price: number; gstType: GstType; gstRate: number; shipping: number; deliveryTimeline: string; terms: string };
  gstAmount: number;
  grandTotal: number;
}) => (
  <div className="bg-white border border-gray-100 rounded-[10px] overflow-hidden">
    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
      <span className="text-[12px] font-extrabold text-slate-800">Quotation</span>
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700">Awaiting Response</span>
    </div>
    <div className="px-3 py-2 flex flex-col gap-1 text-xs">
      <div className="flex justify-between">
        <span>{form.itemName} × {form.quantity}{form.hsnCode ? ` (HSN: ${form.hsnCode})` : ''}</span>
        <span className="font-semibold">₹{form.price.toLocaleString('en-IN')}</span>
      </div>
      <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-100">
        <span>Price</span>
        <span className="font-semibold">₹{form.price.toLocaleString('en-IN')}</span>
      </div>
      {form.gstType !== 'exempt' ? (
        form.gstType === 'IGST' ? (
          <div className="flex justify-between text-blue-600">
            <span>IGST @ {form.gstRate}%</span>
            <span className="font-semibold">₹{gstAmount.toLocaleString('en-IN')}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-blue-600">
              <span>CGST @ {form.gstRate / 2}%</span>
              <span className="font-semibold">₹{(gstAmount / 2).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>SGST @ {form.gstRate / 2}%</span>
              <span className="font-semibold">₹{(gstAmount / 2).toLocaleString('en-IN')}</span>
            </div>
          </>
        )
      ) : (
        <div className="flex justify-between text-gray-400"><span>GST</span><span>Exempt / Nil</span></div>
      )}
      {form.shipping > 0 && (
        <div className="flex justify-between text-gray-400"><span>Shipping</span><span>₹{form.shipping.toLocaleString('en-IN')}</span></div>
      )}
      <div className="flex justify-between font-extrabold text-[13px] border-t border-gray-100 pt-1.5 mt-0.5">
        <span>Grand Total</span>
        <span>₹{grandTotal.toLocaleString('en-IN')}</span>
      </div>
      {form.deliveryTimeline && (
        <p className="text-[10px] text-gray-400 m-0">Delivery: {form.deliveryTimeline}</p>
      )}
      {form.terms && <p className="text-[10px] text-gray-400 m-0">Terms: {form.terms}</p>}
    </div>
  </div>
);

export const FloatingChat: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const { socket, isConnected, activeChatId } = useSocket();

  const [uiState, setUiState] = useState<UIState>('CLOSED');
  const [panel, setPanel] = useState<ActivePanel>('list');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  const { messages, isTyping, loadMessages, sendMessage } = useChat(activeConv?._id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [customMsgOpen, setCustomMsgOpen] = useState(false);
  const [customMsgText, setCustomMsgText] = useState('');
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
  });

  // Derived totals for quote form
  const computedGstAmount = quoteForm.gstType === 'exempt'
    ? 0
    : Math.round(quoteForm.price * quoteForm.gstRate) / 100;
  const computedGrandTotal = quoteForm.price + computedGstAmount + quoteForm.shipping;

  const getOtherUser = (conv: any) => {
    const currentUserId = user?._id || user?.id;
    const buyerId = conv?.buyerId?._id || conv?.buyerId;
    if (buyerId?.toString() === currentUserId?.toString()) return conv?.supplierId;
    return conv?.buyerId;
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
      const unread = data.reduce((acc: number, conv: any) => acc + (conv.unreadCount?.[user?.id] || 0), 0);
      setTotalUnread(unread);
      return data;
    } catch (err) { console.error('loadConversations error', err); }
  }, [user?.id]);

  useEffect(() => { if (isAuthenticated && isConnected) loadConversations(); }, [isAuthenticated, isConnected, loadConversations]);

  useEffect(() => {
    if (!socket) return;
    const handler = (notif: any) => {
      if (notif.type === 'CHAT_MESSAGE' || notif.type === 'QUOTATION_UPDATE') {
        loadConversations();
        if (activeConv?._id === notif.conversationId) loadMessages();
      }
    };
    socket.on('new_notification', handler);
    return () => { socket.off('new_notification', handler); };
  }, [socket, loadConversations, activeConv, loadMessages]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!activeChatId) return;
    const open = (data: any[]) => {
      const found = data.find(c => c._id === activeChatId);
      if (found) { setActiveConv(found); setPanel('chat'); setUiState('ACTIVE'); }
    };
    const existing = conversations.find(c => c._id === activeChatId);
    if (existing) open(conversations);
    else loadConversations().then(data => { if (data) open(data); });
  }, [activeChatId]);

  const openConversation = (conv: any) => {
    setActiveConv(conv); setPanel('chat');
    if (uiState !== 'ACTIVE') setUiState('ACTIVE');
  };

  const handleMinimize = () => { setUiState(activeConv ? 'MINIMIZED' : 'CLOSED'); };
  const handleClose = () => setUiState('CLOSED');
  const handleBubbleClick = () => {
    if (uiState === 'CLOSED' || uiState === 'MINIMIZED') {
      setUiState('ACTIVE');
      setPanel(activeConv ? 'chat' : 'list');
    } else { setUiState('MINIMIZED'); }
  };

  const handleQuickReply = (text: string) => {
    if (!activeConv) return;
    const other = getOtherUser(activeConv);
    const receiverId = other?._id || other?.id;
    if (!receiverId) return;
    sendMessage(text, receiverId);
  };

  const handleCreateQuotation = async () => {
    if (!activeConv) return;
    const other = getOtherUser(activeConv);
    const buyerId = typeof other === 'string' ? other : other?._id || other?.id;
    try {
      await quotationApi.createQuotation({
        conversationId: activeConv._id,
        buyerId,
        items: [{
          name: quoteForm.itemName,
          quantity: quoteForm.quantity,
          price: quoteForm.quantity > 0 ? quoteForm.price / quoteForm.quantity : quoteForm.price,
          hsnCode: quoteForm.hsnCode || undefined,
        }],
        taxableAmount: quoteForm.price,
        totalAmount: quoteForm.price,
        gstType: quoteForm.gstType,
        gstRate: quoteForm.gstType === 'exempt' ? 0 : quoteForm.gstRate,
        gstAmount: computedGstAmount,
        shippingCost: quoteForm.shipping,
        deliveryTimeline: quoteForm.deliveryTimeline || undefined,
        shippingNotes: quoteForm.shippingNotes || undefined,
        terms: quoteForm.terms,
      });
      setIsQuoteModalOpen(false);
      setShowPreview(false);
      loadMessages();
      toast.success('Quotation sent!');
    } catch { toast.error('Failed to send quotation'); }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    const t = toast.loading('Confirming deal...');
    try {
      await quotationApi.acceptQuotation(quoteId);
      loadMessages();
      toast.success('Deal Confirmed!', { id: t });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm deal', { id: t });
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try { await quotationApi.rejectQuotation(quoteId); loadMessages(); }
    catch { console.error('Failed to reject quote'); }
  };

  const QuotationCard = ({ msg }: { msg: any }) => {
    const isMine = (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString();
    const isSupplier = user?.role === 'supplier';
    const [quote, setQuote] = useState<any>(null);
    const [showCounter, setShowCounter] = useState(false);
    const [counterPrice, setCounterPrice] = useState('');
    const [counterNote, setCounterNote] = useState('');
    const [counterSubmitting, setCounterSubmitting] = useState(false);
    const [contactPhone, setContactPhone] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<'accept' | 'decline' | null>(null);
    const hasFetchedContact = useRef(false);

    const fetchQuote = () => {
      if (msg.quotationId) quotationApi.getQuotation(msg.quotationId).then(setQuote);
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

    if (!quote) return <div className="text-[0.9rem] text-gray-400 italic">Loading quotation…</div>;

    const statusMeta: Record<string, { label: string; cls: string }> = {
      pending: { label: 'Awaiting Response', cls: 'bg-yellow-50 text-yellow-700' },
      counter_offered: { label: 'Counter Offered', cls: 'bg-blue-50 text-blue-700' },
      accepted: { label: 'Deal Confirmed ✅', cls: 'bg-green-50 text-green-700' },
      rejected: { label: 'Declined', cls: 'bg-red-50 text-red-600' },
      expired: { label: 'Expired', cls: 'bg-gray-100 text-gray-500' },
      ordered: { label: 'Order Created', cls: 'bg-blue-50 text-blue-700' },
    };
    const meta = statusMeta[quote.status] || { label: quote.status, cls: 'bg-gray-100 text-gray-500' };

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

    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-gray-700 overflow-hidden my-1">
        {/* Header */}
        <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-b border-gray-100">
          <span className="text-[12px] font-extrabold text-slate-800">Quotation</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
        </div>

        {/* Items + Totals */}
        <div className="px-3 py-2 flex flex-col gap-1 text-xs">
          {quote.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>{item.name} × {item.quantity} {item.unit}{item.hsnCode ? ` (HSN: ${item.hsnCode})` : ''}</span>
              <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}

          <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-100">
            <span>Amount</span>
            <span className="font-semibold">₹{taxableAmt.toLocaleString('en-IN')}</span>
          </div>

          {quote.gstType && quote.gstType !== 'exempt' && gstAmt > 0 ? (
            quote.gstType === 'IGST' ? (
              <div className="flex justify-between text-blue-600">
                <span>IGST @ {quote.gstRate}%</span>
                <span className="font-semibold">₹{gstAmt.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-blue-600">
                  <span>CGST @ {halfRate}%</span>
                  <span className="font-semibold">₹{(gstAmt / 2).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>SGST @ {halfRate}%</span>
                  <span className="font-semibold">₹{(gstAmt / 2).toLocaleString('en-IN')}</span>
                </div>
              </>
            )
          ) : (
            <div className="flex justify-between text-gray-400"><span>GST</span><span>Exempt / Nil</span></div>
          )}

          {shipCost > 0 && (
            <div className="flex justify-between text-gray-400"><span>Shipping</span><span>₹{shipCost.toLocaleString('en-IN')}</span></div>
          )}

          <div className="flex justify-between font-extrabold text-[13px] border-t border-gray-100 pt-1.5 mt-0.5">
            <span>Grand Total</span>
            <span>₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>

          {quote.deliveryTimeline && (
            <p className="text-[10px] text-gray-400 m-0">Delivery: {quote.deliveryTimeline}</p>
          )}
          {quote.terms && <p className="text-[10px] text-gray-400 m-0">Terms: {quote.terms}</p>}
        </div>

        {/* Counter offer details */}
        {quote.counterOffer && (
          <div className="mx-3 mb-2 bg-blue-50 border border-blue-100 rounded-[6px] px-2 py-1.5 text-xs text-blue-700">
            <span className="font-bold block">Counter from Buyer</span>
            <span>₹{quote.counterOffer.price}/unit{quote.counterOffer.note ? ` — ${quote.counterOffer.note}` : ''}</span>
          </div>
        )}

        {/* Buyer waiting after counter */}
        {!isSupplier && quote.status === 'counter_offered' && (
          <div className="px-3 pb-2">
            <p className="text-[10px] text-blue-600 font-semibold text-center m-0 bg-blue-50 border border-blue-100 rounded-[5px] py-1.5">
              Counter sent — awaiting supplier's new quote.
            </p>
          </div>
        )}

        {/* Buyer actions: only when pending */}
        {!isMine && !isSupplier && quote.status === 'pending' && !showCounter && (
          <>
            <div className="flex gap-1.5 px-3 pb-3">
              <button onClick={() => setConfirmAction('accept')}
                className="flex-1 py-1.5 bg-green-500 text-white text-[11px] font-bold border-none rounded-[6px] cursor-pointer hover:bg-green-600">
                Accept Deal
              </button>
              <button onClick={() => setShowCounter(true)}
                className="flex-1 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 rounded-[6px] cursor-pointer hover:bg-blue-100">
                Counter
              </button>
              <button onClick={() => setConfirmAction('decline')}
                className="flex-1 py-1.5 bg-red-50 text-red-600 text-[11px] font-bold border border-red-100 rounded-[6px] cursor-pointer hover:bg-red-100">
                Decline
              </button>
            </div>

            {confirmAction && (
              <div className="mx-3 mb-3 bg-gray-50 border border-gray-100 rounded-[8px] p-2.5">
                {confirmAction === 'accept' ? (
                  <>
                    <p className="text-[11px] font-extrabold text-slate-800 m-0 mb-1">Confirm Order?</p>
                    <p className="text-[10px] text-gray-500 m-0 mb-2 leading-relaxed">
                      This creates a Purchase Order. Payment is settled directly with the supplier — contact them via phone.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-extrabold text-red-600 m-0 mb-1">Decline this quote?</p>
                    <p className="text-[10px] text-gray-500 m-0 mb-2">
                      The supplier will be notified. You can request a new quote anytime.
                    </p>
                  </>
                )}
                <div className="flex gap-1.5">
                  <button onClick={() => setConfirmAction(null)}
                    className="flex-1 py-1.5 text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 rounded-[5px] cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setConfirmAction(null);
                      if (confirmAction === 'accept') handleAcceptQuote(quote._id);
                      else handleRejectQuote(quote._id);
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold text-white rounded-[5px] border-none cursor-pointer ${confirmAction === 'accept' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                    {confirmAction === 'accept' ? 'Yes, Confirm' : 'Yes, Decline'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Counter form — only when pending */}
        {!isMine && !isSupplier && quote.status === 'pending' && showCounter && (
          <div className="px-3 pb-3 flex flex-col gap-1.5">
            <div className="flex items-center border border-gray-200 rounded-[6px] focus-within:border-blue-400">
              <span className="px-2 py-1.5 text-[11px] text-gray-400 border-r border-gray-200">₹</span>
              <input autoFocus type="number" min="1" value={counterPrice} onChange={e => setCounterPrice(e.target.value)}
                placeholder="Your price per unit" className="flex-1 border-none outline-none px-2 py-1.5 text-[11px] bg-transparent" />
            </div>
            <input type="text" value={counterNote} onChange={e => setCounterNote(e.target.value)}
              placeholder="Note (optional)" className="border border-gray-200 rounded-[6px] px-2 py-1.5 text-[11px] outline-none" />
            <div className="flex gap-1.5">
              <button onClick={() => setShowCounter(false)}
                className="flex-1 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-[6px] cursor-pointer">
                Cancel
              </button>
              <button onClick={submitCounter} disabled={counterSubmitting || !counterPrice}
                className="flex-1 py-1.5 text-[11px] font-bold text-white bg-blue-600 rounded-[6px] border-none cursor-pointer disabled:opacity-50">
                {counterSubmitting ? 'Sending…' : 'Send Counter'}
              </button>
            </div>
          </div>
        )}

        {/* Supplier: counter_offered → prompt to send new quote */}
        {isSupplier && quote.status === 'counter_offered' && (
          <div className="px-3 pb-3">
            <p className="text-[10px] text-blue-600 font-semibold text-center m-0">
              Buyer countered. Use "Quote" to respond.
            </p>
          </div>
        )}

        {/* Deal Confirmed */}
        {quote.status === 'accepted' && (
          <div className="mx-3 mb-3 bg-green-50 border border-green-100 rounded-[6px] p-2 text-center">
            <p className="text-[11px] font-extrabold text-green-700 m-0">🎉 Deal Confirmed!</p>
            <p className="text-[10px] text-green-600 m-0 mt-0.5">Proceed as per agreed terms.</p>
            {contactPhone && (
              <div className="mt-1.5 pt-1.5 border-t border-green-100">
                <PhoneReveal
                  phone={contactPhone}
                  label={isSupplier ? "Buyer's Phone" : "Supplier's Phone"}
                />
              </div>
            )}
            {quote.orderId?._id ? (
              <a
                href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/api/orders/${quote.orderId._id}/po-download`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-[10px] font-bold rounded-[5px] no-underline hover:bg-green-700"
              >
                <FileText size={10} /> Download PO {quote.orderId.poNumber ? `(${quote.orderId.poNumber})` : ''}
              </a>
            ) : (
              <p className="text-[10px] text-green-400 m-0 mt-0.5">Order being processed…</p>
            )}
          </div>
        )}
        {quote.status === 'ordered' && (
          <div className="mx-3 mb-3 text-[11px] font-bold text-green-700 text-center">Order Created ✅</div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) return null;
  const otherUser = getOtherUser(activeConv);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans max-sm:bottom-3 max-sm:right-3 max-sm:left-3 max-sm:gap-2">

      {/* ACTIVE: full chat window */}
      {uiState === 'ACTIVE' && (
        <div className={`w-[360px] max-sm:w-full bg-cream rounded-[10px] shadow-[0_12px_48px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-slide-up border border-black/5`} style={{ height: panel === 'list' ? 460 : 520, maxHeight: 'calc(100dvh - 112px)' }}>
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              {panel === 'chat' && activeConv ? (
                <>
                  <div className="w-[34px] h-[34px] rounded-full bg-white/30 flex items-center justify-center font-bold text-white text-[13px] shrink-0">
                    {otherUser?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="m-0 text-sm font-semibold text-white leading-tight">{otherUser?.name || 'Supplier'}</h3>
                    {isTyping
                      ? <p className="m-0 text-[11px] text-white/85">Typing…</p>
                      : activeConv.productId?.name
                        ? <p className="m-0 text-[11px] text-white/85">Re: {activeConv.productId.name}</p>
                        : null}
                  </div>
                </>
              ) : (
                <h3 className="m-0 text-sm font-semibold text-white">Messages</h3>
              )}
            </div>
            <div className="flex gap-1">
              {panel === 'chat' && user?.role === 'supplier' && (
                <button
                  className="bg-white/20 border border-white/40 text-white px-2 py-1 rounded-[6px] text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-white/30 transition-colors"
                  onClick={() => {
                    setQuoteForm(p => ({
                      ...p,
                      itemName: activeConv?.productId?.name || '',
                      hsnCode: activeConv?.productId?.hsnCode || '',
                    }));
                    setIsQuoteModalOpen(true);
                  }}
                >
                  <FileText size={14} /> Quote
                </button>
              )}
              {panel === 'chat' && (
                <button className="bg-white/15 border-none text-white w-7 h-7 rounded-[8px] flex items-center justify-center cursor-pointer hover:bg-white/28 transition-colors" onClick={() => setPanel('list')}><ArrowLeft size={16} /></button>
              )}
              <button className="bg-white/15 border-none text-white w-7 h-7 rounded-[8px] flex items-center justify-center cursor-pointer hover:bg-white/28 transition-colors" onClick={handleMinimize}><ChevronDown size={16} /></button>
              <button className="bg-white/15 border-none text-white w-7 h-7 rounded-[8px] flex items-center justify-center cursor-pointer hover:bg-white/28 transition-colors" onClick={handleClose}><X size={16} /></button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3.5 flex flex-col gap-2.5 bg-gray-50 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-sm">
            {panel === 'list' ? (
              <div className="flex flex-col">
                {conversations.length === 0 ? (
                  <div className="py-12 text-center text-[#aaa] text-[13px]">No conversations yet.</div>
                ) : conversations.map(conv => {
                  const other = getOtherUser(conv);
                  const unread = conv.unreadCount?.[user?.id] || 0;
                  return (
                    <div key={conv._id} onClick={() => openConversation(conv)}
                      className="p-3 flex items-center gap-2.5 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] flex items-center justify-center font-bold text-white text-[13px] shrink-0">
                        {other?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-[13px] text-slate-900 block truncate">{other?.name || 'User'}</span>
                        <span className="text-[11.5px] text-[#888] truncate block">
                          {conv.productId ? `[${conv.productId.name}] ` : ''}{conv.lastMessage || 'Start a conversation'}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-[#bbb]">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {unread > 0 && (
                          <span className="bg-[#ff4d4d] text-white text-[10px] min-w-4 h-4 rounded-full flex items-center justify-center px-1">{unread}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isMine = (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString();
                  return msg.messageType === 'system' ? (
                      <div key={msg._id || idx} className="w-full self-center flex items-center gap-1.5 py-0.5">
                        <div className="flex-1 h-px bg-gray-200" />
                        <div className="bg-gray-50 border border-gray-100 rounded-[8px] px-3 py-2 text-center max-w-[260px]">
                          {msg.text.split('\n').map((line: string, i: number) => (
                            <p key={i} className={`m-0 ${i === 0 ? 'text-[11px] font-extrabold text-slate-800' : 'text-[10px] text-gray-500 mt-0.5'}`}>{line}</p>
                          ))}
                        </div>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    ) : (
                      <div key={msg._id || idx} className={`max-w-[80%] px-3 py-2 rounded-[8px] text-[0.9rem] leading-snug relative ${isMine ? 'self-end bg-primary text-white rounded-br-[2px]' : 'self-start bg-cream text-gray-800 rounded-bl-[4px] shadow-sm'}`}>
                        {msg.messageType === 'quotation'
                          ? <QuotationCard msg={msg} />
                          : <div className="mb-0.5">{msg.text}</div>
                        }
                        {isMine && (
                          <div className="flex justify-end text-[10px] opacity-70">
                            {msg.isRead ? <CheckCheck size={12} className="text-sky-300" /> : <Check size={12} className="text-white/60" />}
                          </div>
                        )}
                      </div>
                    );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick replies — only after PO generated */}
          {panel === 'chat' && messages.some(m => m.messageType === 'system') && (
            <div className="px-3 py-2 border-t border-gray-100 bg-white shrink-0">
              {customMsgOpen ? (
                <div className="flex flex-col gap-1.5">
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
                    className="w-full border border-gray-200 rounded-[8px] px-2.5 py-2 text-[12px] text-slate-800 outline-none focus:border-orange-400 resize-none"
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => { setCustomMsgOpen(false); setCustomMsgText(''); }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-[6px] cursor-pointer">
                      Cancel
                    </button>
                    <button
                      disabled={!customMsgText.trim()}
                      onClick={() => {
                        const t = customMsgText.trim();
                        if (t) { handleQuickReply(t); setCustomMsgText(''); setCustomMsgOpen(false); }
                      }}
                      className="px-3 py-1 text-[11px] font-bold text-white bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] rounded-[6px] border-none cursor-pointer disabled:opacity-40">
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider m-0 mb-1.5">Quick Replies</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {(user?.role === 'supplier'
                      ? [
                        { label: '⏳ Processing', text: 'Your order is currently being processed. We will update you soon.' },
                        { label: '🚚 Shipped', text: 'Your order has been shipped and is on the way.' },
                        { label: '📬 Confirm delivery', text: 'Could you please confirm if you have received the order?' },
                        { label: '🕐 24 hrs update', text: 'We will update you on your order status within 24 hours.' },
                      ]
                      : [
                        { label: '📦 Order status?', text: 'Hi, could you please share the current status of my order?' },
                        { label: '⏳ No update yet', text: "I haven't received any update on my order yet." },
                        { label: '✅ Order received', text: 'I have received my order. Thank you!' },
                        { label: '❓ Have a question', text: '' },
                      ]
                    ).map(qr => (
                      <button
                        key={qr.label}
                        onClick={() => {
                          if (qr.label.startsWith('❓')) { setCustomMsgOpen(true); }
                          else { handleQuickReply(qr.text); }
                        }}
                        className="shrink-0 px-2.5 py-1 text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-full cursor-pointer hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors whitespace-nowrap"
                      >
                        {qr.label}
                      </button>
                    ))}
                    {user?.role === 'supplier' && (
                      <button
                        onClick={() => setCustomMsgOpen(true)}
                        className="shrink-0 px-2.5 py-1 text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded-full cursor-pointer hover:bg-orange-100 transition-colors whitespace-nowrap">
                        ✏️ Write your reply
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* MINIMIZED: pill bar */}
      {uiState === 'MINIMIZED' && activeConv && (
        <div
          onClick={() => { setUiState('ACTIVE'); setPanel('chat'); }}
          className="w-[280px] max-sm:w-full bg-cream rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-black/[0.06] px-3.5 py-2.5 flex items-center gap-2.5 cursor-pointer animate-slide-up hover:shadow-[0_6px_24px_rgba(0,0,0,0.16)] transition-shadow"
        >
          <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] flex items-center justify-center font-bold text-white text-[13px] shrink-0">
            {otherUser?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-semibold text-slate-900 block truncate">{otherUser?.name || 'User'}</span>
            <span className="text-[11px] text-[#888] block truncate">{activeConv.lastMessage || 'Tap to continue…'}</span>
          </div>
          <div onClick={e => e.stopPropagation()}>
            <button onClick={handleClose} className="bg-transparent border-none text-[#888] cursor-pointer p-1">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Bubble */}
      <div
        onClick={handleBubbleClick}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] shadow-[0_6px_20px_rgba(255,77,77,0.4)] flex items-center justify-center text-white cursor-pointer relative shrink-0 transition-[transform,box-shadow] duration-[250ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.12] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(255,77,77,0.5)] active:scale-[0.96]"
      >
        {uiState === 'ACTIVE' ? <ChevronDown size={26} /> : (
          <>
            <MessageCircle size={26} />
            {totalUnread > 0 && (
              <div className="absolute -top-[3px] -right-[3px] bg-[#e53935] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-[9px] flex items-center justify-center border-2 border-white px-1">
                {totalUnread > 99 ? '99+' : totalUnread}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quotation Form Modal */}
      {isQuoteModalOpen && !showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]" onClick={() => setIsQuoteModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[440px] max-h-[90vh] overflow-y-auto p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <h2 className="m-0 mb-4 text-base font-bold text-slate-900">Send Quotation</h2>

            <div className="flex flex-col gap-3">
              {/* Item Name */}
              <div>
                <label className="block text-[11px] text-[#666] mb-1 font-semibold">Item Name</label>
                <input type="text" value={quoteForm.itemName}
                  onChange={e => setQuoteForm(p => ({ ...p, itemName: e.target.value }))}
                  className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none" />
              </div>

              {/* HSN + Quantity */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-[#666] mb-1 font-semibold">HSN Code</label>
                  <input type="text" value={quoteForm.hsnCode} placeholder="Optional"
                    onChange={e => setQuoteForm(p => ({ ...p, hsnCode: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-[#666] mb-1 font-semibold">Quantity</label>
                  <input type="number" min="1" value={quoteForm.quantity}
                    onChange={e => setQuoteForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                    onWheel={e => e.currentTarget.blur()}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none" />
                </div>
              </div>

              {/* Taxable Amount */}
              <div>
                <label className="block text-[11px] text-[#666] mb-1 font-semibold">Amount ₹ (before GST)</label>
                <input type="number" min="0" value={quoteForm.price}
                  onChange={e => setQuoteForm(p => ({ ...p, price: Number(e.target.value) }))}
                  onWheel={e => e.currentTarget.blur()}
                  className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none" />
              </div>

              {/* GST Type */}
              <div>
                <label className="block text-[11px] text-[#666] mb-1.5 font-semibold">GST Type</label>
                <div className="flex gap-2">
                  {(['CGST_SGST', 'IGST', 'exempt'] as const).map(t => (
                    <button key={t} type="button"
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-[6px] border cursor-pointer transition-colors ${quoteForm.gstType === t ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-400'}`}
                      onClick={() => setQuoteForm(p => ({ ...p, gstType: t }))}>
                      {t === 'CGST_SGST' ? 'CGST+SGST' : t === 'IGST' ? 'IGST' : 'Exempt'}
                    </button>
                  ))}
                </div>
              </div>

              {/* GST Rate */}
              {quoteForm.gstType !== 'exempt' && (
                <div>
                  <label className="block text-[11px] text-[#666] mb-1.5 font-semibold">GST Rate</label>
                  <div className="flex gap-2">
                    {[5, 12, 18, 28].map(r => (
                      <button key={r} type="button"
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-[6px] border cursor-pointer transition-colors ${quoteForm.gstRate === r ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-400'}`}
                        onClick={() => setQuoteForm(p => ({ ...p, gstRate: r }))}>
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping + Delivery */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-[#666] mb-1 font-semibold">Shipping ₹</label>
                  <input type="number" min="0" value={quoteForm.shipping}
                    onChange={e => setQuoteForm(p => ({ ...p, shipping: Number(e.target.value) }))}
                    onWheel={e => e.currentTarget.blur()}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-[#666] mb-1 font-semibold">Delivery Timeline</label>
                  <input type="text" value={quoteForm.deliveryTimeline} placeholder="e.g. 7–10 days"
                    onChange={e => setQuoteForm(p => ({ ...p, deliveryTimeline: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none" />
                </div>
              </div>

              {/* Shipping Notes */}
              <div>
                <label className="block text-[11px] text-[#666] mb-1 font-semibold">Shipping Notes</label>
                <input type="text" value={quoteForm.shippingNotes} placeholder="e.g. Ex-factory, door delivery included"
                  onChange={e => setQuoteForm(p => ({ ...p, shippingNotes: e.target.value }))}
                  className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none" />
              </div>

              {/* Terms */}
              <div>
                <label className="block text-[11px] text-[#666] mb-1 font-semibold">Terms & Conditions</label>
                <textarea rows={2} value={quoteForm.terms}
                  onChange={e => setQuoteForm(p => ({ ...p, terms: e.target.value }))}
                  className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none resize-none" />
              </div>

              {/* Live Breakdown */}
              <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-3 py-2.5 flex flex-col gap-1 text-[12px]">
                <div className="flex justify-between text-gray-500">
                  <span>Amount</span>
                  <span className="font-semibold">₹{quoteForm.price.toLocaleString('en-IN')}</span>
                </div>
                {quoteForm.gstType !== 'exempt' ? (
                  quoteForm.gstType === 'IGST' ? (
                    <div className="flex justify-between text-blue-600">
                      <span>IGST @ {quoteForm.gstRate}%</span>
                      <span className="font-semibold">₹{computedGstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-blue-600">
                        <span>CGST @ {quoteForm.gstRate / 2}%</span>
                        <span className="font-semibold">₹{(computedGstAmount / 2).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>SGST @ {quoteForm.gstRate / 2}%</span>
                        <span className="font-semibold">₹{(computedGstAmount / 2).toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )
                ) : (
                  <div className="flex justify-between text-gray-400"><span>GST</span><span>Exempt / Nil</span></div>
                )}
                {quoteForm.shipping > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span className="font-semibold">₹{quoteForm.shipping.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[13px] border-t border-gray-200 pt-1.5 mt-0.5 text-slate-900">
                  <span>Grand Total</span>
                  <span>₹{computedGrandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 mt-4">
              <button onClick={() => setIsQuoteModalOpen(false)}
                className="flex-1 py-2.5 rounded-[8px] border-none text-[13px] font-semibold bg-gray-100 text-[#666] cursor-pointer">Cancel</button>
              <button onClick={() => setShowPreview(true)}
                className="flex-1 py-2.5 rounded-[8px] border-none text-[13px] font-semibold bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] text-white cursor-pointer">Preview & Send →</button>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Preview / Confirm Modal */}
      {isQuoteModalOpen && showPreview && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-[100]" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-[16px] w-full max-w-[380px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.22)]" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest m-0 mb-0.5">How the buyer will see this</p>
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Confirm & Send Quotation</h3>
            </div>
            <div className="p-3.5">
              <QuotePreviewCard form={quoteForm} gstAmount={computedGstAmount} grandTotal={computedGrandTotal} />
            </div>
            <div className="px-4 pb-4 pt-1 flex gap-2.5">
              <button
                className="flex-1 py-2.5 text-[13px] font-semibold text-[#475569] bg-gray-50 border border-gray-200 rounded-[10px] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setShowPreview(false)}>
                ← Edit
              </button>
              <button
                className="flex-1 py-2.5 text-[13px] font-bold text-white bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] rounded-[10px] border-none cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handleCreateQuotation}>
                ✓ Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
