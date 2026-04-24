import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ChevronDown, Phone, Menu, X, UserPlus } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { ROUTES } from '@/shared/constants/routes';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import styles from './Navbar.module.css';

const CATEGORIES = [
  'Electronics', 'Textiles', 'Food & Beverages',
  'Chemicals', 'Machinery', 'Furniture', 'Agriculture',
];

const Navbar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector((s) => s.cart.items.length);
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  const { profile } = useAppSelector((s) => s.supplier);
  const isSupplier = user?.role === 'supplier';
  const isAdmin = user?.role === 'admin';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`${ROUTES.PRODUCT_LIST}?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    navigate(ROUTES.HOME);
    setShowLogoutModal(false);
    setUserMenuOpen(false);
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
            <a href="#" className={styles.topLink}>Sell on AMJStar</a>
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
            <span className={styles.logoMain}>AMJStar</span>
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
              <div className={styles.userMenu} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <span className={styles.userName}>
                  {isSupplier ? (profile?.businessName || 'Supplier') : (user?.name || 'User')}
                </span>
                {userMenuOpen && (
                  <div className={styles.dropdown}>
                    {isSupplier ? (
                      <Link to="/supplier/onboarding" className={styles.dropdownItem}>Dashboard</Link>
                    ) : isAdmin ? (
                      <Link to="/admin/dashboard" className={styles.dropdownItem}>Control Panel</Link>
                    ) : (
                      <Link to="/profile" className={styles.dropdownItem}>Profile</Link>
                    )}
                    <button className={styles.dropdownItem} onClick={() => setShowLogoutModal(true)}>Sign Out</button>
                  </div>
                )}
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
      <div className={`${styles.mobileMenuWrapper} ${mobileOpen ? styles.open : ''}`}>
        <div className={styles.mobileMenu}>
          {isAuth ? (
            <>
              {isSupplier ? (
                <Link to="/supplier/onboarding" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Dashboard</Link>
              ) : isAdmin ? (
                <Link to="/admin/dashboard" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Control Panel</Link>
              ) : (
                <Link to="/profile" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Profile</Link>
              )}
              <button className={styles.mobileLink} style={{ textAlign: 'left', border: 'none', background: 'none' }} onClick={() => { setShowLogoutModal(true); setMobileOpen(false); }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link to={ROUTES.REGISTER} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Register</Link>
            </>
          )}
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
      </div>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign Out"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleSignOut}>Sign Out</Button>
          </>
        }
      >
        Are you sure you want to sign out of your account?
      </Modal>
    </header>
  );
};

export default Navbar;
