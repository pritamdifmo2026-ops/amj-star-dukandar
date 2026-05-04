import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  ArrowRight
} from 'lucide-react';
import appConfig from '@/config/app.config';
import { ROUTES } from '@/shared/constants/routes';
import { useAppSelector } from '@/store/hooks';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.newsletter}>
        <div className={styles.container}>
          <div className={styles.newsletterContent}>
            <div className={styles.newsletterText}>
              <h3>Subscribe to our Newsletter</h3>
              <p>Get the latest updates on wholesale trends and bulk deals.</p>
            </div>
            <div className={styles.newsletterForm}>
              <input type="email" placeholder="Enter your email" />
              <button>
                Subscribe <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainFooter}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            {/* Brand Section */}
            <div className={styles.brandCol}>
              <Link to={ROUTES.HOME} className={styles.footerLogo}>
                {appConfig.appName}
              </Link>
              <p className={styles.brandDescription}>
                India's leading B2B marketplace connecting verified buyers with trusted suppliers across the nation. Grow your business with AMJStar.
              </p>
              <div className={styles.socialLinks}>
                <a href="#" className={styles.socialIcon} aria-label="Facebook"><Facebook size={20} /></a>
                <a href="#" className={styles.socialIcon} aria-label="Twitter"><Twitter size={20} /></a>
                <a href="#" className={styles.socialIcon} aria-label="LinkedIn"><Linkedin size={20} /></a>
                <a href="#" className={styles.socialIcon} aria-label="Instagram"><Instagram size={20} /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>Solutions</h4>
              <ul className={styles.linkList}>
                <li><Link to={ROUTES.PRODUCT_LIST}>Browse Products</Link></li>
                <li><Link to={ROUTES.LOGIN}>Post a Requirement</Link></li>
                <li><Link to={ROUTES.REGISTER}>Become a Supplier</Link></li>
                <li><a href="#">Industry Reports</a></li>
                <li><a href="#">Bulk Discounts</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>Support</h4>
              <ul className={styles.linkList}>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Safety & Trust</a></li>
                <li><a href="#">Supplier FAQ</a></li>
                <li><a href="#">Buyer Protection</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>Get in Touch</h4>
              <ul className={styles.contactList}>
                <li>
                  <MapPin size={18} />
                  <span>123 Business Hub, MG Road, New Delhi, India</span>
                </li>
                <li>
                  <Phone size={18} />
                  <span>+91 1800 123 4567</span>
                </li>
                <li>
                  <Mail size={18} />
                  <span>support@amjstar.com</span>
                </li>
                <li>
                  <Globe size={18} />
                  <span>www.amjstar.com</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <div className={styles.bottomBarContent}>
            <div className={styles.legalLinks}>
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Cookie Policy</a>
            </div>
            <div className={styles.copyright}>
              &copy; {new Date().getFullYear()} {appConfig.appName}. All rights reserved.
            </div>
            <div className={styles.topScroll} onClick={scrollToTop}>
              <span>Back to top</span>
              <ArrowRight size={16} className={styles.scrollIcon} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
