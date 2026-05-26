import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Truck, BadgeCheck, Sprout, Cpu, Utensils,
  Armchair, Home, Settings, Shirt, Layers
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import BannerSlider from '../components/BannerSlider';
import PostRequirementSection from '../components/PostRequirementSection';
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

/** IndiaMart-style: hero card (left) + 2×3 mini product grid (right) */
const CategorySection: React.FC<{ cat: any; products: Product[]; loading: boolean }> = ({ cat, products, loading }) => {
  const catProducts = products.filter(p => p.category === cat.name).slice(0, 5);
  const heroProduct = catProducts[0];
  const gridProducts = catProducts.slice(1, 5);

  return (
    <section className="py-10 mb-6 bg-white border-b border-[#f0f0f0]">
      <div className={containerCls}>
        <div className="flex justify-between items-center mb-6 border-l-[6px] border-primary pl-4">
          <h2 className="text-xl font-extrabold text-heading">{cat.name}</h2>
          <Link
            to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
            className="text-[#0066c0] font-medium text-sm no-underline hover:text-[#c45500] hover:underline"
          >
            See more
          </Link>
        </div>

        {loading ? (
          <p className="text-body text-sm">Loading products...</p>
        ) : catProducts.length === 0 ? (
          <p className="text-body text-sm">No products yet in this category.</p>
        ) : (
          <div className="flex gap-4 max-md:flex-col">
            {/* Left: Hero card with background image + product name links */}
            {heroProduct && (
              <div
                className="w-[280px] max-md:w-full shrink-0 rounded-[10px] overflow-hidden relative min-h-[280px] max-sm:min-h-[200px] bg-contain bg-no-repeat bg-center bg-white border border-[#eee]"
                style={{ backgroundImage: `url(${heroProduct.images?.[0] || PLACEHOLDER})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex flex-col justify-end p-4 gap-1">
                  <ul className="list-none m-0 p-0 flex flex-col gap-1.5 mb-3">
                    {catProducts.slice(1, 5).map(p => (
                      <li key={p.id}>
                        <Link
                          to={`/products/${p.id}`}
                          className="text-white text-xs no-underline hover:underline leading-tight block"
                        >
                          {p.name.length > 32 ? p.name.slice(0, 32) + '…' : p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                    className="text-center bg-white text-heading text-xs font-bold py-2 px-4 rounded-[6px] no-underline hover:bg-primary hover:text-white transition-colors"
                  >
                    View All
                  </Link>
                </div>
              </div>
            )}

            {/* Right: 2 cols × 3 rows list-style cards */}
            <div className="flex-1 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              {gridProducts.map(product => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="no-underline flex gap-3 items-center border border-[#eee] rounded-[10px] p-3 hover:border-primary hover:shadow-sm transition-all"
                >
                  <img
                    src={product.images?.[0] || PLACEHOLDER}
                    alt={product.name}
                    className="w-[80px] h-[80px] object-cover rounded-[8px] shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <h4 className="text-heading text-sm font-semibold m-0 leading-snug line-clamp-2">
                      {product.name.length > 36 ? product.name.slice(0, 36) + '…' : product.name}
                    </h4>
                    {product.supplierName && (
                      <span className="text-primary text-xs">{product.supplierName}</span>
                    )}
                    <span className="text-muted text-xs">MOQ: {product.minOrderQty} units</span>
                    <span className="text-primary text-sm font-bold">₹{product.price?.toLocaleString('en-IN')}</span>
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
      } catch { }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Create repeated list to guarantee completely seamless infinite scrolling with no gaps
  const baseMarqueeCats = categories.length > 0 ? [...categories, ...categories, ...categories] : [];
  const marqueeItems = baseMarqueeCats.length > 0 ? [...baseMarqueeCats, ...baseMarqueeCats] : [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main>
        <div className="w-full max-w-[1600px] mx-auto px-0 sm:px-8">
          <BannerSlider />
        </div>
        <Hero />

        {categories.slice(0, 4).map(cat => (
          <CategorySection key={cat._id} cat={cat} products={products} loading={loading} />
        ))}

        {/* Mobile & Tablet Category Marquee — middle of page (below lg breakpoint) */}
        {categories.length > 0 && (
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
                const matchingProduct = products.find(p => p.category === cat.name);
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
        <section className="py-5 my-5 bg-white max-lg:py-12 max-sm:py-8 hidden lg:block">
          <div className={containerCls}>
            <h2 className="text-center text-2xl font-extrabold text-heading mb-6 max-sm:text-[1.5rem] max-sm:mb-8">Browse by Industry</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 max-lg:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] max-sm:grid-cols-2 max-sm:gap-4">
              {categories.map((cat, i) => {
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

        {categories.slice(4).map(cat => (
          <CategorySection key={cat._id} cat={cat} products={products} loading={loading} />
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
