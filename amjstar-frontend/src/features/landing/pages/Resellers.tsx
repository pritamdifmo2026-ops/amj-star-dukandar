import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import styles from './RolePage.module.css';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

const Resellers: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <h1 className={styles.title}>Welcome to the <span className={styles.highlight}>Reseller</span> Hub</h1>
            <p className={styles.subtitle}>
              Start and scale your digital storefront with zero inventory. Connect with top suppliers and sell directly to your audience.
            </p>
            <Link to={`${ROUTES.LOGIN}?mode=reseller`} className={styles.joinBtn}>Join as a Reseller</Link>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitleSmall}>Your Path to Success</h2>
              <p className={styles.sectionSubtitle}>Start your online business journey with AMJStar in four simple steps.</p>
            </div>
            <div className={styles.stepsGrid}>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>1</div>
                <h4>Curate Catalog</h4>
                <p>Choose the best products from our verified manufacturers and add them to your store.</p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>2</div>
                <h4>Share & Sell</h4>
                <p>Share your personalized store link or individual products across social media like WhatsApp and Facebook.</p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>3</div>
                <h4>Collect Orders</h4>
                <p>Receive orders from your customers. You decide your own profit margin on every sale.</p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>4</div>
                <h4>We Deliver</h4>
                <p>Our suppliers ship the products directly to your customer with your branding. You keep the profit!</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.contentSection} style={{ background: 'var(--color-bg)' }}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitleSmall}>Reseller Perks</h2>
              <p className={styles.sectionSubtitle}>Why thousands of entrepreneurs choose AMJStar to build their businesses.</p>
            </div>
            <div className={styles.listGrid}>
              <div className={styles.listItem}>
                <TrendingUp className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Zero Financial Risk</h4>
                  <p>No need to buy inventory upfront. Only pay when you receive an order from your customer.</p>
                </div>
              </div>
              <div className={styles.listItem}>
                <TrendingUp className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Branded Packaging</h4>
                  <p>Send products in packaging that features your brand name, not the supplier's.</p>
                </div>
              </div>
              <div className={styles.listItem}>
                <TrendingUp className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Marketing Assets</h4>
                  <p>Get high-quality images, videos, and descriptions to help you sell more effectively.</p>
                </div>
              </div>
              <div className={styles.listItem}>
                <TrendingUp className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Timely Payouts</h4>
                  <p>Your profits are automatically calculated and transferred to your bank account weekly.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </MainLayout>
  );
};

export default Resellers;
