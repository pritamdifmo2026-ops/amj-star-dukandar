import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import env from '@/config/env';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  activeChatId: null,
  setActiveChatId: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Dynamically derive the socket URL from the API_BASE_URL
      // This ensures LAN collaborators connect to your IP, not their own 'localhost'
      const socketUrl = env.API_BASE_URL.split('/api')[0]; 
      
      console.log('🔌 Connecting socket to:', socketUrl);
      
      const newSocket = io(socketUrl, {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('✅ Socket connected');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('❌ Socket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setActiveChatId(null); // ← clear stale chat ID on logout/user change
      }
    }
  }, [isAuthenticated, user?.id]); // use user.id not the whole object to avoid re-running on populate

  return (
    <SocketContext.Provider value={{ socket, isConnected, activeChatId, setActiveChatId }}>
      {children}
    </SocketContext.Provider>
  );
};
