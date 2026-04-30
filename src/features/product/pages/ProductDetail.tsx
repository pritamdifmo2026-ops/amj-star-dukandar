import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ShieldCheck, Star, Package, Truck, Heart } from 'lucide-react';
import { useProduct } from '../hooks/useProduct';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { calculateGST } from '@/shared/utils/calculateGST';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/cart.slice';
import { toggleWishlist } from '@/store/slices/wishlist.slice';
import Button from '@/shared/components/ui/Button';
import Loader from '@/shared/components/feedback/Loader';
import ErrorState from '@/shared/components/feedback/ErrorState';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import ImageMagnifier from '../components/ImageMagnifier';
import styles from './ProductDetail.module.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(state => state.wishlist.items);
  
  const { data: product, isLoading, isError, refetch } = useProduct(id || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  React.useEffect(() => {
    setSelectedImage(null);
  }, [id]);
  
  const isWishlisted = product ? wishlistItems.some(item => item.id === product.id) : false;

  const handleToggleWishlist = () => {
    if (product) {
      dispatch(toggleWishlist(product));
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.center}><Loader size="lg" /></div>
        <Footer />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.center}><ErrorState onRetry={() => refetch()} /></div>
        <Footer />
      </div>
    );
  }

  const galleryImages = Array.from(
    new Set([product.imageUrl, ...(product.images || [])].filter((img): img is string => Boolean(img)))
  );
  const currentImage = selectedImage || galleryImages[0] || '';

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: product.minOrderQty,
        unit: product.unit,
        supplierId: product.supplierId,
        imageUrl: currentImage,
      })
    );
  };

  const gstAmount = calculateGST(product.price, product.gstRate);
  const totalPrice = product.price + gstAmount;

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className={styles.layout}>
            {/* Left: Image with Amazon-style magnifier */}
            <div className={styles.imageSection}>
              <div className={styles.mainImageWrap}>
                <ImageMagnifier src={currentImage} alt={product.name} />
              </div>
              <div className={styles.thumbnailGrid}>
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.thumbWrap} ${currentImage === img ? styles.activeThumb : ''}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <img src={img} alt={`${product.name} ${idx}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Info */}
            <div className={styles.infoSection}>
              <div className={styles.badgeRow}>
                {product.isVerified && (
                  <span className={styles.verifiedBadge}>
                    <ShieldCheck size={14} /> Verified Supplier
                  </span>
                )}
                <span className={styles.categoryBadge}>{product.category}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h1 className={styles.title}>{product.name}</h1>
                <button 
                  className={`${styles.wishlistBtn} ${isWishlisted ? styles.active : ''}`}
                  onClick={handleToggleWishlist}
                  aria-label="Add to wishlist"
                >
                  <Heart size={24} fill={isWishlisted ? 'var(--color-primary)' : 'none'} color={isWishlisted ? 'var(--color-primary)' : '#888'} />
                </button>
              </div>

              <div className={styles.ratingRow}>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.floor(product.rating) ? "var(--color-primary)" : "none"} color={i < Math.floor(product.rating) ? "var(--color-primary)" : "var(--color-text-muted)"} />
                  ))}
                </div>
                <span className={styles.ratingText}>{product.rating} / 5.0</span>
              </div>

              <div className={styles.priceCard}>
                <div className={styles.priceRow}>
                  <span className={styles.priceLabel}>Wholesale Price:</span>
                  <span className={styles.priceValue}>{formatCurrency(product.price)}</span>
                  <span className={styles.unit}>/ {product.unit}</span>
                </div>
                <p className={styles.gstInfo}>+ {formatCurrency(gstAmount)} GST ({product.gstRate}%)</p>
                <p className={styles.totalPrice}>Total: {formatCurrency(totalPrice)}</p>
              </div>

              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <Package size={18} />
                  <div>
                    <strong>{product.minOrderQty} {product.unit}s</strong>
                    <span>Min. Order</span>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <Truck size={18} />
                  <div>
                    <strong>PAN India</strong>
                    <span>Shipping</span>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <Button size="lg" className={styles.buyBtn} onClick={handleAddToCart}>
                  <ShoppingCart size={20} />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg" className={styles.inquiryBtn}>
                  Send Inquiry
                </Button>
              </div>

              <div className={styles.supplierCard}>
                <h3 className={styles.supplierTitle}>Supplier Information</h3>
                <p className={styles.supplierName}>{product.supplierName}</p>
                <p className={styles.supplierLoc}>Mumbai, Maharashtra</p>
                <button className={styles.viewStoreBtn}>View Store</button>
              </div>
            </div>
          </div>

          <section className={styles.descriptionSection}>
            <h2 className={styles.descTitle}>Product Description</h2>
            <div className={styles.description}>
              {product.description}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
