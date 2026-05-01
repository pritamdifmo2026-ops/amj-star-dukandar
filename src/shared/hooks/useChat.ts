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
      if (data.userId === user?.id) return; // ignore own typing echo
      setIsTyping(data.isTyping);

      // Auto-clear after 2 s in case the stop event is missed
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (data.isTyping) {
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      // Remove ONLY this hook's specific listener, not all listeners
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);

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
    if (!socket || !conversationId) return;
    socket.emit('send_message', { conversationId, receiverId, text });
  }, [socket, conversationId]);

  const handleTyping = useCallback((typing: boolean) => {
    if (!socket || !conversationId) return;
    socket.emit('typing', { conversationId, isTyping: typing });
  }, [socket, conversationId]);

  return { messages, loading, isTyping, sendMessage, handleTyping };
};
