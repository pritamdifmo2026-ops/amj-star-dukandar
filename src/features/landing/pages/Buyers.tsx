import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import styles from './RolePage.module.css';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

const Buyers: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <h1 className={styles.title}>Welcome to the <span className={styles.highlight}>Buyer</span> Portal</h1>
            <p className={styles.subtitle}>
              Discover top-quality products from verified manufacturers. Enjoy seamless purchasing, secure transactions, and unparalleled support.
            </p>
            <Link to={`${ROUTES.LOGIN}?mode=buyer`} className={styles.joinBtn}>Join as a Buyer</Link>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitleSmall}>How it Works for Buyers</h2>
              <p className={styles.sectionSubtitle}>Simple, transparent, and secure procurement in just four steps.</p>
            </div>
            <div className={styles.stepsGrid}>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>1</div>
                <h4>Search & Filter</h4>
                <p>Browse through thousands of products or search specifically for what your business needs.</p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>2</div>
                <h4>Select & Quote</h4>
                <p>Compare prices, check Minimum Order Quantities (MOQ), and get instant wholesale quotes.</p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>3</div>
                <h4>Secure Payment</h4>
                <p>Pay securely through our integrated gateway with multiple payment options and escrow protection.</p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>4</div>
                <h4>Doorstep Delivery</h4>
                <p>Receive your goods directly at your warehouse or shop with real-time tracking every step of the way.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.contentSection} style={{ background: 'var(--color-bg)' }}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitleSmall}>Why Source with AMJStar?</h2>
              <p className={styles.sectionSubtitle}>We provide the tools and trust you need to grow your retail business.</p>
            </div>
            <div className={styles.listGrid}>
              <div className={styles.listItem}>
                <ShieldCheck className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Factory Direct Pricing</h4>
                  <p>Cut out the middlemen and buy directly from manufacturers at true wholesale rates.</p>
                </div>
              </div>
              <div className={styles.listItem}>
                <ShieldCheck className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Quality Guarantee</h4>
                  <p>Our "Star Verified" program ensures you only deal with manufacturers who meet high quality standards.</p>
                </div>
              </div>
              <div className={styles.listItem}>
                <ShieldCheck className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Flexible Credits</h4>
                  <p>Apply for business credit and pay for your inventory later as you grow your sales.</p>
                </div>
              </div>
              <div className={styles.listItem}>
                <ShieldCheck className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>24/7 Support</h4>
                  <p>Dedicated account managers to help you with sourcing, logistics, and any issues you face.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </MainLayout>
  );
};

export default Buyers;
