import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Truck, BadgeCheck, Sprout, Cpu, Utensils,
  Armchair, Home, Settings, Shirt, Layers
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import BannerSlider from '../components/BannerSlider';
import Footer from '../components/Footer';
import { ROUTES } from '@/shared/constants/routes';
import { productApi } from '@/features/product/services/product.api';
import categoryService from '@/features/product/services/category.service';
import type { Product } from '@/features/product/types';
import styles from './Landing.module.css';

const getCategoryIcon = (name: string) => {
  const iconMap: { [key: string]: any } = {
    'Agriculture': Sprout,
    'Electronics': Cpu,
    'Food & Beverages': Utensils,
    'Furniture': Armchair,
    'Home Furnishing': Home,
    'Machinery': Settings,
    'Textiles': Shirt,
  };
  return iconMap[name] || Layers;
};

const DEFAULT_COLORS = [
  '#E3F2FD', '#F3E5F5', '#FFF3E0', '#EFEBE9',
  '#E8F5E9', '#E0F7FA', '#FFEBEE', '#F1F8E9'
];

const PLACEHOLDER = 'https://placehold.co/300x200/f5f5f5/999?text=No+Image';

/** IndiaMart-style category section: hero card (left) + 2×3 mini grid (right) = 7 items */
const CategorySection: React.FC<{ cat: any; products: Product[]; loading: boolean }> = ({
  cat, products, loading
}) => {
  const catProducts = products.filter(p => p.category === cat.name).slice(0, 7);
  const heroProduct = catProducts[0];
  const gridProducts = catProducts.slice(1, 7);

  return (
    <section className={styles.categoryHub}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{cat.name}</h2>
          <Link
            to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
            className={styles.viewAll}
          >
            See more
          </Link>
        </div>

        {loading ? (
          <p className={styles.loadingText}>Loading products...</p>
        ) : catProducts.length === 0 ? (
          <p className={styles.loadingText}>No products yet in this category.</p>
        ) : (
          <div className={styles.categoryLayout}>
            {/* Left: Hero Card */}
            <div
              className={styles.heroCard}
              style={{ backgroundImage: `url(${heroProduct?.images?.[0] || PLACEHOLDER})` }}
            >
              <div className={styles.heroOverlay}>
                <ul className={styles.heroLinks}>
                  {catProducts.slice(1, 5).map(p => (
                    <li key={p.id}>
                      <Link to={`/products/${p.id}`} className={styles.heroLink}>
                        {p.name.length > 30 ? p.name.slice(0, 30) + '…' : p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                  className={styles.heroViewAllBtn}
                >
                  View All
                </Link>
              </div>
            </div>

            {/* Right: 2×3 Mini Product Grid */}
            <div className={styles.miniProductGrid}>
              {gridProducts.map(product => (
                <Link key={product.id} to={`/products/${product.id}`} className={styles.miniCard}>
                  <img
                    src={product.images?.[0] || PLACEHOLDER}
                    alt={product.name}
                    className={styles.miniImg}
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                  <div className={styles.miniInfo}>
                    <h4 className={styles.miniTitle}>
                      {product.name.length > 28 ? product.name.slice(0, 28) + '…' : product.name}
                    </h4>
                    <ul className={styles.miniLinks}>
                      {product.supplierName && <li>{product.supplierName}</li>}
                      <li>MOQ: {product.minOrderQty} units</li>
                      <li>₹{product.price?.toLocaleString('en-IN')}</li>
                    </ul>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const Landing: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productApi.list({ pageSize: 100 }),
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

        {/* First 3 category sections */}
        {categories.slice(0, 3).map(cat => (
          <CategorySection key={cat._id} cat={cat} products={products} loading={loading} />
        ))}

        {/* Browse by Industry */}
        <section className={styles.middleNavigation}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitleCenter}>Browse by Industry</h2>
            <div className={styles.categoryStrip}>
              {categories.map((cat, i) => {
                const Icon = getCategoryIcon(cat.name);
                return (
                  <Link
                    key={cat.name}
                    to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                    className={styles.industryCard}
                    style={{ '--bg-color': DEFAULT_COLORS[i % DEFAULT_COLORS.length] } as any}
                  >
                    <div className={styles.iconCircle}>
                      <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <span className={styles.industryName}>{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Next 3 category sections */}
        {categories.slice(3, 6).map(cat => (
          <CategorySection key={cat._id} cat={cat} products={products} loading={loading} />
        ))}

        {/* Why Choose AMJStar */}
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
