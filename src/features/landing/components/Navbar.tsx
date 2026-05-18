import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, ChevronDown, Phone, Menu, X, User, LogOut,
  Store, ShoppingBag, Truck, List, LayoutDashboard
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { fetchCart } from '@/store/slices/cart.slice';
import { ROUTES } from '@/shared/constants/routes';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import MessageModal from '@/shared/components/ui/MessageModal';
import categoryService from '@/features/product/services/category.service';
import SearchBar from './SearchBar';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSoonModal, setShowSoonModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const userMenuRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    categoryService.getAll().then(res => {
      if (res.categories) setCategories(res.categories);
    }).catch(err => console.error('Failed to fetch categories navbar', err));
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
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
            <Phone size={10} /> Helpline: 1800-XXX-XXXX (Mon–Sat, 9am–6pm)
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
            <img src="/favicon.jpeg" alt="AMJStar Logo" style={{ height: '38px', objectFit: 'contain' }} />
          </Link>

          {/* Search */}
          <SearchBar categories={categories} />

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
                      <Link to="/supplier/onboarding" className={styles.dropdownItem}>
                        <LayoutDashboard size={14} className={styles.dropdownIcon} />
                        <span>Dashboard</span>
                      </Link>
                    ) : isReseller ? (
                      <Link to="/reseller/dashboard" className={styles.dropdownItem}>
                        <LayoutDashboard size={14} className={styles.dropdownIcon} />
                        <span>Dashboard</span>
                      </Link>
                    ) : isAdmin ? (
                      <Link to="/admin/dashboard" className={styles.dropdownItem}>
                        <LayoutDashboard size={14} className={styles.dropdownIcon} />
                        <span>Control Panel</span>
                      </Link>
                    ) : (
                      <Link to="/profile" className={styles.dropdownItem}>
                        <User size={14} className={styles.dropdownIcon} />
                        <span>Profile</span>
                      </Link>
                    )}
                    <button className={styles.dropdownItem} onClick={() => setShowLogoutModal(true)}>
                      <LogOut size={14} className={styles.dropdownIcon} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.guestNav}>
                <Link to="/about" className={styles.navLink}>About</Link>
                <Link to={ROUTES.BUYERS} className={styles.navLink}>
                  <User size={16} className={styles.navIcon} />
                  For Buyers
                </Link>
                <Link to={ROUTES.RESELLERS} className={styles.navLink}>
                  <Truck size={16} className={styles.navIcon} />
                  For Resellers
                </Link>
                <Link to={ROUTES.SUPPLIERS} className={styles.navLink}>
                  <Store size={16} className={styles.navIcon} />
                  For Suppliers
                </Link>
                <Link to={`${ROUTES.LOGIN}?mode=buyer`} className={styles.joinBtn}>Join Free</Link>
              </div>
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

      <div className={styles.catBar}>
        <div className={styles.container}>
          <div className={styles.categoryNav}>
            {categories.map((cat) => {
              const hasSubs = cat.subcategories && cat.subcategories.length > 0;
              return (
                <div key={cat._id} className={styles.catItemWrapper}>
                  <Link
                    to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                    className={styles.catLinkMain}
                  >
                    <span>{cat.name}</span>
                    {hasSubs && <ChevronDown size={12} />}
                  </Link>
                  {hasSubs && (
                    <div className={styles.subDropdown}>
                      {cat.subcategories.map((sub: any) => (
                        <Link
                          key={sub._id}
                          to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                          className={styles.subLink}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
              <div className={styles.sectionLabel}>Quick Links</div>
              <Link to="/about" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                <List size={18} />
                <span>About AMJStar</span>
              </Link>
            </div>

            <div className={styles.menuSection}>
              <div className={styles.sectionLabel}>Join as Partner</div>
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
                  <Link to={ROUTES.BUYERS} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                    <ShoppingBag size={18} />
                    <span>For Buyers</span>
                  </Link>
                  <Link to={ROUTES.SUPPLIERS} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                    <Store size={18} />
                    <span>For Suppliers</span>
                  </Link>
                  <Link to={ROUTES.RESELLERS} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                    <Truck size={18} />
                    <span>For Resellers</span>
                  </Link>
                </>
              )}
            </div>

            <hr className={styles.mobileDivider} />

            <div className={styles.menuSection}>
              <div className={styles.sectionLabel}>Browse Categories</div>
              {categories.map((cat) => {
                const hasSubs = cat.subcategories && cat.subcategories.length > 0;
                const isExpanded = expandedCategory === cat._id;
                return (
                  <div key={cat._id}>
                    <div
                      className={styles.mobileLink}
                      onClick={() => {
                        if (hasSubs) {
                          setExpandedCategory(isExpanded ? null : cat._id);
                        } else {
                          navigate(`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`);
                          setMobileOpen(false);
                        }
                      }}
                      style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <List size={18} />
                        <span>{cat.name}</span>
                      </div>
                      {hasSubs && (
                        <ChevronDown 
                          size={16} 
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} 
                        />
                      )}
                    </div>
                    {isExpanded && hasSubs && (
                      <div className={styles.mobileSubList}>
                        <Link
                          to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                          className={`${styles.mobileLink} ${styles.mobileSubLink}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <span>- All {cat.name}</span>
                        </Link>
                        {cat.subcategories.map((sub: any) => (
                          <Link
                            key={sub._id}
                            to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                            className={`${styles.mobileLink} ${styles.mobileSubLink}`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <span>- {sub.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
