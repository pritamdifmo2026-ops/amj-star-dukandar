import React from 'react';
import { Toaster } from 'react-hot-toast';
import ReduxProvider from './ReduxProvider';
import ReactQueryProvider from './ReactQueryProvider';

interface Props {
  children: React.ReactNode;
}

const AppProvider: React.FC<Props> = ({ children }) => {
  return (
    <ReduxProvider>
      <ReactQueryProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '14px', fontFamily: 'Inter, sans-serif' },
          }}
        />
      </ReactQueryProvider>
    </ReduxProvider>
  );
};

export default AppProvider;
