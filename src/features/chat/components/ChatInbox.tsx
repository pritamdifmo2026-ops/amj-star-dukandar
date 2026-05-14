import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Inbox, ArrowLeft, Check, CheckCheck, FileText, MoreVertical, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { chatApi } from '@/features/chat/services/chat.api';
import { quotationApi } from '@/features/supplier/services/quotation.api';
import { useChat } from '@/shared/hooks/useChat';
import { useSocket } from '@/shared/contexts/SocketContext';
import { paymentApi } from '@/features/order/services/payment.api';

type Filter = 'all' | 'unread';

const inputCls = "w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary transition-colors";
const labelCls = "text-xs font-bold uppercase text-[#94a3b8] tracking-wider block mb-1.5";

const ChatInbox: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    itemName: '', quantity: 1, price: 0, shipping: 0, terms: 'Standard delivery terms apply.'
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { messages, sendMessage, handleTyping, isTyping, loadMessages } = useChat(activeConv?._id);
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
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
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete chat');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notif: any) => {
      if (notif.type === 'CHAT_MESSAGE') {
        loadConversations();
        if (activeConv?._id === notif.conversationId) loadMessages();
      }
    };
    socket.on('new_notification', handleNotification);
    socket.on('new_message', () => {});
    return () => {
      socket.off('new_notification', handleNotification);
      socket.off('new_message');
    };
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
    setInputText('');
    setQuoteForm(prev => ({ ...prev, itemName: conv.productId?.name || '' }));
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    const other = getOtherParticipant(activeConv);
    const receiverId = typeof other === 'string' ? other : other?._id || other?.id;
    if (!receiverId) return;
    sendMessage(inputText, receiverId);
    setInputText('');
    handleTyping(false);
  };

  const handleCreateQuotation = async () => {
    if (!activeConv) return;
    const other = getOtherParticipant(activeConv);
    const buyerId = typeof other === 'string' ? other : other?._id || other?.id;
    try {
      await quotationApi.createQuotation({
        conversationId: activeConv._id,
        buyerId,
        items: [{ name: quoteForm.itemName, quantity: quoteForm.quantity, price: quoteForm.price }],
        totalAmount: quoteForm.quantity * quoteForm.price,
        shippingCost: quoteForm.shipping,
        terms: quoteForm.terms
      });
      setIsQuoteModalOpen(false);
      loadMessages();
      toast.success('Quotation sent successfully!');
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
        name: 'AMJStar Dukandar',
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
        theme: { color: '#ff4d4d' }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
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

  const QuotationCard = ({ msg }: { msg: any }) => {
    const isMine = (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString();
    const [quote, setQuote] = useState<any>(null);

    useEffect(() => {
      if (msg.quotationId) {
        quotationApi.getQuotation(msg.quotationId).then(setQuote);
      }
    }, [msg.quotationId]);

    if (!quote) return <div className="text-xs text-[#94a3b8] italic">Loading quotation...</div>;

    const statusCls: Record<string, string> = {
      pending: 'bg-[#fffbeb] text-[#a16207]',
      accepted: 'bg-[#ecfdf5] text-[#059669]',
      rejected: 'bg-[#fef2f2] text-[#dc2626]',
      ordered: 'bg-[#eff6ff] text-[#0369a1]',
    };

    return (
      <div className="bg-white border border-[#eef2f6] rounded-[10px] overflow-hidden min-w-[260px] max-w-[340px]">
        <div className="flex items-center justify-between px-4 py-3 bg-[#f8fafc] border-b border-[#f1f5f9]">
          <span className="text-xs font-extrabold text-[#0f172a]">Quotation</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCls[quote.status] || 'bg-[#f1f5f9] text-[#475569]'}`}>{quote.status}</span>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2">
          {quote.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-xs text-[#475569]">
              <span>{item.name} x {item.quantity}</span>
              <span className="font-semibold">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs text-[#475569]">
            <span>Shipping</span>
            <span className="font-semibold">₹{quote.shippingCost}</span>
          </div>
          <div className="flex justify-between text-sm font-extrabold text-[#0f172a] pt-2 border-t border-[#f1f5f9]">
            <span>Total</span>
            <span>₹{quote.totalAmount + quote.shippingCost}</span>
          </div>
        </div>
        {!isMine && quote.status === 'pending' && (
          <div className="flex gap-2 px-4 pb-3">
            <button className="flex-1 py-2 text-xs font-bold text-white bg-[#059669] rounded-[6px] border-none cursor-pointer hover:bg-[#047857]" onClick={() => handleAcceptQuote(quote._id)}>
              Accept & Order
            </button>
            <button className="flex-1 py-2 text-xs font-bold text-[#dc2626] bg-[#fef2f2] rounded-[6px] border-none cursor-pointer hover:bg-[#fee2e2]" onClick={() => handleRejectQuote(quote._id)}>
              Reject
            </button>
          </div>
        )}
        {quote.status === 'accepted' && (
          <div className="px-4 pb-3 flex items-center justify-between gap-2 text-xs text-[#64748b]">
            <span>Accepted — Waiting for payment</span>
            {!isMine && (
              <button className="text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-[6px] border-none cursor-pointer hover:opacity-90" onClick={() => handlePayment(quote.orderId?._id || quote.orderId)}>
                Pay Now
              </button>
            )}
          </div>
        )}
        {quote.status === 'ordered' && (
          <div className="px-4 pb-3 text-xs font-bold text-[#059669]">Order Created ✅</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      <aside
        className={`w-[300px] max-lg:w-full border-r border-[#f1f5f9] flex flex-col shrink-0 ${activeConv ? 'max-lg:hidden' : ''}`}
      >
        <div className="px-6 pt-10 pb-4 border-b border-[#f1f5f9]">
          <h1 className="text-xl font-extrabold text-[#0f172a] m-0 mb-4">Messages</h1>
          <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2 focus-within:border-primary bg-[#f8fafc]">
            <Search size={14} className="text-[#94a3b8] shrink-0" />
            <input
              className="border-none outline-none text-sm bg-transparent flex-1 text-[#1e293b] placeholder:text-[#94a3b8]"
              placeholder="Search chats…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex border-b border-[#f1f5f9]">
          {(['all', 'unread'] as Filter[]).map(f => (
            <button
              key={f}
              className={`flex-1 py-2.5 text-xs font-bold capitalize cursor-pointer border-none transition-colors ${filter === f ? 'text-primary border-b-2 border-primary bg-[#fff7ed]' : 'text-[#94a3b8] bg-transparent hover:text-[#475569]'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#94a3b8] gap-2">
              <Inbox size={32} strokeWidth={1.5} />
              <p className="text-xs m-0">No conversations yet.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const unread = getUnread(conv);
              const isActive = activeConv?._id === conv._id;
              const isMenuOpen = openMenuId === conv._id;
              const isDeleting = deletingId === conv._id;
              return (
                <div
                  key={conv._id}
                  className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-[#f8fafc] ${isActive ? 'bg-[#fff7ed]' : 'hover:bg-[#f8fafc]'} ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                  onClick={() => handleSelectConv(conv)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${isActive ? 'bg-primary text-white' : 'bg-[#f1f5f9] text-[#475569]'}`}>
                    {other?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {conv.productId?.name && (
                      <span className="text-[10px] font-bold text-primary bg-[#fff7ed] px-1.5 py-0.5 rounded-full">{conv.productId.name}</span>
                    )}
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-semibold text-[#0f172a] truncate">{other?.name || 'User'}</span>
                      <span className="text-[10px] text-[#94a3b8] shrink-0 mr-5">{new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-[#94a3b8] truncate">{conv.lastMessage || 'Start of conversation'}</span>
                      {unread > 0 && (
                        <span className="text-[10px] font-extrabold bg-primary text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0 mr-5">{unread}</span>
                      )}
                    </div>
                  </div>

                  {/* Three-dot menu */}
                  <button
                    className="absolute right-2 top-3 w-7 h-7 flex items-center justify-center rounded-full text-[#94a3b8] bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-[#f1f5f9] hover:text-[#475569] transition-opacity"
                    onClick={e => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : conv._id); }}
                  >
                    <MoreVertical size={15} />
                  </button>

                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-2 top-9 z-50 bg-white border border-[#e2e8f0] rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.1)] py-1 min-w-[140px]"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-[#dc2626] bg-transparent border-none cursor-pointer hover:bg-[#fef2f2] transition-colors"
                        onClick={e => handleDeleteConv(e, conv._id)}
                      >
                        <Trash2 size={13} /> Delete Chat
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col min-w-0 ${!activeConv ? 'max-lg:hidden' : ''}`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center p-8">
              <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center text-[#94a3b8]">
                <Inbox size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-extrabold text-[#0f172a] m-0">Your Messages</h3>
              <p className="text-sm text-[#64748b] m-0 max-w-[300px]">Select a conversation from the list to view chat history and start messaging.</p>
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
                <div className="text-xs text-[#94a3b8]">{isTyping ? 'Typing…' : activeConv.productId?.name ? `Context: ${activeConv.productId.name}` : 'Active chat'}</div>
              </div>
              {user?.role === 'supplier' && (
                <button
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] cursor-pointer hover:bg-[#ffedd5]"
                  onClick={() => setIsQuoteModalOpen(true)}
                >
                  <FileText size={14} /> Send Quotation
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-[#f8fafc]">
              {messages.map((msg, idx) => {
                const isMine = (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString();
                return (
                  <div key={msg._id || idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {msg.messageType === 'quotation' ? (
                      <QuotationCard msg={msg} />
                    ) : (
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-[12px] text-sm ${isMine ? 'bg-primary text-white rounded-br-[4px]' : 'bg-white text-[#334155] border border-[#eef2f6] rounded-bl-[4px]'}`}>
                        {msg.text}
                      </div>
                    )}
                    {isMine && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {msg.isRead
                          ? <CheckCheck size={13} className="text-[#38bdf8]" />
                          : <Check size={13} className="text-[#94a3b8]" />}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-3 px-4 py-3 border-t border-[#f1f5f9] bg-white">
              <input
                type="text"
                placeholder="Type your message…"
                value={inputText}
                onChange={e => { setInputText(e.target.value); handleTyping(e.target.value.length > 0); }}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 border border-[#e2e8f0] rounded-[8px] px-4 py-2.5 text-sm text-[#1e293b] outline-none focus:border-primary bg-[#f8fafc]"
              />
              <button
                className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                onClick={handleSend}
                disabled={!inputText.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </main>

      {isQuoteModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-50 flex items-center justify-center px-4" onClick={() => setIsQuoteModalOpen(false)}>
          <div className="bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 w-full max-w-[440px]" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-extrabold text-[#0f172a] m-0 mb-5">Send Quotation</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Item Name</label>
                <input type="text" value={quoteForm.itemName} onChange={e => setQuoteForm({ ...quoteForm, itemName: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Quantity</label>
                  <input type="number" value={quoteForm.quantity} onChange={e => setQuoteForm({ ...quoteForm, quantity: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Unit Price (₹)</label>
                  <input type="number" value={quoteForm.price} onChange={e => setQuoteForm({ ...quoteForm, price: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Shipping Cost (₹)</label>
                <input type="number" value={quoteForm.shipping} onChange={e => setQuoteForm({ ...quoteForm, shipping: Number(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Terms & Conditions</label>
                <textarea rows={3} value={quoteForm.terms} onChange={e => setQuoteForm({ ...quoteForm, terms: e.target.value })} className={inputCls + " resize-none"} />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-5">
              <button className="px-4 py-2 text-sm font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] cursor-pointer hover:bg-[#f1f5f9]" onClick={() => setIsQuoteModalOpen(false)}>
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-[8px] border-none cursor-pointer hover:opacity-90" onClick={handleCreateQuotation}>
                Send Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInbox;
