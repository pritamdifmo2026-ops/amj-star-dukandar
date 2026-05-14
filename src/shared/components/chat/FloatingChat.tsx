import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  MessageCircle, X, ChevronDown, Send, ArrowLeft,
  Check, CheckCheck, FileText
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../contexts/SocketContext';
import { useChat } from '../../hooks/useChat';
import { chatApi } from '../../services/chat.api';
import { quotationApi } from '../../services/quotation.api';
import { paymentApi } from '../../services/payment.api';

type UIState = 'CLOSED' | 'MINIMIZED' | 'ACTIVE';
type ActivePanel = 'list' | 'chat';

export const FloatingChat: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const { socket, isConnected, activeChatId } = useSocket();

  const [uiState, setUiState] = useState<UIState>('CLOSED');
  const [panel, setPanel] = useState<ActivePanel>('list');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);

  const { messages, sendMessage, handleTyping, isTyping, loadMessages } = useChat(activeConv?._id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    itemName: '', quantity: 1, price: 0, shipping: 0,
    terms: 'Standard delivery terms apply.',
  });

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
    const handler = (notif: any) => { if (notif.type === 'CHAT_MESSAGE') loadConversations(); };
    socket.on('new_notification', handler);
    return () => { socket.off('new_notification', handler); };
  }, [socket, loadConversations]);

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

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    const other = getOtherUser(activeConv);
    const receiverId: string | undefined =
      typeof other === 'string' ? other :
      typeof other === 'object' && other !== null ? (other._id?.toString() || other.id?.toString()) :
      undefined;
    if (!receiverId) return;
    sendMessage(inputText, receiverId);
    setInputText('');
    handleTyping(false);
  };

  const handleMinimize = () => { setUiState(activeConv ? 'MINIMIZED' : 'CLOSED'); };
  const handleClose = () => setUiState('CLOSED');
  const handleBubbleClick = () => {
    if (uiState === 'CLOSED' || uiState === 'MINIMIZED') {
      setUiState('ACTIVE');
      setPanel(activeConv ? 'chat' : 'list');
    } else { setUiState('MINIMIZED'); }
  };

  const handleCreateQuotation = async () => {
    if (!activeConv) return;
    const other = getOtherUser(activeConv);
    const buyerId = typeof other === 'string' ? other : other?._id || other?.id;
    try {
      await quotationApi.createQuotation({
        conversationId: activeConv._id, buyerId,
        items: [{ name: quoteForm.itemName, quantity: quoteForm.quantity, price: quoteForm.price }],
        totalAmount: quoteForm.quantity * quoteForm.price,
        shippingCost: quoteForm.shipping, terms: quoteForm.terms,
      });
      setIsQuoteModalOpen(false);
      loadMessages();
      toast.success('Quotation sent!');
    } catch { toast.error('Failed to send quotation'); }
  };

  const handlePayment = async (orderId: string) => {
    const t = toast.loading('Initializing payment...');
    try {
      const data = await paymentApi.createOrder(orderId);
      const options = {
        key: data.keyId, amount: data.amount, currency: data.currency,
        name: 'AMJStar Dukandar', description: `Order #${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        handler: async (response: any) => {
          const vt = toast.loading('Verifying payment...');
          try {
            await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful!', { id: vt });
            loadMessages();
          } catch { toast.error('Payment verification failed', { id: vt }); }
        },
        prefill: {
          name: data.prefill?.name || user?.name,
          email: data.prefill?.email || user?.email,
          contact: data.prefill?.contact || user?.phone || user?.phoneNumber || user?.contact,
        },
        theme: { color: '#ff4d4d' },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => toast.error('Payment failed: ' + response.error.description));
      rzp.open();
      toast.dismiss(t);
    } catch { toast.error('Failed to initialize payment', { id: t }); }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    const t = toast.loading('Creating order...');
    try {
      const { order } = await quotationApi.acceptQuotation(quoteId);
      loadMessages();
      toast.success('Order created!', { id: t });
      handlePayment(order._id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept quotation', { id: t });
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try { await quotationApi.rejectQuotation(quoteId); loadMessages(); }
    catch { console.error('Failed to reject quote'); }
  };

  const QuotationCard = ({ msg }: { msg: any }) => {
    const isMine = (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString();
    const [quote, setQuote] = useState<any>(null);

    useEffect(() => {
      if (msg.quotationId) quotationApi.getQuotation(msg.quotationId).then(setQuote);
    }, [msg.quotationId]);

    if (!quote) return <div className="text-[0.9rem]">Loading quotation...</div>;

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-3 my-1 shadow-sm text-gray-700">
        <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-50">
          <h4 className="m-0 text-[13px] text-slate-900">Quotation</h4>
          <span className="text-[10px] uppercase font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">
            {quote.status}
          </span>
        </div>
        <div className="flex flex-col gap-1 mb-2 text-xs">
          {quote.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>{item.name} x {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between">
            <span>Shipping</span><span>₹{quote.shippingCost}</span>
          </div>
        </div>
        <div className="flex justify-between font-bold text-[13px] border-t border-gray-50 pt-1.5 mb-2.5">
          <span>Total</span><span>₹{quote.totalAmount + quote.shippingCost}</span>
        </div>
        {!isMine && quote.status === 'pending' && (
          <div className="flex gap-2">
            <button onClick={() => handleAcceptQuote(quote._id)}
              className="flex-1 py-1.5 bg-green-500 text-white text-[11px] font-semibold border-none rounded-[6px] cursor-pointer hover:opacity-90">
              Accept & Order
            </button>
            <button onClick={() => handleRejectQuote(quote._id)}
              className="flex-1 py-1.5 bg-red-500 text-white text-[11px] font-semibold border-none rounded-[6px] cursor-pointer hover:opacity-90">
              Reject
            </button>
          </div>
        )}
        {quote.status === 'accepted' && (
          <div className="bg-orange-50 text-orange-700 text-center text-[11px] font-semibold p-1.5 rounded-[6px]">
            Quotation Accepted. Waiting for Payment...
            {!isMine && (
              <button onClick={() => handlePayment(quote.orderId?._id || quote.orderId)}
                className="ml-2 underline bg-transparent border-none text-orange-700 cursor-pointer text-[11px] font-semibold">
                Pay Now
              </button>
            )}
          </div>
        )}
        {quote.status === 'ordered' && (
          <div className="bg-green-50 text-green-800 text-center text-[11px] font-semibold p-1.5 rounded-[6px]">
            Order Created ✅
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) return null;
  const otherUser = getOtherUser(activeConv);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans">

      {/* ACTIVE: full chat window */}
      {uiState === 'ACTIVE' && (
        <div className={`w-[360px] bg-cream rounded-[10px] shadow-[0_12px_48px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-slide-up border border-black/5 ${panel === 'list' ? 'h-[460px]' : 'h-[520px]'}`}>
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
                  onClick={() => { setQuoteForm(p => ({ ...p, itemName: activeConv?.productId?.name || '' })); setIsQuoteModalOpen(true); }}
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
                  return (
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

          {/* Input */}
          {panel === 'chat' && (
            <div className="px-3.5 py-3 border-t border-gray-100 flex gap-2 items-center bg-cream shrink-0">
              <input
                type="text" placeholder="Type a message…" value={inputText}
                onChange={e => { setInputText(e.target.value); handleTyping(e.target.value.length > 0); }}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 border-[1.5px] border-gray-200 px-3.5 py-2 rounded-full outline-none text-[13px] bg-gray-50 focus:border-[#ff4d4d] focus:bg-cream transition-colors"
              />
              <button
                onClick={handleSend} disabled={!inputText.trim()}
                className="bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] text-white border-none w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-default disabled:scale-100"
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* MINIMIZED: pill bar */}
      {uiState === 'MINIMIZED' && activeConv && (
        <div
          onClick={() => { setUiState('ACTIVE'); setPanel('chat'); }}
          className="w-[280px] bg-cream rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-black/[0.06] px-3.5 py-2.5 flex items-center gap-2.5 cursor-pointer animate-slide-up hover:shadow-[0_6px_24px_rgba(0,0,0,0.16)] transition-shadow"
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

      {/* Quotation Modal */}
      {isQuoteModalOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-5 z-[100]">
          <div className="bg-white rounded-2xl w-full max-h-full overflow-y-auto p-[18px] shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h2 className="m-0 mb-4 text-base text-slate-900">Send Quotation</h2>
            {[
              { label: 'Item Name', key: 'itemName', type: 'text' },
            ].map(f => (
              <div key={f.key} className="mb-3">
                <label className="block text-[11px] text-[#666] mb-1 font-semibold">{f.label}</label>
                <input type={f.type} value={(quoteForm as any)[f.key]}
                  onChange={e => setQuoteForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none" />
              </div>
            ))}
            <div className="flex gap-3 mb-3">
              {[{ label: 'Quantity', key: 'quantity' }, { label: 'Unit Price (₹)', key: 'price' }].map(f => (
                <div key={f.key} className="flex-1">
                  <label className="block text-[11px] text-[#666] mb-1 font-semibold">{f.label}</label>
                  <input type="number" value={(quoteForm as any)[f.key]}
                    onChange={e => setQuoteForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none" />
                </div>
              ))}
            </div>
            <div className="mb-3">
              <label className="block text-[11px] text-[#666] mb-1 font-semibold">Shipping Cost (₹)</label>
              <input type="number" value={quoteForm.shipping}
                onChange={e => setQuoteForm(p => ({ ...p, shipping: Number(e.target.value) }))}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none" />
            </div>
            <div className="mb-3">
              <label className="block text-[11px] text-[#666] mb-1 font-semibold">Terms & Conditions</label>
              <textarea rows={3} value={quoteForm.terms}
                onChange={e => setQuoteForm(p => ({ ...p, terms: e.target.value }))}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-[8px] text-[13px] outline-none resize-none" />
            </div>
            <div className="flex gap-2.5 mt-4">
              <button onClick={() => setIsQuoteModalOpen(false)}
                className="flex-1 py-2.5 rounded-[8px] border-none text-[13px] font-semibold bg-gray-100 text-[#666] cursor-pointer">Cancel</button>
              <button onClick={handleCreateQuotation}
                className="flex-1 py-2.5 rounded-[8px] border-none text-[13px] font-semibold bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] text-white cursor-pointer">Send Quote</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
