import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageCircle, Send, Inbox } from 'lucide-react';
import { useSelector } from 'react-redux';
import { chatApi } from '@/shared/services/chat.api';
import { useChat } from '@/shared/hooks/useChat';
import styles from './SupplierInbox.module.css';

type Filter = 'all' | 'unread';

const SupplierInbox: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');

  const { messages, sendMessage, handleTyping, isTyping } = useChat(activeConv?._id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Load conversations ───────────────────────────────────────────
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Helpers ──────────────────────────────────────────────────────
  const getBuyer = (conv: any) => conv.buyerId;

  const getUnread = (conv: any) => conv.unreadCount?.[user?.id] || 0;

  const filteredConversations = conversations.filter((conv) => {
    const buyer = getBuyer(conv);
    const matchesSearch = buyer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || getUnread(conv) > 0;
    return matchesSearch && matchesFilter;
  });

  const handleSelectConv = (conv: any) => {
    setActiveConv(conv);
    setInputText('');
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    const receiverId = getBuyer(activeConv)?._id;
    if (!receiverId) return;
    sendMessage(inputText, receiverId);
    setInputText('');
    handleTyping(false);
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── Left: Conversation List ─────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1>Inbox</h1>
          <div className={styles.searchBar}>
            <Search size={14} />
            <input
              placeholder="Search buyers…"
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
              const buyer = getBuyer(conv);
              const unread = getUnread(conv);
              const isActive = activeConv?._id === conv._id;

              return (
                <div
                  key={conv._id}
                  className={`${styles.convItem} ${isActive ? styles.convItemActive : ''}`}
                  onClick={() => handleSelectConv(conv)}
                >
                  <div className={styles.avatar}>
                    {buyer?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className={styles.convMeta}>
                    {conv.productId?.name && (
                      <span className={styles.productTag}>
                        {conv.productId.name}
                      </span>
                    )}
                    <div className={styles.convName}>
                      <span>{buyer?.name || 'Buyer'}</span>
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

      {/* ── Right: Chat Thread ──────────────────────────────────── */}
      <main className={styles.chatPanel}>
        {!activeConv ? (
          <div className={styles.noChat}>
            <Inbox size={48} strokeWidth={1} />
            <p>Select a conversation to start replying</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.avatar}>
                {getBuyer(activeConv)?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className={styles.chatHeaderInfo}>
                <span className={styles.chatHeaderName}>
                  {getBuyer(activeConv)?.name || 'Buyer'}
                </span>
                <span className={styles.chatHeaderSub}>
                  {isTyping
                    ? 'Typing…'
                    : activeConv.productId?.name
                      ? `Enquiry: ${activeConv.productId.name}`
                      : 'General enquiry'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.chatMessages}>
              {messages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={`${styles.message} ${
                    msg.senderId === user?.id ? styles.sent : styles.received
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={styles.chatInputBar}>
              <input
                type="text"
                placeholder="Type your reply…"
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

export default SupplierInbox;
