import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Loader2, Filter, ShieldCheck, Phone, MessageCircle } from 'lucide-react';
import { productApi } from '@/features/product/services/product.api';
import { ROUTES } from '@/shared/constants/routes';
import type { Product } from '@/features/product/types';

interface MobileSearchOverlayProps {
  categories: any[];
  onClose: () => void;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

const BASE_KEYWORDS = [
  'fabric', 'textile', 'cotton', 'polyester', 'silk', 'linen', 'machinery',
  'equipment', 'chemical', 'medicine', 'electronics', 'computer', 'laptop',
  'mobile', 'furniture', 'packaging', 'agriculture', 'food', 'clothing',
  'garment', 'steel', 'plastic', 'rubber', 'leather', 'paper', 'glass',
  'ceramic', 'spice', 'basmati', 'rice', 'wheat', 'sugar', 'oil', 'motor',
  'pump', 'valve', 'pipe', 'cable', 'battery', 'solar', 'paint', 'adhesive',
];

function findSpellSuggestion(query: string, candidates: string[]): string | null {
  const q = query.toLowerCase().trim();
  if (q.length < 3) return null;

  const words = q.split(/\s+/);
  const correctedWords = words.map(word => {
    if (word.length < 3) return word;
    let best: { replacement: string; dist: number } | null = null;
    for (const candidate of candidates) {
      for (const cw of candidate.toLowerCase().split(/\s+/)) {
        if (cw.length < 3) continue;
        const dist = levenshtein(word, cw);
        const threshold = Math.max(1, Math.floor(Math.max(word.length, cw.length) * 0.35));
        if (dist > 0 && dist <= threshold) {
          if (!best || dist < best.dist) best = { replacement: cw, dist };
        }
      }
    }
    return best ? best.replacement : word;
  });

  const corrected = correctedWords.join(' ');
  return corrected !== q ? corrected : null;
}

const MobileSearchOverlay: React.FC<MobileSearchOverlayProps> = ({ categories, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [spellSuggestion, setSpellSuggestion] = useState<string | null>(null);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Disable body scroll when overlay is open, and automatically close if resized to desktop (>= 1024px)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial check in case it somehow got opened on desktop
    if (window.innerWidth >= 1024) {
      onClose();
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, [onClose]);

  const candidateTerms = useMemo(() => {
    const fromCategories = categories.flatMap(c => [
      c.name,
      ...(c.subcategories?.map((s: any) => s.name) || []),
    ]);
    return [...fromCategories, ...BASE_KEYWORDS];
  }, [categories]);

  // Debounced search logic
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setTotal(0);
      setSpellSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await productApi.list({ q: query, pageSize: 20 });
        setResults(res.data || []);
        setTotal(res.total || res.data?.length || 0);

        if (!res.data || res.data.length === 0) {
          setSpellSuggestion(findSpellSuggestion(query, candidateTerms));
        } else {
          setSpellSuggestion(null);
        }
      } catch (err) {
        console.error('Error fetching search results in overlay:', err);
        setResults([]);
        setTotal(0);
        setSpellSuggestion(null);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, candidateTerms]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`${ROUTES.PRODUCT_LIST}?q=${encodeURIComponent(q)}`);
    onClose();
  };

  const handleFiltersClick = () => {
    const q = query.trim();
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    params.append('showFilters', 'true');
    navigate(`${ROUTES.PRODUCT_LIST}?${params.toString()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-cream flex flex-col overflow-hidden animate-fade-in lg:hidden">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Header section */}
      <header
        className="bg-surface border-b border-border px-4 flex items-center justify-between shadow-sm shrink-0"
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: '0.75rem'
        }}
      >
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream transition-colors text-heading border-none bg-transparent cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        <h2 className="text-sm font-extrabold text-heading m-0 flex-1 text-center px-2">
          {query.trim().length >= 2 ? `Search Results (${total})` : 'Search Products'}
        </h2>

        <button
          onClick={handleFiltersClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded-[8px] text-[11px] font-bold text-body hover:border-primary hover:text-primary transition-all cursor-pointer"
        >
          <Filter size={13} />
          <span>Filters</span>
        </button>
      </header>

      {/* Search Input Bar */}
      <div className="bg-surface px-4 py-3 border-b border-border shrink-0">
        <form onSubmit={handleSearchSubmit} className="flex items-center bg-white border border-primary rounded-[10px] h-10 px-3 transition-all focus-within:shadow-[0_0_0_2px_rgba(187,70,30,0.1)]">
          <Search size={16} className="text-body opacity-60 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 border-none outline-none px-3 py-1.5 text-xs text-heading bg-transparent placeholder:text-[#a0a0a0]"
            placeholder="Search by name, brand, or category..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {loading && <Loader2 size={14} className="animate-spin text-primary shrink-0 mr-1" />}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                if (inputRef.current) inputRef.current.focus();
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-cream text-muted border-none bg-transparent cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
        {query.trim().length < 2 ? (
          /* Empty / Initial State */
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[280px] mx-auto py-10">
            <div className="w-14 h-14 rounded-full bg-white border border-[#f0f0f0] flex items-center justify-center mb-4 shadow-sm text-primary">
              <Search size={24} />
            </div>
            <h3 className="text-sm font-extrabold text-heading m-0 mb-1.5">Search for Products</h3>
            <p className="text-[11px] text-body m-0 mb-6 leading-relaxed">
              Find agriculture produce, machinery, electricals, garments, and more at wholesale rates.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-primary text-white border-none rounded-[8px] font-bold text-xs cursor-pointer shadow-md hover:bg-primary-dark transition-all active:scale-[0.98]"
            >
              Start Shopping
            </button>
          </div>
        ) : loading ? (
          /* Loading indicator */
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-body text-[11px] gap-2">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="font-semibold text-heading">Searching products...</span>
          </div>
        ) : results.length > 0 ? (
          /* Results list */
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2.5">
              {results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    navigate(ROUTES.PRODUCT_DETAIL.replace(':id', product.id));
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 bg-white border border-[#f0f0f0] rounded-[10px] cursor-pointer hover:border-primary/20 transition-all active:scale-[0.99] shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
                >
                  <div className="w-14 h-14 rounded-[6px] overflow-hidden bg-[#f8f9fa] border border-[#f0f0f0] shrink-0">
                    <img
                      src={product.imageUrl || '/placeholder.png'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/f5f5f5/999?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold text-primary uppercase tracking-wider truncate max-w-[60%]">
                        {product.brand || 'Generic'}
                      </span>
                      {product.isVerified && (
                        <span className="flex items-center gap-0.5 text-[8px] text-[#16a34a] font-bold bg-[#f0fdf4] px-1.5 py-0.5 rounded-full border border-[#bbf7d0] shrink-0">
                          <ShieldCheck size={9} /> Verified
                        </span>
                      )}
                    </div>
                    <h4 className="text-[11px] font-extrabold text-heading truncate m-0 leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-[9px] text-body m-0 truncate">
                      {product.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* View all results button */}
            <button
              onClick={() => handleSearchSubmit()}
              className="mt-4 w-full py-3 text-center text-xs font-bold text-primary bg-white border border-primary/20 rounded-[8px] hover:bg-cream transition-colors cursor-pointer"
            >
              View all results for "{query}"
            </button>
          </div>
        ) : (
          /* No results */
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-4 max-w-[300px] mx-auto">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-3">
              <Search size={22} className="text-primary" />
            </div>
            <p className="text-sm font-extrabold m-0 text-heading mb-1">No products found for &ldquo;{query}&rdquo;</p>
            <p className="text-[11px] text-body m-0 mb-2">We couldn&apos;t find this in our catalogue right now.</p>
            <p className="text-[11px] font-semibold text-body mb-5">Our team will contact you soon!</p>

            {spellSuggestion && (
              <p className="text-[11px] text-body mb-4">
                Did you mean:{' '}
                <button
                  type="button"
                  onClick={() => setQuery(spellSuggestion)}
                  className="text-primary font-bold italic underline bg-transparent border-none cursor-pointer p-0 text-[11px]"
                >
                  {spellSuggestion}
                </button>
                ?
              </p>
            )}

            <div className="flex flex-col gap-2.5 w-full">
              <a
                href="tel:+919034440673"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border-2 border-primary text-primary rounded-[10px] font-bold text-xs hover:bg-primary hover:text-white transition-all no-underline"
              >
                <Phone size={14} />
                +91 90344 40673
              </a>
              <a
                href={`https://wa.me/919034440673?text=Hi%2C%20I%20was%20looking%20for%20%22${encodeURIComponent(query)}%22%20on%20AMJ%20Star%20Dukandar%20but%20couldn't%20find%20it.%20Can%20you%20help%3F`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] text-white rounded-[10px] font-bold text-xs hover:bg-[#1db954] transition-all no-underline"
              >
                <MessageCircle size={14} />
                Chat on WhatsApp
              </a>
            </div>
            <p className="text-[10px] text-muted mt-4">Helpline: Mon–Sat, 9am–6pm</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSearchOverlay;
