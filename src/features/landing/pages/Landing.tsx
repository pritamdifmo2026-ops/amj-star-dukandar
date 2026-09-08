import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Truck, BadgeCheck, Sprout, Cpu, Utensils,
  Armchair, Home, Settings, Shirt, Layers
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

const getCategoryIcon = (name: string) => {
  const iconMap: { [key: string]: any } = {
    'Agriculture': Sprout, 'Electronics': Cpu, 'Food & Beverages': Utensils,
    'Furniture': Armchair, 'Home Furnishing': Home, 'Machinery': Settings, 'Textiles': Shirt,
  };
  return iconMap[name] || Layers;
};

const DEFAULT_COLORS = [
  '#E3F2FD', '#F3E5F5', '#FFF3E0', '#EFEBE9',
  '#E8F5E9', '#E0F7FA', '#FFEBEE', '#F1F8E9'
];

const CATEGORY_IMAGES: { [key: string]: string } = {
  'Agriculture': 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=150&h=150&fit=crop&q=80',
  'Electronics': 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=150&h=150&fit=crop&q=80',
  'Food & Beverages': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&h=150&fit=crop&q=80',
  'Furniture': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=150&fit=crop&q=80',
  'Home Furnishing': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=150&h=150&fit=crop&q=80',
  'Textiles': 'https://images.unsplash.com/photo-1558271821-65ab901470dc?w=150&h=150&fit=crop&q=80',
  'Machinery': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&h=150&fit=crop&q=80'
};

const containerCls = "w-full max-w-[var(--width-container)] mx-auto px-4 sm:px-8";
const PLACEHOLDER = 'https://placehold.co/300x200/f5f5f5/999?text=No+Image';

const isProductInCat = (p: Product, cat: any) => {
  if (!p || !cat) return false;
  if (cat._id && p.categoryId && String(p.categoryId) === String(cat._id)) return true;
  if (p.category && cat.name && p.category.trim().toLowerCase() === cat.name.trim().toLowerCase()) return true;
  return false;
};

/** IndiaMart-style: hero card (left) + up to 8 product cards grid (right) with subcategory filter */
const CategorySection: React.FC<{ cat: any; products: Product[]; loading: boolean }> = ({ cat, products, loading }) => {
  const [selectedSub, setSelectedSub] = useState<string>('All');

  // All products in this category
  const allCatProducts = products.filter(p => isProductInCat(p, cat));

  // If loading or no products in this category, do not render the category section at all
  if (loading || allCatProducts.length === 0) {
    return null;
  }

  // Filter subcategories of this category that actually have products associated with them
  const activeSubcategories = (cat.subcategories || []).filter((sub: any) => {
    if (!sub || !sub.name || !sub.name.trim()) return false;
    if (typeof sub.productCount === 'number' && sub.productCount > 0) return true;
    return allCatProducts.some(p =>
      (sub._id && p.subcategoryId && String(p.subcategoryId) === String(sub._id)) ||
      (p.subcategory && p.subcategory.trim().toLowerCase() === sub.name.trim().toLowerCase())
    );
  });

  // Filter products by selected subcategory if a subcategory is selected
  const filteredProducts = selectedSub === 'All'
    ? allCatProducts
    : allCatProducts.filter(p => {
        const subObj = activeSubcategories.find((s: any) => s.name === selectedSub);
        if (subObj && subObj._id && p.subcategoryId && String(p.subcategoryId) === String(subObj._id)) return true;
        if (p.subcategory && p.subcategory.trim().toLowerCase() === selectedSub.trim().toLowerCase()) return true;
        return false;
      });

  // Display up to 8 items (or more than 4 items) for rich aesthetics
  const displayProducts = filteredProducts.slice(0, 8);
  const heroProduct = displayProducts[0] || allCatProducts[0];

  return (
    <section className="py-10 mb-6 bg-white border-b border-[#f0f0f0]">
      <div className={containerCls}>
        {/* Section Header: Category title + Subcategory filter pills + See More */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 border-l-[6px] border-primary pl-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-extrabold text-heading m-0">{cat.name}</h2>
            {activeSubcategories.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedSub('All')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedSub === 'All'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-gray-50 text-body border-gray-200 hover:bg-gray-100 hover:text-heading'
                  }`}
                >
                  All ({allCatProducts.length})
                </button>
                {activeSubcategories.map((sub: any) => {
                  const subCount = allCatProducts.filter(p =>
                    (sub._id && p.subcategoryId && String(p.subcategoryId) === String(sub._id)) ||
                    (p.subcategory && p.subcategory.trim().toLowerCase() === sub.name.trim().toLowerCase())
                  ).length;
                  return (
                    <button
                      key={sub._id || sub.name}
                      type="button"
                      onClick={() => setSelectedSub(sub.name)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        selectedSub === sub.name
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
            className="text-[#0066c0] font-medium text-sm no-underline hover:text-[#c45500] hover:underline whitespace-nowrap self-start md:self-auto"
          >
            See more
          </Link>
        </div>

        <div className="flex gap-4 max-md:flex-col items-start">
          {/* Left: Hero card with background image + subcategories links */}
          {heroProduct && (
            <div
              className="w-[280px] h-[280px] max-sm:h-[220px] max-md:w-full shrink-0 rounded-[10px] overflow-hidden relative self-start bg-cover bg-center border border-[#eee] flex flex-col justify-end"
              style={{ backgroundImage: `url(${heroProduct.images?.[0] || PLACEHOLDER})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-3.5 gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-0.5">
                  {selectedSub !== 'All' ? selectedSub : 'Featured Subcategories'}
                </span>
                <ul className="list-none m-0 p-0 flex flex-col gap-1 mb-2.5">
                  {activeSubcategories.length > 0 ? (
                    activeSubcategories.slice(0, 3).map((sub: any) => (
                      <li key={sub._id || sub.name}>
                        <button
                          type="button"
                          onClick={() => setSelectedSub(sub.name)}
                          className={`text-left text-xs font-medium no-underline leading-tight block border-none bg-transparent p-0 cursor-pointer transition-colors ${
                            selectedSub === sub.name
                              ? 'text-primary font-bold underline'
                              : 'text-white/90 hover:text-white hover:underline'
                          }`}
                        >
                          • {sub.name.length > 28 ? sub.name.slice(0, 28) + '…' : sub.name}
                        </button>
                      </li>
                    ))
                  ) : (
                    displayProducts.slice(0, 3).map(p => (
                      <li key={p.id}>
                        <Link
                          to={`/products/${p.id}`}
                          className="text-white text-xs no-underline hover:underline leading-tight block"
                        >
                          • {p.name.length > 28 ? p.name.slice(0, 28) + '…' : p.name}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
                <Link
                  to={
                    selectedSub !== 'All'
                      ? `${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(selectedSub)}`
                      : `${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`
                  }
                  className="text-center bg-white text-heading text-xs font-bold py-2 px-4 rounded-[6px] no-underline hover:bg-primary hover:text-white transition-colors"
                >
                  View All {selectedSub !== 'All' ? selectedSub : cat.name}
                </Link>
              </div>
            </div>
          )}

          {/* Right: Grid of up to 8 product items (2 columns on md/lg, 1 on sm) */}
          <div className="flex-1 grid grid-cols-2 max-sm:grid-cols-1 gap-3 content-start">
            {displayProducts.map(product => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="no-underline flex gap-3 items-start border border-[#eee] rounded-[10px] p-3 hover:border-primary hover:shadow-sm transition-all self-start h-auto bg-white group"
              >
                <div className="w-[84px] h-[84px] rounded-[8px] overflow-hidden shrink-0 bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <img
                    src={product.images?.[0] || PLACEHOLDER}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <h4 className="text-heading text-sm font-semibold m-0 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {product.subcategory && (
                      <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-[4px] truncate max-w-[140px]">
                        {product.subcategory}
                      </span>
                    )}
                    {product.supplierName && (
                      <span className="text-muted text-xs truncate max-w-[140px]">{product.supplierName}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-primary text-[15px] font-bold">
                      ₹{product.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-muted text-[11px]">MOQ: {product.minOrderQty} {product.unit || 'units'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
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
          categoryService.getAll({ hasProducts: true })
        ]);
        setProducts(prodRes.data || []);
        if (catRes.categories) setCategories(catRes.categories);
      } catch { }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Filter to categories that actually have live products
  const activeCategories = React.useMemo(() => {
    return categories.filter(cat => {
      const hasLoadedProduct = products.some(p => isProductInCat(p, cat));
      return hasLoadedProduct || (typeof cat.productCount === 'number' && cat.productCount > 0);
    });
  }, [categories, products]);

  // Create repeated list to guarantee completely seamless infinite scrolling with no gaps
  const baseMarqueeCats = activeCategories.length > 0 ? [...activeCategories, ...activeCategories, ...activeCategories] : [];
  const marqueeItems = baseMarqueeCats.length > 0 ? [...baseMarqueeCats, ...baseMarqueeCats] : [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="w-full">
        <div className="w-full max-w-[1600px] mx-auto px-0 sm:px-8">
          <BannerSlider />
        </div>
        <Hero />
        <LatestUpdatesCarousel />

        {activeCategories.slice(0, 4).map(cat => (
          <CategorySection key={cat._id || cat.name} cat={cat} products={products} loading={loading} />
        ))}

        {/* Mobile & Tablet Category Marquee — middle of page (below lg breakpoint) */}
        {activeCategories.length > 0 && (
          <div className="lg:hidden w-full bg-white border-y border-[#f0f0f0] py-2 overflow-hidden flex relative">
            <style dangerouslySetInnerHTML={{__html: `
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
                const image = cat.image || productImage || CATEGORY_IMAGES[cat.name] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150&h=150&fit=crop&q=80';

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
        {activeCategories.length > 0 && (
          <section className="py-5 my-5 bg-white max-lg:py-12 max-sm:py-8 hidden lg:block">
            <div className={containerCls}>
              <h2 className="text-center text-2xl font-extrabold text-heading mb-6 max-sm:text-[1.5rem] max-sm:mb-8">Browse by Industry</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 max-lg:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] max-sm:grid-cols-2 max-sm:gap-4">
                {activeCategories.map((cat, i) => {
                  const Icon = getCategoryIcon(cat.name);
                  return (
                    <Link
                      key={cat.name}
                      to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                      className="no-underline flex flex-col items-center gap-3 py-5 px-3 rounded-[12px] border border-[rgba(0,0,0,0.03)] text-center transition-colors hover:border-primary max-sm:py-6 max-sm:px-2 group"
                      style={{ backgroundColor: DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
                    >
                      <div className="w-11 h-11 bg-white/60 rounded-full flex items-center justify-center text-heading transition-all group-hover:bg-white group-hover:text-primary">
                        <Icon size={24} strokeWidth={1.5} />
                      </div>
                      <span className="font-semibold text-heading text-[13px] leading-tight">{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <FeaturedSuppliers />

        {activeCategories.slice(4).map(cat => (
          <CategorySection key={cat._id || cat.name} cat={cat} products={products} loading={loading} />
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

        <PostRequirementSection />
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
