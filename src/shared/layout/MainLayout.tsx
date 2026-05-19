import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col flex-1">
      <Navbar />
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
