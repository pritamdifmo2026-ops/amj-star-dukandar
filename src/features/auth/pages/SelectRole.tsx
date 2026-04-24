import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Store, ShoppingBag } from 'lucide-react';
import authService from '../services/auth.service';

import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import type { UserRole } from '../types';
import styles from './SelectRole.module.css';

const SelectRole: React.FC = () => {
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // If we're here, the user should already have a session cookie from verify-otp
    // We can also check if Redux has a user, or just trust the backend to 401 if unauthorized
  }, []);

  const handleRoleSelect = async (role: UserRole) => {
    setLoading(role);
    setError('');

    try {
      const response = await authService.selectRole({ role });
      localStorage.removeItem('temp_phone');

      dispatch(setCredentials({
        user: response.user
      }));

      if (role === 'supplier') navigate('/supplier/onboarding');
      else if (role === 'reseller') navigate('/reseller/dashboard');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set role. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Choose Your Path</h1>
        <p className={styles.subtitle}>
          Join thousands of businesses on AMJStar Dukandar. Select the role that best describes how you'll use our platform.
        </p>
        {error && <div className={styles.errorMsg}>{error}</div>}
      </header>

      <div className={styles.splitContainer}>
        {/* Buyer Pane */}
        <div className={styles.rolePane}>
          <span className={`${styles.badge} ${styles.badgeBuyer}`}>For Retailers</span>
          <div className={styles.iconWrapper}>
            <ShoppingBag size={48} color="#0B7F5A" />
          </div>
          <h2 className={styles.roleTitle}>Buyer</h2>
          <p className={styles.roleDesc}>
            Source high-quality products in bulk at wholesale prices directly from verified manufacturers.
          </p>
          <button
            className={`${styles.selectBtn} ${styles.btnBuyer} ${loading ? styles.btnDisabled : ''}`}
            onClick={() => handleRoleSelect('buyer')}
            disabled={!!loading}
          >
            {loading === 'buyer' ? 'Setting up...' : 'Join as Buyer'}
          </button>
        </div>

        {/* Supplier Pane */}
        <div className={styles.rolePane}>
          <span className={`${styles.badge} ${styles.badgeSupplier}`}>For Manufacturers</span>
          <div className={styles.iconWrapper}>
            <Store size={48} color="#1A3C5E" />
          </div>
          <h2 className={styles.roleTitle}>Supplier</h2>
          <p className={styles.roleDesc}>
            List your catalog, reach thousands of retailers across India, and grow your B2B sales effortlessly.
          </p>
          <button
            className={`${styles.selectBtn} ${styles.btnSupplier} ${loading ? styles.btnDisabled : ''}`}
            onClick={() => handleRoleSelect('supplier')}
            disabled={!!loading}
          >
            {loading === 'supplier' ? 'Setting up...' : 'Join as Supplier'}
          </button>
        </div>

        {/* Reseller Pane */}
        <div className={styles.rolePane}>
          <span className={`${styles.badge} ${styles.badgeReseller}`}>For Entrepreneurs</span>
          <div className={styles.iconWrapper}>
            <User size={48} color="#D94F00" />
          </div>
          <h2 className={styles.roleTitle}>Reseller</h2>
          <p className={styles.roleDesc}>
            Start your own business with zero investment. Share products with your network and earn margins.
          </p>
          <button
            className={`${styles.selectBtn} ${styles.btnReseller} ${loading ? styles.btnDisabled : ''}`}
            onClick={() => handleRoleSelect('reseller')}
            disabled={!!loading}
          >
            {loading === 'reseller' ? 'Setting up...' : 'Join as Reseller'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
