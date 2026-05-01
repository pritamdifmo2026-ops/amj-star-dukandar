import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Inbox, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import { chatApi } from '@/shared/services/chat.api';
import { useChat } from '@/shared/hooks/useChat';
import { useSocket } from '@/shared/contexts/SocketContext';
import styles from './ChatInbox.module.css';

type Filter = 'all' | 'unread';

const ChatInbox: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');

  const { messages, sendMessage, handleTyping, isTyping } = useChat(activeConv?._id);
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Load conversations ───────────────────────────────────────────
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notif: any) => {
      if (notif.type === 'CHAT_MESSAGE') loadConversations();
    };
    socket.on('new_notification', handleNotification);
    return () => {
      socket.off('new_notification', handleNotification);
    };
  }, [socket]);

  const loadConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Helpers ──────────────────────────────────────────────────────
  // Get the "other" person in the conversation
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
    const matchesSearch = other?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || getUnread(conv) > 0;
    return matchesSearch && matchesFilter;
  });

  const handleSelectConv = (conv: any) => {
    setActiveConv(conv);
    setInputText('');
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    const other = getOtherParticipant(activeConv);
    
    const receiverId: string | undefined =
      typeof other === 'string' ? other :
      typeof other === 'object' && other !== null ? (other._id?.toString() || other.id?.toString()) :
      undefined;
    
    console.log('[ChatInbox] handleSend →', { other, receiverId, convId: activeConv._id });
    
    if (!receiverId) {
      console.warn('[ChatInbox] Cannot send: receiverId is undefined', other);
      return;
    }
    sendMessage(inputText, receiverId);
    setInputText('');
    handleTyping(false);
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── Left: List ── */}
      <aside 
        className={styles.sidebar} 
        data-chat-active={!!activeConv}
      >
        <div className={styles.sidebarHeader}>
          <h1>Messages</h1>
          <div className={styles.searchBar}>
            <Search size={14} />
            <input
              placeholder="Search chats…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterTabs}>
          <button
            className={filter === 'all' ? styles.filterTabActive : styles.filterTab}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'unread' ? styles.filterTabActive : styles.filterTab}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
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
                <div
                  key={conv._id}
                  className={`${styles.convItem} ${isActive ? styles.convItemActive : ''}`}
                  onClick={() => handleSelectConv(conv)}
                >
                  <div className={styles.avatar}>
                    {other?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className={styles.convMeta}>
                    {conv.productId?.name && (
                      <span className={styles.productTag}>
                        {conv.productId.name}
                      </span>
                    )}
                    <div className={styles.convName}>
                      <span>{other?.name || 'User'}</span>
                      <span className={styles.convTime}>
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className={styles.convPreview}>
                      <span>{conv.lastMessage || 'Start of conversation'}</span>
                      {unread > 0 && (
                        <span className={styles.unreadBadge}>{unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Right: Thread ── */}
      <main 
        className={styles.chatPanel}
        data-chat-active={!!activeConv}
      >
        {!activeConv ? (
          <div className={styles.noChat}>
            <Inbox size={48} strokeWidth={1} />
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className={styles.chatHeader}>
              <button 
                className={styles.mobileBackBtn} 
                onClick={() => setActiveConv(null)}
                style={{ border: 'none', background: 'none', marginRight: '10px', display: 'none' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div className={styles.avatar}>
                {getOtherParticipant(activeConv)?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className={styles.chatHeaderInfo}>
                <span className={styles.chatHeaderName}>
                  {getOtherParticipant(activeConv)?.name || 'User'}
                </span>
                <span className={styles.chatHeaderSub}>
                  {isTyping
                    ? 'Typing…'
                    : activeConv.productId?.name
                      ? `Context: ${activeConv.productId.name}`
                      : 'Active chat'}
                </span>
              </div>
            </div>

            <div className={styles.chatMessages}>
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
                        <CheckCheck size={14} className={styles.readIcon} />
                      ) : (
                        <Check size={14} className={styles.sentIcon} />
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.chatInputBar}>
              <input
                type="text"
                placeholder="Type your message…"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleTyping(e.target.value.length > 0);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!inputText.trim()}
              >
                <Send size={17} />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ChatInbox;
