import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ShieldCheck, Star, Package, Truck, Heart, CreditCard, MessageCircle } from 'lucide-react';
import { useProduct } from '../hooks/useProduct';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { calculateGST } from '@/shared/utils/calculateGST';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCartAsync } from '@/store/slices/cart.slice';
import { toggleWishlistItem } from '@/store/slices/wishlist.slice';
import { useSocket } from '@/shared/contexts/SocketContext';
import { chatApi } from '@/shared/services/chat.api';
import Button from '@/shared/components/ui/Button';
import Loader from '@/shared/components/feedback/Loader';
import ErrorState from '@/shared/components/feedback/ErrorState';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import ImageMagnifier from '../components/ImageMagnifier';
import { ROUTES } from '@/shared/constants/routes';
import styles from './ProductDetail.module.css';

const getSupplierExtraDetails = (supplierName: string = '') => {
  const name = supplierName || 'Test Supplier';
  const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const natures = [
    'Manufacturer & Wholesale Exporter',
    'Authorized Distributor & Wholesaler',
    'OEM Manufacturer / Industrial Supplier',
    'Contract Manufacturer & Supplier'
  ];
  const nature = natures[charCodeSum % natures.length];

  const panLetters = (name.replace(/[^A-Za-z]/g, '').slice(0, 5).padEnd(5, 'X') + 'P').toUpperCase().slice(0, 5);
  const panDigits = String(charCodeSum * 7).padEnd(4, '0').slice(0, 4);
  const mockGST = `27${panLetters}${panDigits}A1Z${charCodeSum % 10}`;

  const suffixes = ['Pvt. Ltd.', 'Enterprises', 'Industries', 'Trading Co.'];
  const companyName = name.toLowerCase().includes('supplier') || name.toLowerCase().includes('ltd') || name.toLowerCase().includes('enterprise')
    ? name
    : `${name} ${suffixes[charCodeSum % suffixes.length]}`;

  return { companyName, nature, mockGST };
};

const maskGST = (gst: string) => {
  if (!gst || gst.length < 5) return 'N/A';
  return `${gst.slice(0, 2)}******${gst.slice(-2)}`;
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(state => state.wishlist.items);
  const { setActiveChatId } = useSocket();
  const [contactingSupplier, setContactingSupplier] = useState(false);

  const { data: product, isLoading, isError, refetch } = useProduct(id || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const user = useAppSelector(state => state.auth.user);

  React.useEffect(() => {
    if (id === 'undefined') {
      navigate('/');
      return;
    }
    setSelectedImage(null);
  }, [id, navigate]);

  const currentProductId = product?.id || (product as any)?._id;
  const isWishlisted = product ? wishlistItems.some(item => {
    const itemId = item.id || (item as any)._id;
    return itemId && currentProductId && itemId === currentProductId;
  }) : false;

  const cartItems = useAppSelector(state => state.cart.items);
  const isInCart = currentProductId ? cartItems.some(item => item.productId === currentProductId) : false;

  const companyDetails = React.useMemo(() => {
    if (!product) {
      return {
        companyName: '',
        nature: '',
        mockGST: '',
        location: 'Mumbai, Maharashtra'
      };
    }
    const fallback = getSupplierExtraDetails(product.supplierName);
    const apiDetails = product.supplierDetails;

    const rawGST = apiDetails?.gstin || fallback.mockGST;
    const maskedGST = maskGST(rawGST);

    const location = apiDetails?.city && apiDetails?.state
      ? `${apiDetails.city}, ${apiDetails.state}`
      : apiDetails?.city || 'Mumbai, Maharashtra';

    return {
      companyName: apiDetails?.businessName || fallback.companyName,
      nature: apiDetails?.nature || fallback.nature,
      mockGST: maskedGST,
      location
    };
  }, [product]);

  const handleToggleWishlist = () => {
    if (product && currentProductId) {
      if (!user) {
        navigate(`${ROUTES.LOGIN}?redirect=${window.location.pathname}`);
        return;
      }
      dispatch(toggleWishlistItem(product));
    }
  };

  const handleContactSupplier = async () => {
    if (!product) return;
    setContactingSupplier(true);
    try {
      const conversation = await chatApi.getOrCreateConversation(
        product.supplierId,
        product.id
      );
      setActiveChatId(conversation._id);
    } catch (err) {
      console.error('Failed to open chat', err);
    } finally {
      setContactingSupplier(false);
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

  // Gallery and current image - defined BEFORE handlers that use them
  const galleryImages = Array.from(
    new Set([product.imageUrl, ...(product.images || [])].filter((img): img is string => Boolean(img)))
  );
  const currentImage = selectedImage || galleryImages[0] || '';


  // Handlers that use currentImage - defined AFTER currentImage
  const handleAddToCart = () => {
    if (!product) return;

    if (isInCart) {
      navigate(ROUTES.CART);
      return;
    }

    if (!user) {
      navigate(`${ROUTES.LOGIN}?redirect=/products/${product.id}`);
      return;
    }

    dispatch(
      addToCartAsync({
        productId: currentProductId,
        name: product.name,
        price: product.price,
        quantity: product.minOrderQty,
        unit: product.unit,
        supplierId: product.supplierId,
        imageUrl: currentImage,
      })
    );
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (!user) {
      navigate(`${ROUTES.LOGIN}?redirect=/products/${product.id}`);
      return;
    }

    const buyNowItem = {
      productId: currentProductId,
      name: product.name,
      price: product.price,
      quantity: product.minOrderQty,
      unit: product.unit,
      supplierId: product.supplierId,
      imageUrl: currentImage,
    };

    navigate(ROUTES.CHECKOUT, { state: { buyNowItem } });
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
                <ImageMagnifier key={currentImage} src={currentImage} alt={product.name} />
                <button
                  className={`${styles.wishlistBtn} ${isWishlisted ? styles.active : ''}`}
                  onClick={handleToggleWishlist}
                  aria-label="Add to wishlist"
                >
                  <Heart size={24} fill={isWishlisted ? 'var(--color-primary)' : 'none'} color={isWishlisted ? 'var(--color-primary)' : '#888'} />
                </button>
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

              <div className={styles.headerRow}>
                <h1 className={styles.title}>{product.name}</h1>
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
                  {isInCart ? 'Go to Cart' : 'Add to Cart'}
                </Button>
                <Button size="lg" variant="primary" className={styles.buyNowBtn} onClick={handleBuyNow}>
                  <CreditCard size={20} />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className={styles.inquiryBtn}
                  onClick={handleContactSupplier}
                  disabled={contactingSupplier}
                >
                  <MessageCircle size={18} />
                  {contactingSupplier ? 'Opening Chat…' : 'Chat with Supplier'}
                </Button>
              </div>

              <div className={styles.supplierCard}>
                <h3 className={styles.supplierTitle}>Supplier Information</h3>
                <div className={styles.supplierDetailsList}>
                  <div className={styles.supplierDetailItem}>
                    <span className={styles.detailLabel}>Company Name:</span>
                    <span className={styles.detailValue}>{companyDetails.companyName}</span>
                  </div>
                  <div className={styles.supplierDetailItem}>
                    <span className={styles.detailLabel}>Nature of Business:</span>
                    <span className={styles.detailValue}>{companyDetails.nature}</span>
                  </div>
                  <div className={styles.supplierDetailItem}>
                    <span className={styles.detailLabel}>GST Number:</span>
                    <span className={styles.detailValue}>{companyDetails.mockGST}</span>
                  </div>
                  <div className={styles.supplierDetailItem}>
                    <span className={styles.detailLabel}>Location:</span>
                    <span className={styles.detailValue}>{companyDetails.location}</span>
                  </div>
                </div>
                <div className={styles.supplierActions}>
                  <button className={styles.viewStoreBtn}>View Store</button>
                  <button
                    className={styles.supplierContactBtn}
                    onClick={handleContactSupplier}
                    disabled={contactingSupplier}
                  >
                    <MessageCircle size={14} />
                    {contactingSupplier ? 'Connecting...' : 'Contact Supplier'}
                  </button>
                </div>
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