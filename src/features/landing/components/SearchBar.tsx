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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (catMenuRef.current && !catMenuRef.current.contains(event.target as Node)) {
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
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setShowSuggestions(true);
      try {
        const res = await productApi.getSuggestions(query, selectedCat);
        setSuggestions(res);
        setHighlightIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
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
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0) {
        e.preventDefault();
        const selected = suggestions[highlightIndex];
        const id = selected.id || selected._id;
        navigate(ROUTES.PRODUCT_DETAIL.replace(':id', id));
        setShowSuggestions(false);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item: any) => {
    const id = item.id || item._id;
    navigate(ROUTES.PRODUCT_DETAIL.replace(':id', id));
    setShowSuggestions(false);
    setQuery('');
  };

  return (
    <div className="relative flex-1 max-w-[380px] mx-6 max-lg:max-w-[240px] max-lg:mx-2.5 max-md:max-w-[160px] max-md:mx-2" ref={searchRef}>
      <form className="flex items-center bg-white border border-[#BB461E] rounded-lg overflow-hidden h-8 transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus-within:border-[#BB461E] focus-within:shadow-[0_0_0_2px_rgba(187,70,30,0.1)] max-lg:h-7 max-md:h-[26px]" onSubmit={handleSearch}>
        {/* Category Dropdown */}
        <div 
          className="flex items-center gap-1 px-2 h-full border-r border-[#BB461E] cursor-pointer text-[10px] text-slate-500 bg-[oklch(0.98_0.01_80)] whitespace-nowrap select-none min-w-[80px] hover:bg-[oklch(0.96_0.01_80)] max-lg:text-[9px] max-lg:px-1.5 max-lg:min-w-[60px] max-md:hidden" 
          onClick={() => setCatMenuOpen(!catMenuOpen)}
          ref={catMenuRef}
        >
          <span>{selectedCat}</span>
          <ChevronDown size={14} className={catMenuOpen ? 'rotate-180' : ''} />
          {catMenuOpen && (
            <div className="absolute top-full left-0 w-[180px] bg-white border border-slate-200 rounded-lg mt-1 shadow-[0_10px_25px_rgba(0,0,0,0.1)] z-[1002] max-h-[300px] overflow-y-auto">
              <div 
                className="py-2.5 px-3.5 text-[11px] cursor-pointer transition-colors duration-200 hover:bg-slate-50" 
                onClick={(e) => { e.stopPropagation(); setSelectedCat('All'); setCatMenuOpen(false); }}
              >
                All Categories
              </div>
              {categories.map(c => (
                <div 
                  key={c._id} 
                  className="py-2.5 px-3.5 text-[11px] cursor-pointer transition-colors duration-200 hover:bg-slate-50"
                  onClick={(e) => { e.stopPropagation(); setSelectedCat(c.name); setCatMenuOpen(false); }}
                >
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input with Icon inside */}
        <div className="flex-1 flex items-center px-3 relative">
          <Search size={16} className="text-slate-500 opacity-60" />
          <input
            type="text"
            className="w-full border-none outline-none py-1 px-2 text-[11px] text-slate-900 placeholder:text-[#a0a0a0] max-lg:text-[10px] max-md:px-1.5"
            placeholder="Search by name, brand, or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
          />
          {loading && <Loader2 size={16} className="animate-spin text-[#BB461E]" />}
        </div>

        <button type="submit" className="bg-[#BB461E] text-white border-none px-4 h-full text-[10px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#a33c1a] max-lg:px-2.5 max-lg:text-[9px] max-md:px-2">
          Search
        </button>
      </form>

      {/* Suggestions */}
      {showSuggestions && query.trim().length >= 2 && (
        <div className="absolute top-[calc(100%+8px)] left-0 -right-[50px] bg-white border border-slate-200 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] z-[1001] overflow-hidden max-md:right-0">
          {loading ? (
            <div className="p-[30px] flex flex-col items-center gap-3 text-slate-500 text-xs">
              <Loader2 size={18} className="animate-spin" />
              <span>Searching for products...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col">
              <div className="py-2.5 px-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-[oklch(0.98_0.01_80)] border-b border-slate-200">Matching Products</div>
              {suggestions.map((item, idx) => (
                <div
                  key={item._id}
                  className={`flex items-center gap-3 py-2 px-4 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${idx === highlightIndex ? 'bg-slate-50' : ''}`}
                  onClick={() => handleSuggestionClick(item)}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 bg-[#f8f9fa]">
                    <img src={item.images?.[0] || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[11px] font-medium text-slate-900">{item.name}</span>
                    <div className="flex items-center gap-1.5 text-[9px]">
                      {item.brand && <span className="text-[#BB461E] font-semibold">{item.brand}</span>}
                      <span className="text-slate-500">{item.category}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="py-3 px-4 text-center text-[11px] font-semibold text-[#BB461E] border-t border-slate-200 cursor-pointer hover:bg-[oklch(0.98_0.01_80)]" onClick={() => handleSearch()}>
                See all results for "{query}"
              </div>
            </div>
          ) : (
            <div className="py-10 px-5 text-center flex flex-col items-center">
              <Search size={24} style={{ opacity: 0.2, marginBottom: '8px' }} />
              <p className="text-[13px] font-semibold m-0 text-slate-900">No products found for "{query}"</p>
              <span className="text-[11px] text-slate-500 mt-1">Try checking your spelling or use more general terms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
