import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { productApi } from '@/features/product/services/product.api';
import { ROUTES } from '@/shared/constants/routes';

interface SearchBarProps {
  categories: any[];
}

const SearchBar: React.FC<SearchBarProps> = ({ categories }) => {
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const catMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSuggestions(false);
      if (catMenuRef.current && !catMenuRef.current.contains(event.target as Node)) setCatMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true); setShowSuggestions(true);
      try {
        const res = await productApi.getSuggestions(query, selectedCat);
        setSuggestions(res); setHighlightIndex(-1);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selectedCat]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() && selectedCat === 'All') return;
    const params = new URLSearchParams();
    if (query.trim()) params.append('q', query.trim());
    if (selectedCat !== 'All') params.append('category', selectedCat);
    navigate(`${ROUTES.PRODUCT_LIST}?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') {
      if (highlightIndex >= 0) {
        e.preventDefault();
        const id = suggestions[highlightIndex].id || suggestions[highlightIndex]._id;
        navigate(ROUTES.PRODUCT_DETAIL.replace(':id', id));
        setShowSuggestions(false);
      } else { handleSearch(); }
    } else if (e.key === 'Escape') { setShowSuggestions(false); }
  };

  const handleSuggestionClick = (item: any) => {
    navigate(ROUTES.PRODUCT_DETAIL.replace(':id', item.id || item._id));
    setShowSuggestions(false); setQuery('');
  };

  return (
    <div className="relative flex-1 max-w-[380px] mx-3 sm:mx-6 max-md:max-w-full" ref={searchRef}>
      <form
        className="flex items-center bg-white border border-primary rounded-[8px] overflow-hidden h-8 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus-within:shadow-[0_0_0_2px_rgba(187,70,30,0.1)]"
        onSubmit={handleSearch}
      >
        {/* Category dropdown */}
        <div
          ref={catMenuRef}
          onClick={() => setCatMenuOpen(p => !p)}
          className="relative flex items-center gap-1 px-2 h-full border-r border-primary cursor-pointer text-[10px] text-body bg-[oklch(0.98_0.01_80)] whitespace-nowrap select-none min-w-[80px] hover:bg-[oklch(0.96_0.01_80)] max-md:hidden"
        >
          <span>{selectedCat}</span>
          <ChevronDown size={14} className={`transition-transform ${catMenuOpen ? 'rotate-180' : ''}`} />
          {catMenuOpen && (
            <div className="absolute top-full left-0 w-[180px] bg-white border border-border rounded-[8px] mt-1 shadow-[0_10px_25px_rgba(0,0,0,0.1)] z-[1002] max-h-[300px] overflow-y-auto">
              <div
                className="px-3.5 py-2.5 text-[11px] cursor-pointer hover:bg-cream"
                onClick={e => { e.stopPropagation(); setSelectedCat('All'); setCatMenuOpen(false); }}
              >All Categories</div>
              {categories.map(c => (
                <div
                  key={c._id}
                  className="px-3.5 py-2.5 text-[11px] cursor-pointer hover:bg-cream"
                  onClick={e => { e.stopPropagation(); setSelectedCat(c.name); setCatMenuOpen(false); }}
                >{c.name}</div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-1 flex items-center px-3 relative">
          <Search size={16} className="text-body opacity-60" />
          <input
            type="text"
            className="w-full border-none outline-none px-2 py-1 text-[11px] text-heading bg-transparent placeholder:text-[#a0a0a0]"
            placeholder="Search by name, brand, or category..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
          />
          {loading && <Loader2 size={16} className="animate-spin text-primary" />}
        </div>

        <button type="submit" className="bg-primary text-white border-none px-4 h-full text-[10px] font-semibold cursor-pointer transition-colors hover:bg-primary-dark max-md:px-3">
          Search
        </button>
      </form>

      {/* Suggestions */}
      {showSuggestions && query.trim().length >= 2 && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-[-50px] max-md:right-0 bg-white border border-border rounded-[12px] shadow-[0_20px_40px_rgba(0,0,0,0.15)] z-[1001] overflow-hidden">
          {loading ? (
            <div className="p-[30px] flex flex-col items-center gap-3 text-body text-xs">
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
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[11px] font-medium text-heading">{item.name}</span>
                    <div className="flex items-center gap-1.5 text-[9px]">
                      {item.brand && <span className="text-primary font-semibold">{item.brand}</span>}
                      <span className="text-body">{item.category}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div
                onClick={() => handleSearch()}
                className="px-4 py-3 text-center text-[11px] font-semibold text-primary border-t border-border cursor-pointer hover:bg-[oklch(0.98_0.01_80)]"
              >
                See all results for "{query}"
              </div>
            </div>
          ) : (
            <div className="p-10 text-center flex flex-col items-center">
              <Search size={24} className="opacity-20 mb-2" />
              <p className="text-[13px] font-semibold m-0 text-heading">No products found for "{query}"</p>
              <span className="text-[11px] text-body mt-1">Try checking your spelling or use more general terms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
