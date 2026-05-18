import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
} from 'lucide-react';
import appConfig from '@/config/app.config';
import { ROUTES } from '@/shared/constants/routes';
import styles from './Footer.module.css';

const Footer: React.FC = () => {

  return (
    <footer className={styles.footer}>
      <div className={styles.mainFooter}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            {/* Brand Section */}
            <div className={styles.brandCol}>
              <Link to={ROUTES.HOME} className={styles.footerLogo}>
                <img src="/favicon.jpeg" alt="AMJStar Logo" className={styles.footerLogoImg} />
                <span>{appConfig.appName}</span>
              </Link>
              <p className={styles.brandDescription}>
                India's leading B2B wholesale marketplace connecting verified buyers with trusted suppliers across the nation. Trade globally, connect locally.
              </p>
              <div className={styles.socialLinks}>
                <a href="#" className={styles.socialIcon} aria-label="Facebook"><Facebook size={18} /></a>
                <a href="#" className={styles.socialIcon} aria-label="Twitter"><Twitter size={18} /></a>
                <a href="#" className={styles.socialIcon} aria-label="LinkedIn"><Linkedin size={18} /></a>
                <a href="#" className={styles.socialIcon} aria-label="Instagram"><Instagram size={18} /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>Quick Links</h4>
              <ul className={styles.linkList}>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to={ROUTES.PRODUCT_LIST}>Categories</Link></li>
                <li><Link to={ROUTES.SUPPLIERS}>Become Seller</Link></li>
                <li><Link to={ROUTES.RESELLERS}>Bulk Orders</Link></li>
                <li><Link to="/about">Contact</Link></li>
              </ul>
            </div>

            {/* Buyer Section */}
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>For Buyers</h4>
              <ul className={styles.linkList}>
                <li><Link to={ROUTES.PRODUCT_LIST}>Browse Products</Link></li>
                <li><Link to={ROUTES.BUYERS}>Request Quote</Link></li>
                <li><Link to={ROUTES.BUYERS}>Buyer Protection</Link></li>
                <li><Link to="/about">Help Center</Link></li>
              </ul>
            </div>

            {/* Seller Section */}
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>For Sellers</h4>
              <ul className={styles.linkList}>
                <li><Link to={ROUTES.SUPPLIERS}>Sell on AMJStar</Link></li>
                <li><Link to={ROUTES.SUPPLIERS}>Supplier Membership</Link></li>
                <li><Link to={ROUTES.SUPPLIER_DASHBOARD}>Seller Dashboard</Link></li>
                <li><Link to={ROUTES.SUPPLIERS}>Advertising</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>Contact Info</h4>
              <ul className={styles.contactList}>
                <li>
                  <Mail size={16} />
                  <span>support@amjstar.com</span>
                </li>
                <li>
                  <Phone size={16} />
                  <span>+91 1800 123 4567</span>
                </li>
                <li>
                  <MapPin size={16} />
                  <span>123 Business Hub, MG Road, New Delhi, India</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <div className={styles.bottomBarContent}>
            <div className={styles.copyright}>
              &copy; {new Date().getFullYear()} {appConfig.appName}. All rights reserved.
            </div>
            <div className={styles.legalLinks}>
              <Link to="/about">Privacy Policy</Link>
              <Link to="/about">Terms</Link>
              <Link to="/about">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
