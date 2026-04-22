import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import Loader from '@/shared/components/feedback/Loader';
import ErrorState from '@/shared/components/feedback/ErrorState';
import EmptyState from '@/shared/components/feedback/EmptyState';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import styles from './ProductList.module.css';

const ProductList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || undefined;
  const searchQuery = searchParams.get('search') || undefined;
  
  const { data, isLoading, isError, refetch } = useProducts({
    category,
    search: searchQuery,
  });

  const products = data?.data || [];

  return (
    <div className={styles.page}>
      <Navbar />
      
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Filter Sidebar / Header */}
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <h1 className={styles.title}>
                {searchQuery ? `Results for "${searchQuery}"` : category || 'All Products'}
              </h1>
              <p className={styles.count}>{products.length} products found</p>
            </div>
            
            <div className={styles.controls}>
              <button className={styles.controlBtn}>
                <Filter size={16} />
                <span>Filter</span>
              </button>
              <button className={styles.controlBtn}>
                <SlidersHorizontal size={16} />
                <span>Sort</span>
              </button>
            </div>
          </div>

          <div className={styles.content}>
            {isLoading ? (
              <div className={styles.center}>
                <Loader size="lg" />
              </div>
            ) : isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : products.length === 0 ? (
              <EmptyState title="No products found in this category." />
            ) : (
              <div className={styles.grid}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductList;
