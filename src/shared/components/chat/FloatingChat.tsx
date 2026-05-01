import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  X,
  ChevronDown,
  Maximize2,
  Send,
  List,
  ArrowLeft,
  Check,
  CheckCheck
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../contexts/SocketContext';
import { useChat } from '../../hooks/useChat';
import { chatApi } from '../../services/chat.api';
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
  const { socket, isConnected, activeChatId, setActiveChatId } = useSocket();

  const [uiState, setUiState] = useState<UIState>('CLOSED');
  const [panel, setPanel] = useState<ActivePanel>('list');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);

  const { messages, sendMessage, handleTyping, isTyping } = useChat(activeConv?._id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                    <div className={styles.messageText}>{msg.text}</div>
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
    </div>
  );
};
