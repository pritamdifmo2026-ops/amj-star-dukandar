import React, { useState, useCallback, useEffect } from 'react';
import { Filter, SlidersHorizontal, X, ChevronDown, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation, useNavigationType } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import Loader from '@/shared/components/feedback/Loader';
import ErrorState from '@/shared/components/feedback/ErrorState';
import EmptyState from '@/shared/components/feedback/EmptyState';
import Navbar from '@/features/landing/components/Navbar';
import Footer from '@/features/landing/components/Footer';
import type { ProductFilters } from '../types';

const LEAD_TIME_OPTIONS = ['Any', '1-3 days', '1 week', '2 weeks', '1 month', '2+ months'];
const CERT_OPTIONS = ['ISO', 'FSSAI', 'BIS', 'MSME', 'GMP', 'CE', 'Organic'];
const SORT_OPTIONS: { value: ProductFilters['sort']; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

interface FilterState {
  minPrice: string;
  maxPrice: string;
  minMoq: string;
  maxMoq: string;
  certifications: string[];
  leadTime: string;
  verifiedOnly: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  minPrice: '', maxPrice: '', minMoq: '', maxMoq: '',
  certifications: [], leadTime: '', verifiedOnly: false,
};

function filterCount(f: FilterState): number {
  let count = 0;
  if (f.minPrice || f.maxPrice) count++;
  if (f.minMoq || f.maxMoq) count++;
  count += f.certifications.length;
  if (f.leadTime) count++;
  if (f.verifiedOnly) count++;
  return count;
}

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { key: locationKey } = useLocation();
  const navType = useNavigationType();
  const category = searchParams.get('category') || undefined;
  const subcategory = searchParams.get('subcategory') || undefined;
  const searchQuery = searchParams.get('q') || undefined;
  const originalQuery = searchParams.get('original') || undefined;

  const [showFilters, setShowFilters] = useState(() => searchParams.get('showFilters') === 'true');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sort, setSort] = useState<ProductFilters['sort']>('newest');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Handle auto-opening filter drawer via URL param
  useEffect(() => {
    if (searchParams.get('showFilters') === 'true') {
      setShowFilters(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('showFilters');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const queryFilters: ProductFilters = {
    category, subcategory, q: searchQuery, sort,
    ...(appliedFilters.minPrice ? { minPrice: Number(appliedFilters.minPrice) } : {}),
    ...(appliedFilters.maxPrice ? { maxPrice: Number(appliedFilters.maxPrice) } : {}),
    ...(appliedFilters.minMoq ? { minMoq: Number(appliedFilters.minMoq) } : {}),
    ...(appliedFilters.maxMoq ? { maxMoq: Number(appliedFilters.maxMoq) } : {}),
    ...(appliedFilters.certifications.length ? { certifications: appliedFilters.certifications } : {}),
    ...(appliedFilters.leadTime ? { leadTime: appliedFilters.leadTime } : {}),
    ...(appliedFilters.verifiedOnly ? { verifiedOnly: true } : {}),
  };

  const { data, isLoading, isError, refetch } = useProducts(queryFilters);
  const products = data?.data || [];

  const scrollKey = `scroll:products:${locationKey}`;

  // Save scroll position when leaving this page
  useEffect(() => {
    return () => {
      sessionStorage.setItem(scrollKey, String(window.scrollY));
    };
  }, [scrollKey]);

  // Restore scroll position after data is available on back navigation
  useEffect(() => {
    if (navType === 'POP' && !isLoading) {
      const saved = sessionStorage.getItem(scrollKey);
      if (saved) {
        requestAnimationFrame(() =>
          window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
        );
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filters });
    setShowFilters(false);
  }, [filters]);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSort('newest');
  }, []);

  const handleReset = useCallback(() => {
    clearAllFilters();
    setShowFilters(false);
  }, [clearAllFilters]);

  // Prevent background scrolling on mobile when filter drawer is open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFilters]);

  // Close drawer on ESC key press
  useEffect(() => {
    if (!showFilters) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFilters(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFilters]);



  const toggleCert = (cert: string) => {
    setFilters(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const activeFilterCount = filterCount(appliedFilters);
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Newest First';

  const controlBtnCls = "flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-[8px] text-sm font-semibold text-body cursor-pointer transition-all hover:border-primary hover:text-primary max-md:px-3 select-none relative";

  const renderFilterFields = () => (
    <div className="flex flex-col gap-6">
      {/* Price Range */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Price Range (₹)</label>
        <div className="flex items-center gap-2">
          <input
            type="number" placeholder="Min"
            className="flex-1 border border-border rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary w-0 bg-white"
            value={filters.minPrice}
            onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))}
            onWheel={e => e.currentTarget.blur()}
            min={0}
          />
          <span className="text-muted text-xs">—</span>
          <input
            type="number" placeholder="Max"
            className="flex-1 border border-border rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary w-0 bg-white"
            value={filters.maxPrice}
            onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
            onWheel={e => e.currentTarget.blur()}
            min={0}
          />
        </div>
      </div>

      {/* MOQ Range */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted">MOQ Range</label>
        <div className="flex items-center gap-2">
          <input
            type="number" placeholder="Min"
            className="flex-1 border border-border rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary w-0 bg-white"
            value={filters.minMoq}
            onChange={e => setFilters(p => ({ ...p, minMoq: e.target.value }))}
            onWheel={e => e.currentTarget.blur()}
            min={1}
          />
          <span className="text-muted text-xs">—</span>
          <input
            type="number" placeholder="Max"
            className="flex-1 border border-border rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary w-0 bg-white"
            value={filters.maxMoq}
            onChange={e => setFilters(p => ({ ...p, maxMoq: e.target.value }))}
            onWheel={e => e.currentTarget.blur()}
            min={1}
          />
        </div>
      </div>

      {/* Lead Time */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Lead Time</label>
        <select
          className="border border-border rounded-[8px] px-3 py-2 text-sm outline-none focus:border-primary bg-white cursor-pointer"
          value={filters.leadTime}
          onChange={e => setFilters(p => ({ ...p, leadTime: e.target.value === 'Any' ? '' : e.target.value }))}
        >
          {LEAD_TIME_OPTIONS.map(o => <option key={o} value={o === 'Any' ? '' : o}>{o}</option>)}
        </select>
      </div>

      {/* Verified Only */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Supplier Verification</label>
        <label className="flex items-center justify-between cursor-pointer select-none bg-cream/30 border border-border/60 rounded-[8px] p-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-body">
            <ShieldCheck size={16} className={filters.verifiedOnly ? 'text-primary' : 'text-muted'} />
            Verified only
          </span>
          <div
            onClick={() => setFilters(p => ({ ...p, verifiedOnly: !p.verifiedOnly }))}
            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${filters.verifiedOnly ? 'bg-primary' : 'bg-[#e2e8f0]'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${filters.verifiedOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>

      {/* Certifications */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Certifications</label>
        <div className="flex flex-wrap gap-2">
          {CERT_OPTIONS.map(cert => (
            <button
              key={cert}
              onClick={() => toggleCert(cert)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all ${
                filters.certifications.includes(cert)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-body border-border hover:border-primary hover:text-primary'
              }`}
            >
              {cert}
            </button>
          ))}
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />

      <main className="flex-1 py-8 pb-12">
        <div className="w-full max-w-[var(--width-container)] mx-auto px-8 max-md:px-4">

          {/* Header row */}
          <div className="flex items-end justify-between mb-6 pb-4 border-b border-border max-md:flex-col max-md:items-start max-md:gap-3 max-md:pb-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-heading">
                  {searchQuery && originalQuery
                    ? <>Showing results for <em>{searchQuery}</em></>
                    : searchQuery
                      ? `Results for "${searchQuery}"`
                      : subcategory || category || 'All Products'}
                </h1>
                {(category || subcategory || searchQuery) && (
                  <button
                    onClick={() => navigate(ROUTES.HOME)}
                    className="flex items-center gap-1.5 bg-white border border-primary text-primary px-3 py-1 rounded-[10px] text-xs font-semibold cursor-pointer transition-all hover:bg-primary hover:text-white"
                  >
                    <X size={14} /> View All
                  </button>
                )}
              </div>
              {searchQuery && originalQuery && (
                <button
                  onClick={() => setSearchParams({ q: originalQuery, ...(category ? { category } : {}) })}
                  className="text-sm text-primary underline bg-transparent border-none cursor-pointer p-0 text-left w-fit"
                >
                  Search instead for {originalQuery}
                </button>
              )}
              <p className="text-sm text-muted">
                {isLoading ? 'Searching...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="ml-3 text-primary font-semibold hover:underline text-xs">
                    Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                  </button>
                )}
              </p>
            </div>

            <div className="flex gap-2">
              {/* Filter button */}
              <button className={controlBtnCls} onClick={() => setShowFilters(p => !p)}>
                <Filter size={15} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-extrabold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort dropdown */}
              <div className="relative">
                <button className={controlBtnCls} onClick={() => setShowSortMenu(p => !p)}>
                  <SlidersHorizontal size={15} />
                  <span className="max-md:hidden">{currentSortLabel}</span>
                  <span className="hidden max-md:inline">Sort</span>
                  <ChevronDown size={14} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-20 overflow-hidden">
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSort(opt.value); setShowSortMenu(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium cursor-pointer border-none transition-colors ${sort === opt.value ? 'bg-primary text-white' : 'bg-white text-body hover:bg-cream'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sliding Filter Drawer */}
          <div 
            className={`fixed inset-0 z-[2100] transition-all duration-300 ${
              showFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setShowFilters(false)}
            />
            
            {/* Drawer panel */}
            <div 
              className={`absolute top-0 right-0 h-full w-[360px] max-w-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
                showFilters ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-primary" />
                  <h2 className="text-base font-extrabold text-heading m-0">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 hover:text-heading cursor-pointer border-none"
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5">
                {renderFilterFields()}
              </div>

              {/* Drawer Footer (Sticky) */}
              <div className="p-4 border-t border-border bg-white flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 text-sm font-bold text-muted border border-border rounded-[8px] bg-white cursor-pointer hover:text-body hover:border-body transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 py-3 text-sm font-bold text-white bg-primary border border-primary rounded-[8px] cursor-pointer hover:bg-primary-dark transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Main Layout containing Grid */}
          <div className="mt-6">
            {/* Main Content Area */}
            <div className="w-full">
              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {appliedFilters.verifiedOnly && (
                    <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/20">
                      <ShieldCheck size={12} /> Verified Only
                      <button onClick={() => { setFilters(p => ({ ...p, verifiedOnly: false })); setAppliedFilters(p => ({ ...p, verifiedOnly: false })); }} className="ml-1 cursor-pointer"><X size={11} /></button>
                    </span>
                  )}
                  {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
                    <span className="flex items-center gap-1.5 bg-[#f0fdf4] text-[#16a34a] text-xs font-semibold px-3 py-1 rounded-full border border-[#bbf7d0]">
                      ₹{appliedFilters.minPrice || '0'} — ₹{appliedFilters.maxPrice || '∞'}
                      <button onClick={() => { setFilters(p => ({ ...p, minPrice: '', maxPrice: '' })); setAppliedFilters(p => ({ ...p, minPrice: '', maxPrice: '' })); }} className="ml-1 cursor-pointer"><X size={11} /></button>
                    </span>
                  )}
                  {(appliedFilters.minMoq || appliedFilters.maxMoq) && (
                    <span className="flex items-center gap-1.5 bg-[#fffbeb] text-[#d97706] text-xs font-semibold px-3 py-1 rounded-full border border-[#fde68a]">
                      MOQ: {appliedFilters.minMoq || '1'} — {appliedFilters.maxMoq || '∞'}
                      <button onClick={() => { setFilters(p => ({ ...p, minMoq: '', maxMoq: '' })); setAppliedFilters(p => ({ ...p, minMoq: '', maxMoq: '' })); }} className="ml-1 cursor-pointer"><X size={11} /></button>
                    </span>
                  )}
                  {appliedFilters.leadTime && (
                    <span className="flex items-center gap-1.5 bg-[#f0f9ff] text-[#0369a1] text-xs font-semibold px-3 py-1 rounded-full border border-[#bae6fd]">
                      Lead: {appliedFilters.leadTime}
                      <button onClick={() => { setFilters(p => ({ ...p, leadTime: '' })); setAppliedFilters(p => ({ ...p, leadTime: '' })); }} className="ml-1 cursor-pointer"><X size={11} /></button>
                    </span>
                  )}
                  {appliedFilters.certifications.map(cert => (
                    <span key={cert} className="flex items-center gap-1.5 bg-[#f5f3ff] text-[#7c3aed] text-xs font-semibold px-3 py-1 rounded-full border border-[#ddd6fe]">
                      {cert}
                      <button onClick={() => { const next = appliedFilters.certifications.filter(c => c !== cert); setFilters(p => ({ ...p, certifications: next })); setAppliedFilters(p => ({ ...p, certifications: next })); }} className="ml-1 cursor-pointer"><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}

              {/* Product grid */}
              <div className="min-h-[400px]">
                {isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader size="lg" />
                  </div>
                ) : isError ? (
                  <ErrorState onRetry={() => refetch()} />
                ) : products.length === 0 ? (
                  <EmptyState title={searchQuery ? `No products found for "${searchQuery}"` : 'No products match your filters.'} />
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6 max-sm:grid-cols-2 max-sm:gap-3">
                    {products.map((product: any) => (
                      <ProductCard key={product._id || product.id} product={product} showAddToCart={false} hidePrice={!!searchQuery} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductList;
