import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ChevronDown, Phone, Menu, X, UserPlus } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/shared/constants/routes';
import styles from './Navbar.module.css';

const CATEGORIES = [
  'Electronics', 'Textiles', 'Food & Beverages',
  'Chemicals', 'Machinery', 'Furniture', 'Agriculture',
];

const Navbar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const cartCount = useAppSelector((s) => s.cart.items.length);
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`${ROUTES.PRODUCT_LIST}?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className={styles.header}>
      {/* Top strip */}
      <div className={styles.topStrip}>
        <div className={styles.container}>
          <span className={styles.helpline}>
            <Phone size={12} /> Helpline: 1800-XXX-XXXX (Mon–Sat, 9am–6pm)
          </span>
          <div className={styles.topLinks}>
            <a href="#" className={styles.topLink}>Sell on AMJ Star</a>
            <span className={styles.sep}>|</span>
            <a href="#" className={styles.topLink}>Help Center</a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className={styles.navbar}>
        <div className={styles.container}>
          {/* Logo */}
          <Link to={ROUTES.HOME} className={styles.logo}>
            <span className={styles.logoMain}>AMJ Star</span>
            <span className={styles.logoSub}>Dukandar</span>
          </Link>

          {/* Search */}
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <div className={styles.categoryDrop}>
              <span>All</span>
              <ChevronDown size={14} />
            </div>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search products, suppliers, categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn}>
              <Search size={18} />
            </button>
          </form>

          {/* Right actions */}
          <div className={styles.actions}>
            {isAuth ? (
              <div className={styles.userMenu}>
                <span className={styles.userName}>{user?.name}</span>
              </div>
            ) : (
              <>
                <Link to={ROUTES.LOGIN} className={styles.loginBtn}>
                  <UserPlus size={20} />
                  <span>Sign In</span>
                </Link>
                <Link to={ROUTES.REGISTER} className={styles.registerBtn}>Join Free</Link>
              </>
            )}
            <Link to={ROUTES.RESELLER_CART} className={styles.cartIcon} aria-label="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </Link>
            <button className={styles.menuToggle} onClick={() => setMobileOpen((p) => !p)} aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Category bar */}
      <div className={styles.catBar}>
        <div className={styles.container}>
          <ul className={styles.catList}>
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <Link
                  to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat)}`}
                  className={styles.catLink}
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link to={ROUTES.LOGIN} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Sign In</Link>
          <Link to={ROUTES.REGISTER} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Register</Link>
          <hr className={styles.mobileDivider} />
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat)}`}
              className={styles.mobileLink}
              onClick={() => setMobileOpen(false)}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
