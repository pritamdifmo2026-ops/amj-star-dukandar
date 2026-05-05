import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart, ChevronDown, Phone, Menu, X, UserPlus, User, LogOut, Tag, 
  Store, ShoppingBag, Truck, List, Shirt, Monitor, Trophy, Footprints, Briefcase, 
  Home as HomeIcon, Sprout, Settings, Utensils, Layers, FlaskConical, Armchair,
  Star
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { fetchCart } from '@/store/slices/cart.slice';
import { ROUTES } from '@/shared/constants/routes';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import MessageModal from '@/shared/components/ui/MessageModal';
import styles from './Navbar.module.css';

const CATEGORY_LIST = [
  { name: 'Agriculture', icon: Sprout },
  { name: 'Chemicals', icon: FlaskConical },
  { name: 'Electronics', icon: Monitor },
  { name: 'Food & Beverages', icon: Utensils },
  { name: 'Furniture', icon: Armchair },
];

const Navbar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSoonModal, setShowSoonModal] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [allCatsOpen, setAllCatsOpen] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const signInRef = React.useRef<HTMLDivElement>(null);
  const allCatsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (signInRef.current && !signInRef.current.contains(event.target as Node)) {
        setSignInOpen(false);
      }
      if (allCatsRef.current && !allCatsRef.current.contains(event.target as Node)) {
        setAllCatsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector((s) => s.cart.items.length);
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  const isSupplier = user?.role === 'supplier';
  const isReseller = user?.role === 'reseller';
  const isAdmin = user?.role === 'admin';
  const { profile: supplierProfile } = useAppSelector((s) => s.supplier);
  const { profile: resellerProfile } = useAppSelector((s) => s.reseller);

  React.useEffect(() => {
    if (isSupplier && !supplierProfile) {
      const fetchProfile = async () => {
        try {
          const { default: supplierService } = await import('@/features/supplier/services/supplier.service');
          const responseData = await supplierService.getProfile();
          const { setSupplierProfile } = await import('@/store/slices/supplier.slice');
          if (responseData.success && responseData.supplier) {
            dispatch(setSupplierProfile(responseData.supplier));
          }
        } catch (err) {
          console.error('Failed to fetch supplier profile in Navbar');
        }
      };
      fetchProfile();
    }
  }, [isSupplier, supplierProfile, dispatch]);

  React.useEffect(() => {
    if (isReseller && !resellerProfile) {
      const fetchProfile = async () => {
        try {
          const { default: resellerService } = await import('@/features/reseller/services/reseller.service');
          const data = await resellerService.getProfile();
          const { setResellerProfile } = await import('@/store/slices/reseller.slice');
          if (data) {
            dispatch(setResellerProfile(data));
          }
        } catch (err) {
          console.error('Failed to fetch reseller profile in Navbar');
        }
      };
      fetchProfile();
    }
  }, [isReseller, resellerProfile, dispatch]);

  React.useEffect(() => {
    if (isAuth) {
      dispatch(fetchCart());
    }
  }, [isAuth, dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`${ROUTES.PRODUCT_LIST}?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    if (isAdmin) {
      window.location.href = '/';
    } else {
      navigate(ROUTES.HOME);
      setShowLogoutModal(false);
      setUserMenuOpen(false);
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
            {!isAuth && (
              <>
                <Link to="/login?mode=seller" className={styles.topLink}>Sell on AMJStar</Link>
                <span className={styles.sep}>|</span>
              </>
            )}
            <a href="#" className={styles.topLink}>Help Center</a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className={styles.navbar}>
        <div className={styles.container}>
          {/* Logo */}
          <Link to={ROUTES.HOME} className={styles.logo}>
            <img src="/favicon.jpeg" alt="AMJStar Logo" style={{ height: '44px', objectFit: 'contain' }} />
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
              <div
                className={styles.userMenu}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                ref={userMenuRef}
              >
                <span className={styles.userName}>
                  {isSupplier
                    ? (supplierProfile?.businessName || 'Supplier')
                    : isReseller
                      ? (resellerProfile?.fullName || resellerProfile?.storeName || user?.name || 'Reseller')
                      : (user?.name || 'User')
                  }
                </span>
                {userMenuOpen && (
                  <div className={styles.dropdown}>
                    {isSupplier ? (
                      <Link to="/supplier/onboarding" className={styles.dropdownItem}>Dashboard</Link>
                    ) : isReseller ? (
                      <Link to="/reseller/dashboard" className={styles.dropdownItem}>Dashboard</Link>
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
                <div className={styles.signInWrapper} ref={signInRef}>
                  <button
                    className={styles.loginBtn}
                    onClick={() => setSignInOpen(!signInOpen)}
                  >
                    <UserPlus size={20} />
                    <span>Sign In</span>
                    <ChevronDown size={14} />
                  </button>
                  {signInOpen && (
                    <div className={styles.signInDropdown}>
                      <Link
                        to={`${ROUTES.LOGIN}?mode=buyer`}
                        className={styles.signInRole}
                        onClick={() => setSignInOpen(false)}
                      >
                        <ShoppingBag size={18} />
                        <div>
                          <span className={styles.roleName}>Buyer</span>
                          <span className={styles.roleDesc}>Browse & buy wholesale</span>
                        </div>
                      </Link>
                      <Link
                        to={`${ROUTES.LOGIN}?mode=seller`}
                        className={styles.signInRole}
                        onClick={() => setSignInOpen(false)}
                      >
                        <Store size={18} />
                        <div>
                          <span className={styles.roleName}>Supplier</span>
                          <span className={styles.roleDesc}>List & sell products</span>
                        </div>
                      </Link>
                      <Link
                        to={`${ROUTES.LOGIN}?mode=reseller`}
                        className={styles.signInRole}
                        onClick={() => setSignInOpen(false)}
                      >
                        <Truck size={18} />
                        <div>
                          <span className={styles.roleName}>Reseller</span>
                          <span className={styles.roleDesc}>Resell & earn margins</span>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
                <Link to={`${ROUTES.LOGIN}?mode=buyer`} className={styles.registerBtn}>Join Free</Link>
              </>
            )}
            <div
              className={styles.cartIcon}
              aria-label="Cart"
              onClick={() => navigate(ROUTES.CART)}
              style={{ cursor: 'pointer' }}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </div>
            <button className={styles.menuToggle} onClick={() => setMobileOpen((p) => !p)} aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <MessageModal
        isOpen={showSoonModal}
        onClose={() => setShowSoonModal(false)}
        title="Coming Soon"
        message="We are currently updating our cart and checkout system. Please check back soon!"
        type="info"
      />

      {/* Category bar */}
      <div className={styles.catBar}>
        <div className={styles.container}>
          <div className={styles.allCatsWrapper} ref={allCatsRef}>
            <button 
              className={`${styles.allCatsBtn} ${allCatsOpen ? styles.active : ''}`}
              onClick={() => setAllCatsOpen(!allCatsOpen)}
            >
              <List size={18} />
              <span>All categories</span>
              <ChevronDown size={14} className={allCatsOpen ? styles.rotate : ''} />
            </button>

            {allCatsOpen && (
              <div className={styles.allCatsDropdown}>
                {CATEGORY_LIST.map((item) => (
                  <Link
                    key={item.name}
                    to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(item.name)}`}
                    className={styles.allCatItem}
                    onClick={() => setAllCatsOpen(false)}
                  >
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className={styles.promoLinks}>
            <Link to={ROUTES.PRODUCT_LIST} className={styles.promoLink}>Verified manufacturers</Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`${styles.mobileMenuWrapper} ${mobileOpen ? styles.open : ''}`}
        onClick={() => setMobileOpen(false)}
      >
        <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
          <header className={styles.mobileHeader}>
            {isAuth ? (
              <div className={styles.mobileUser}>
                <div className={styles.mobileAvatar}>
                  {(isSupplier ? (supplierProfile?.businessName?.[0]) : isReseller ? (resellerProfile?.fullName?.[0] || resellerProfile?.storeName?.[0]) : (user?.name?.[0]))?.toUpperCase() || 'U'}
                </div>
                <div className={styles.mobileUserInfo}>
                  <span className={styles.mobileUserName}>
                    {isSupplier
                      ? (supplierProfile?.businessName || 'Supplier')
                      : isReseller
                        ? (resellerProfile?.fullName || resellerProfile?.storeName || user?.name || 'Reseller')
                        : (user?.name || 'User')
                    }
                  </span>
                  <span className={styles.mobileUserRole}>{user?.role}</span>
                </div>
              </div>
            ) : (
              <img src="/favicon.jpeg" alt="Logo" className={styles.mobileLogo} />
            )}
            <button className={styles.closeMenuBtn} onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </header>

          <div className={styles.mobileContent}>
            <div className={styles.menuSection}>
              <div className={styles.sectionLabel}>Account & Settings</div>
              {isAuth ? (
                <>
                  <Link
                    to={isSupplier ? "/supplier/onboarding" : isReseller ? "/reseller/dashboard" : isAdmin ? "/admin/dashboard" : "/profile"}
                    className={styles.mobileLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    <User size={18} />
                    <span>{isAdmin ? 'Control Panel' : 'My Profile'}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to={`${ROUTES.LOGIN}?mode=buyer`} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                    <ShoppingBag size={18} />
                    <span>Sign in as Buyer</span>
                  </Link>
                  <Link to={`${ROUTES.LOGIN}?mode=seller`} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                    <Store size={18} />
                    <span>Sign in as Supplier</span>
                  </Link>
                  <Link to={`${ROUTES.LOGIN}?mode=reseller`} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                    <Truck size={18} />
                    <span>Sign in as Reseller</span>
                  </Link>
                </>
              )}
            </div>

            <hr className={styles.mobileDivider} />

            <div className={styles.menuSection}>
              <div className={styles.sectionLabel}>Browse Categories</div>
              {CATEGORY_LIST.map((cat) => (
                <Link
                  key={cat.name}
                  to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                  className={styles.mobileLink}
                  onClick={() => setMobileOpen(false)}
                >
                  <cat.icon size={18} />
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {isAuth && (
            <footer className={styles.mobileFooter}>
              <button className={styles.signOutBtn} onClick={handleSignOut}>
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </footer>
          )}
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
