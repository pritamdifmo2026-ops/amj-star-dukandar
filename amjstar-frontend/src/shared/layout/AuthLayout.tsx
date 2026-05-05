import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';
import appConfig from '@/config/app.config';

const AuthLayout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <div className={styles.brand}>
        <div className={styles.brandRow}>
          <img src="/favicon.jpeg" alt="AMJStar Logo" className={styles.logoImage} />
          <p className={styles.tagline}>{appConfig.appTagline}</p>
        </div>
      </div>
      <div className={styles.card}>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
