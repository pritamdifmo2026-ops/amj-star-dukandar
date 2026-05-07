import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

import loginBanner from '@/assets/login_banner.png';
import { ShieldCheck, ShoppingBag, Tag, Headphones } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className={styles.splitContainer}>
      <div className={styles.sideImage}>
        <img src={loginBanner} alt="Auth Banner" />
        <div className={styles.imageOverlay}>
          <div className={styles.overlayContent}>
            <div className={styles.overlayBrand}>
              <div className={styles.brandIcon}><ShoppingBag size={24} /></div>
              <h2>AMJSTAR <br/><span>WHOLESALE</span></h2>
            </div>
            
            <h1 className={styles.mainHeadline}>Smart Wholesale <br/>Better Business</h1>
            <p className={styles.mainSubline}>Your trusted partner for quality products at wholesale prices.</p>
            
            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><ShieldCheck size={20} /></div>
                <div className={styles.featureText}>
                  <h4>Secure & Safe</h4>
                  <p>Your data is protected with enterprise-grade security.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><ShoppingBag size={20} /></div>
                <div className={styles.featureText}>
                  <h4>Huge Product Range</h4>
                  <p>Thousands of products across multiple categories.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><Tag size={20} /></div>
                <div className={styles.featureText}>
                  <h4>Best Wholesale Prices</h4>
                  <p>Competitive pricing for your growing business.</p>
                </div>
              </div>
            </div>

            <div className={styles.helpFooter}>
              <Headphones size={24} />
              <div className={styles.helpText}>
                <span>Need Help?</span>
                <p>support@amjstar.com | +91 123 456 7890</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.contentSide}>
        <div className={styles.brandFloating}>
           <img src="/favicon.jpeg" alt="Logo" />
        </div>
        
        <div className={styles.card}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
