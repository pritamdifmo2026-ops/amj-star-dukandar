import React from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import appConfig from '@/config/app.config';
import { ROUTES } from '@/shared/constants/routes';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuth = () => {
    if (isAuthenticated) {
      dispatch(logout());
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.backToTop} onClick={scrollToTop}>
        TOP OF PAGE
      </div>

      <div className={styles.mainContent}>
        <div className={styles.container}>
          <div className={styles.linkGrid}>
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>For Buyers</h4>
              <ul className={styles.linkList}>
                <li><Link to={ROUTES.PRODUCT_LIST}>Browse Products</Link></li>
                <li><Link to={ROUTES.LOGIN}>Post a Requirement</Link></li>
                <li><Link to={ROUTES.REGISTER}>Register as Buyer</Link></li>
                <li><a href="#">Help Center</a></li>
              </ul>
            </div>

            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>For Suppliers</h4>
              <ul className={styles.linkList}>
                <li><Link to={ROUTES.REGISTER}>Register as Supplier</Link></li>
                <li><Link to={ROUTES.LOGIN}>Supplier Login</Link></li>
                <li><a href="#">Grow Your Business</a></li>
                <li><a href="#">Supplier FAQ</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.regionSection}>
        <div className={styles.regionGrid}>
          <div className={styles.regionItem}>
            <Globe size={14} />
            <span>English</span>
          </div>
          <div className={styles.regionItem}>
            <span>India</span>
          </div>
        </div>

        <div className={styles.authLinks}>
          {isAuthenticated ? (
            <button onClick={handleAuth} className={styles.authBtn}>Sign Out</button>
          ) : (
            <Link to={ROUTES.LOGIN} className={styles.authBtn}>Sign In</Link>
          )}
        </div>
      </div>

      <div className={styles.bottomLegal}>
        <div className={styles.legalLinks}>
          <a href="#">Contact Us</a>
          <a href="#">Terms of Use</a>
          <a href="#">Privacy Policy</a>
          <a href="#">FAQ</a>
        </div>
        
        <div className={styles.branding}>
          <span className={styles.footerLogo}>{appConfig.appName}</span>
          <p className={styles.copyText}>
            &copy; {new Date().getFullYear()} {appConfig.appName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
