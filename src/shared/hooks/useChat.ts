import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { chatApi } from '../services/chat.api';
import { useSelector } from 'react-redux';

export const useChat = (conversationId?: string) => {
  const { socket } = useSocket();
  const { user } = useSelector((state: any) => state.auth);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Keep a ref so sendMessage/handleTyping always use the *current* conversationId
  // even if the hook was rendered before it was set (stale closure fix)
  const conversationIdRef = useRef<string | undefined>(conversationId);
  conversationIdRef.current = conversationId;

  // Auto-clear typing indicator after 2s of silence
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load history + join room ─────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !socket) return;

    loadMessages();
    socket.emit('join_conversation', conversationId);
    socket.emit('mark_read', conversationId);
  }, [conversationId, socket]);

  // ─── Socket event listeners ───────────────────────────────────────
  // Use named handler references so we can remove ONLY this hook's listener,
  // not all listeners on the event (which would break when multiple
  // components use useChat simultaneously, e.g. FloatingChat + SupplierInbox).
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => {
        // Deduplicate by _id in case the server echoes back to sender
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      socket.emit('mark_read', conversationId);
    };

    const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
      const currentUserId = user?._id || user?.id;
      if (data.userId?.toString() === currentUserId?.toString()) return; // ignore own typing echo
      setIsTyping(data.isTyping);

      // Auto-clear after 2 s in case the stop event is missed
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (data.isTyping) {
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    };

    const handleMessagesRead = (data: { conversationId: string; readerId: string }) => {
      const currentUserId = user?._id || user?.id;
      if (data.conversationId === conversationId && data.readerId?.toString() !== currentUserId?.toString()) {
        setMessages((prev) => 
          prev.map((msg) => {
            const senderId = msg.senderId?._id || msg.senderId;
            return senderId?.toString() === currentUserId?.toString() ? { ...msg, isRead: true } : msg;
          })
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      // Remove ONLY this hook's specific listener, not all listeners
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, conversationId, user?.id]);

  // ─── Actions ──────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await chatApi.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback((text: string, receiverId: string) => {
    const convId = conversationIdRef.current;
    if (!socket || !convId) {
      console.warn('sendMessage: socket or conversationId not ready', { socket: !!socket, convId });
      return;
    }
    socket.emit('send_message', { conversationId: convId, receiverId, text });
  }, [socket]);

  const handleTyping = useCallback((typing: boolean) => {
    const convId = conversationIdRef.current;
    if (!socket || !convId) return;
    socket.emit('typing', { conversationId: convId, isTyping: typing });
  }, [socket]);

  return { messages, loading, isTyping, sendMessage, handleTyping };
};
