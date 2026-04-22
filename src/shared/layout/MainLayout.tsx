import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './MainLayout.module.css';

/**
 * MainLayout wraps authenticated/app pages.
 * Navbar and Footer will be injected via child features (not here).
 * This is intentionally minimal — just scroll + overflow management.
 */
const MainLayout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
