import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Inbox } from 'lucide-react';
import { useSelector } from 'react-redux';
import { chatApi } from '@/features/chat/services/chat.api';
import { useSocket } from '@/shared/contexts/SocketContext';
import { useChat } from '@/shared/hooks/useChat';

type Filter = 'all' | 'unread';

const tabCls = (active: boolean) =>
  `flex-1 px-4 py-2.5 text-sm font-semibold cursor-pointer border-b-2 transition-all ${
    active ? 'text-primary border-primary font-bold' : 'text-[#64748b] border-transparent hover:text-[#1e293b]'
  }`;

const SupplierInbox: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');

  const { messages, sendMessage, handleTyping, isTyping } = useChat(activeConv?._id);
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notif: any) => {
      if (notif.type === 'CHAT_MESSAGE') loadConversations();
    };
    socket.on('new_notification', handleNotification);
    return () => { socket.off('new_notification', handleNotification); };
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

  const getBuyer = (conv: any) => conv.buyerId;
  const getUnread = (conv: any) => conv.unreadCount?.[user?.id] || 0;

  const filteredConversations = conversations.filter((conv) => {
    const buyer = getBuyer(conv);
    const matchesSearch = buyer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || getUnread(conv) > 0;
    return matchesSearch && matchesFilter;
  });

  const handleSelectConv = (conv: any) => { setActiveConv(conv); setInputText(''); };

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    const receiverId = getBuyer(activeConv)?._id;
    if (!receiverId) return;
    sendMessage(inputText, receiverId);
    setInputText('');
    handleTyping(false);
  };

  return (
    <div className="flex h-full min-h-[600px] bg-white rounded-[10px] border border-[#eef2f6] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[320px] shrink-0 border-r border-[#eef2f6] flex flex-col max-lg:w-[240px]">
        <div className="p-4 border-b border-[#eef2f6]">
          <h1 className="text-lg font-extrabold text-[#0f172a] m-0 mb-3">Inbox</h1>
          <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2">
            <Search size={14} className="text-[#94a3b8] shrink-0" />
            <input
              className="border-none outline-none bg-transparent text-sm flex-1 text-[#1e293b] placeholder:text-[#94a3b8]"
              placeholder="Search buyers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex border-b border-[#eef2f6]">
          <button className={tabCls(filter === 'all')} onClick={() => setFilter('all')}>All</button>
          <button className={tabCls(filter === 'unread')} onClick={() => setFilter('unread')}>Unread</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-[#94a3b8]">No conversations yet.</div>
          ) : (
            filteredConversations.map((conv) => {
              const buyer = getBuyer(conv);
              const unread = getUnread(conv);
              const isActive = activeConv?._id === conv._id;
              return (
                <div
                  key={conv._id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[#f1f5f9] transition-colors ${isActive ? 'bg-[#fff7ed]' : 'hover:bg-[#f8fafc]'}`}
                  onClick={() => handleSelectConv(conv)}
                >
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {buyer?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {conv.productId?.name && (
                      <span className="text-[10px] bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded-full font-semibold mb-0.5 inline-block truncate max-w-full">
                        {conv.productId.name}
                      </span>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-[#1e293b] truncate">{buyer?.name || 'Buyer'}</span>
                      <span className="text-xs text-[#94a3b8] shrink-0 ml-1">
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-xs text-[#64748b] truncate">{conv.lastMessage || 'Start of conversation'}</span>
                      {unread > 0 && (
                        <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ml-1">{unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <main className="flex-1 flex flex-col min-w-0">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#94a3b8] gap-3">
            <Inbox size={48} strokeWidth={1} />
            <p className="text-sm">Select a conversation to start replying</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#eef2f6]">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {getBuyer(activeConv)?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#1e293b] text-sm">{getBuyer(activeConv)?.name || 'Buyer'}</span>
                <span className="text-xs text-[#64748b]">
                  {isTyping ? 'Typing…' : activeConv.productId?.name ? `Enquiry: ${activeConv.productId.name}` : 'General enquiry'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
              {messages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={`max-w-[70%] px-4 py-2.5 rounded-[12px] text-sm leading-relaxed ${
                    msg.senderId === user?.id
                      ? 'self-end bg-primary text-white rounded-br-[4px]'
                      : 'self-start bg-[#f1f5f9] text-[#1e293b] rounded-bl-[4px]'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-3 px-4 py-3 border-t border-[#eef2f6]">
              <input
                type="text"
                className="flex-1 border border-[#e2e8f0] rounded-[8px] px-4 py-2.5 text-sm outline-none focus:border-primary bg-[#f8fafc]"
                placeholder="Type your reply…"
                value={inputText}
                onChange={e => { setInputText(e.target.value); handleTyping(e.target.value.length > 0); }}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button
                className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer border-none hover:bg-primary-dark disabled:opacity-50 shrink-0"
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
