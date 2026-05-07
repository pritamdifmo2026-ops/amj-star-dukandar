import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import styles from './RolePage.module.css';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

const Suppliers: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <h1 className={styles.title}>Welcome to the <span className={styles.highlight}>Supplier</span> Network</h1>
            <p className={styles.subtitle}>
              Expand your reach, streamline your wholesale operations, and connect directly with thousands of verified B2B buyers across India.
            </p>
            <Link to={`${ROUTES.LOGIN}?mode=seller`} className={styles.joinBtn}>Join as a Supplier</Link>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitleSmall}>How to Sell on AMJStar</h2>
              <p className={styles.sectionSubtitle}>List your products and start receiving wholesale orders in minutes.</p>
            </div>
            <div className={styles.stepsGrid}>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>1</div>
                <h4>Register & Verify</h4>
                <p>Complete your business profile and upload KYC documents to become a verified supplier.</p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>2</div>
                <h4>List Products</h4>
                <p>Use our bulk upload tools to list your entire catalog with wholesale pricing and MOQs.</p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>3</div>
                <h4>Receive Orders</h4>
                <p>Get notified instantly when buyers or resellers place orders for your products.</p>
              </div>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>4</div>
                <h4>Get Paid Fast</h4>
                <p>Payments are settled directly to your bank account as soon as delivery is confirmed.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.contentSection} style={{ background: 'var(--color-bg)' }}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitleSmall}>Supplier Advantages</h2>
              <p className={styles.sectionSubtitle}>Scale your manufacturing business with our digital distribution tools.</p>
            </div>
            <div className={styles.listGrid}>
              <div className={styles.listItem}>
                <CheckCircle className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Zero Marketing Cost</h4>
                  <p>Get your products in front of thousands of active B2B buyers without spending on ads.</p>
                </div>
              </div>
              <div className={styles.listItem}>
                <CheckCircle className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Analytics & Insights</h4>
                  <p>Understand demand trends and optimize your production based on real-time market data.</p>
                </div>
              </div>
              <div className={styles.listItem}>
                <CheckCircle className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Logistics Support</h4>
                  <p>Leverage our network of 20,000+ pin codes coverage for seamless nationwide distribution.</p>
                </div>
              </div>
              <div className={styles.listItem}>
                <CheckCircle className={styles.checkIcon} size={24} />
                <div className={styles.listItemText}>
                  <h4>Payment Security</h4>
                  <p>Eliminate payment defaults with our secure escrow and verified buyer network.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </MainLayout>
  );
};

export default Suppliers;
