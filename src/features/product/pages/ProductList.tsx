import React from 'react';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import Loader from '@/shared/components/feedback/Loader';
import ErrorState from '@/shared/components/feedback/ErrorState';
import EmptyState from '@/shared/components/feedback/EmptyState';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || undefined;
  const subcategory = searchParams.get('subcategory') || undefined;
  const searchQuery = searchParams.get('search') || undefined;

  const { data, isLoading, isError, refetch } = useProducts({ category, subcategory, search: searchQuery });
  const products = data?.data || [];

  const controlBtnCls = "flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-[var(--radius-sm)] text-sm font-medium text-body cursor-pointer transition-all hover:border-primary hover:text-primary max-md:px-2 max-md:rounded-[8px]";

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1 py-8 pb-12">
        <div className="w-full max-w-[var(--width-container)] mx-auto px-8">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-border max-md:relative max-md:flex-col max-md:items-start max-md:pb-2 max-md:mb-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-heading">
                  {searchQuery ? `Results for "${searchQuery}"` : subcategory || category || 'All Products'}
                </h1>
                {(category || subcategory || searchQuery) && (
                  <button
                    onClick={() => navigate('/products')}
                    title="View All Products"
                    className="flex items-center gap-1.5 bg-surface border border-primary text-primary px-3 py-1 rounded-[10px] text-xs font-semibold cursor-pointer transition-all hover:bg-primary hover:text-white max-md:px-1.5"
                  >
                    <X size={16} />
                    <span className="max-md:hidden">View All</span>
                  </button>
                )}
              </div>
              <p className="text-sm text-muted">{products.length} products found</p>
            </div>

            <div className="flex gap-3 max-md:absolute max-md:top-1 max-md:right-0 max-md:gap-2">
              <button className={controlBtnCls}>
                <Filter size={16} />
                <span className="max-md:hidden">Filter</span>
              </button>
              <button className={controlBtnCls}>
                <SlidersHorizontal size={16} />
                <span className="max-md:hidden">Sort</span>
              </button>
            </div>
          </div>

          <div className="flex gap-8 items-start">
            <div className="flex-1 min-h-[400px]">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader size="lg" />
                </div>
              ) : isError ? (
                <ErrorState onRetry={() => refetch()} />
              ) : products.length === 0 ? (
                <EmptyState title="No products found in this category." />
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6 max-sm:grid-cols-2 max-sm:gap-3">
                  {products.map((product: any) => (
                    <ProductCard key={product._id || product.id} product={product} showAddToCart={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductList;
