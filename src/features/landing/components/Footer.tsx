import React from 'react';
import { Link } from 'react-router-dom';
import appConfig from '@/config/app.config';
import { ROUTES } from '@/shared/constants/routes';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.col}>
            <h3 className={styles.brand}>{appConfig.appName}</h3>
            <p className={styles.desc}>{appConfig.appTagline}</p>
            <p className={styles.copyright}>
              &copy; {new Date().getFullYear()} {appConfig.appName}. All rights reserved.
            </p>
          </div>
          
          <div className={styles.col}>
            <h4 className={styles.title}>For Buyers</h4>
            <ul className={styles.list}>
              <li><Link to={ROUTES.PRODUCT_LIST}>Browse Products</Link></li>
              <li><Link to={ROUTES.LOGIN}>Post a Requirement</Link></li>
              <li><Link to={ROUTES.REGISTER}>Register as Buyer</Link></li>
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.title}>For Suppliers</h4>
            <ul className={styles.list}>
              <li><Link to={ROUTES.REGISTER}>Register as Supplier</Link></li>
              <li><Link to={ROUTES.LOGIN}>Supplier Login</Link></li>
              <li><a href="#">Grow Your Business</a></li>
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.title}>Help & Support</h4>
            <ul className={styles.list}>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Terms of Use</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
