import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';
import appConfig from '@/config/app.config';

const AuthLayout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <div className={styles.brand}>
        <span className={styles.logo}>{appConfig.appName}</span>
        <p className={styles.tagline}>{appConfig.appTagline}</p>
      </div>
      <div className={styles.card}>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
