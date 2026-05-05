import React from 'react';
import { RouterProvider } from 'react-router-dom';
import AppProvider from './providers/AppProvider';
import { router } from './routes';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
