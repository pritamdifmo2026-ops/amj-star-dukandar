import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Inbox, ArrowLeft, Check, CheckCheck, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { chatApi } from '@/shared/services/chat.api';
import { quotationApi } from '@/shared/services/quotation.api';
import { useChat } from '@/shared/hooks/useChat';
import { useSocket } from '@/shared/contexts/SocketContext';
import { paymentApi } from '@/shared/services/payment.api';
import styles from './ChatInbox.module.css';

type Filter = 'all' | 'unread';

const ChatInbox: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');

  // Quotation State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    itemName: '',
    quantity: 1,
    price: 0,
    shipping: 0,
    terms: 'Standard delivery terms apply.'
  });

  const { messages, sendMessage, handleTyping, isTyping, loadMessages } = useChat(activeConv?._id);
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Load conversations ───────────────────────────────────────────
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notif: any) => {
      if (notif.type === 'CHAT_MESSAGE') {
        loadConversations();
        if (activeConv?._id === notif.conversationId) {
          loadMessages();
        }
      }
    };
    socket.on('new_notification', handleNotification);
    socket.on('new_message', (msg) => {
      if (activeConv?._id === msg.conversationId) {
        // useChat already handles this usually, but double check
      }
    });
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
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // ─── Helpers ──────────────────────────────────────────────────────
  const getOtherParticipant = (conv: any) => {
    const currentUserId = user?._id || user?.id;
    const buyerId = conv?.buyerId?._id || conv?.buyerId;

    if (buyerId?.toString() === currentUserId?.toString()) {
      return conv?.supplierId;
    }
    return conv?.buyerId;
  };

  const getUnread = (conv: any) => conv.unreadCount?.[user?.id] || 0;

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    const otherName = other?.name || 'User';
    const matchesSearch = otherName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || getUnread(conv) > 0;
    return matchesSearch && matchesFilter;
  });

  const handleSelectConv = (conv: any) => {
    setActiveConv(conv);
    setInputText('');
    setQuoteForm(prev => ({
      ...prev,
      itemName: conv.productId?.name || ''
    }));
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
      loadMessages(); // Refresh messages to show quotation
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

      // Initialize Razorpay Payment
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

      console.log('💳 [Razorpay] Opening checkout with options:', JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId
      }, null, 2));

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

  // ─── Sub-Components ──────────────────────────────────────────────
  const QuotationCard = ({ msg }: { msg: any }) => {
    const isMine = (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString();
    const [quote, setQuote] = useState<any>(null);

    useEffect(() => {
      if (msg.quotationId) {
        quotationApi.getQuotation(msg.quotationId).then(setQuote);
      }
    }, [msg.quotationId]);

    if (!quote) return <div className={styles.messageText}>Loading quotation...</div>;

    return (
      <div className={styles.quotationCard}>
        <div className={styles.quotationHeader}>
          <h4>Quotation</h4>
          <span className={styles.quotationStatus}>{quote.status}</span>
        </div>
        <div className={styles.quotationItems}>
          {quote.items.map((item: any, i: number) => (
            <div key={i} className={styles.quotationItem}>
              <span>{item.name} x {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className={styles.quotationItem}>
            <span>Shipping</span>
            <span>₹{quote.shippingCost}</span>
          </div>
        </div>
        <div className={styles.quotationTotal}>
          <span>Total</span>
          <span>₹{quote.totalAmount + quote.shippingCost}</span>
        </div>
        {!isMine && quote.status === 'pending' && (
          <div className={styles.quotationActions}>
            <button className={styles.acceptBtn} onClick={() => handleAcceptQuote(quote._id)}>Accept & Order</button>
            <button className={styles.rejectBtn} onClick={() => handleRejectQuote(quote._id)}>Reject</button>
          </div>
        )}
        {quote.status === 'accepted' && (
          <div className={styles.paymentBadge}>
            Quotation Accepted. Waiting for Payment...
            {!isMine && <button className={styles.payNowInlineBtn} onClick={() => handlePayment(quote.orderId?._id || quote.orderId)}>Pay Now</button>}
          </div>
        )}
        {quote.status === 'accepted' && (
          <div className={styles.paymentBadge}>
            Quotation Accepted. Waiting for Payment...
            {!isMine && <button className={styles.payNowInlineBtn} onClick={() => handlePayment(quote.orderId?._id || quote.orderId)}>Pay Now</button>}
          </div>
        )}
        {quote.status === 'ordered' && (
          <div className={styles.orderBadge}>Order Created ✅</div>
        )}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── Left: List ── */}
      <aside className={styles.sidebar} data-chat-active={!!activeConv}>
        <div className={styles.sidebarHeader}>
          <h1>Messages</h1>
          <div className={styles.searchBar}>
            <Search size={14} />
            <input placeholder="Search chats…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className={styles.filterTabs}>
          <button className={filter === 'all' ? styles.filterTabActive : styles.filterTab} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'unread' ? styles.filterTabActive : styles.filterTab} onClick={() => setFilter('unread')}>Unread</button>
        </div>
        <div className={styles.convList}>
          {filteredConversations.length === 0 ? (
            <div className={styles.emptyList}>No conversations yet.</div>
          ) : (
            filteredConversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const unread = getUnread(conv);
              const isActive = activeConv?._id === conv._id;
              return (
                <div key={conv._id} className={`${styles.convItem} ${isActive ? styles.convItemActive : ''}`} onClick={() => handleSelectConv(conv)}>
                  <div className={styles.avatar}>{other?.name?.[0]?.toUpperCase() || '?'}</div>
                  <div className={styles.convMeta}>
                    {conv.productId?.name && <span className={styles.productTag}>{conv.productId.name}</span>}
                    <div className={styles.convName}>
                      <span>{other?.name || 'User'}</span>
                      <span className={styles.convTime}>{new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={styles.convPreview}>
                      <span className={styles.previewText}>{conv.lastMessage || 'Start of conversation'}</span>
                      {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Right: Thread ── */}
      <main className={styles.chatPanel} data-chat-active={!!activeConv}>
        {!activeConv ? (
          <div className={styles.noChat}>
            <div className={styles.emptyStateCard}>
              <div className={styles.emptyStateIcon}><Inbox size={40} strokeWidth={1.5} /></div>
              <h3>Your Messages</h3>
              <p>Select a conversation from the list to view chat history and start messaging.</p>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.chatHeader}>
              <button className={styles.mobileBackBtn} onClick={() => setActiveConv(null)} style={{ border: 'none', background: 'none', marginRight: '10px', display: 'none' }}><ArrowLeft size={20} /></button>
              <div className={styles.avatar}>{getOtherParticipant(activeConv)?.name?.[0]?.toUpperCase() || '?'}</div>
              <div className={styles.chatHeaderInfo}>
                <span className={styles.chatHeaderName}>{getOtherParticipant(activeConv)?.name || 'User'}</span>
                <span className={styles.chatHeaderSub}>{isTyping ? 'Typing…' : activeConv.productId?.name ? `Context: ${activeConv.productId.name}` : 'Active chat'}</span>
              </div>

              {/* Only show "Send Quote" if user is a supplier (role check) */}
              {user?.role === 'supplier' && (
                <button className={styles.quoteBtn} onClick={() => setIsQuoteModalOpen(true)}>
                  <FileText size={16} /> Send Quotation
                </button>
              )}
            </div>

            <div className={styles.chatMessages}>
              {messages.map((msg, idx) => (
                <div key={msg._id || idx} className={`${styles.message} ${(msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString() ? styles.sent : styles.received}`}>
                  {msg.messageType === 'quotation' ? (
                    <QuotationCard msg={msg} />
                  ) : (
                    <div className={styles.messageText}>{msg.text}</div>
                  )}
                  {(msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString() && (
                    <div className={styles.messageStatus}>
                      {msg.isRead ? <CheckCheck size={14} className={styles.readIcon} /> : <Check size={14} className={styles.sentIcon} />}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.chatInputBar}>
              <input type="text" placeholder="Type your message…" value={inputText} onChange={(e) => { setInputText(e.target.value); handleTyping(e.target.value.length > 0); }} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
              <button className={styles.sendBtn} onClick={handleSend} disabled={!inputText.trim()}><Send size={17} /></button>
            </div>
          </>
        )}
      </main>

      {/* ── Quotation Modal ── */}
      {isQuoteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Send Quotation</h2>
            <div className={styles.formGroup}>
              <label>Item Name</label>
              <input type="text" value={quoteForm.itemName} onChange={(e) => setQuoteForm({ ...quoteForm, itemName: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Quantity</label>
                <input type="number" value={quoteForm.quantity} onChange={(e) => setQuoteForm({ ...quoteForm, quantity: Number(e.target.value) })} />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Unit Price (₹)</label>
                <input type="number" value={quoteForm.price} onChange={(e) => setQuoteForm({ ...quoteForm, price: Number(e.target.value) })} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Shipping Cost (₹)</label>
              <input type="number" value={quoteForm.shipping} onChange={(e) => setQuoteForm({ ...quoteForm, shipping: Number(e.target.value) })} />
            </div>
            <div className={styles.formGroup}>
              <label>Terms & Conditions</label>
              <textarea rows={3} value={quoteForm.terms} onChange={(e) => setQuoteForm({ ...quoteForm, terms: e.target.value })} />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setIsQuoteModalOpen(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleCreateQuotation}>Send Quote</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInbox;
