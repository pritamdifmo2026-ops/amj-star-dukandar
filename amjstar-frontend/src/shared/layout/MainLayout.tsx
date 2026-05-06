import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import styles from './MainLayout.module.css';

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Navbar />
      <main className={styles.main}>
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
