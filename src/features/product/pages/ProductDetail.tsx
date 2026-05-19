import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, ArrowLeft, ShieldCheck, Star, Package, Truck, Heart,
  CreditCard, MessageCircle, MapPin, Calendar, BadgeCheck
} from 'lucide-react';
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
import EnquiryModal, { type EnquiryPayload } from '@/features/chat/components/EnquiryModal';
import { ROUTES } from '@/shared/constants/routes';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(state => state.wishlist.items);
  const { socket, setActiveChatId } = useSocket();
  const [contactingSupplier, setContactingSupplier] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'company'>('details');

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

  const handleContactSupplier = () => {
    if (!product) return;
    if (isAdmin) { setShowAdminModal(true); return; }
    if (!user) { navigate(`${ROUTES.LOGIN}?redirect=${window.location.pathname}`); return; }
    setShowEnquiryModal(true);
  };

  const handleEnquirySubmit = useCallback(async (enquiry: EnquiryPayload) => {
    if (!product) return;
    setContactingSupplier(true);
    try {
      const conversation = await chatApi.getOrCreateConversation(
        product.supplierId,
        product.id,
        enquiry.deliveryAddress,
      );
      const shipTo = [
        enquiry.deliveryAddress.fullAddress,
        enquiry.deliveryAddress.city,
        enquiry.deliveryAddress.state,
        enquiry.deliveryAddress.pincode,
      ].filter(Boolean).join(', ');
      const text = [
        `📦 Enquiry: ${product.name}`,
        `Quantity: ${enquiry.quantity} ${product.unit}s`,
        `Price: ${enquiry.targetPrice ? `₹${enquiry.targetPrice.toLocaleString()} total` : 'As listed'}`,
        `Delivery Timeline: ${enquiry.deliveryTimeline}`,
        shipTo ? `Ship to: ${shipTo}` : '',
        `Requirements: ${enquiry.requirements}`,
        enquiry.note ? `Note: ${enquiry.note}` : '',
      ].filter(Boolean).join('\n');
      socket?.emit('join_conversation', conversation._id);
      socket?.emit('send_message', { conversationId: conversation._id, text, receiverId: (conversation as any).supplierId });
      setShowEnquiryModal(false);
      setActiveChatId(conversation._id);
    } finally {
      setContactingSupplier(false);
    }
  }, [product, socket, setActiveChatId]);

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
    navigate(ROUTES.CHECKOUT, {
      state: {
        buyNowItem: {
          productId: currentProductId,
          name: product.name,
          price: product.price,
          quantity: product.minOrderQty,
          unit: product.unit,
          supplierId: product.supplierId,
          imageUrl: currentImage
        }
      }
    });
  };

  const gstAmount = product.gstIncluded ? 0 : calculateGST(product.price, product.gstRate);
  const totalPrice = product.gstIncluded ? product.price : product.price + gstAmount;

  const packagingLabel: Record<string, string> = { bulk: 'Bulk', retail: 'Retail Pack', custom: 'Custom Packaging' };

  // Collect all specification rows for the details tab
  const hasSpecs = product.countryOfOrigin || product.leadTime || product.packagingType ||
    product.hsnCode || (product.specifications && Object.keys(product.specifications).length > 0);
  const hasCerts = product.certifications && product.certifications.length > 0;

  return (
    <div className={pageCls}>
      <Navbar />

      <main className="flex-1 py-6 pb-20 max-md:py-4">
        <div className="w-full max-w-[var(--width-container)] mx-auto px-8 max-md:px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-transparent border-none text-body text-sm font-medium cursor-pointer mt-4 mb-6 p-0 transition-colors hover:text-primary"
          >
            <ArrowLeft size={20} /> Back
          </button>

          {/* Main grid: image + info */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-8 mb-10">
            {/* Image gallery */}
            <div className="flex flex-col gap-4 w-full max-w-[600px] mx-auto lg:max-w-none">
              <div className="relative w-full aspect-square bg-cream border border-border rounded-[var(--radius-md)] overflow-visible flex items-center justify-center">
                <ImageMagnifier key={currentImage} src={currentImage} alt={product.name} />
                <button
                  onClick={handleToggleWishlist}
                  aria-label="Add to wishlist"
                  className="absolute top-4 right-4 bg-surface border border-border rounded-full w-11 h-11 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-md hover:scale-105 hover:border-primary z-[5]"
                >
                  <Heart size={22} fill={isWishlisted ? 'var(--color-primary)' : 'none'} color={isWishlisted ? 'var(--color-primary)' : '#888'} />
                </button>
              </div>
              {galleryImages.length > 1 && (
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
              )}
            </div>

            {/* Product info */}
            <div className="flex flex-col mt-4 lg:mt-0">
              {/* Badges */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {product.isVerified && (
                  <span className="bg-[#e8f5e9] text-[#2e7d32] text-[11px] font-bold px-2.5 py-1 rounded-[4px] flex items-center gap-1 uppercase">
                    <ShieldCheck size={13} /> Verified Supplier
                  </span>
                )}
                {product.isGSTVerified && (
                  <span className="bg-[#eff6ff] text-[#1d4ed8] text-[11px] font-bold px-2.5 py-1 rounded-[4px] flex items-center gap-1 uppercase">
                    <BadgeCheck size={13} /> GST Verified
                  </span>
                )}
                <span className="bg-cream text-body text-[11px] font-semibold px-2.5 py-1 rounded-[4px] uppercase">
                  {product.category}
                </span>
              </div>

              {/* Title */}
              <div className="mb-3">
                <h1 className="text-xl font-extrabold text-heading leading-[1.2] md:text-2xl">{product.name}</h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill={i < Math.floor(product.rating) ? 'var(--color-primary)' : 'none'} color={i < Math.floor(product.rating) ? 'var(--color-primary)' : 'var(--color-muted)'} />
                  ))}
                </div>
                <span className="text-sm text-body font-semibold">{product.rating} / 5.0</span>
              </div>

              {/* Price box */}
              <div className="bg-cream p-4 rounded-[var(--radius-md)] mb-5 border-l-4 border-primary">
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] text-body font-semibold">Wholesale Price:</span>
                  <span className="text-lg font-extrabold text-primary">{formatCurrency(product.price)}</span>
                  <span className="text-sm text-muted">/ {product.unit}</span>
                </div>
                {product.gstIncluded ? (
                  <p className="text-xs text-muted mt-0.5">GST inclusive ({product.gstRate}% included in price)</p>
                ) : (
                  <p className="text-[11px] text-muted mt-0.5">+ {formatCurrency(gstAmount)} GST ({product.gstRate}%) extra</p>
                )}
                <p className="text-sm font-bold text-heading mt-2">
                  {product.gstIncluded ? 'All-inclusive price' : `Total: ${formatCurrency(totalPrice)}`}
                </p>
              </div>

              {/* Key details row */}
              <div className="flex gap-6 mb-6 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <Package size={17} className="text-muted" />
                  <div>
                    <strong className="block text-sm text-heading">{product.minOrderQty} {product.unit}s</strong>
                    <span className="block text-xs text-muted">Min. Order</span>
                  </div>
                </div>
                {product.leadTime && (
                  <div className="flex items-center gap-2.5">
                    <Truck size={17} className="text-muted" />
                    <div>
                      <strong className="block text-sm text-heading">{product.leadTime}</strong>
                      <span className="block text-xs text-muted">Lead Time</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button size="lg" onClick={handleAddToCart} className="flex-1 h-[52px] whitespace-nowrap">
                  <ShoppingCart size={18} /> {isInCart ? 'Go to Cart' : 'Add to Cart'}
                </Button>
                <Button size="lg" variant="primary" onClick={handleBuyNow} className="flex-1 h-[52px] whitespace-nowrap">
                  <CreditCard size={18} /> Buy Now
                </Button>
                <Button variant="outline" size="lg" onClick={handleContactSupplier} disabled={contactingSupplier} className="flex-1 h-[52px]">
                  <MessageCircle size={17} /> {contactingSupplier ? 'Opening…' : 'Enquire Now'}
                </Button>
              </div>

              {/* Minimal supplier card */}
              <div className="bg-surface border border-border p-4 rounded-[var(--radius-md)] flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg shrink-0">
                  {(product.supplierName || 'S')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-heading truncate">{product.supplierName}</p>
                  {(product.supplierCity || product.supplierState) && (
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {[product.supplierCity, product.supplierState].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('company')}
                  className="text-xs text-primary font-semibold bg-transparent border-none cursor-pointer shrink-0 hover:underline"
                >
                  Company Info
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border mb-8">
            <div className="flex gap-0">
              {(['details', 'company'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer bg-transparent ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-heading'
                  }`}
                >
                  {tab === 'details' ? 'Product Details' : 'Company Details'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab: Product Details */}
          {activeTab === 'details' && (
            <div className="mb-20 max-w-[860px]">
              {/* Description */}
              <h2 className="text-base font-bold text-heading mb-4">Description</h2>
              <div className="text-sm text-body leading-[1.8] mb-10">{product.description}</div>

              {/* Specifications table */}
              {(hasSpecs || hasCerts) && (
                <>
                  <h2 className="text-base font-bold text-heading mb-4">Specifications</h2>
                  {hasSpecs && (
                    <div className="border border-border rounded-[var(--radius-md)] overflow-hidden mb-6">
                      <table className="w-full text-xs">
                        <tbody>
                          {product.countryOfOrigin && (
                            <tr className="border-b border-border">
                              <td className="py-3 px-5 font-semibold text-muted bg-cream w-[220px] max-sm:w-[140px]">Country of Origin</td>
                              <td className="py-3 px-5 text-heading">{product.countryOfOrigin}</td>
                            </tr>
                          )}
                          {product.leadTime && (
                            <tr className="border-b border-border">
                              <td className="py-3 px-5 font-semibold text-muted bg-cream">Lead Time</td>
                              <td className="py-3 px-5 text-heading">{product.leadTime}</td>
                            </tr>
                          )}
                          {product.packagingType && (
                            <tr className="border-b border-border">
                              <td className="py-3 px-5 font-semibold text-muted bg-cream">Packaging</td>
                              <td className="py-3 px-5 text-heading">{packagingLabel[product.packagingType] || product.packagingType}</td>
                            </tr>
                          )}
                          {product.hsnCode && (
                            <tr className="border-b border-border">
                              <td className="py-3 px-5 font-semibold text-muted bg-cream">HSN Code</td>
                              <td className="py-3 px-5 text-heading">{product.hsnCode}</td>
                            </tr>
                          )}
                          {product.specifications && Object.entries(product.specifications).map(([key, value], idx, arr) =>
                            value ? (
                              <tr key={key} className={idx < arr.length - 1 || hasCerts ? 'border-b border-border' : ''}>
                                <td className="py-3 px-5 font-semibold text-muted bg-cream capitalize">{key}</td>
                                <td className="py-3 px-5 text-heading">{value as string}</td>
                              </tr>
                            ) : null
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {hasCerts && (
                    <div className="mb-6">
                      <p className="text-sm font-bold text-heading mb-3">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {product.certifications!.map((cert: string) => (
                          <span key={cert} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] rounded-full text-xs font-semibold">
                            <ShieldCheck size={12} /> {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab: Company Details */}
          {activeTab === 'company' && (
            <div className="mb-20 max-w-[680px]">
              <div className="bg-surface border border-border rounded-[var(--radius-md)] p-7">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xl shrink-0">
                    {(product.supplierName || 'S')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-heading mb-1">{product.supplierName}</h2>
                    <div className="flex flex-wrap gap-2">
                      {product.isVerified && (
                        <span className="inline-flex items-center gap-1 bg-[#e8f5e9] text-[#2e7d32] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          <ShieldCheck size={11} /> Verified Supplier
                        </span>
                      )}
                      {product.isGSTVerified && (
                        <span className="inline-flex items-center gap-1 bg-[#eff6ff] text-[#1d4ed8] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          <BadgeCheck size={11} /> GST Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-sm:grid-cols-1">
                  {(product.supplierCity || product.supplierState) && (
                    <div className="flex items-start gap-2.5">
                      <MapPin size={16} className="text-muted mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted font-semibold mb-0.5">Location</p>
                        <p className="text-sm text-heading font-medium">
                          {[product.supplierCity, product.supplierState].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {product.supplierYearEst && (
                    <div className="flex items-start gap-2.5">
                      <Calendar size={16} className="text-muted mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted font-semibold mb-0.5">Year of Establishment</p>
                        <p className="text-sm text-heading font-medium">{product.supplierYearEst}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* About */}
                {product.supplierAbout && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs text-muted font-semibold mb-2">About the Company</p>
                    <p className="text-sm text-body leading-[1.7]">{product.supplierAbout}</p>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-6 pt-6 border-t border-border">
                  <Button onClick={handleContactSupplier} disabled={contactingSupplier} className="w-full">
                    <MessageCircle size={16} /> {contactingSupplier ? 'Opening…' : 'Enquire Now'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showEnquiryModal && product && (
        <EnquiryModal
          productName={product.name}
          basePrice={product.price}
          moq={product.minOrderQty}
          unit={product.unit}
          onSubmit={handleEnquirySubmit}
          onClose={() => setShowEnquiryModal(false)}
        />
      )}

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
            Admin accounts are kept separate from buyer activity. Admins can't place orders, add to cart, or chat with suppliers.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetail;
