import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { productApi } from '@/features/product/services/product.api';
import { ROUTES } from '@/shared/constants/routes';

interface SearchBarProps {
  categories: any[];
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

const SearchBar: React.FC<SearchBarProps> = ({ categories }) => {
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [spellSuggestion, setSpellSuggestion] = useState<string | null>(null);

  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const candidateTerms = useMemo(() => {
    const fromCategories = categories.flatMap(c => [
      c.name,
      ...(c.subcategories?.map((s: any) => s.name) || []),
    ]);
    return [...fromCategories, ...BASE_KEYWORDS];
  }, [categories]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setCatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSpellSuggestion(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setShowSuggestions(true);
      try {
        const res = await productApi.getSuggestions(query, selectedCat);
        setSuggestions(res);
        setHighlightIndex(-1);
        setSpellSuggestion(res.length === 0 ? findSpellSuggestion(query, candidateTerms) : null);
      } catch {
        setSuggestions([]);
        setSpellSuggestion(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selectedCat, candidateTerms]);

  const doSearch = (searchQuery: string = query, correctedFrom?: string) => {
    const q = searchQuery.trim();
    if (!q && selectedCat === 'All') return;
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (selectedCat !== 'All') params.append('category', selectedCat);
    if (correctedFrom) params.append('original', correctedFrom.trim());
    navigate(`${ROUTES.PRODUCT_LIST}?${params.toString()}`);
    setShowSuggestions(false);
  };

  const applySpellSuggestion = (corrected: string) => {
    setQuery(corrected);
    setSpellSuggestion(null);
    doSearch(corrected, query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0) {
        e.preventDefault();
        const id = suggestions[highlightIndex].id || suggestions[highlightIndex]._id;
        navigate(ROUTES.PRODUCT_DETAIL.replace(':id', id));
        setShowSuggestions(false);
      } else if (spellSuggestion) {
        doSearch(spellSuggestion, query);
      } else {
        doSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setCatMenuOpen(false);
    }
  };

  const handleSuggestionClick = (item: any) => {
    navigate(ROUTES.PRODUCT_DETAIL.replace(':id', item.id || item._id));
    setShowSuggestions(false);
    setQuery('');
  };

  return (
    <div className="relative flex-1 max-w-[380px] mx-3 sm:mx-6 max-md:max-w-full" ref={searchRef}>
      {/* Search form — no overflow-hidden so category panel is not clipped */}
      <form
        className="flex items-center bg-white border border-primary rounded-[8px] h-8 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus-within:shadow-[0_0_0_2px_rgba(187,70,30,0.1)]"
        onSubmit={e => { e.preventDefault(); spellSuggestion ? doSearch(spellSuggestion, query) : doSearch(); }}
      >
        {/* Category trigger */}
        <div
          className="flex items-center gap-1 px-2 h-full border-r border-primary cursor-pointer text-[10px] text-body bg-[oklch(0.98_0.01_80)] whitespace-nowrap select-none min-w-[80px] hover:bg-[oklch(0.96_0.01_80)] max-md:hidden rounded-l-[7px]"
          onClick={() => { setCatMenuOpen(p => !p); setShowSuggestions(false); }}
        >
          <span className="truncate max-w-[58px]">{selectedCat}</span>
          <ChevronDown size={14} className={`shrink-0 transition-transform ${catMenuOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Input */}
        <div className="flex-1 flex items-center px-3">
          <Search size={16} className="text-body opacity-60 shrink-0" />
          <input
            type="text"
            className="w-full border-none outline-none px-2 py-1 text-[11px] text-heading bg-transparent placeholder:text-[#a0a0a0]"
            placeholder="Search by name, brand, or category..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (query.trim().length >= 2) setShowSuggestions(true); setCatMenuOpen(false); }}
          />
          {loading && <Loader2 size={14} className="animate-spin text-primary shrink-0" />}
        </div>

        <button
          type="submit"
          className="bg-primary text-white border-none px-4 h-full text-[10px] font-semibold cursor-pointer transition-colors hover:bg-primary-dark max-md:px-3 rounded-r-[7px]"
        >
          Search
        </button>
      </form>

      {/* Category dropdown panel — outside form to avoid clipping */}
      {catMenuOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-[210px] bg-white border border-border rounded-[8px] shadow-[0_12px_28px_rgba(0,0,0,0.12)] z-[1002] max-h-[320px] overflow-y-auto max-md:hidden">
          <div className="px-3 py-2 text-[9px] uppercase tracking-widest font-bold text-body border-b border-border bg-[oklch(0.98_0.01_80)]">
            Filter by Category
          </div>
          <div
            className={`px-3.5 py-2.5 text-[11px] cursor-pointer transition-colors hover:bg-cream ${selectedCat === 'All' ? 'text-primary font-bold' : 'text-heading'}`}
            onClick={() => { setSelectedCat('All'); setCatMenuOpen(false); }}
          >
            All Categories
          </div>
          {categories.map(c => (
            <div
              key={c._id}
              className={`px-3.5 py-2.5 text-[11px] cursor-pointer transition-colors hover:bg-cream ${selectedCat === c.name ? 'text-primary font-bold' : 'text-body'}`}
              onClick={() => { setSelectedCat(c.name); setCatMenuOpen(false); }}
            >
              {c.name}
            </div>
          ))}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && query.trim().length >= 2 && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-[-50px] max-md:right-0 bg-white border border-border rounded-[12px] shadow-[0_20px_40px_rgba(0,0,0,0.15)] z-[1001] overflow-hidden">
          {loading ? (
            <div className="p-8 flex flex-col items-center gap-3 text-body text-xs">
              <Loader2 size={18} className="animate-spin" />
              <span>Searching for products...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col">
              <div className="px-4 py-2.5 text-[10px] uppercase tracking-[0.05em] font-bold text-body bg-[oklch(0.98_0.01_80)] border-b border-border">
                Matching Products
              </div>
              {suggestions.map((item, idx) => (
                <div
                  key={item._id}
                  onClick={() => handleSuggestionClick(item)}
                  className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-all ${idx === highlightIndex ? 'bg-cream' : 'hover:bg-cream'}`}
                >
                  <div className="w-10 h-10 rounded-[6px] overflow-hidden border border-border bg-[#f8f9fa] shrink-0">
                    <img src={item.images?.[0] || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span className="text-[11px] font-medium text-heading truncate">{item.name}</span>
                    <div className="flex items-center gap-1.5 text-[9px]">
                      {item.brand && <span className="text-primary font-semibold">{item.brand}</span>}
                      <span className="text-body">{item.category}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div
                onClick={() => doSearch()}
                className="px-4 py-3 text-center text-[11px] font-semibold text-primary border-t border-border cursor-pointer hover:bg-[oklch(0.98_0.01_80)]"
              >
                See all results for "{query}"
              </div>
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <Search size={24} className="opacity-20" />
              <p className="text-[13px] font-semibold m-0 text-heading">No results for "{query}"</p>
              {spellSuggestion ? (
                <p className="text-[11px] text-body m-0">
                  Did you mean:{' '}
                  <button
                    type="button"
                    onClick={() => applySpellSuggestion(spellSuggestion)}
                    className="text-primary font-semibold italic underline bg-transparent border-none cursor-pointer p-0 text-[11px]"
                  >
                    {spellSuggestion}
                  </button>
                  ?
                </p>
              ) : (
                <span className="text-[11px] text-body">Try checking your spelling or use more general terms</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
