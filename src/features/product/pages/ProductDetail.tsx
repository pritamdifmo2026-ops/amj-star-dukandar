import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ShieldCheck, Star, Package, Truck, Heart, CreditCard, MessageCircle } from 'lucide-react';
import { useProduct } from '../hooks/useProduct';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { calculateGST } from '@/shared/utils/calculateGST';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCartAsync } from '@/features/buyer/store/cart.slice';
import { toggleWishlistItem } from '@/features/buyer/store/wishlist.slice';
import { useSocket } from '@/shared/contexts/SocketContext';
import { chatApi } from '@/features/chat/services/chat.api';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import Loader from '@/shared/components/feedback/Loader';
import ErrorState from '@/shared/components/feedback/ErrorState';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import ImageMagnifier from '../components/ImageMagnifier';
import { ROUTES } from '@/shared/constants/routes';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(state => state.wishlist.items);
  const { setActiveChatId } = useSocket();
  const [contactingSupplier, setContactingSupplier] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const { data: product, isLoading, isError, refetch } = useProduct(id || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const user = useAppSelector(state => state.auth.user);
  const isAdmin = user?.role === 'admin';

  React.useEffect(() => {
    if (id === 'undefined') { navigate('/'); return; }
    setSelectedImage(null);
  }, [id, navigate]);

  const currentProductId = product?.id || (product as any)?._id;
  const isWishlisted = product ? wishlistItems.some(item => {
    const itemId = item.id || (item as any)._id;
    return itemId && currentProductId && itemId === currentProductId;
  }) : false;

  const cartItems = useAppSelector(state => state.cart.items);
  const isInCart = currentProductId ? cartItems.some(item => item.productId === currentProductId) : false;

  const handleToggleWishlist = () => {
    if (!product || !currentProductId) return;
    if (!user) { navigate(`${ROUTES.LOGIN}?redirect=${window.location.pathname}`); return; }
    dispatch(toggleWishlistItem(product));
  };

  const handleContactSupplier = async () => {
    if (!product) return;
    if (isAdmin) { setShowAdminModal(true); return; }
    setContactingSupplier(true);
    try {
      const conversation = await chatApi.getOrCreateConversation(product.supplierId, product.id);
      setActiveChatId(conversation._id);
    } catch {}
    finally { setContactingSupplier(false); }
  };

  const pageCls = "min-h-screen flex flex-col bg-surface";
  const centerCls = "flex justify-center items-center min-h-[60vh]";

  if (isLoading) return <div className={pageCls}><Navbar /><div className={centerCls}><Loader size="lg" /></div><Footer /></div>;
  if (isError || !product) return <div className={pageCls}><Navbar /><div className={centerCls}><ErrorState onRetry={() => refetch()} /></div><Footer /></div>;

  const galleryImages = Array.from(
    new Set([product.imageUrl, ...(product.images || [])].filter((img): img is string => Boolean(img)))
  );
  const currentImage = selectedImage || galleryImages[0] || '';

  const handleAddToCart = () => {
    if (!product) return;
    if (isAdmin) { setShowAdminModal(true); return; }
    if (isInCart) { navigate(ROUTES.CART); return; }
    if (!user) { navigate(`${ROUTES.LOGIN}?redirect=/products/${product.id}`); return; }
    dispatch(addToCartAsync({ productId: currentProductId, name: product.name, price: product.price, quantity: product.minOrderQty, unit: product.unit, supplierId: product.supplierId, imageUrl: currentImage }));
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (isAdmin) { setShowAdminModal(true); return; }
    if (!user) { navigate(`${ROUTES.LOGIN}?redirect=/products/${product.id}`); return; }
    dispatch(addToCartAsync({ productId: currentProductId, name: product.name, price: product.price, quantity: product.minOrderQty, unit: product.unit, supplierId: product.supplierId, imageUrl: currentImage }));
    navigate(ROUTES.CHECKOUT);
  };

  const gstAmount = calculateGST(product.price, product.gstRate);
  const totalPrice = product.price + gstAmount;

  return (
    <div className={pageCls}>
      <Navbar />

      <main className="flex-1 py-6 pb-20 max-md:py-4">
        <div className="w-full max-w-[var(--width-container)] mx-auto px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-transparent border-none text-body text-sm font-medium cursor-pointer mt-4 mb-6 p-0 transition-colors hover:text-primary"
          >
            <ArrowLeft size={20} /> <span>Back</span>
          </button>

          <div className="grid grid-cols-[1fr_1.2fr] gap-8 mb-12 relative max-lg:grid-cols-[1fr_1.1fr] max-lg:gap-6 max-[992px]:grid-cols-1 max-[992px]:gap-8">
            {/* Images */}
            <div className="flex flex-col gap-4 relative z-[2] max-[992px]:max-w-[600px] max-[992px]:mx-auto max-[992px]:w-full">
              <div className="w-full aspect-square bg-cream border border-border rounded-[var(--radius-md)] overflow-visible flex items-center justify-center relative">
                <ImageMagnifier key={currentImage} src={currentImage} alt={product.name} />
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-none p-1">
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 border rounded-[var(--radius-sm)] overflow-hidden cursor-pointer shrink-0 transition-colors ${currentImage === img ? 'border-primary' : 'border-border hover:border-primary'}`}
                  >
                    <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col max-[992px]:mt-4">
              <div className="flex gap-3 mb-4 flex-wrap max-sm:gap-2">
                {product.isVerified && (
                  <span className="bg-[#e8f5e9] text-[#2e7d32] text-[11px] font-bold px-2.5 py-1 rounded-[4px] flex items-center gap-1 uppercase max-sm:text-[10px] max-sm:px-2">
                    <ShieldCheck size={14} /> Verified Supplier
                  </span>
                )}
                <span className="bg-cream text-body text-[11px] font-semibold px-2.5 py-1 rounded-[4px] uppercase max-sm:text-[10px] max-sm:px-2">
                  {product.category}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4 max-sm:gap-2">
                <h1 className="text-2xl font-extrabold text-heading leading-[1.2] mb-2 max-[992px]:text-xl max-sm:text-lg">{product.name}</h1>
                <button
                  onClick={handleToggleWishlist}
                  aria-label="Add to wishlist"
                  className="bg-surface border border-border rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-sm hover:scale-105 hover:border-primary max-sm:w-10 max-sm:h-10"
                >
                  <Heart size={24} fill={isWishlisted ? 'var(--color-primary)' : 'none'} color={isWishlisted ? 'var(--color-primary)' : '#888'} className="max-sm:w-5 max-sm:h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < Math.floor(product.rating) ? 'var(--color-primary)' : 'none'} color={i < Math.floor(product.rating) ? 'var(--color-primary)' : 'var(--color-muted)'} />
                  ))}
                </div>
                <span className="text-sm text-body font-semibold">{product.rating} / 5.0</span>
              </div>

              <div className="bg-cream p-4 rounded-[var(--radius-md)] mb-6 border-l-4 border-primary max-sm:p-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-body font-semibold">Wholesale Price:</span>
                  <span className="text-xl font-extrabold text-primary max-md:text-lg max-sm:text-base">{formatCurrency(product.price)}</span>
                  <span className="text-base text-muted">/ {product.unit}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">+ {formatCurrency(gstAmount)} GST ({product.gstRate}%)</p>
                <p className="text-lg font-bold text-heading mt-2 max-sm:text-base">Total: {formatCurrency(totalPrice)}</p>
              </div>

              <div className="flex gap-8 mb-8 max-md:flex-wrap max-md:gap-6">
                {[
                  { Icon: Package, strong: `${product.minOrderQty} ${product.unit}s`, label: 'Min. Order' },
                  { Icon: Truck, strong: 'PAN India', label: 'Shipping' },
                ].map(({ Icon, strong, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon size={18} className="text-muted" />
                    <div>
                      <strong className="block text-base text-heading">{strong}</strong>
                      <span className="block text-xs text-muted">{label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mb-10 max-md:flex-col max-md:gap-3">
                <Button size="lg" onClick={handleAddToCart} className="flex-1 h-[54px] text-lg whitespace-nowrap max-md:w-full max-md:flex-none max-md:h-[50px]">
                  <ShoppingCart size={20} /> {isInCart ? 'Go to Cart' : 'Add to Cart'}
                </Button>
                <Button size="lg" variant="primary" onClick={handleBuyNow} className="flex-1 h-[54px] text-lg whitespace-nowrap max-md:w-full max-md:flex-none max-md:h-[50px]">
                  <CreditCard size={20} /> Buy Now
                </Button>
                <Button variant="outline" size="lg" onClick={handleContactSupplier} disabled={contactingSupplier} className="flex-1 h-[54px] max-md:w-full max-md:flex-none max-md:h-[50px]">
                  <MessageCircle size={18} /> {contactingSupplier ? 'Opening Chat…' : 'Chat with Supplier'}
                </Button>
              </div>

              <div className="bg-surface border border-border p-6 rounded-[var(--radius-md)] max-sm:p-4">
                <h3 className="text-sm text-muted uppercase tracking-[0.05em] mb-4">Supplier Information</h3>
                <p className="text-lg font-bold text-heading">{product.supplierName}</p>
                <p className="text-sm text-body mb-4">Mumbai, Maharashtra</p>
                <button className="bg-transparent border-none text-primary font-semibold text-sm cursor-pointer p-0 underline">View Store</button>
              </div>
            </div>
          </div>

          <section className="border-t border-border pt-12 mb-20 max-md:pt-8 max-md:mb-10">
            <h2 className="text-xl font-bold text-heading mb-6">Product Description</h2>
            <div className="text-base text-body leading-[1.7] max-w-[800px]">{product.description}</div>
          </section>
        </div>
      </main>

      <Footer />

      <Modal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        title="Hey, Admin!"
        footer={<Button onClick={() => setShowAdminModal(false)}>Got it</Button>}
      >
        <div className="py-2 text-center">
          <div className="text-4xl mb-4">👋</div>
          <p className="text-base font-semibold text-[#0f172a] mb-3">
            Looks like you're trying to shop as an Admin — that's a no-go!
          </p>
          <p className="text-sm text-[#64748b] leading-relaxed">
            For platform security and clean data integrity, admin accounts are kept separate from buyer activity. Admins can't place orders, add to cart, or chat with suppliers.
          </p>
          <p className="text-sm text-[#64748b] mt-3 leading-relaxed">
            Want to explore AMJ Star as a customer? Simply register a new buyer account with a different mobile number and enjoy the full experience.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetail;
