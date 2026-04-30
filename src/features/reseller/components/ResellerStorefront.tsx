import React, { useState, useEffect } from 'react';
import {
  Eye, Package, Copy, CheckCircle, Share2,
  ExternalLink, MessageCircle, Camera, TrendingUp,
  ToggleLeft, ToggleRight, Tag, ChevronRight, Sparkles,
  Globe
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import Button from '@/shared/components/ui/Button';
import resellerService from '../services/reseller.service';
import styles from './ResellerStorefront.module.css';

const ResellerStorefront: React.FC = () => {
  const { profile } = useAppSelector(state => state.reseller);
  const { user } = useAppSelector(state => state.auth);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const storeName = profile?.storeName || 'My Store';
  const storeSlug = (profile?.fullName || user?.name || 'reseller')
    .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const storeUrl = `${window.location.origin}/store/${storeSlug}`;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await resellerService.getRequests();
      const approved = (data.requests || [])
        .filter((r: any) => r.status === 'APPROVED')
        .map((r: any) => ({
          ...r,
          visible: r.visible === true,
          sellingPrice: r.sellingPrice || r.product?.basePrice || 0,
        }));
      setProducts(approved);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (id: string) => {
    const productToToggle = products.find(p => p._id === id);
    if (!productToToggle) return;

    const newVisible = !productToToggle.visible;
    // Optimistic UI update
    setProducts(prev => prev.map(p => p._id === id ? { ...p, visible: newVisible } : p));

    try {
      await resellerService.updateProductCustomization(id, { visible: newVisible });
    } catch (error) {
      console.error('Failed to toggle visibility', error);
      // Revert if failed
      setProducts(prev => prev.map(p => p._id === id ? { ...p, visible: !newVisible } : p));
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const visibleProducts = products.filter(p => p.visible);
  const categories = [...new Set(products.map(p => p.product?.category).filter(Boolean))];

  return (
    <div className={styles.container}>

      {/* ── STORE STATUS BANNER ── */}
      <div className={styles.statusBanner}>
        <div className={styles.statusLeft}>
          <div className={styles.liveDot} />
          <div>
            <h2 className={styles.statusTitle}>Your Store is Live on AMJStar</h2>
            <p className={styles.statusSub}>Buyers can discover and purchase from your curated storefront</p>
          </div>
        </div>
        <a
          href={storeUrl}
          target="_blank"
          rel="noreferrer"
          className={styles.previewBtn}
        >
          <Eye size={16} /> View My Store <ExternalLink size={14} />
        </a>
      </div>

      {/* ── MAIN GRID ── */}
      <div className={styles.mainGrid}>

        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>

          {/* Store Preview Card */}
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <div className={styles.storeAvatar}>
                {storeName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className={styles.previewStoreName}>{storeName}</h3>
                <span className={styles.previewOwner}>{profile?.fullName || user?.name}</span>
              </div>
              <div className={styles.liveChip}><Globe size={12} /> LIVE</div>
            </div>

            {/* Mini Product Grid Preview */}
            <div className={styles.previewProductGrid}>
              {loading ? (
                <div className={styles.previewLoading}>Loading products...</div>
              ) : visibleProducts.length === 0 ? (
                <div className={styles.previewEmpty}>
                  <Package size={32} />
                  <p>No visible products yet.<br />Toggle products on below to populate your store.</p>
                </div>
              ) : (
                visibleProducts.slice(0, 6).map(req => (
                  <div key={req._id} className={styles.previewItem}>
                    {req.product?.images?.[0] ? (
                      <img src={req.product.images[0]} alt={req.customTitle || req.product.name} />
                    ) : (
                      <div className={styles.previewItemPlaceholder}><Package size={18} /></div>
                    )}
                    <div className={styles.previewItemInfo}>
                      <span className={styles.previewItemName}>{req.customTitle || req.product?.name}</span>
                      <span className={styles.previewItemPrice}>₹{req.sellingPrice}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.previewFooter}>
              <span><Package size={14} /> {visibleProducts.length} products visible</span>
              <span><Tag size={14} /> {categories.length} categories</span>
            </div>
          </div>

          {/* Shareable Link */}
          <div className={styles.shareCard}>
            <div className={styles.shareHeader}>
              <Share2 size={18} />
              <div>
                <h4>Share Your Store</h4>
                <p>Send this link to your network and let them buy directly from you</p>
              </div>
            </div>

            <div className={styles.linkBox}>
              <span className={styles.linkText}>{storeUrl}</span>
              <button className={styles.copyBtn} onClick={copyLink}>
                {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>

            <div className={styles.shareActions}>
              <a
                href={`https://wa.me/?text=Shop%20from%20my%20store%20on%20AMJStar%3A%20${encodeURIComponent(storeUrl)}`}
                target="_blank"
                rel="noreferrer"
                className={`${styles.shareBtn} ${styles.shareBtnWA}`}
              >
                <MessageCircle size={16} /> Share on WhatsApp
              </a>
              <a
                href={`https://www.instagram.com/`}
                target="_blank"
                rel="noreferrer"
                className={`${styles.shareBtn} ${styles.shareBtnIG}`}
              >
                <Camera size={16} /> Share on Instagram
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>

          {/* Quick Stats */}
          <div className={styles.statsRow}>
            <div className={styles.miniStat}>
              <Package size={18} className={styles.miniStatIcon} />
              <div>
                <h4>{visibleProducts.length}</h4>
                <span>Visible Products</span>
              </div>
            </div>
            <div className={styles.miniStat}>
              <Tag size={18} className={styles.miniStatIcon} />
              <div>
                <h4>{categories.length}</h4>
                <span>Categories</span>
              </div>
            </div>
            <div className={styles.miniStat}>
              <TrendingUp size={18} className={styles.miniStatIcon} />
              <div>
                <h4>{profile?.subscriptionPlan || 'Standard'}</h4>
                <span>Your Plan</span>
              </div>
            </div>
          </div>

          {/* Products in Store */}
          <div className={styles.productsCard}>
            <div className={styles.productsCardHeader}>
              <h4><Sparkles size={16} /> Products in Store</h4>
              <span className={styles.productsCardSub}>Toggle visibility, adjust margin, or reorder</span>
            </div>

            {loading ? (
              <div className={styles.productsLoading}>Loading...</div>
            ) : products.length === 0 ? (
              <div className={styles.productsEmpty}>
                <Package size={36} />
                <p>No approved products yet.<br />Browse products and request them from suppliers.</p>
                <Button variant="outline" onClick={() => window.location.href = '/reseller/dashboard?tab=browse'}>
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className={styles.productsList}>
                {products.map(req => {
                  const base = req.product?.basePrice || 0;
                  const selling = req.sellingPrice || base;
                  const margin = selling - base;

                  return (
                    <div key={req._id} className={`${styles.productRow} ${!req.visible ? styles.productRowHidden : ''}`}>
                      <div className={styles.productRowImg}>
                        {req.product?.images?.[0] ? (
                          <img src={req.product.images[0]} alt={req.product.name} />
                        ) : (
                          <div className={styles.productRowPlaceholder}><Package size={14} /></div>
                        )}
                      </div>

                      <div className={styles.productRowInfo}>
                        <span className={styles.productRowName}>{req.customTitle || req.product?.name}</span>
                        <div className={styles.productRowPricing}>
                          <span className={styles.supplierPriceSmall}>₹{base}</span>
                          <ChevronRight size={12} />
                          <span className={styles.yourPriceSmall}>₹{selling}</span>
                          <span className={styles.marginSmall}>+₹{margin}</span>
                        </div>
                      </div>

                      <div className={styles.productRowActions}>
                        <button
                          className={`${styles.toggleBtn} ${req.visible ? styles.toggleBtnOn : styles.toggleBtnOff}`}
                          onClick={() => toggleVisibility(req._id)}
                          title={req.visible ? 'Hide from store' : 'Show in store'}
                        >
                          {req.visible ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResellerStorefront;
