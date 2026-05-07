import React from 'react';
import styles from './About.module.css';
import { ShieldCheck, TrendingUp, Handshake } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';

const About: React.FC = () => {
  return (
    <MainLayout>
      <div className={styles.aboutPage}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div className={styles.heroContent}>
                <span className={styles.badge}>Our Journey</span>
                <h1 className={styles.title}>Redefining <span className={styles.highlight}>B2B Commerce</span> for the Digital Age</h1>
                <p className={styles.subtitle}>
                  AMJStar is not just a marketplace; it's a movement to empower millions of businesses
                  by bridging the gap between quality manufacturing and retail accessibility.
                </p>
                <div className={styles.heroActions}>
                  <button className={styles.primaryBtn}>Our Mission</button>
                  <button className={styles.textBtn}>View Story</button>
                </div>
              </div>
              <div className={styles.heroImageWrapper}>
                <img src="/about image.png" alt="Professional Workspace" className={styles.heroImage} />
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className={styles.story}>
          <div className={styles.container}>
            <div className={styles.storyGrid}>
              <div className={styles.storyText}>
                <h2 className={styles.sectionTitleAlt}>Our Story</h2>
                <p>
                  Founded in 2024, AMJStar started with a simple observation: the wholesale market was
                  fragmented and difficult to navigate for small-scale resellers and growing manufacturers.
                  We saw an opportunity to build a bridge—a digital ecosystem where trust is the primary currency.
                </p>
                <p>
                  Today, we are proud to be one of India's fastest-growing B2B platforms, serving thousands
                  of partners across the country with a focus on quality, speed, and reliability.
                </p>
              </div>
              <div className={styles.founderCard}>
                <div className={styles.founderQuote}>
                  <p>"We believe that every business, no matter how small, deserves a global platform to shine. AMJStar is that stage."</p>
                </div>
                <div className={styles.founderInfo}>
                  <div className={styles.founderAvatar}>AV</div>
                  <div>
                    <h4>Founder's Vision</h4>
                    <span>CEO, AMJStar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className={styles.values}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Our Core Values</h2>
            <div className={styles.valuesGrid}>
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}><ShieldCheck size={32} /></div>
                <h3>Absolute Trust</h3>
                <p>We implement multi-level verification for every partner to ensure a safe trading environment.</p>
              </div>
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}><TrendingUp size={32} /></div>
                <h3>Growth First</h3>
                <p>Our tools are designed specifically to help you scale your business volume and reach.</p>
              </div>
              <div className={styles.valueCard}>
                <div className={styles.valueIcon}><Handshake size={32} /></div>
                <h3>Solid Partnerships</h3>
                <p>We treat our users as partners, ensuring your success is fundamentally linked to ours.</p>
              </div>
            </div>
          </div>
        </section>


      </div>
    </MainLayout>
  );
};

export default About;
