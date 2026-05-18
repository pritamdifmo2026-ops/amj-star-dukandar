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
import styles from './FloatingChat.module.css';

/**
 * 3 UI States:
 *  CLOSED     – only the bubble is visible
 *  MINIMIZED  – a compact pill bar shows who you're talking to
 *  ACTIVE     – full chat window expanded above the bubble
 *
 * Sub-state inside ACTIVE:
 *  'list'  – conversation list panel
 *  'chat'  – active conversation panel
 */
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
    
    // Compare as strings to avoid object/string mismatch
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
  }, [activeChatId]); // intentionally not including conversations

  // ─── Actions ──────────────────────────────────────────────────────────────
  const openConversation = (conv: any) => {
    setActiveConv(conv);
    setPanel('chat');
    if (uiState !== 'ACTIVE') setUiState('ACTIVE');
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    
    console.log('[Chat] Full activeConv:', JSON.stringify(activeConv, null, 2));
    
    const other = getOtherUser(activeConv);
    
    // other can be: a populated user object {_id, name} OR a raw ObjectId string
    const receiverId: string | undefined = 
      typeof other === 'string' ? other :
      typeof other === 'object' && other !== null ? (other._id?.toString() || other.id?.toString()) :
      undefined;
    
    console.log('[Chat] handleSend →', { other, receiverId, activeConv: activeConv._id });
    
    if (!receiverId) {
      console.warn('[Chat] Cannot send: receiverId is undefined', other);
      return;
    }
    
    sendMessage(inputText, receiverId);
    setInputText('');
    handleTyping(false);
  };

  const handleMinimize = () => {
    // From ACTIVE → MINIMIZED (only if there's an active conversation to show)
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
      // If we have an active conversation, go back to chat panel, else list
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
        {quote.status === 'ordered' && (
          <div className={styles.orderBadge}>Order Created ✅</div>
        )}
      </div>
    );
  };

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (!isAuthenticated) return null;

  const otherUser = getOtherUser(activeConv);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.floatingContainer}>

      {/* ── STATE: ACTIVE ─────────────────────────────────────────── */}
      {uiState === 'ACTIVE' && (
        <div className={`${styles.chatWindow} ${panel === 'list' ? styles.listView : ''}`}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              {panel === 'chat' && activeConv ? (
                <>
                  <div className={styles.avatar}>
                    {otherUser?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className={styles.headerText}>
                    <h3>{otherUser?.name || 'Supplier'}</h3>
                    {isTyping
                      ? <p>Typing…</p>
                      : activeConv.productId?.name
                        ? <p>Re: {activeConv.productId.name}</p>
                        : null}
                  </div>
                </>
              ) : (
                <div className={styles.headerText}>
                  <h3>Messages</h3>
                </div>
              )}
            </div>
            <div className={styles.headerActions}>
              {panel === 'chat' && user?.role === 'supplier' && (
                <button 
                  className={styles.quoteBtn} 
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
                  className={styles.iconButton}
                  onClick={() => setPanel('list')}
                  title="All conversations"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              {/* Minimize → MINIMIZED pill */}
              <button
                className={styles.iconButton}
                onClick={handleMinimize}
                title="Minimize"
              >
                <ChevronDown size={16} />
              </button>
              {/* Close → CLOSED bubble */}
              <button
                className={styles.iconButton}
                onClick={handleClose}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className={styles.chatBody}>
            {panel === 'list' ? (
              <div className={styles.convList}>
                {conversations.length === 0 ? (
                  <div className={styles.emptyState}>No conversations yet.</div>
                ) : (
                  conversations.map((conv) => {
                    const other = getOtherUser(conv);
                    const unread = conv.unreadCount?.[user?.id] || 0;
                    return (
                      <div
                        key={conv._id}
                        className={styles.convItem}
                        onClick={() => openConversation(conv)}
                      >
                        <div className={styles.avatar}>
                          {other?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className={styles.convInfo}>
                          <span className={styles.convName}>{other?.name || 'User'}</span>
                          <span className={styles.convLastMsg}>
                            {conv.productId ? `[${conv.productId.name}] ` : ''}
                            {conv.lastMessage || 'Start a conversation'}
                          </span>
                        </div>
                        <div className={styles.convMeta}>
                          <span className={styles.convTime}>
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {unread > 0 && (
                            <span className={styles.convUnread}>{unread}</span>
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
                    className={`${styles.message} ${
                      (msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString() 
                        ? styles.sent 
                        : styles.received
                    }`}
                  >
                    {msg.messageType === 'quotation' ? (
                      <QuotationCard msg={msg} />
                    ) : (
                      <div className={styles.messageText}>{msg.text}</div>
                    )}
                    {(msg.senderId?._id || msg.senderId)?.toString() === (user?._id || user?.id)?.toString() && (
                      <div className={styles.messageStatus}>
                        {msg.isRead ? (
                          <CheckCheck size={12} className={styles.readIcon} />
                        ) : (
                          <Check size={12} className={styles.sentIcon} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input — only in chat panel */}
          {panel === 'chat' && (
            <div className={styles.chatInput}>
              <input
                type="text"
                placeholder="Type a message…"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleTyping(e.target.value.length > 0);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                className={styles.sendButton}
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
          className={styles.minimizedBar}
          onClick={() => { setUiState('ACTIVE'); setPanel('chat'); }}
          title="Expand chat"
        >
          <div className={styles.minimizedAvatar}>
            {otherUser?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className={styles.minimizedInfo}>
            <span className={styles.minimizedName}>{otherUser?.name || 'User'}</span>
            <span className={styles.minimizedPreview}>
              {activeConv.lastMessage || 'Tap to continue…'}
            </span>
          </div>
          <div className={styles.minimizedActions} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.iconButton}
              style={{ background: 'transparent', color: '#888' }}
              onClick={handleClose}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Bubble (always visible) ───────────────────────────────── */}
      <div className={styles.chatBubble} onClick={handleBubbleClick}>
        {uiState === 'ACTIVE' ? (
          <ChevronDown size={26} />
        ) : (
          <>
            <MessageCircle size={26} />
            {totalUnread > 0 && (
              <div className={styles.notificationBadge}>
                {totalUnread > 99 ? '99+' : totalUnread}
              </div>
            )}
          </>
        )}
      </div>
      {/* ── Quotation Modal ── */}
      {isQuoteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Send Quotation</h2>
            <div className={styles.formGroup}>
              <label>Item Name</label>
              <input type="text" value={quoteForm.itemName} onChange={(e) => setQuoteForm({...quoteForm, itemName: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Quantity</label>
                <input type="number" value={quoteForm.quantity} onChange={(e) => setQuoteForm({...quoteForm, quantity: Number(e.target.value)})} />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Unit Price (₹)</label>
                <input type="number" value={quoteForm.price} onChange={(e) => setQuoteForm({...quoteForm, price: Number(e.target.value)})} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Shipping Cost (₹)</label>
              <input type="number" value={quoteForm.shipping} onChange={(e) => setQuoteForm({...quoteForm, shipping: Number(e.target.value)})} />
            </div>
            <div className={styles.formGroup}>
              <label>Terms & Conditions</label>
              <textarea rows={3} value={quoteForm.terms} onChange={(e) => setQuoteForm({...quoteForm, terms: e.target.value})} />
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
