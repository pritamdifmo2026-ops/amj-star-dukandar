import React from 'react';
import { Outlet } from 'react-router-dom';
import ScrollToTop from '@/shared/components/navigation/ScrollToTop';
import { Toaster } from 'react-hot-toast';

const RootLayout: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Toaster />
      <Outlet />
    </>
  );
};

export default RootLayout;
