import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, ShieldCheck, Package } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import resellerService from '../services/reseller.service';
import styles from './PublicStorefront.module.css';

const PublicStorefront: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app, we would fetch the store details and visible products using the slug from a public endpoint
  const storeName = slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Reseller Store';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // During development, we'll just fetch the logged-in user's approved products
        const data = await resellerService.getRequests();
        const approved = (data.requests || []).filter((r: any) => r.status === 'APPROVED');
        setProducts(approved);
      } catch (error) {
        console.error('Failed to load products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className={styles.container}>
      {/* ── STORE HEADER ── */}
      <header className={styles.storeHeader}>
        <div className={styles.containerInner}>
          <div className={styles.storeBranding}>
            <div className={styles.storeAvatar}>{storeName.charAt(0)}</div>
            <div>
              <h1 className={styles.storeTitle}>{storeName}</h1>
              <p className={styles.storeTrust}>
                <ShieldCheck size={16} className={styles.trustIcon} /> Verified AMJStar Reseller
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── STORE CONTENT ── */}
      <main className={styles.mainContent}>
        <div className={styles.containerInner}>

          <div className={styles.welcomeBanner}>
            <Star className={styles.starIcon} size={24} />
            <h2>Welcome to my store!</h2>
            <p>I have handpicked the best products for you. Shop with confidence.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading store products...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3>No products available yet</h3>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {products.map((req: any) => {
                // Calculate selling price just like in the reseller dashboard
                const basePrice = req.product?.basePrice || 0;
                const sellingPrice = req.sellingPrice || Math.round(basePrice * 1.3);

                return (
                  <div key={req._id} className={styles.productCard}>
                    <div className={styles.productImagePlaceholder}>
                      {req.product?.images?.[0] ? (
                        <img
                          src={req.product.images[0]}
                          alt={req.customTitle || req.product?.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <ShoppingBag size={32} />
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{req.customTitle || req.product?.name}</h3>

                      {req.highlights && req.highlights.length > 0 && (
                        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#64748b' }}>
                          {req.highlights.map((h: string, idx: number) => <li key={idx}>{h}</li>)}
                        </ul>
                      )}

                      <div className={styles.priceRow}>
                        <span className={styles.price}>₹{sellingPrice}</span>
                      </div>
                      <Button className={styles.buyBtn} onClick={() => alert('Checkout flow will be developed soon!')}>
                        Buy Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      <footer className={styles.footer}>
        <p>Powered by AMJStar</p>
        <Button variant="outline" onClick={() => navigate('/')}>Explore AMJStar</Button>
      </footer>
    </div>
  );
};

export default PublicStorefront;
