import React, { useState } from 'react';
import logo from '@/assets/logoo.png';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, ChevronDown, Phone, Menu, X, User, LogOut,
  Store, ShoppingBag, Truck, List, LayoutDashboard, Search,
  Info, Factory, RefreshCw
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/features/auth/store/auth.slice';
import { fetchCart } from '@/features/buyer/store/cart.slice';
import { ROUTES } from '@/shared/constants/routes';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import MessageModal from '@/shared/components/ui/MessageModal';
import categoryService from '@/features/product/services/category.service';
import SearchBar from './SearchBar';
import MobileSearchOverlay from './MobileSearchOverlay';

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSoonModal, setShowSoonModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const navigate = useNavigate();
  const desktopMenuRef = React.useRef<HTMLDivElement>(null);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    categoryService.getAll().then(res => {
      if (res.categories) setCategories(res.categories);
    }).catch(() => { });
  }, []);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const clickedOutsideDesktop = !desktopMenuRef.current || !desktopMenuRef.current.contains(e.target as Node);
      const clickedOutsideMobile = !mobileMenuRef.current || !mobileMenuRef.current.contains(e.target as Node);
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dispatch = useAppDispatch();
  const cartCount = useAppSelector(s => s.cart.items.length);
  const isAuth = useAppSelector(s => s.auth.isAuthenticated);
  const user = useAppSelector(s => s.auth.user);
  const isSupplier = user?.role === 'supplier';
  const isReseller = user?.role === 'reseller';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const { profile: supplierProfile } = useAppSelector(s => s.supplier);
  const { profile: resellerProfile } = useAppSelector(s => s.reseller);

  React.useEffect(() => {
    if (isSupplier && !supplierProfile) {
      (async () => {
        try {
          const { default: svc } = await import('@/features/supplier/services/supplier.service');
          const res = await svc.getProfile();
          const { setSupplierProfile } = await import('@/features/supplier/store/supplier.slice');
          if (res.success && res.supplier) dispatch(setSupplierProfile(res.supplier));
        } catch { }
      })();
    }
  }, [isSupplier, supplierProfile, dispatch]);

  React.useEffect(() => {
    if (isReseller && !resellerProfile) {
      (async () => {
        try {
          const { default: svc } = await import('@/features/reseller/services/reseller.service');
          const data = await svc.getProfile();
          const { setResellerProfile } = await import('@/features/reseller/store/reseller.slice');
          if (data) dispatch(setResellerProfile(data));
        } catch { }
      })();
    }
  }, [isReseller, resellerProfile, dispatch]);

  React.useEffect(() => { if (isAuth) dispatch(fetchCart()); }, [isAuth, dispatch]);

  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleSignOut = () => {
    dispatch(logout());
    setMobileOpen(false);
    if (isAdmin) window.location.href = '/';
    else { navigate(ROUTES.HOME); setShowLogoutModal(false); setUserMenuOpen(false); }
  };

  const displayName = isSupplier
    ? (supplierProfile?.businessName || 'Supplier')
    : isReseller
      ? (resellerProfile?.fullName || resellerProfile?.storeName || user?.name || 'Reseller')
      : (user?.name || 'User');

  const navLinkCls = "text-[11px] font-medium text-heading no-underline transition-colors hover:text-primary whitespace-nowrap";
  const dropdownItemCls = "block w-full px-4 py-3 text-left border-none bg-transparent text-heading text-xs no-underline rounded-[8px] cursor-pointer hover:bg-gray-50 hover:text-primary";

  return (
    <>
      {/* Top strip */}
      <div className="hidden sm:block bg-cream border-b border-border py-0.5">
        <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 flex justify-between items-center">
          <span className="text-[9px] text-body flex items-center gap-1.5">
            <Phone size={10} /> Helpline: +91 9034440673 (Mon–Sat, 9am–6pm)
          </span>
          <div className="flex items-center gap-3">
            {!isAuth && (
              <>
                <Link to="/login?mode=seller" className="text-[9px] text-body no-underline hover:text-primary">Sell on AMJSTAR</Link>
                <span className="text-border">|</span>
              </>
            )}
            <Link to="/contact" className="text-[9px] text-body no-underline hover:text-primary">Contact Us</Link>
          </div>
        </div>
      </div>

      <header
        className="fixed lg:sticky top-0 left-0 right-0 w-full z-[1000] bg-surface"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        {/* Main navbar */}
        <nav className="bg-surface h-14 lg:h-auto border-b border-border flex items-stretch lg:items-center lg:py-1">
          <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 w-full flex justify-between items-center h-full">
            {/* Desktop-only Logo */}
            <Link to={ROUTES.HOME} className="hidden lg:flex items-center no-underline h-full">
              <img src={logo} alt="AMJSTAR Logo" className="block h-9 w-9 lg:h-10 lg:w-10 rounded-full object-contain" />
            </Link>

            {/* Desktop-only SearchBar */}
            <div className="hidden lg:block flex-1 max-w-[760px] mx-3 sm:mx-6">
              <SearchBar categories={categories} />
            </div>

            {/* Desktop-only Navigation and Profile */}
            <div className="hidden lg:flex items-center gap-4">
              {isAuth ? (
                <div className="relative flex items-center gap-2" ref={desktopMenuRef}>
                  <span className="font-semibold text-heading text-[11px] border border-[#d1a97a] rounded-[6px] px-3 py-1 bg-[#fdf6ee] cursor-pointer select-none" onClick={() => setUserMenuOpen(p => !p)}>{displayName}</span>
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-3 bg-cream border border-border rounded-[8px] shadow-[0_10px_25px_rgba(0,0,0,0.1)] min-w-[200px] p-2 z-10" onClick={e => e.stopPropagation()}>
                      {isSupplier ? (
                        <Link to="/supplier/onboarding" className={dropdownItemCls} onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard size={14} className="inline mr-2" />Dashboard
                        </Link>
                      ) : isReseller ? (
                        <Link to="/reseller/dashboard" className={dropdownItemCls} onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard size={14} className="inline mr-2" />Dashboard
                        </Link>
                      ) : isAdmin ? (
                        <Link to="/admin/dashboard" className={dropdownItemCls} onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard size={14} className="inline mr-2" />Control Panel
                        </Link>
                      ) : (
                        <Link to="/profile" className={dropdownItemCls} onClick={() => setUserMenuOpen(false)}>
                          <User size={14} className="inline mr-2" />Profile
                        </Link>
                      )}
                      <button className={dropdownItemCls} onClick={() => { setShowLogoutModal(true); setUserMenuOpen(false); }}>
                        <LogOut size={14} className="inline mr-2" />Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-5">
                  <Link to="/about" className={`${navLinkCls} flex items-center gap-1`}>
                    <Info size={12} /> About
                  </Link>
                  <Link to={ROUTES.BUYERS} className={`${navLinkCls} flex items-center gap-1`}>
                    <ShoppingBag size={12} /> For Buyers
                  </Link>
                  <Link to={ROUTES.RESELLERS} className={`${navLinkCls} flex items-center gap-1`}>
                    <RefreshCw size={12} /> For Resellers
                  </Link>
                  <Link to={ROUTES.SUPPLIERS} className={`${navLinkCls} flex items-center gap-1`}>
                    <Factory size={12} /> For Suppliers
                  </Link>
                  <Link to={`${ROUTES.LOGIN}?mode=buyer`}
                    className="bg-heading text-white px-[18px] py-1.5 rounded-full no-underline font-semibold text-[11px] transition-all ml-2 hover:opacity-90 hover:-translate-y-px">
                    Join Free
                  </Link>
                </div>
              )}
              {isAuth && <NotificationBell />}
              {isAuth && !isSupplier && !isReseller && !isAdmin && (
                <div className="relative text-heading flex items-center cursor-pointer" onClick={() => navigate('/profile?tab=cart')}>
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-surface" />
                  )}
                </div>
              )}
            </div>

            {/* Mobile-only Layout */}
            <div className="flex lg:hidden items-center justify-between w-full h-full gap-2">
              {/* Left: Hamburger menu */}
              <button
                className="bg-transparent border-none text-heading cursor-pointer p-1 flex items-center justify-center shrink-0"
                onClick={() => setMobileOpen(p => !p)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Logo */}
              <Link to={ROUTES.HOME} className="flex items-center no-underline shrink-0">
                <img src={logo} alt="AMJSTAR Logo" className="block h-9 w-9 rounded-full object-contain" />
              </Link>

              {/* Search Bar */}
              <div
                onClick={() => setIsMobileSearchOpen(true)}
                className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full h-9 px-3 cursor-pointer shrink min-w-0"
              >
                <Search size={14} className="text-gray-400 mr-1.5 shrink-0" />
                <span className="text-gray-400 text-xs truncate">Search products, suppliers...</span>
              </div>

              {/* Right actions: Avatar, Notification, Cart */}
              <div className="flex items-center gap-2.5 shrink-0">
                {isAuth ? (
                  <div className="relative flex items-center" ref={mobileMenuRef}>
                    <span className="w-8 h-8 rounded-full bg-[#fdf6ee] border border-[#d1a97a] text-[#b38040] font-semibold text-xs flex items-center justify-center select-none cursor-pointer" onClick={() => setUserMenuOpen(p => !p)}>
                      {displayName[0]?.toUpperCase() || 'U'}
                    </span>
                    {userMenuOpen && (
                      <div className="absolute top-[calc(100%+8px)] right-0 mt-1 bg-cream border border-border rounded-[8px] shadow-[0_10px_25px_rgba(0,0,0,0.1)] min-w-[180px] p-2 z-[1001]" onClick={e => e.stopPropagation()}>
                        {isSupplier ? (
                          <Link to="/supplier/onboarding" className={dropdownItemCls} onClick={() => setUserMenuOpen(false)}>
                            <LayoutDashboard size={14} className="inline mr-2" />Dashboard
                          </Link>
                        ) : isReseller ? (
                          <Link to="/reseller/dashboard" className={dropdownItemCls} onClick={() => setUserMenuOpen(false)}>
                            <LayoutDashboard size={14} className="inline mr-2" />Dashboard
                          </Link>
                        ) : isAdmin ? (
                          <Link to="/admin/dashboard" className={dropdownItemCls} onClick={() => setUserMenuOpen(false)}>
                            <LayoutDashboard size={14} className="inline mr-2" />Control Panel
                          </Link>
                        ) : (
                          <Link to="/profile" className={dropdownItemCls} onClick={() => setUserMenuOpen(false)}>
                            <User size={14} className="inline mr-2" />Profile
                          </Link>
                        )}
                        <button className={dropdownItemCls} onClick={() => { setShowLogoutModal(true); setUserMenuOpen(false); }}>
                          <LogOut size={14} className="inline mr-2" />Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={`${ROUTES.LOGIN}?mode=buyer`}
                    className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <User size={14} />
                  </Link>
                )}

                {isAuth && <NotificationBell />}

                {isAuth && !isSupplier && !isReseller && !isAdmin && (
                  <div className="relative text-heading flex items-center cursor-pointer" onClick={() => navigate('/profile?tab=cart')}>
                    <ShoppingCart size={18} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-surface" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Category bar — desktop only */}
        <div className="hidden lg:block bg-surface border-b border-border">
          <div className="max-w-[var(--width-container)] mx-auto px-8 flex items-center gap-6">
            <div className="flex items-center gap-5 flex-1">
              {categories.map(cat => {
                const hasSubs = cat.subcategories?.length > 0;
                return (
                  <div key={cat._id} className="relative py-1 group">
                    <Link
                      to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                      className="flex items-center gap-1.5 text-body no-underline text-[11px] font-semibold transition-colors group-hover:text-primary whitespace-nowrap"
                    >
                      <span>{cat.name}</span>
                      {hasSubs && <ChevronDown size={12} />}
                    </Link>
                    {hasSubs && (
                      <div className="absolute top-full left-0 min-w-[200px] bg-white border border-border rounded-[8px] shadow-[0_10px_25px_rgba(0,0,0,0.1)] p-2 z-[100] opacity-0 invisible translate-y-2.5 transition-all group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                        {cat.subcategories.map((sub: any) => (
                          <Link key={sub._id}
                            to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                            className="block px-3 py-2 text-heading no-underline text-xs rounded-[6px] transition-all hover:bg-slate-50 hover:text-primary hover:pl-4">
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-6 border-l border-border pl-6">
              <Link to="/verified-manufacturers" className="text-[11px] font-medium text-heading no-underline whitespace-nowrap hover:text-primary">
                Verified manufacturers
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content overlap on mobile/tablet because the header is fixed */}
      <div
        className="lg:hidden"
        style={{
          height: 'calc(3.5rem + env(safe-area-inset-top, 0px))'
        }}
      />

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[2000] transition-all duration-300 ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className={`fixed top-0 left-0 bottom-0 w-[300px] h-[100dvh] bg-surface flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <header
            className="px-6 border-b border-border flex justify-between items-center"
            style={{
              paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))',
              paddingBottom: '1.5rem'
            }}
          >
            {isAuth ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <span className="block font-semibold text-heading text-sm">{displayName}</span>
                  <span className="text-xs text-muted capitalize">{user?.role}</span>
                </div>
              </div>
            ) : (
              <img src={logo} alt="Logo" className="h-8 rounded-full" />
            )}
            <button className="bg-transparent border-none cursor-pointer text-heading" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-8">
              <div className="text-xs font-bold uppercase text-muted tracking-widest mb-4">Quick Links</div>
              <Link to={ROUTES.PRODUCT_LIST} className="flex items-center gap-3 py-3 text-heading no-underline font-medium" onClick={() => setMobileOpen(false)}>
                <Search size={18} /><span>Search Products</span>
              </Link>
              <Link to="/about" className="flex items-center gap-3 py-3 text-heading no-underline font-medium" onClick={() => setMobileOpen(false)}>
                <List size={18} /><span>About AMJSTAR</span>
              </Link>
            </div>

            <div className="mb-8">
              <div className="text-xs font-bold uppercase text-muted tracking-widest mb-4">Join as Partner</div>
              {isAuth ? (
                <Link to={isSupplier ? "/supplier/onboarding" : isReseller ? "/reseller/dashboard" : isAdmin ? "/admin/dashboard" : "/profile"}
                  className="flex items-center gap-3 py-3 text-heading no-underline font-medium" onClick={() => setMobileOpen(false)}>
                  <User size={18} /><span>{isAdmin ? 'Control Panel' : 'My Profile'}</span>
                </Link>
              ) : (
                <>
                  <Link to={ROUTES.BUYERS} className="flex items-center gap-3 py-3 text-heading no-underline font-medium" onClick={() => setMobileOpen(false)}><ShoppingBag size={18} /><span>For Buyers</span></Link>
                  <Link to={ROUTES.SUPPLIERS} className="flex items-center gap-3 py-3 text-heading no-underline font-medium" onClick={() => setMobileOpen(false)}><Store size={18} /><span>For Suppliers</span></Link>
                  <Link to={ROUTES.RESELLERS} className="flex items-center gap-3 py-3 text-heading no-underline font-medium" onClick={() => setMobileOpen(false)}><Truck size={18} /><span>For Resellers</span></Link>
                  <Link
                    to={`${ROUTES.LOGIN}?mode=buyer`}
                    className="mt-3 flex items-center justify-center gap-2 w-full py-3 bg-heading text-white rounded-[8px] no-underline font-semibold text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Join Free
                  </Link>
                </>
              )}
            </div>

            <hr className="border-border my-4" />

            <div>
              <div className="text-xs font-bold uppercase text-muted tracking-widest mb-4">Browse Categories</div>
              {categories.map((cat) => {
                const hasSubs = cat.subcategories && cat.subcategories.length > 0;
                const isExpanded = expandedCategory === cat._id;
                return (
                  <div key={cat._id}>
                    <div
                      className="flex items-center justify-between py-3 text-heading font-medium cursor-pointer"
                      onClick={() => {
                        if (hasSubs) {
                          setExpandedCategory(isExpanded ? null : cat._id);
                        } else {
                          navigate(`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`);
                          setMobileOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <List size={18} />
                        <span>{cat.name}</span>
                      </div>
                      {hasSubs && (
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      )}
                    </div>
                    {isExpanded && hasSubs && (
                      <div className="pl-9 flex flex-col">
                        <Link
                          to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                          className="py-2 text-slate-500 no-underline text-xs"
                          onClick={() => setMobileOpen(false)}
                        >
                          - All {cat.name}
                        </Link>
                        {cat.subcategories.map((sub: any) => (
                          <Link
                            key={sub._id}
                            to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                            className="py-2 text-slate-500 no-underline text-xs"
                            onClick={() => setMobileOpen(false)}
                          >
                            - {sub.name}
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
            <footer className="px-6 py-6 border-t border-border">
              <button onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-500 border-none rounded-[6px] font-semibold cursor-pointer">
                <LogOut size={18} /><span>Sign Out</span>
              </button>
            </footer>
          )}
        </div>
      </div>

      <MessageModal isOpen={showSoonModal} onClose={() => setShowSoonModal(false)} title="Coming Soon"
        message="We are currently updating our cart and checkout system. Please check back soon!" type="info" />

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Sign Out"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleSignOut}>Sign Out</Button>
          </>
        }
      >
        Are you sure you want to sign out of your account?
      </Modal>

      {isMobileSearchOpen && (
        <MobileSearchOverlay
          categories={categories}
          onClose={() => setIsMobileSearchOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
