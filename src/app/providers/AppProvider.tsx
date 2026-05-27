import React from 'react';
import { Toaster } from 'react-hot-toast';
import ReduxProvider from './ReduxProvider';
import ReactQueryProvider from './ReactQueryProvider';
import { SocketProvider } from '@/shared/contexts/SocketContext';
import { useFcmToken } from '@/features/notifications/hooks/useFcmToken';

interface Props {
  children: React.ReactNode;
}

// Initializes FCM token registration and foreground message listener.
// Must live inside ReduxProvider (needs auth state) and SocketProvider.
const FcmInitializer: React.FC = () => {
  useFcmToken();
  return null;
};

const AppProvider: React.FC<Props> = ({ children }) => {
  return (
    <ReduxProvider>
      <SocketProvider>
        <ReactQueryProvider>
          <FcmInitializer />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { fontSize: '14px', fontFamily: 'Inter, sans-serif' },
            }}
          />
        </ReactQueryProvider>
      </SocketProvider>
    </ReduxProvider>
  );
};

export default AppProvider;
