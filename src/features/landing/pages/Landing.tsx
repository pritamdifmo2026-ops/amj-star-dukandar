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
import ProductCard from '@/features/product/components/ProductCard';
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

const containerCls = "w-full max-w-[var(--width-container)] mx-auto px-8";

const CategorySection: React.FC<{ cat: any; products: Product[]; loading: boolean }> = ({ cat, products, loading }) => (
  <section className="py-16 mb-20 bg-white max-lg:py-12 max-lg:mb-12 max-sm:py-8 max-sm:mb-8">
    <div className={containerCls}>
      <div className="flex justify-between items-center mb-12 border-l-[6px] border-primary pl-4 max-sm:mb-6">
        <h2 className="text-2xl font-extrabold text-heading max-sm:text-xl">{cat.name}</h2>
        <Link
          to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
          className="text-[#0066c0] font-medium text-sm no-underline hover:text-[#c45500] hover:underline"
        >
          See more
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6 max-sm:grid-cols-2 max-sm:gap-3">
        {loading ? <p>Loading products...</p> : products
          .filter(p => p.category === cat.name)
          .slice(0, 8)
          .map(product => <ProductCard key={product.id} product={product} showAddToCart={false} />)}
      </div>
    </div>
  </section>
);

const Landing: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productApi.list({ pageSize: 50 }), categoryService.getAll()])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data || []);
        if (catRes.categories) setCategories(catRes.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main>
        <div className="w-full max-w-[1600px] mx-auto px-8">
          <BannerSlider />
        </div>
        <Hero />

        {categories.slice(0, 3).map(cat => (
          <CategorySection key={cat._id} cat={cat} products={products} loading={loading} />
        ))}

        {/* Browse by Industry */}
        <section className="py-5 my-5 bg-white max-lg:py-12 max-sm:py-8">
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

        {categories.slice(3, 6).map(cat => (
          <CategorySection key={cat._id} cat={cat} products={products} loading={loading} />
        ))}

        {/* Features */}
        <section className="py-20 pb-24 bg-white border-t border-[#f0f0f0] mb-20 max-lg:py-12 max-lg:mb-12 max-sm:py-8 max-sm:mb-8">
          <div className={containerCls}>
            <div className="flex justify-between items-center mb-12 border-l-[6px] border-primary pl-4">
              <h2 className="text-2xl font-extrabold text-heading">Why Choose AMJStar?</h2>
            </div>
            <div className="grid grid-cols-3 gap-12 max-lg:gap-4 max-sm:gap-6">
              {[
                { Icon: ShieldCheck, title: 'Secure Payments', desc: '100% payment protection for both buyers and suppliers.' },
                { Icon: Truck, title: 'Pan India Delivery', desc: 'Reliable logistics partners for timely delivery everywhere.' },
                { Icon: BadgeCheck, title: 'Verified Sellers', desc: 'All suppliers go through a strict background verification.' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="text-center flex flex-col items-center gap-6">
                  <div className="w-20 h-20 max-sm:w-12 max-sm:h-12 bg-white border border-border text-primary rounded-[8px] max-sm:rounded-[4px] flex items-center justify-center shadow-sm">
                    <Icon size={32} className="max-sm:w-5 max-sm:h-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-heading max-sm:text-[11px] max-sm:mt-1 max-sm:leading-tight">{title}</h3>
                  <p className="text-body text-sm leading-[1.7] max-sm:hidden">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
