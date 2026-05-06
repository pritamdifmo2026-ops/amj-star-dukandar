import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, BadgeCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import BannerSlider from '../components/BannerSlider';
import Footer from '../components/Footer';
import ProductCard from '@/features/product/components/ProductCard';
import { ROUTES } from '@/shared/constants/routes';
import { productApi } from '@/features/product/services/product.api';
import categoryService from '@/features/product/services/category.service';
import type { Product } from '@/features/product/types';
import styles from './Landing.module.css';

const DEFAULT_ICONS = ['💻', '👕', '⚙️', '🛋️', '🌾', '🧪', '🍔', '📦'];
const DEFAULT_COLORS = ['#e3f2fd', '#f3e5f5', '#fff3e0', '#efebe9', '#e8f5e9', '#e0f7fa', '#ffebee', '#f5f5f5'];

const Landing: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productApi.list({ pageSize: 50 }),
          categoryService.getAll()
        ]);
        setProducts(prodRes.data || []);
        if (catRes.categories) setCategories(catRes.categories);
      } catch (error) {
        console.error('Failed to fetch landing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.landing}>
      <Navbar />

      <main>
        <div className={styles.bannerWrapper}>
          <BannerSlider />
        </div>
        <Hero />

        {categories.slice(0, 3).map((cat) => (
          <section key={cat._id} className={styles.categoryHub}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{cat.name}</h2>
                <Link to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`} className={styles.viewAll}>
                  See more
                </Link>
              </div>
              <div className={styles.productGrid}>
                {loading ? <p>Loading products...</p> : products
                  .filter(p => p.category === cat.name)
                  .slice(0, 4)
                  .map(product => (
                    <ProductCard key={product.id} product={product} showAddToCart={false} />
                  ))}
              </div>
            </div>
          </section>
        ))}

        {/* Global Categories Navigation (The middle break) */}
        <section className={styles.middleNavigation}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitleCenter}>Browse by Industry</h2>
            <div className={styles.categoryStrip}>
              {categories.map((cat, i) => (
                <Link
                  key={cat.name}
                  to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                  className={styles.industryCard}
                  style={{ '--bg-color': DEFAULT_COLORS[i % DEFAULT_COLORS.length] } as any}
                >
                  <span className={styles.industryIcon}>{DEFAULT_ICONS[i % DEFAULT_ICONS.length]}</span>
                  <span className={styles.industryName}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {categories.slice(3, 6).map((cat) => (
          <section key={cat._id} className={styles.categoryHub}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{cat.name}</h2>
                <Link to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`} className={styles.viewAll}>
                  See more
                </Link>
              </div>
              <div className={styles.productGrid}>
                {loading ? <p>Loading products...</p> : products
                  .filter(p => p.category === cat.name)
                  .slice(0, 4)
                  .map(product => (
                    <ProductCard key={product.id} product={product} showAddToCart={false} />
                  ))}
              </div>
            </div>
          </section>
        ))}

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
