import React, { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import Loader from '@/shared/components/feedback/Loader';
import ErrorState from '@/shared/components/feedback/ErrorState';
import EmptyState from '@/shared/components/feedback/EmptyState';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import styles from './ProductList.module.css';

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || undefined;
  const subcategory = searchParams.get('subcategory') || undefined;
  const searchQuery = searchParams.get('search') || undefined;
  
  const { data, isLoading, isError, refetch } = useProducts({
    category,
    subcategory,
    search: searchQuery,
  });

  const products = data?.data || [];

  // Filter and Sort states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('default');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [moqRange, setMoqRange] = useState<string>('all');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);

  // Client-side instant filter and sort logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 1. Price Range Filter
    if (priceRange === 'under10') {
      result = result.filter(p => p.price < 10000);
    } else if (priceRange === '10to50') {
      result = result.filter(p => p.price >= 10000 && p.price <= 50000);
    } else if (priceRange === '50to100') {
      result = result.filter(p => p.price >= 50000 && p.price <= 100000);
    } else if (priceRange === 'above100') {
      result = result.filter(p => p.price > 100000);
    }

    // 2. MOQ Range Filter
    if (moqRange === 'moq5') {
      result = result.filter(p => p.minOrderQty <= 5);
    } else if (moqRange === 'moq20') {
      result = result.filter(p => p.minOrderQty <= 20);
    } else if (moqRange === 'moq100') {
      result = result.filter(p => p.minOrderQty <= 100);
    }

    // 3. Verified Supplier Filter
    if (onlyVerified) {
      result = result.filter(p => p.isVerified);
    }

    // 4. Sorting Logic
    if (sortBy === 'priceLow') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceHigh') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'moqLow') {
      result.sort((a, b) => a.minOrderQty - b.minOrderQty);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return result;
  }, [products, sortBy, priceRange, moqRange, onlyVerified]);

  const activeFiltersCount = (priceRange !== 'all' ? 1 : 0) + (moqRange !== 'all' ? 1 : 0) + (onlyVerified ? 1 : 0) + (sortBy !== 'default' ? 1 : 0);

  return (
    <div className={styles.page}>
      <Navbar />
      
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Filter Sidebar / Header */}
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>
                  {searchQuery ? `Results for "${searchQuery}"` : subcategory || category || 'All Products'}
                </h1>
                {(category || subcategory || searchQuery) && (
                  <button 
                    className={styles.clearBtn} 
                    onClick={() => navigate('/products')}
                    title="View All Products"
                  >
                    <X size={16} />
                    <span>View All</span>
                  </button>
                )}
              </div>
              <p className={styles.count}>{filteredAndSortedProducts.length} products found</p>
            </div>
            
            <div className={styles.controls}>
              <button className={styles.controlBtn} onClick={() => setIsFilterOpen(true)}>
                <Filter size={16} />
                <span>Filter</span>
                {activeFiltersCount > 0 && (
                  <span className={styles.badge}>{activeFiltersCount}</span>
                )}
              </button>
              <button className={styles.controlBtn} onClick={() => setIsFilterOpen(true)}>
                <SlidersHorizontal size={16} />
                <span>Sort</span>
              </button>
            </div>
          </div>

          <div className={styles.content}>
            <div className={styles.mainGrid}>
              {isLoading ? (
                <div className={styles.center}>
                  <Loader size="lg" />
                </div>
              ) : isError ? (
                <ErrorState onRetry={() => refetch()} />
              ) : filteredAndSortedProducts.length === 0 ? (
                <EmptyState title="No products matched your filters." />
              ) : (
                <div className={styles.grid}>
                  {filteredAndSortedProducts.map((product: any) => (
                    <ProductCard key={product._id || product.id} product={product} showAddToCart={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Slide-over Filter & Sort Drawer Panel */}
      <div 
        className={`${styles.drawerOverlay} ${isFilterOpen ? styles.overlayOpen : ''}`} 
        onClick={() => setIsFilterOpen(false)} 
      />
      <div className={`${styles.filterDrawer} ${isFilterOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          <h3>Filter & Sort Products</h3>
          <button className={styles.closeDrawerBtn} onClick={() => setIsFilterOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          {/* Sorting Group */}
          <div className={styles.filterGroup}>
            <h4 className={styles.groupTitle}>Sort By</h4>
            <div className={styles.optionsList}>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="sortBy" 
                  value="default" 
                  checked={sortBy === 'default'} 
                  onChange={() => setSortBy('default')} 
                />
                <span>Default</span>
              </label>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="sortBy" 
                  value="priceLow" 
                  checked={sortBy === 'priceLow'} 
                  onChange={() => setSortBy('priceLow')} 
                />
                <span>Price: Low to High</span>
              </label>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="sortBy" 
                  value="priceHigh" 
                  checked={sortBy === 'priceHigh'} 
                  onChange={() => setSortBy('priceHigh')} 
                />
                <span>Price: High to Low</span>
              </label>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="sortBy" 
                  value="moqLow" 
                  checked={sortBy === 'moqLow'} 
                  onChange={() => setSortBy('moqLow')} 
                />
                <span>MOQ: Low to High</span>
              </label>
            </div>
          </div>

          {/* Price Range Group */}
          <div className={styles.filterGroup}>
            <h4 className={styles.groupTitle}>Price Range</h4>
            <div className={styles.optionsList}>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="priceRange" 
                  value="all" 
                  checked={priceRange === 'all'} 
                  onChange={() => setPriceRange('all')} 
                />
                <span>All Prices</span>
              </label>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="priceRange" 
                  value="under10" 
                  checked={priceRange === 'under10'} 
                  onChange={() => setPriceRange('under10')} 
                />
                <span>Under ₹10,000</span>
              </label>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="priceRange" 
                  value="10to50" 
                  checked={priceRange === '10to50'} 
                  onChange={() => setPriceRange('10to50')} 
                />
                <span>₹10,000 - ₹50,000</span>
              </label>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="priceRange" 
                  value="50to100" 
                  checked={priceRange === '50to100'} 
                  onChange={() => setPriceRange('50to100')} 
                />
                <span>₹50,000 - ₹1,00,000</span>
              </label>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="priceRange" 
                  value="above100" 
                  checked={priceRange === 'above100'} 
                  onChange={() => setPriceRange('above100')} 
                />
                <span>Above ₹1,00,000</span>
              </label>
            </div>
          </div>

          {/* MOQ Group */}
          <div className={styles.filterGroup}>
            <h4 className={styles.groupTitle}>Minimum Order Qty (MOQ)</h4>
            <div className={styles.optionsList}>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="moqRange" 
                  value="all" 
                  checked={moqRange === 'all'} 
                  onChange={() => setMoqRange('all')} 
                />
                <span>All MOQs</span>
              </label>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="moqRange" 
                  value="moq5" 
                  checked={moqRange === 'moq5'} 
                  onChange={() => setMoqRange('moq5')} 
                />
                <span>MOQ ≤ 5 pcs</span>
              </label>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="moqRange" 
                  value="moq20" 
                  checked={moqRange === 'moq20'} 
                  onChange={() => setMoqRange('moq20')} 
                />
                <span>MOQ ≤ 20 pcs</span>
              </label>
              <label className={styles.optionLabel}>
                <input 
                  type="radio" 
                  name="moqRange" 
                  value="moq100" 
                  checked={moqRange === 'moq100'} 
                  onChange={() => setMoqRange('moq100')} 
                />
                <span>MOQ ≤ 100 pcs</span>
              </label>
            </div>
          </div>

          {/* Seller Group */}
          <div className={styles.filterGroup}>
            <h4 className={styles.groupTitle}>Seller Verification</h4>
            <div className={styles.optionsList}>
              <label className={styles.optionLabel}>
                <input 
                  type="checkbox" 
                  checked={onlyVerified} 
                  onChange={(e) => setOnlyVerified(e.target.checked)} 
                />
                <span>Verified Suppliers Only</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.drawerFooter}>
          <button 
            className={styles.resetBtn} 
            onClick={() => {
              setSortBy('default');
              setPriceRange('all');
              setMoqRange('all');
              setOnlyVerified(false);
            }}
          >
            Reset All
          </button>
          <button className={styles.applyBtn} onClick={() => setIsFilterOpen(false)}>
            Apply Filters
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductList;
