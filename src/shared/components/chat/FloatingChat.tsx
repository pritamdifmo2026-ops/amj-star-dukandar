import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  MessageCircle,
  X,
  ChevronDown,
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  FileText
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

  // Quotation State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    itemName: '',
    quantity: 1,
    price: 0,
    shipping: 0,
    terms: 'Standard delivery terms apply.'
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getOtherUser = (conv: any) => {
    const currentUserId = user?._id || user?.id;
    const buyerId = conv?.buyerId?._id || conv?.buyerId;
    
    if (buyerId?.toString() === currentUserId?.toString()) {
      return conv?.supplierId;
    }
    return conv?.buyerId;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ─── Load Conversations ───────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
      const unread = data.reduce(
        (acc: number, conv: any) => acc + (conv.unreadCount?.[user?.id] || 0),
        0
      );
      setTotalUnread(unread);
      return data;
    } catch (err) {
      console.error('loadConversations error', err);
    }
  }, [user?.id]);

  // Initial load when socket connects
  useEffect(() => {
    if (isAuthenticated && isConnected) loadConversations();
  }, [isAuthenticated, isConnected, loadConversations]);

  // Refresh conversations list on incoming notification
  useEffect(() => {
    if (!socket) return;
    const handler = (notif: any) => {
      if (notif.type === 'CHAT_MESSAGE') loadConversations();
    };
    socket.on('new_notification', handler);
    return () => { socket.off('new_notification', handler); };
  }, [socket, loadConversations]);

  // Auto-scroll when new messages arrive
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Global activeChatId sync (triggered by "Contact Supplier" buttons etc.)
  useEffect(() => {
    if (!activeChatId) return;
    const open = (data: any[]) => {
      const found = data.find((c) => c._id === activeChatId);
      if (found) {
        setActiveConv(found);
        setPanel('chat');
        setUiState('ACTIVE');
      }
    };
    const existing = conversations.find((c) => c._id === activeChatId);
    if (existing) {
      open(conversations);
    } else {
      loadConversations().then((data) => { if (data) open(data); });
    }
  }, [activeChatId]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const openConversation = (conv: any) => {
    setActiveConv(conv);
    setPanel('chat');
    if (uiState !== 'ACTIVE') setUiState('ACTIVE');
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    
    const other = getOtherUser(activeConv);
    const receiverId: string | undefined = 
      typeof other === 'string' ? other :
      typeof other === 'object' && other !== null ? (other._id?.toString() || other.id?.toString()) :
      undefined;
    
    if (!receiverId) {
      console.warn('[Chat] Cannot send: receiverId is undefined', other);
      return;
    }
    
    sendMessage(inputText, receiverId);
    setInputText('');
    handleTyping(false);
  };

  const handleMinimize = () => {
    if (activeConv) {
      setUiState('MINIMIZED');
    } else {
      setUiState('CLOSED');
    }
  };

  const handleClose = () => {
    setUiState('CLOSED');
  };

  const handleBubbleClick = () => {
    if (uiState === 'CLOSED' || uiState === 'MINIMIZED') {
      setUiState('ACTIVE');
      setPanel(activeConv ? 'chat' : 'list');
    } else {
      setUiState('MINIMIZED');
    }
  };

  const handleCreateQuotation = async () => {
    if (!activeConv) return;
    const other = getOtherUser(activeConv);
    const buyerId = typeof other === 'string' ? other : other?._id || other?.id;

    try {
      await quotationApi.createQuotation({
        conversationId: activeConv._id,
        buyerId: buyerId,
        items: [{
          name: quoteForm.itemName,
          quantity: quoteForm.quantity,
          price: quoteForm.price
        }],
        totalAmount: quoteForm.quantity * quoteForm.price,
        shippingCost: quoteForm.shipping,
        terms: quoteForm.terms
      });
      setIsQuoteModalOpen(false);
      loadMessages(); 
      toast.success('Quotation sent!');
    } catch (err) {
      console.error('Failed to create quotation', err);
      toast.error('Failed to send quotation');
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    const loadingToast = toast.loading('Creating order...');
    try {
      const { order } = await quotationApi.acceptQuotation(quoteId);
      loadMessages();
      toast.success('Order created!', { id: loadingToast });
      handlePayment(order._id);
    } catch (err: any) {
      console.error('Failed to accept quote', err);
      toast.error(err.response?.data?.message || 'Failed to accept quotation', { id: loadingToast });
    }
  };

  const handlePayment = async (orderId: string) => {
    const loadingToast = toast.loading('Initializing payment...');
    try {
      const data = await paymentApi.createOrder(orderId);
      
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'AMJStar',
        description: `Order #${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        handler: async function (response: any) {
          const verifyToast = toast.loading('Verifying payment...');
          try {
            await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success('Payment successful!', { id: verifyToast });
            loadMessages();
          } catch (err) {
            console.error('Verification failed', err);
            toast.error('Payment verification failed', { id: verifyToast });
          }
        },
        prefill: {
          name: data.prefill?.name || user?.name,
          email: data.prefill?.email || user?.email,
          contact: data.prefill?.contact || user?.phone || user?.phoneNumber || user?.contact
        },
        theme: {
          color: '#ff4d4d'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error('Payment failed: ' + response.error.description);
      });
      rzp.open();
      toast.dismiss(loadingToast);
    } catch (err: any) {
      console.error('Payment initialization failed', err);
      toast.error('Failed to initialize payment', { id: loadingToast });
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try {
      await quotationApi.rejectQuotation(quoteId);
      loadMessages();
    } catch (err) {
      console.error('Failed to reject quote', err);
    }
  };

  // ─── Sub-Components ───────────────────────────────────────────────────────
  const QuotationCard = ({ msg }: { msg: any }) => {
    const isMine = (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString();
    const [quote, setQuote] = useState<any>(null);

    useEffect(() => {
      if (msg.quotationId) {
        quotationApi.getQuotation(msg.quotationId).then(setQuote);
      }
    }, [msg.quotationId]);

    if (!quote) return <div className="mb-0.5">Loading quotation...</div>;

    return (
      <div className="bg-white rounded-xl border border-[#eee] p-3 my-1 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-gray-700">
        <div className="flex justify-between items-center mb-2 border-b border-[#f5f5f5] pb-1.5">
          <h4 className="m-0 text-[13px] font-semibold text-[#1a1a2e]">Quotation</h4>
          <span className="text-[10px] uppercase font-bold bg-[#fff3e0] text-[#ef6c00] py-0.5 px-1.5 rounded">{quote.status}</span>
        </div>
        <div className="text-xs flex flex-col gap-1 mb-2">
          {quote.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>{item.name} x {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>₹{quote.shippingCost}</span>
          </div>
        </div>
        <div className="flex justify-between font-bold text-[13px] border-t border-[#f5f5f5] pt-1.5 mb-2.5">
          <span>Total</span>
          <span>₹{quote.totalAmount + quote.shippingCost}</span>
        </div>
        {!isMine && quote.status === 'pending' && (
          <div className="flex gap-2">
            <button className="flex-1 p-1.5 border-none rounded-md text-[11px] font-semibold cursor-pointer transition-opacity duration-200 bg-[#4caf50] text-white hover:opacity-90" onClick={() => handleAcceptQuote(quote._id)}>Accept & Order</button>
            <button className="flex-1 p-1.5 border-none rounded-md text-[11px] font-semibold cursor-pointer transition-opacity duration-200 bg-[#f44336] text-white hover:opacity-90" onClick={() => handleRejectQuote(quote._id)}>Reject</button>
          </div>
        )}
        {quote.status === 'accepted' && (
          <div className="mt-3 bg-blue-50 text-blue-800 p-3 rounded-lg text-center text-[13px] font-semibold border border-blue-100 flex flex-col gap-2">
            Quotation Accepted. Waiting for Payment...
            {!isMine && <button className="bg-blue-600 text-white border-none py-1.5 px-3 rounded-md font-bold cursor-pointer text-xs transition-colors duration-200 hover:bg-blue-700 hover:-translate-y-0.5" onClick={() => handlePayment(quote.orderId?._id || quote.orderId)}>Pay Now</button>}
          </div>
        )}
        {quote.status === 'ordered' && (
          <div className="bg-[#e8f5e9] text-[#2e7d32] text-center text-[11px] font-semibold p-1.5 rounded-md">Order Created ✅</div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) return null;

  const otherUser = getOtherUser(activeConv);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans">

      {/* ── STATE: ACTIVE ─────────────────────────────────────────── */}
      {uiState === 'ACTIVE' && (
        <div className={`w-[360px] bg-white rounded-[10px] shadow-[0_12px_48px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-[slideUp_0.28s_ease-out] border border-black/5 ${panel === 'list' ? 'h-[460px]' : 'h-[520px]'}`}>
          {/* Header */}
          <div className="py-3 px-4 bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              {panel === 'chat' && activeConv ? (
                <>
                  <div className="w-8.5 h-8.5 rounded-full bg-white/30 flex items-center justify-center font-bold text-white text-[13px] shrink-0">
                    {otherUser?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="headerText">
                    <h3 className="m-0 text-sm font-semibold text-white leading-tight">{otherUser?.name || 'Supplier'}</h3>
                    {isTyping
                      ? <p className="m-0 text-[11px] text-white/85 leading-tight">Typing…</p>
                      : activeConv.productId?.name
                        ? <p className="m-0 text-[11px] text-white/85 leading-tight">Re: {activeConv.productId.name}</p>
                        : null}
                  </div>
                </>
              ) : (
                <div className="headerText">
                  <h3 className="m-0 text-sm font-semibold text-white leading-tight">Messages</h3>
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {panel === 'chat' && user?.role === 'supplier' && (
                <button 
                  className="bg-white/20 border border-white/45 text-white py-1 px-2 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors duration-200 hover:bg-white/30" 
                  onClick={() => {
                    setQuoteForm(prev => ({...prev, itemName: activeConv?.productId?.name || ''}));
                    setIsQuoteModalOpen(true);
                  }}
                  title="Send Quotation"
                >
                  <FileText size={14} /> Quote
                </button>
              )}
              {panel === 'chat' && (
                <button
                  className="bg-white/15 border-none text-white cursor-pointer w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 hover:bg-white/28"
                  onClick={() => setPanel('list')}
                  title="All conversations"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <button
                className="bg-white/15 border-none text-white cursor-pointer w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 hover:bg-white/28"
                onClick={handleMinimize}
                title="Minimize"
              >
                <ChevronDown size={16} />
              </button>
              <button
                className="bg-white/15 border-none text-white cursor-pointer w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 hover:bg-white/28"
                onClick={handleClose}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5 bg-[#f9fafb] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {panel === 'list' ? (
              <div className="flex flex-col">
                {conversations.length === 0 ? (
                  <div className="py-12 px-5 text-center text-[#aaa] text-[13px]">No conversations yet.</div>
                ) : (
                  conversations.map((conv) => {
                    const other = getOtherUser(conv);
                    const unread = conv.unreadCount?.[user?.id] || 0;
                    return (
                      <div
                        key={conv._id}
                        className="py-2.5 px-3.5 flex items-center gap-2.5 cursor-pointer transition-colors duration-150 border-b border-[#f3f3f3] hover:bg-[#f9fafb]"
                        onClick={() => openConversation(conv)}
                      >
                        <div className="w-8.5 h-8.5 rounded-full bg-white/30 flex items-center justify-center font-bold text-white text-[13px] shrink-0 bg-gradient-to-br from-[#ff4d4d] to-[#f9a825]">
                          {other?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[13px] text-[#1a1a2e] block truncate">{other?.name || 'User'}</span>
                          <span className="text-[11.5px] text-gray-500 truncate block">
                            {conv.productId ? `[${conv.productId.name}] ` : ''}
                            {conv.lastMessage || 'Start a conversation'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] text-gray-300">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {unread > 0 && (
                            <span className="bg-[#ff4d4d] text-white text-[10px] min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">{unread}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={msg._id || idx}
                    className={`max-w-[80%] py-2 px-3 rounded-lg text-[0.9rem] leading-relaxed relative ${
                      (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString() 
                        ? 'self-end bg-[var(--color-primary)] text-white rounded-br-[2px]' 
                        : 'self-start bg-white text-[#212529] rounded-bl-[4px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
                    }`}
                  >
                    {msg.messageType === 'quotation' ? (
                      <QuotationCard msg={msg} />
                    ) : (
                      <div className="mb-0.5">{msg.text}</div>
                    )}
                    {(msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString() && (
                      <div className="flex justify-end text-[10px] opacity-70">
                        {msg.isRead ? (
                          <CheckCheck size={12} className="text-[#4fc3f7]" />
                        ) : (
                          <Check size={12} className="text-white/60" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          {panel === 'chat' && (
            <div className="py-3 px-3.5 border-t border-[#f0f0f0] flex gap-2 items-center bg-white shrink-0">
              <input
                type="text"
                placeholder="Type a message…"
                className="flex-1 border border-[#eee] py-2 px-3.5 rounded-[22px] outline-none text-[13px] bg-[#f9fafb] transition-colors duration-200 focus:border-[#ff4d4d] focus:bg-white"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleTyping(e.target.value.length > 0);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                className="bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] text-white border-none w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.08] disabled:opacity-50 disabled:cursor-default disabled:transform-none shrink-0"
                onClick={handleSend}
                disabled={!inputText.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STATE: MINIMIZED ──────────────────────────────────────── */}
      {uiState === 'MINIMIZED' && activeConv && (
        <div
          className="w-[280px] bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-black/5 p-2.5 px-3.5 flex items-center gap-2.5 cursor-pointer transition-shadow duration-200 hover:shadow-[0_6px_24px_rgba(0,0,0,0.16)]"
          onClick={() => { setUiState('ACTIVE'); setPanel('chat'); }}
          title="Expand chat"
        >
          <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] flex items-center justify-center text-white font-bold text-[13px] shrink-0">
            {otherUser?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-semibold text-[#1a1a2e] block truncate">{otherUser?.name || 'User'}</span>
            <span className="text-[11px] text-gray-400 block truncate">
              {activeConv.lastMessage || 'Tap to continue…'}
            </span>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              className="bg-white/15 border-none text-white cursor-pointer w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 hover:bg-white/28 !bg-transparent !text-[#888]"
              onClick={handleClose}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Bubble (always visible) ───────────────────────────────── */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] shadow-[0_6px_20px_rgba(255,77,77,0.4)] flex items-center justify-center text-white cursor-pointer transition-all duration-250 ease-out active:scale-95 hover:scale-[1.12] hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(255,77,77,0.5)] relative shrink-0" onClick={handleBubbleClick}>
        {uiState === 'ACTIVE' ? (
          <ChevronDown size={26} />
        ) : (
          <>
            <MessageCircle size={26} />
            {totalUnread > 0 && (
              <div className="absolute -top-0.5 -right-0.5 bg-[#e53935] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white px-1">
                {totalUnread > 99 ? '99+' : totalUnread}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Quotation Modal ── */}
      {isQuoteModalOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-5 z-[100]">
          <div className="bg-white rounded-2xl w-full max-h-full overflow-y-auto p-4.5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h2 className="m-0 mb-4 text-base text-[#1a1a2e]">Send Quotation</h2>
            <div className="mb-3">
              <label className="block text-[11px] text-gray-500 mb-1 font-semibold">Item Name</label>
              <input type="text" className="w-full py-2 px-2.5 border border-gray-300 rounded-lg text-[13px] outline-none" value={quoteForm.itemName} onChange={(e) => setQuoteForm({...quoteForm, itemName: e.target.value})} />
            </div>
            <div className="flex gap-3">
              <div className="mb-3 flex-1">
                <label className="block text-[11px] text-gray-500 mb-1 font-semibold">Quantity</label>
                <input type="number" className="w-full py-2 px-2.5 border border-gray-300 rounded-lg text-[13px] outline-none" value={quoteForm.quantity} onChange={(e) => setQuoteForm({...quoteForm, quantity: Number(e.target.value)})} />
              </div>
              <div className="mb-3 flex-1">
                <label className="block text-[11px] text-gray-500 mb-1 font-semibold">Unit Price (₹)</label>
                <input type="number" className="w-full py-2 px-2.5 border border-gray-300 rounded-lg text-[13px] outline-none" value={quoteForm.price} onChange={(e) => setQuoteForm({...quoteForm, price: Number(e.target.value)})} />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-[11px] text-gray-500 mb-1 font-semibold">Shipping Cost (₹)</label>
              <input type="number" className="w-full py-2 px-2.5 border border-gray-300 rounded-lg text-[13px] outline-none" value={quoteForm.shipping} onChange={(e) => setQuoteForm({...quoteForm, shipping: Number(e.target.value)})} />
            </div>
            <div className="mb-3">
              <label className="block text-[11px] text-gray-500 mb-1 font-semibold">Terms & Conditions</label>
              <textarea rows={3} className="w-full py-2 px-2.5 border border-gray-300 rounded-lg text-[13px] outline-none" value={quoteForm.terms} onChange={(e) => setQuoteForm({...quoteForm, terms: e.target.value})} />
            </div>
            <div className="flex gap-2.5 mt-4">
              <button className="flex-1 p-2.5 rounded-lg border-none text-[13px] font-semibold cursor-pointer bg-[#f5f5f5] text-gray-500" onClick={() => setIsQuoteModalOpen(false)}>Cancel</button>
              <button className="flex-1 p-2.5 rounded-lg border-none text-[13px] font-semibold cursor-pointer bg-gradient-to-br from-[#ff4d4d] to-[#f9a825] text-white" onClick={handleCreateQuotation}>Send Quote</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
