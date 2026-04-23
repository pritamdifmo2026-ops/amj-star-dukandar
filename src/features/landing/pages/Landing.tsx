import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, BadgeCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import ProductCard from '@/features/product/components/ProductCard';
import { ROUTES } from '@/shared/constants/routes';
import { MOCK_PRODUCTS } from '@/api/mocks/products';
import styles from './Landing.module.css';

const CATEGORIES = [
  { name: 'Electronics', icon: '💻', color: '#e3f2fd' },
  { name: 'Textiles', icon: '👕', color: '#f3e5f5' },
  { name: 'Machinery', icon: '⚙️', color: '#fff3e0' },
  { name: 'Furniture', icon: '🛋️', color: '#efebe9' },
  { name: 'Agriculture', icon: '🌾', color: '#e8f5e9' },
];

const Landing: React.FC = () => {
  return (
    <div className={styles.landing}>
      <Navbar />

      <main>
        <Hero />

        {/* Category: Electronics */}
        <section className={styles.categoryHub}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Electronics Hub</h2>
              <Link to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent('Electronics')}`} className={styles.viewAll}>
                See more
              </Link>
            </div>
            <div className={styles.productGrid}>
              {MOCK_PRODUCTS
                .filter(p => p.category === 'Electronics')
                .slice(0, 4)
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        </section>

        {/* Category: Daily Essentials Bulk */}
        <section className={styles.categoryHub}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Daily Essentials Bulk</h2>
              <Link to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent('Bulk Essentials')}`} className={styles.viewAll}>
                See more
              </Link>
            </div>
            <div className={styles.productGrid}>
              {MOCK_PRODUCTS
                .filter(p => p.category === 'Bulk Essentials')
                .slice(0, 4)
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        </section>

        {/* Category: Bulk Textiles & Fabrics */}
        <section className={styles.categoryHub}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Bulk Textiles & Fabrics</h2>
              <Link to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent('Bulk Textiles')}`} className={styles.viewAll}>
                See more
              </Link>
            </div>
            <div className={styles.productGrid}>
              {MOCK_PRODUCTS
                .filter(p => p.category === 'Bulk Textiles')
                .slice(0, 4)
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        </section>

        {/* Global Categories Navigation (The middle break) */}
        <section className={styles.middleNavigation}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitleCenter}>Browse by Industry</h2>
            <div className={styles.categoryStrip}>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                  className={styles.industryCard}
                  style={{ '--bg-color': cat.color } as any}
                >
                  <span className={styles.industryIcon}>{cat.icon}</span>
                  <span className={styles.industryName}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Category: Textiles */}
        <section className={styles.categoryHub}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Textiles & Apparel</h2>
              <Link to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent('Textiles')}`} className={styles.viewAll}>
                See more
              </Link>
            </div>
            <div className={styles.productGrid}>
              {MOCK_PRODUCTS
                .filter(p => p.category === 'Textiles')
                .slice(0, 4)
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        </section>

        {/* Category: Machinery */}
        <section className={styles.categoryHub}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Industrial Machinery</h2>
              <Link to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent('Machinery')}`} className={styles.viewAll}>
                See more
              </Link>
            </div>
            <div className={styles.productGrid}>
              {MOCK_PRODUCTS
                .filter(p => p.category === 'Machinery')
                .slice(0, 4)
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        </section>

        {/* Category: Food & Beverages */}
        <section className={styles.categoryHub}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Food & Beverages</h2>
              <Link to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent('Food & Beverages')}`} className={styles.viewAll}>
                See more
              </Link>
            </div>
            <div className={styles.productGrid}>
              {MOCK_PRODUCTS
                .filter(p => p.category === 'Food & Beverages')
                .slice(0, 4)
                .map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Why Choose AMJStar?</h2>
            </div>
            <div className={styles.featuresGrid}>
              <div className={styles.featureBox}>
                <div className={styles.featureIcon}><ShieldCheck size={32} /></div>
                <h3>Secure Payments</h3>
                <p>100% payment protection for both buyers and suppliers.</p>
              </div>
              <div className={styles.featureBox}>
                <div className={styles.featureIcon}><Truck size={32} /></div>
                <h3>Pan India Delivery</h3>
                <p>Reliable logistics partners for timely delivery everywhere.</p>
              </div>
              <div className={styles.featureBox}>
                <div className={styles.featureIcon}><BadgeCheck size={32} /></div>
                <h3>Verified Sellers</h3>
                <p>All suppliers go through a strict background verification.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
