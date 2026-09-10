import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck, Truck, BadgeCheck, Sprout, Cpu, Utensils,
  Armchair, Home, Settings, Shirt, Layers, Car, Smartphone, Briefcase,
  Heart, ShoppingCart, Zap, Users, ArrowRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import LatestUpdatesCarousel from '../components/LatestUpdatesCarousel';
import BannerSlider from '../components/BannerSlider';
import PostRequirementSection from '../components/PostRequirementSection';
import FeaturedSuppliers from '../components/FeaturedSuppliers';
import Footer from '../components/Footer';
import { ROUTES } from '@/shared/constants/routes';
import { productApi } from '@/features/product/services/product.api';
import categoryService from '@/features/product/services/category.service';
import type { Product } from '@/features/product/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCartAsync } from '@/features/buyer/store/cart.slice';
import { toggleWishlistItem } from '@/features/buyer/store/wishlist.slice';
import { useSocket } from '@/shared/contexts/SocketContext';
import { chatApi } from '@/features/chat/services/chat.api';
import EnquiryModal, { type EnquiryPayload } from '@/features/chat/components/EnquiryModal';
import ProfileCompletionModal from '@/features/chat/components/ProfileCompletionModal';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';

const getCategoryIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('auto') || n.includes('car')) return Car;
  if (n.includes('mobile') || n.includes('phone')) return Smartphone;
  if (n.includes('office')) return Briefcase;
  if (n.includes('machin') || n.includes('equipment') || n.includes('industrial')) return Settings;
  if (n.includes('electronic') || n.includes('appliance')) return Cpu;
  if (n.includes('home') || n.includes('furnish')) return Home;
  if (n.includes('furniture')) return Armchair;
  if (n.includes('agri') || n.includes('farm')) return Sprout;
  if (n.includes('food') || n.includes('bever')) return Utensils;
  if (n.includes('textile') || n.includes('cloth')) return Shirt;
  return Layers;
};

const DEFAULT_COLORS = [
  '#E3F2FD', '#F3E5F5', '#FFF3E0', '#EFEBE9',
  '#E8F5E9', '#E0F7FA', '#FFEBEE', '#F1F8E9'
];

const CATEGORY_IMAGES: { [key: string]: string } = {
  'Automobile Accessories': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=150&h=150&fit=crop&q=80',
  'Electronics & Household Appliances': 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=150&h=150&fit=crop&q=80',
  'Home Furnishing': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=150&h=150&fit=crop&q=80',
  'Industrial Machinery & Equipments': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&h=150&fit=crop&q=80',
  'Mobile Phone & Accessories': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&h=150&fit=crop&q=80',
  'Office Products & Devices': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=150&h=150&fit=crop&q=80',
  'Agriculture': 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=150&h=150&fit=crop&q=80',
  'Electronics': 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=150&h=150&fit=crop&q=80',
  'Food & Beverages': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&h=150&fit=crop&q=80',
  'Furniture': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop&q=80',
  'Textiles': 'https://images.unsplash.com/photo-1558271821-65ab901470dc?w=150&h=150&fit=crop&q=80',
  'Machinery': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&h=150&fit=crop&q=80'
};

const getCategoryImage = (name: string) => {
  if (!name) return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150&h=150&fit=crop&q=80';
  if (CATEGORY_IMAGES[name]) return CATEGORY_IMAGES[name];
  const n = name.toLowerCase();
  if (n.includes('auto') || n.includes('car')) return CATEGORY_IMAGES['Automobile Accessories'];
  if (n.includes('mobile') || n.includes('phone')) return CATEGORY_IMAGES['Mobile Phone & Accessories'];
  if (n.includes('office')) return CATEGORY_IMAGES['Office Products & Devices'];
  if (n.includes('machin') || n.includes('industrial') || n.includes('equipment')) return CATEGORY_IMAGES['Industrial Machinery & Equipments'];
  if (n.includes('electronic') || n.includes('appliance')) return CATEGORY_IMAGES['Electronics & Household Appliances'];
  if (n.includes('home') || n.includes('furnish')) return CATEGORY_IMAGES['Home Furnishing'];
  if (n.includes('furniture')) return CATEGORY_IMAGES['Furniture'];
  if (n.includes('agri') || n.includes('farm')) return CATEGORY_IMAGES['Agriculture'];
  if (n.includes('food') || n.includes('bever')) return CATEGORY_IMAGES['Food & Beverages'];
  if (n.includes('textile') || n.includes('cloth')) return CATEGORY_IMAGES['Textiles'];
  return 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150&h=150&fit=crop&q=80';
};

const containerCls = "w-full max-w-[var(--width-container)] mx-auto px-4 sm:px-8";
const PLACEHOLDER = 'https://placehold.co/300x200/f5f5f5/999?text=No+Image';

const isProductInCat = (p: Product, cat: any) => {
  if (!p || !cat) return false;
  if (cat._id && p.categoryId && String(p.categoryId) === String(cat._id)) return true;
  if (p.category && cat.name && p.category.trim().toLowerCase() === cat.name.trim().toLowerCase()) return true;
  return false;
};

/** IndiaMart-style: hero card (left) + up to 8 product cards or subcategories grid (right) with subcategory filter */
const CategorySection: React.FC<{
  cat: any;
  products: Product[];
  loading: boolean;
  onBulkEnquiry: (product: Product) => void;
}> = ({ cat, products, loading, onBulkEnquiry }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(state => state.wishlist.items);
  const cartItems = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user);
  const isNonBuyer = ['admin', 'supplier', 'reseller', 'superadmin'].includes(user?.role ?? '');
  const [selectedSub, setSelectedSub] = useState<string>('All');

  // If loading, wait for data
  if (loading) {
    return null;
  }

  // All products in this category
  const allCatProducts = products.filter(p => isProductInCat(p, cat));

  // If no products exist in this category, do not render this section on the home page
  if (allCatProducts.length === 0) {
    return null;
  }

  // All subcategories from database
  const allSubcategories = (cat.subcategories || []).filter((sub: any) => sub && sub.name && Boolean(sub.name.trim()));

  // Filter subcategories of this category that actually have products associated with them
  const activeSubcategories = allSubcategories.filter((sub: any) => {
    if (typeof sub.productCount === 'number' && sub.productCount > 0) return true;
    return allCatProducts.some(p =>
      (sub._id && p.subcategoryId && String(p.subcategoryId) === String(sub._id)) ||
      (p.subcategory && p.subcategory.trim().toLowerCase() === sub.name.trim().toLowerCase())
    );
  });

  // Display subcategories for pills: use active ones if available, otherwise all DB subcategories
  const displaySubcategories = activeSubcategories.length > 0 ? activeSubcategories : allSubcategories;

  // Filter products by selected subcategory if a subcategory is selected
  const filteredProducts = selectedSub === 'All'
    ? allCatProducts
    : allCatProducts.filter(p => {
      const subObj = displaySubcategories.find((s: any) => s.name === selectedSub);
      if (subObj && subObj._id && p.subcategoryId && String(p.subcategoryId) === String(subObj._id)) return true;
      if (p.subcategory && p.subcategory.trim().toLowerCase() === selectedSub.trim().toLowerCase()) return true;
      return false;
    });

  // Display up to 8 items (4 columns x 2 rows = 8 items)
  const displayProducts = filteredProducts.slice(0, 8);

  return (
    <section className="py-10 mb-6 bg-white border-b border-[#f0f0f0]">
      <div className={containerCls}>
        {/* Section Header: Category title + Subcategory filter pills + See More */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 border-l-[6px] border-primary pl-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-extrabold text-heading m-0">{cat.name}</h2>
            {displaySubcategories.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedSub('All')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${selectedSub === 'All'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-gray-50 text-body border-gray-200 hover:bg-gray-100 hover:text-heading'
                    }`}
                >
                  All {allCatProducts.length > 0 ? `(${allCatProducts.length})` : ''}
                </button>
                {displaySubcategories.slice(0, 8).map((sub: any) => {
                  const subCount = allCatProducts.filter(p =>
                    (sub._id && p.subcategoryId && String(p.subcategoryId) === String(sub._id)) ||
                    (p.subcategory && p.subcategory.trim().toLowerCase() === sub.name.trim().toLowerCase())
                  ).length;
                  return (
                    <button
                      key={sub._id || sub.name}
                      type="button"
                      onClick={() => setSelectedSub(sub.name)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${selectedSub === sub.name
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-gray-50 text-body border-gray-200 hover:bg-gray-100 hover:text-heading'
                        }`}
                    >
                      {sub.name} {subCount > 0 ? `(${subCount})` : ''}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Link
            to={
              selectedSub !== 'All'
                ? `${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(selectedSub)}`
                : `${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`
            }
            className="text-primary hover:text-primary-dark font-bold text-sm no-underline hover:underline flex items-center gap-1.5 whitespace-nowrap self-start md:self-auto"
          >
            <span>View All {selectedSub !== 'All' ? selectedSub : cat.name}</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Full-Width Modern Grid (4 columns x 2 rows = up to 8 products) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {displayProducts.length > 0 ? (
            displayProducts.map(product => {
              const currentProductId = String(product.id || (product as any)._id || '');
              const isWishlisted = wishlistItems.some(item => {
                const itemId = String(item.id || (item as any)._id || '');
                return itemId && currentProductId && itemId === currentProductId;
              });
              const isInCart = cartItems.some(item => item.productId === currentProductId);

              const handleToggleWishlist = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (!user) {
                  navigate(`${ROUTES.LOGIN}?redirect=${window.location.pathname}`);
                  return;
                }
                if (currentProductId) dispatch(toggleWishlistItem(product));
              };

              const isOutOfStock = (product.stock !== undefined && product.stock <= 0) ||
                (product.stock !== undefined && product.minOrderQty !== undefined && product.stock < product.minOrderQty);

              const handleAddToCart = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (isOutOfStock) return;
                if (isNonBuyer) {
                  alert('This feature is for buyers only');
                  return;
                }
                if (isInCart) {
                  navigate(ROUTES.CART);
                  return;
                }
                if (!user) {
                  navigate(`${ROUTES.LOGIN}?redirect=${window.location.pathname}`);
                  return;
                }
                dispatch(addToCartAsync({
                  productId: currentProductId,
                  name: product.name,
                  price: product.price,
                  quantity: product.minOrderQty || 1,
                  unit: product.unit || 'pcs',
                  supplierId: product.supplierId,
                  imageUrl: product.images?.[0] || product.imageUrl,
                  moq: product.minOrderQty || 1,
                  stock: product.stock,
                  gstRate: product.gstRate,
                  gstIncluded: product.gstIncluded,
                }));
              };

              const handleBuyNow = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (isOutOfStock) return;
                if (isNonBuyer) {
                  alert('This feature is for buyers only');
                  return;
                }
                if (!user) {
                  navigate(`${ROUTES.LOGIN}?redirect=${window.location.pathname}`);
                  return;
                }
                if (!isInCart) {
                  dispatch(addToCartAsync({
                    productId: currentProductId,
                    name: product.name,
                    price: product.price,
                    quantity: product.minOrderQty || 1,
                    unit: product.unit || 'pcs',
                    supplierId: product.supplierId,
                    imageUrl: product.images?.[0] || product.imageUrl,
                    moq: product.minOrderQty || 1,
                    stock: product.stock,
                    gstRate: product.gstRate,
                    gstIncluded: product.gstIncluded,
                  }));
                }
                navigate(ROUTES.CART);
              };

              const handleBulkEnquiry = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (isOutOfStock) return;
                onBulkEnquiry(product);
              };

              return (
                <div
                  key={product.id || currentProductId}
                  onClick={() => navigate(`/products/${currentProductId}`)}
                  className="bg-white border border-[#e2e8f0] rounded-[14px] p-3 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all group relative cursor-pointer"
                >
                  <div>
                    {/* Top Image Area with Wishlist Heart (1:1 square, seamless fit) */}
                    <div className="w-full aspect-square rounded-[10px] bg-white overflow-hidden relative flex items-center justify-center border border-slate-100">
                      <img
                        src={product.images?.[0] || PLACEHOLDER}
                        alt={product.name}
                        className={`w-full h-full object-contain group-hover:scale-101 transition-transform duration-300 ${isOutOfStock ? 'opacity-60 grayscale-[40%]' : ''}`}
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                      />
                      {isOutOfStock && (
                        <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm tracking-wide z-10">
                          Out of Stock
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleToggleWishlist}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 transition-all shadow-xs z-10 border border-slate-100 cursor-pointer"
                        title="Add to Wishlist"
                      >
                        <Heart size={15} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                      </button>
                    </div>

                    {/* Title */}
                    <h4 className="text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug !mt-2 mb-2 group-hover:text-primary transition-colors min-h-[36px]">
                      {product.name}
                    </h4>

                    {/* Badges: Subcategory & Supplier */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {product.subcategory && (
                        <span className="text-[10.5px] font-medium text-[#d9532f] bg-[#fff1e8] px-2 py-0.5 rounded-[5px] truncate max-w-[130px]">
                          {product.subcategory}
                        </span>
                      )}
                      {product.supplierName && (
                        <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                          {product.supplierName}
                        </span>
                      )}
                    </div>

                    {/* Price & MOQ */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[16px] font-black text-[#d9532f]">
                        ₹{product.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                        MOQ: {product.minOrderQty} {product.unit || 'pcs'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Action Buttons (Line 1: Add to Cart & Buy Now | Line 2: Bulk Enquiry) */}
                  <div className="flex flex-col gap-1.5 pt-2.5 border-t border-slate-100 mt-1 w-full">
                    {/* Line 1: Add to Cart & Buy Now in the same line */}
                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={handleAddToCart}
                        className={`text-white text-[11px] font-bold py-2 px-2 rounded-[6px] flex items-center justify-center gap-1 transition-colors whitespace-nowrap shadow-xs flex-1 min-w-0 ${isOutOfStock
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                          : 'bg-[#1a5b8c] hover:bg-[#13466d] cursor-pointer'
                          }`}
                        title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      >
                        <ShoppingCart size={12} className="shrink-0" />
                        <span className="truncate">{isOutOfStock ? 'Out of Stock' : (isInCart ? 'In Cart' : 'Add to Cart')}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={handleBuyNow}
                        className={`text-white text-[11px] font-bold py-2 px-2 rounded-[6px] flex items-center justify-center gap-1 transition-colors whitespace-nowrap shadow-xs flex-1 min-w-0 ${isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-[#10b981] hover:bg-[#059669] cursor-pointer'
                          }`}
                        title={isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                      >
                        <Zap size={12} className={`shrink-0 ${isOutOfStock ? 'fill-slate-400' : 'fill-white'}`} />
                        <span>Buy Now</span>
                      </button>
                    </div>

                    {/* Line 2: Bulk Enquiry in another line (Website brand orange) */}
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={handleBulkEnquiry}
                      className={`w-full text-[11px] font-bold py-2 px-2 rounded-[6px] flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shadow-xs ${isOutOfStock
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                        : 'bg-primary hover:bg-primary-dark text-white border border-primary hover:border-primary-dark cursor-pointer'
                        }`}
                      title={isOutOfStock ? 'Out of Stock' : 'Bulk Enquiry'}
                    >
                      <Users size={12} className={`shrink-0 ${isOutOfStock ? 'text-slate-400' : 'text-white'}`} />
                      <span>Bulk Enquiry</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full h-[339px] flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-[10px] p-6 text-center bg-gray-50/50">
              <h4 className="text-heading font-bold text-sm m-0 mb-1">No products found in "{selectedSub}"</h4>
              <p className="text-xs text-muted m-0 mb-3 max-w-md">
                Be the first to request verified wholesale quotations for {selectedSub}.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('post-requirement-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2 px-4 rounded-[6px] transition-colors cursor-pointer"
                >
                  Request Quotes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSub('All')}
                  className="bg-white hover:bg-gray-100 text-heading text-xs font-semibold py-2 px-4 rounded-[6px] border border-gray-200 transition-colors cursor-pointer"
                >
                  View All {cat.name} ({allCatProducts.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};


const Landing: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector(state => state.auth.user);
  const isNonBuyer = ['admin', 'supplier', 'reseller', 'superadmin'].includes(user?.role ?? '');
  const { socket, setActiveChatId } = useSocket();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk Enquiry modal state
  const [enquiryProduct, setEnquiryProduct] = useState<Product | null>(null);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [, setContactingSupplier] = useState(false);

  const handleBulkEnquiry = (product: Product) => {
    if (!product) return;
    if (isNonBuyer) {
      setShowAdminModal(true);
      return;
    }
    if (!user) {
      navigate(`${ROUTES.LOGIN}?redirect=${window.location.pathname}`);
      return;
    }
    if (!user.name?.trim() || !user.email?.trim()) {
      setEnquiryProduct(product);
      setShowProfilePrompt(true);
      return;
    }
    if (!user.gstin?.trim()) {
      toast.error('GST not available. Please add and verify your GST details to use this feature.');
      return;
    }
    setEnquiryProduct(product);
  };

  const handleEnquirySubmit = useCallback(async (enquiry: EnquiryPayload) => {
    if (!enquiryProduct) return;
    setContactingSupplier(true);
    try {
      const conversation = await chatApi.getOrCreateConversation(
        enquiryProduct.supplierId,
        enquiryProduct.id,
        enquiry.deliveryAddress,
        {
          quantity: enquiry.quantity,
          targetPrice: enquiry.targetPrice || undefined,
          deliveryTimeline: enquiry.deliveryTimeline,
          paymentTerms: enquiry.paymentTerms,
          transportationTerms: enquiry.transportationTerms
        }
      );
      const shipTo = [
        enquiry.deliveryAddress.fullAddress,
        enquiry.deliveryAddress.city,
        enquiry.deliveryAddress.state,
        enquiry.deliveryAddress.pincode,
      ].filter(Boolean).join(', ');
      const priceLine =
        enquiry.priceMode === 'negotiate'
          ? enquiry.targetPrice
            ? `Open to negotiation (Target budget: ₹${(enquiry.targetPrice / enquiry.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} x ${enquiry.quantity} = ₹${enquiry.targetPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total (excl. GST))`
            : 'Open to negotiation'
          : 'As listed';
      const text = [
        `📦 Enquiry: ${enquiryProduct.name}`,
        `Quantity: ${enquiry.quantity} ${enquiryProduct.unit || 'pcs'}s`,
        `Price: ${priceLine}`,
        `Delivery Timeline: ${enquiry.deliveryTimeline}`,
        `Payment Terms: ${enquiry.paymentTerms}`,
        `Transportation: ${enquiry.transportationTerms}`,
        shipTo ? `Ship to: ${shipTo}` : '',
        `Requirements: ${enquiry.requirements}`,
        enquiry.note ? `Note: ${enquiry.note}` : '',
      ].filter(Boolean).join('\n');
      socket?.emit('join_conversation', conversation._id);
      socket?.emit('send_message', {
        conversationId: conversation._id,
        text,
        receiverId: (conversation as any).supplierId,
        metadata: {
          imageUrl: enquiryProduct.imageUrl || enquiryProduct.images?.[0],
          deliveryTimeline: enquiry.deliveryTimeline,
          paymentTerms: enquiry.paymentTerms,
          transportationTerms: enquiry.transportationTerms
        }
      });

      setEnquiryProduct(null);
      toast.success('Bulk enquiry sent successfully!');

      // Give the backend a moment to save the message via socket before fetching messages
      await new Promise(resolve => setTimeout(resolve, 300));

      setActiveChatId(conversation._id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send bulk enquiry');
    } finally {
      setContactingSupplier(false);
    }
  }, [enquiryProduct, socket, setActiveChatId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productApi.list({ pageSize: 100 }),
          categoryService.getAll() // Fetch all categories directly from backend DB (regardless of product count)
        ]);
        setProducts(prodRes.data || []);
        if (catRes.categories) setCategories(catRes.categories);
      } catch { }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);


  // Create repeated list of all backend categories for completely seamless infinite scrolling
  const baseMarqueeCats = categories.length > 0 ? [...categories, ...categories] : [];
  const marqueeItems = baseMarqueeCats.length > 0 ? [...baseMarqueeCats, ...baseMarqueeCats] : [];

  // Only display category sections on the home page that have products
  const categoriesWithProducts = categories.filter(cat => products.some(p => isProductInCat(p, cat)));

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="w-full">
        <div className="w-full max-w-[1600px] mx-auto px-0 sm:px-8">
          <BannerSlider />
        </div>
        <Hero />
        <LatestUpdatesCarousel />

        {categoriesWithProducts.slice(0, 3).map(cat => (
          <CategorySection key={cat._id || cat.name} cat={cat} products={products} loading={loading} onBulkEnquiry={handleBulkEnquiry} />
        ))}

        {/* Post Requirement Lead Capture Section — prominently placed after top categories */}
        <div id="post-requirement-section">
          <PostRequirementSection />
        </div>

        {/* Mobile & Tablet Category Marquee — middle of page (below lg breakpoint) */}
        {categories.length > 0 && (
          <div className="lg:hidden w-full bg-white border-y border-[#f0f0f0] py-2 overflow-hidden flex relative">
            <style dangerouslySetInnerHTML={{
              __html: `
              @keyframes marquee-scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee-infinite {
                display: flex;
                width: max-content;
                animation: marquee-scroll 45s linear infinite;
              }
              .animate-marquee-infinite:hover {
                animation-play-state: paused;
              }
            `}} />

            <div className="animate-marquee-infinite gap-4 px-3">
              {marqueeItems.map((cat, index) => {
                // Dynamically find first uploaded product in this category to show its image
                const matchingProduct = products.find(p => isProductInCat(p, cat));
                const productImage = matchingProduct?.images?.[0];
                const image = cat.image || productImage || getCategoryImage(cat.name);

                return (
                  <Link
                    key={`${cat.name}-${index}`}
                    to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                    className="flex flex-col items-center text-center no-underline shrink-0 group"
                    style={{ width: '58px' }}
                  >
                    <div className="w-[42px] h-[42px] rounded-full overflow-hidden border border-[#e2e8f0] shadow-[0_2px_6px_rgba(0,0,0,0.04)] mb-1 transition-transform duration-300 group-hover:scale-105">
                      <img
                        src={image}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150&h=150&fit=crop&q=80';
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-heading truncate w-full leading-tight">
                      {cat.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Browse by Industry */}
        {categories.length > 0 && (
          <section className="py-8 my-4 bg-white border-b border-[#f0f0f0]">
            <div className={containerCls}>
              <h2 className="text-center text-2xl font-extrabold text-heading mb-6 max-sm:text-[1.5rem] max-sm:mb-8">Browse by Industry</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 w-full">
                {categories.map((cat, i) => {
                  const Icon = getCategoryIcon(cat.name);
                  return (
                    <Link
                      key={cat.name}
                      to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                      className="no-underline flex flex-col items-center justify-center gap-3 py-6 px-3 rounded-[14px] border border-[rgba(0,0,0,0.04)] text-center transition-all hover:scale-[1.03] hover:shadow-md hover:border-primary/40 group"
                      style={{ backgroundColor: DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
                    >
                      <div className="w-12 h-12 bg-white/70 rounded-full flex items-center justify-center text-heading transition-all group-hover:bg-white group-hover:text-primary shadow-2xs">
                        <Icon size={24} strokeWidth={1.5} />
                      </div>
                      <span className="font-bold text-heading text-[13px] leading-tight line-clamp-2">{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <FeaturedSuppliers />

        {categoriesWithProducts.slice(3).map(cat => (
          <CategorySection key={cat._id || cat.name} cat={cat} products={products} loading={loading} onBulkEnquiry={handleBulkEnquiry} />
        ))}

        {/* Why Choose AMJSTAR */}
        <section className="py-10 pb-12 bg-white border-t border-[#f0f0f0] mb-10 max-lg:py-8 max-lg:mb-8 max-sm:py-6 max-sm:mb-6">
          <div className={containerCls}>
            <div className="flex justify-between items-center mb-6 border-l-[6px] border-primary pl-4">
              <h2 className="text-2xl font-extrabold text-heading">Why Choose AMJSTAR?</h2>
            </div>
            <div className="grid grid-cols-3 gap-12 max-lg:gap-4 max-sm:gap-3">
              {[
                { Icon: ShieldCheck, title: 'Secure Payments', desc: '100% payment protection for both buyers and suppliers.' },
                { Icon: Truck, title: 'Pan India Delivery', desc: 'Reliable logistics partners for timely delivery everywhere.' },
                { Icon: BadgeCheck, title: 'Verified Suppliers', desc: 'All suppliers go through a strict background verification.' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="text-center flex flex-col items-center gap-4 max-sm:gap-2">
                  <div className="w-20 h-20 max-sm:w-12 max-sm:h-12 bg-white border border-border text-primary rounded-[8px] max-sm:rounded-[6px] flex items-center justify-center shadow-sm">
                    <Icon size={32} className="max-sm:w-5 max-sm:h-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-heading max-sm:text-xs max-sm:leading-tight">{title}</h3>
                  <p className="text-body text-sm leading-[1.7] max-sm:hidden">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <ProfileCompletionModal
        isOpen={showProfilePrompt}
        onClose={() => setShowProfilePrompt(false)}
        onComplete={() => {
          setShowProfilePrompt(false);
        }}
      />

      {enquiryProduct && !showProfilePrompt && (
        <EnquiryModal
          productName={enquiryProduct.name}
          basePrice={enquiryProduct.price}
          moq={enquiryProduct.minOrderQty}
          stock={enquiryProduct.stock}
          unit={enquiryProduct.unit || 'pcs'}
          gstRate={enquiryProduct.gstRate}
          supplierProfile={enquiryProduct.supplier as any}
          onSubmit={handleEnquirySubmit}
          onClose={() => setEnquiryProduct(null)}
        />
      )}

      <Modal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        title="Buyer Account Required"
        footer={<Button onClick={() => setShowAdminModal(false)}>Got it</Button>}
      >
        <div className="py-2 text-center">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-base font-semibold text-[#0f172a] mb-3">
            Enquiries can only be sent from buyer accounts.
          </p>
          <p className="text-sm text-[#64748b] leading-relaxed">
            Suppliers, resellers, and admins have separate dashboards and cannot negotiate or send bulk enquiries to suppliers. Please log in with a buyer account to continue.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Landing;
