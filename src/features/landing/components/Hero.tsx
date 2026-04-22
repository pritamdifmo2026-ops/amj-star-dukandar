import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import styles from './Hero.module.css';

const Hero: React.FC = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            India's Largest B2B <span className={styles.highlight}>Wholesale Market</span>
          </h1>
          <p className={styles.subtitle}>
            Connect with verified suppliers, manufacturers, and wholesalers. 
            Get the best prices for your business in bulk.
          </p>
          <div className={styles.actions}>
            <Link to={ROUTES.REGISTER} className={styles.primaryBtn}>
              Join as Buyer
            </Link>
            <Link to={ROUTES.REGISTER} className={styles.secondaryBtn}>
              Start Selling
            </Link>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>50,000+</strong>
              <span>Suppliers</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <strong>2M+</strong>
              <span>Products</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <strong>100%</strong>
              <span>Verified</span>
            </div>
          </div>
        </div>
        <div className={styles.imageWrap}>
          {/* Using a solid color or gradient placeholder to avoid AI-generated look */}
          <div className={styles.placeholderImage}>
            <div className={styles.placeholderContent}>
              <span className={styles.tag}>Trusted by 1M+ Businesses</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
