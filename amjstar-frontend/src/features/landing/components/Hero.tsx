import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import styles from './Hero.module.css';

import { ArrowRight } from 'lucide-react';
import heroImage from '@/assets/images/image.png';

const Hero: React.FC = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.topBadge}>
            <span className={styles.dot} />
            Now onboarding founding vendors & resellers
          </div>
          
          <h1 className={styles.title}>
            The B2B marketplace that puts <span className={styles.highlight}>local wholesalers</span> at the center.
          </h1>
          
          <p className={styles.subtitle}>
            AMJStar connects wholesalers, local retail resellers, and business 
            buyers in one trade network. Quote-based ordering and bulk fulfillment.
          </p>
          
          <div className={styles.actions}>
            <Link to={`${ROUTES.LOGIN}?mode=buyer`} className={styles.primaryBtn}>
              Join as Buyer <ArrowRight size={20} />
            </Link>
            <Link to={`${ROUTES.LOGIN}?mode=seller`} className={styles.secondaryBtn}>
              Become a Supplier
            </Link>
          </div>
          
          <div className={styles.stats}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>50k+</span>
              <span className={styles.statLabel}>Verified Suppliers</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBox}>
              <span className={styles.statValue}>2M+</span>
              <span className={styles.statLabel}>Bulk Products</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBox}>
              <span className={styles.statValue}>B2B</span>
              <span className={styles.statLabel}>First Platform</span>
            </div>
          </div>
        </div>
        
        <div className={styles.imageWrap}>
          <div className={styles.imageCard}>
            <img src={heroImage} alt="B2B Marketplace" className={styles.heroImage} />
            <div className={styles.floatingCard}>
              <span className={styles.floatValue}>+38%</span>
              <span className={styles.floatLabel}>avg. reseller margin uplift</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
