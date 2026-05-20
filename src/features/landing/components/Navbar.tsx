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
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import MessageModal from '@/shared/components/ui/MessageModal';
import categoryService from '@/features/product/services/category.service';
import SearchBar from './SearchBar';

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
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
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
  const isAdmin = user?.role === 'admin';
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
        } catch {}
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
        } catch {}
      })();
    }
  }, [isReseller, resellerProfile, dispatch]);

  React.useEffect(() => { if (isAuth) dispatch(fetchCart()); }, [isAuth, dispatch]);

  const handleSignOut = () => {
    dispatch(logout());
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
    <header className="sticky top-0 z-[1000] bg-cream">
      {/* Top strip */}
      <div className="hidden sm:block bg-cream border-b border-border py-0.5">
        <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 flex justify-between items-center">
          <span className="text-[9px] text-body flex items-center gap-1.5">
            <Phone size={10} /> Helpline: 1800-XXX-XXXX (Mon–Sat, 9am–6pm)
          </span>
          <div className="flex items-center gap-3">
            {!isAuth && (
              <>
                <Link to="/login?mode=seller" className="text-[9px] text-body no-underline hover:text-primary">Sell on AMJSTAR</Link>
                <span className="text-border">|</span>
              </>
            )}
            <a href="#" className="text-[9px] text-body no-underline hover:text-primary">Help Center</a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="bg-surface py-1 border-b border-border">
        <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 flex justify-between items-center">
          <Link to={ROUTES.HOME} className="no-underline">
            <img src={logo} alt="AMJSTAR Logo" style={{ height: '38px', objectFit: 'contain' }} />
          </Link>

          <SearchBar categories={categories} />

          <div className="flex items-center gap-4">
            {isAuth ? (
              <div className="relative cursor-pointer flex items-center gap-2" onClick={() => setUserMenuOpen(p => !p)} ref={userMenuRef}>
                <span className="font-semibold text-heading text-[11px]">{displayName}</span>
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-3 bg-cream border border-border rounded-[8px] shadow-[0_10px_25px_rgba(0,0,0,0.1)] min-w-[200px] p-2 z-10">
                    {isSupplier ? (
                      <Link to="/supplier/onboarding" className={dropdownItemCls}>
                        <LayoutDashboard size={14} className="inline mr-2" />Dashboard
                      </Link>
                    ) : isReseller ? (
                      <Link to="/reseller/dashboard" className={dropdownItemCls}>
                        <LayoutDashboard size={14} className="inline mr-2" />Dashboard
                      </Link>
                    ) : isAdmin ? (
                      <Link to="/admin/dashboard" className={dropdownItemCls}>
                        <LayoutDashboard size={14} className="inline mr-2" />Control Panel
                      </Link>
                    ) : (
                      <Link to="/profile" className={dropdownItemCls}>
                        <User size={14} className="inline mr-2" />Profile
                      </Link>
                    )}
                    <button className={dropdownItemCls} onClick={() => setShowLogoutModal(true)}>
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
            {isAuth && !isSupplier && !isReseller && !isAdmin && (
              <div className="relative text-heading flex items-center cursor-pointer" onClick={() => navigate(ROUTES.CART)}>
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-primary text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-surface">
                    {cartCount}
                  </span>
                )}
              </div>
            )}
            <button className="flex lg:hidden bg-transparent border-none text-heading cursor-pointer p-1" onClick={() => setMobileOpen(p => !p)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
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
            <Link to={ROUTES.PRODUCT_LIST} className="text-[11px] font-medium text-heading no-underline whitespace-nowrap hover:text-primary">
              Verified manufacturers
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[2000] transition-all duration-300 ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 bottom-0 w-[300px] bg-surface flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <header className="px-6 py-6 border-b border-border flex justify-between items-center">
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
              <img src={logo} alt="Logo" className="h-8" />
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
    </header>
  );
};

export default Navbar;
