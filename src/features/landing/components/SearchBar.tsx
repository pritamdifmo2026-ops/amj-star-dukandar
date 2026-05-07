import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { productApi } from '@/features/product/services/product.api';
import { ROUTES } from '@/shared/constants/routes';
import styles from './SearchBar.module.css';

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
    <div className={styles.searchWrapper} ref={searchRef}>
      <form className={styles.searchForm} onSubmit={handleSearch}>
        {/* Category Dropdown */}
        <div 
          className={styles.categoryDrop} 
          onClick={() => setCatMenuOpen(!catMenuOpen)}
          ref={catMenuRef}
        >
          <span>{selectedCat}</span>
          <ChevronDown size={14} className={catMenuOpen ? styles.rotate : ''} />
          {catMenuOpen && (
            <div className={styles.dropdown}>
              <div 
                className={styles.dropdownItem} 
                onClick={(e) => { e.stopPropagation(); setSelectedCat('All'); setCatMenuOpen(false); }}
              >
                All Categories
              </div>
              {categories.map(c => (
                <div 
                  key={c._id} 
                  className={styles.dropdownItem}
                  onClick={(e) => { e.stopPropagation(); setSelectedCat(c.name); setCatMenuOpen(false); }}
                >
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input with Icon inside */}
        <div className={styles.inputContainer}>
          <Search size={16} className={styles.searchIconInside} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, brand, or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
          />
          {loading && <Loader2 size={16} className={styles.spinner} />}
        </div>

        <button type="submit" className={styles.searchBtn}>
          Search
        </button>
      </form>

      {/* Suggestions */}
      {showSuggestions && query.trim().length >= 2 && (
        <div className={styles.suggestionsContainer}>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 size={18} className={styles.spin} />
              <span>Searching for products...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className={styles.suggestionsList}>
              <div className={styles.suggestionHeader}>Matching Products</div>
              {suggestions.map((item, idx) => (
                <div
                  key={item._id}
                  className={`${styles.suggestionItem} ${idx === highlightIndex ? styles.active : ''}`}
                  onClick={() => handleSuggestionClick(item)}
                >
                  <div className={styles.itemImage}>
                    <img src={item.images?.[0] || '/placeholder.png'} alt={item.name} />
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <div className={styles.itemMeta}>
                      {item.brand && <span className={styles.itemBrand}>{item.brand}</span>}
                      <span className={styles.itemCategory}>{item.category}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className={styles.suggestionFooter} onClick={() => handleSearch()}>
                See all results for "{query}"
              </div>
            </div>
          ) : (
            <div className={styles.noResults}>
              <Search size={24} style={{ opacity: 0.2, marginBottom: '8px' }} />
              <p>No products found for "{query}"</p>
              <span>Try checking your spelling or use more general terms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
