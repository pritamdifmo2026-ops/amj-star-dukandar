import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Truck, BadgeCheck, Sprout, Cpu, Utensils,
  Armchair, Home, Settings, Shirt, Layers
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import BannerSlider from '../components/BannerSlider';
import Footer from '../components/Footer';
import { ROUTES } from '@/shared/constants/routes';
import { productApi } from '@/features/product/services/product.api';
import categoryService from '@/features/product/services/category.service';
import type { Product } from '@/features/product/types';
import { useState, useEffect } from 'react';

const getCategoryIcon = (name: string) => {
  const iconMap: { [key: string]: any } = {
    'Agriculture': Sprout,
    'Electronics': Cpu,
    'Food & Beverages': Utensils,
    'Furniture': Armchair,
    'Home Furnishing': Home,
    'Machinery': Settings,
    'Textiles': Shirt,
  };
  return iconMap[name] || Layers;
};

const DEFAULT_COLORS = [
  '#E3F2FD', '#F3E5F5', '#FFF3E0', '#EFEBE9',
  '#E8F5E9', '#E0F7FA', '#FFEBEE', '#F1F8E9'
];

const PLACEHOLDER = 'https://placehold.co/300x200/f5f5f5/999?text=No+Image';

const CategorySection: React.FC<{ cat: any; products: Product[]; loading: boolean }> = ({
  cat, products, loading
}) => {
  const catProducts = products.filter(p => p.category === cat.name).slice(0, 7);
  const heroProduct = catProducts[0];
  const gridProducts = catProducts.slice(1, 7);

  return (
    <section className="py-16 mb-20 max-lg:py-12 max-lg:mb-12 max-sm:py-8 max-sm:mb-8 bg-white">
      <div className="w-full max-w-[var(--container-max)] mx-auto px-4">
        <div className="flex justify-between items-center mb-12 max-sm:mb-6 border-l-[6px] border-[var(--color-primary)] pl-4">
          <h2 className="text-2xl font-extrabold text-[var(--color-secondary)]">{cat.name}</h2>
          <Link
            to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
            className="text-[#0066c0] font-medium text-sm no-underline transition-colors duration-200 hover:text-[#c45500] hover:underline"
          >
            See more
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm py-5">Loading products...</p>
        ) : catProducts.length === 0 ? (
          <p className="text-slate-400 text-sm py-5">No products yet in this category.</p>
        ) : (
          <div className="grid grid-cols-[260px_1fr] max-lg:grid-cols-[220px_1fr] max-md:grid-cols-1 max-sm:grid-cols-1 gap-5 max-lg:gap-4 max-sm:gap-3 items-stretch">
            {/* Hero Card */}
            <div
              className="bg-cover bg-center rounded-lg min-h-[360px] max-lg:min-h-[300px] max-md:min-h-[220px] max-sm:min-h-[180px] relative overflow-hidden shrink-0"
              style={{ backgroundImage: `url(${heroProduct?.images?.[0] || PLACEHOLDER})` }}
            >
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pb-4 pt-5 flex flex-col gap-3">
                <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                  {catProducts.slice(1, 5).map(p => (
                    <li key={p.id}>
                      <Link to={`/products/${p.id}`} className="text-white text-[13px] font-medium no-underline leading-tight transition-colors duration-150 hover:text-yellow-300 hover:underline">
                        {p.name.length > 30 ? p.name.slice(0, 30) + '…' : p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                  className="inline-block bg-white/15 border border-white/70 text-white text-xs font-semibold py-[7px] px-[18px] rounded no-underline transition-colors duration-200 w-fit hover:bg-white/28"
                >
                  View All
                </Link>
              </div>
            </div>

            {/* 2×3 Mini Product Grid */}
            <div className="grid grid-cols-2 grid-rows-3 max-sm:grid-cols-1 gap-[14px]">
              {gridProducts.map(product => (
                <Link key={product.id} to={`/products/${product.id}`} className="flex gap-3 p-3 border border-[#e8e8e8] rounded-md no-underline text-inherit bg-white transition-all duration-200 overflow-hidden hover:shadow-[0_2px_10px_rgba(0,0,0,0.09)] hover:border-[#d0d0d0]">
                  <img
                    src={product.images?.[0] || PLACEHOLDER}
                    alt={product.name}
                    className="w-20 h-20 max-sm:w-16 max-sm:h-16 object-cover rounded shrink-0 bg-[#f5f5f5]"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <h4 className="text-[13px] font-semibold text-[#1a1a2e] m-0 leading-tight">
                      {product.name.length > 28 ? product.name.slice(0, 28) + '…' : product.name}
                    </h4>
                    <ul className="list-none p-0 m-0 flex flex-col gap-0.5">
                      {product.supplierName && <li className="text-[11.5px] text-[#0066c0] whitespace-nowrap overflow-hidden text-ellipsis">{product.supplierName}</li>}
                      <li className="text-[11.5px] text-[#0066c0] whitespace-nowrap overflow-hidden text-ellipsis">MOQ: {product.minOrderQty} units</li>
                      <li className="text-[11.5px] text-[#0066c0] whitespace-nowrap overflow-hidden text-ellipsis">₹{product.price?.toLocaleString('en-IN')}</li>
                    </ul>
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
      } catch (error) {
        console.error('Failed to fetch landing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main>
        <div className="w-full max-w-[1600px] mx-auto px-4">
          <BannerSlider />
        </div>
        <Hero />

        {categories.slice(0, 3).map(cat => (
          <CategorySection key={cat._id} cat={cat} products={products} loading={loading} />
        ))}

        {/* Browse by Industry */}
        <section className="py-5 my-5 bg-white">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-4">
            <h2 className="text-center text-2xl font-extrabold text-[var(--color-secondary)] mb-6">Browse by Industry</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] max-lg:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] max-sm:grid-cols-2 gap-6 max-sm:gap-4">
              {categories.map((cat, i) => {
                const Icon = getCategoryIcon(cat.name);
                return (
                  <Link
                    key={cat.name}
                    to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                    className="p-5 max-sm:p-3 rounded-xl text-center flex flex-col items-center gap-3 border border-black/[0.03] no-underline transition-colors duration-200 hover:border-[var(--color-primary)]"
                    style={{ backgroundColor: DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
                  >
                    <div className="w-11 h-11 bg-white/60 rounded-full flex items-center justify-center text-[var(--color-secondary)]">
                      <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <span className="font-semibold text-[var(--color-secondary)] text-[13px] leading-tight">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {categories.slice(3, 6).map(cat => (
          <CategorySection key={cat._id} cat={cat} products={products} loading={loading} />
        ))}

        {/* Why Choose AMJStar */}
        <section className="py-20 max-lg:py-12 max-sm:py-8 pb-24 bg-white border-t border-[#f0f0f0] mb-20">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-4">
            <div className="flex justify-between items-center mb-12 border-l-[6px] border-[var(--color-primary)] pl-4">
              <h2 className="text-2xl font-extrabold text-[var(--color-secondary)]">Why Choose AMJStar?</h2>
            </div>
            <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-12 max-lg:gap-4 max-sm:gap-8">
              {[
                { icon: ShieldCheck, title: 'Secure Payments', desc: '100% payment protection for both buyers and suppliers.' },
                { icon: Truck, title: 'Pan India Delivery', desc: 'Reliable logistics partners for timely delivery everywhere.' },
                { icon: BadgeCheck, title: 'Verified Sellers', desc: 'All suppliers go through a strict background verification.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center flex flex-col items-center gap-6">
                  <div className="w-20 h-20 max-sm:w-12 max-sm:h-12 bg-white border border-[var(--color-border)] text-[var(--color-primary)] rounded-md flex items-center justify-center shadow-sm">
                    <Icon size={32} />
                  </div>
                  <h3 className="text-lg font-extrabold max-sm:text-[11px] max-sm:mt-1 max-sm:leading-tight">{title}</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{desc}</p>
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
