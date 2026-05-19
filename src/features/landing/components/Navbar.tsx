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
    <header className="sticky top-0 z-[1000] bg-[oklch(0.98_0.01_80)]">
      {/* Top strip */}
      <div className="bg-[oklch(0.98_0.01_80)] border-b border-slate-200 py-[2px]">
        <div className="max-w-[1280px] mx-auto px-8 flex justify-between items-center">
          <span className="text-[9px] text-slate-500 flex items-center gap-[6px]">
            <Phone size={10} /> Helpline: 1800-XXX-XXXX (Mon–Sat, 9am–6pm)
          </span>
          <div className="flex items-center gap-3">
            {!isAuth && (
              <>
                <Link to="/login?mode=seller" className="text-[9px] text-slate-500 no-underline hover:text-[var(--color-primary)]">Sell on AMJStar</Link>
                <span className="text-slate-200">|</span>
              </>
            )}
            <a href="#" className="text-[9px] text-slate-500 no-underline hover:text-[var(--color-primary)]">Help Center</a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="bg-white py-1 border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-8 flex justify-between items-center">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="">
            <img src="/favicon.jpeg" alt="AMJStar Logo" style={{ height: '38px', objectFit: 'contain' }} />
          </Link>

          {/* Search */}
          <SearchBar categories={categories} />

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {isAuth ? (
              <div
                className="relative cursor-pointer flex items-center gap-2 max-lg:hidden"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                ref={userMenuRef}
              >
                <span className="font-semibold text-slate-900 text-[11px]">
                  {isSupplier
                    ? (supplierProfile?.businessName || 'Supplier')
                    : isReseller
                      ? (resellerProfile?.fullName || resellerProfile?.storeName || user?.name || 'Reseller')
                      : (user?.name || 'User')
                  }
                </span>
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-[rgba(226,232,240,0.8)] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.03)] min-w-[155px] p-1.5 z-[1000] origin-top-right animate-in fade-in zoom-in duration-200">
                    {isSupplier ? (
                      <Link to="/supplier/onboarding" className="flex items-center gap-2.5 w-full py-2.5 px-3 text-left border-none bg-transparent text-slate-900 no-underline text-xs font-[550] rounded-md cursor-pointer transition-all duration-200 hover:bg-[rgba(217,79,0,0.05)] hover:text-[var(--color-primary)] group">
                        <LayoutDashboard size={14} className="text-slate-500 transition-colors duration-200 shrink-0 group-hover:text-[var(--color-primary)]" />
                        <span>Dashboard</span>
                      </Link>
                    ) : isReseller ? (
                      <Link to="/reseller/dashboard" className="flex items-center gap-2.5 w-full py-2.5 px-3 text-left border-none bg-transparent text-slate-900 no-underline text-xs font-[550] rounded-md cursor-pointer transition-all duration-200 hover:bg-[rgba(217,79,0,0.05)] hover:text-[var(--color-primary)] group">
                        <LayoutDashboard size={14} className="text-slate-500 transition-colors duration-200 shrink-0 group-hover:text-[var(--color-primary)]" />
                        <span>Dashboard</span>
                      </Link>
                    ) : isAdmin ? (
                      <Link to="/admin/dashboard" className="flex items-center gap-2.5 w-full py-2.5 px-3 text-left border-none bg-transparent text-slate-900 no-underline text-xs font-[550] rounded-md cursor-pointer transition-all duration-200 hover:bg-[rgba(217,79,0,0.05)] hover:text-[var(--color-primary)] group">
                        <LayoutDashboard size={14} className="text-slate-500 transition-colors duration-200 shrink-0 group-hover:text-[var(--color-primary)]" />
                        <span>Control Panel</span>
                      </Link>
                    ) : (
                      <Link to="/profile" className="flex items-center gap-2.5 w-full py-2.5 px-3 text-left border-none bg-transparent text-slate-900 no-underline text-xs font-[550] rounded-md cursor-pointer transition-all duration-200 hover:bg-[rgba(217,79,0,0.05)] hover:text-[var(--color-primary)] group">
                        <User size={14} className="text-slate-500 transition-colors duration-200 shrink-0 group-hover:text-[var(--color-primary)]" />
                        <span>Profile</span>
                      </Link>
                    )}
                    <button className="flex items-center gap-2.5 w-full py-2.5 px-3 text-left border-none bg-transparent text-slate-900 no-underline text-xs font-[550] rounded-md cursor-pointer transition-all duration-200 hover:bg-[rgba(217,79,0,0.05)] hover:text-[var(--color-primary)] group" onClick={() => setShowLogoutModal(true)}>
                      <LogOut size={14} className="text-slate-500 transition-colors duration-200 shrink-0 group-hover:text-[var(--color-primary)]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-5 max-lg:hidden">
                <Link to="/about" className="text-[10px] font-medium text-slate-900 no-underline transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5 hover:text-[var(--color-primary)]">About</Link>
                <Link to={ROUTES.BUYERS} className="text-[10px] font-medium text-slate-900 no-underline transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5 hover:text-[var(--color-primary)]">
                  <User size={16} className="text-[var(--color-primary)]" />
                  For Buyers
                </Link>
                <Link to={ROUTES.RESELLERS} className="text-[10px] font-medium text-slate-900 no-underline transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5 hover:text-[var(--color-primary)]">
                  <Truck size={16} className="text-[var(--color-primary)]" />
                  For Resellers
                </Link>
                <Link to={ROUTES.SUPPLIERS} className="text-[10px] font-medium text-slate-900 no-underline transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5 hover:text-[var(--color-primary)]">
                  <Store size={16} className="text-[var(--color-primary)]" />
                  For Suppliers
                </Link>
                <Link to={`${ROUTES.LOGIN}?mode=buyer`} className="bg-[#BB461E] text-white py-1.5 px-[18px] rounded-full no-underline font-semibold text-[11px] transition-all duration-200 ml-2 hover:opacity-90 hover:-translate-y-[1px]">Join Free</Link>
              </div>
            )}
            <div
              className="relative text-slate-900 flex items-center cursor-pointer"
              aria-label="Cart"
              onClick={() => navigate(ROUTES.CART)}
              style={{ cursor: 'pointer' }}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="absolute -top-2 -right-2.5 bg-[var(--color-primary)] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>}
            </div>
            <button className="hidden bg-transparent border-none text-slate-900 max-lg:block" onClick={() => setMobileOpen((p) => !p)} aria-label="Menu">
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

      <div className="bg-white border-b border-slate-200 relative max-lg:hidden">
        <div className="max-w-[1280px] mx-auto px-8 flex items-center gap-6 overflow-visible">
          <div className="flex items-center gap-5 flex-1">
            {categories.map((cat) => {
              const hasSubs = cat.subcategories && cat.subcategories.length > 0;
              return (
                <div key={cat._id} className="relative py-1 group">
                  <Link
                    to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                    className="flex items-center gap-1.5 text-slate-500 no-underline text-[11px] font-semibold transition-colors duration-200 whitespace-nowrap group-hover:text-[var(--color-primary)]"
                  >
                    <span>{cat.name}</span>
                    {hasSubs && <ChevronDown size={12} />}
                  </Link>
                  {hasSubs && (
                    <div className="absolute top-full left-0 min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)] p-2 z-[100] opacity-0 invisible translate-y-2.5 transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                      {cat.subcategories.map((sub: any) => (
                        <Link
                          key={sub._id}
                          to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                          className="block py-2 px-3 text-slate-900 no-underline text-xs rounded-md transition-all duration-200 hover:bg-slate-50 hover:text-[var(--color-primary)] hover:pl-4"
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

          <div className="flex items-center gap-6 border-l border-slate-200 pl-6">
            <Link to={ROUTES.PRODUCT_LIST} className="text-[11px] font-medium text-slate-900 no-underline whitespace-nowrap hover:text-[var(--color-primary)]">Verified manufacturers</Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 bg-black/50 z-[2000] transition-all duration-300 ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setMobileOpen(false)}
      >
        <div className={`absolute top-0 right-0 bottom-0 w-[300px] bg-white transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
          <header className="p-6 border-b border-slate-200 flex justify-between items-center">
            {isAuth ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-lg">
                  {(isSupplier ? (supplierProfile?.businessName?.[0]) : isReseller ? (resellerProfile?.fullName?.[0] || resellerProfile?.storeName?.[0]) : (user?.name?.[0]))?.toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-slate-900">
                    {isSupplier
                      ? (supplierProfile?.businessName || 'Supplier')
                      : isReseller
                        ? (resellerProfile?.fullName || resellerProfile?.storeName || user?.name || 'Reseller')
                        : (user?.name || 'User')
                    }
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
                </div>
              </div>
            ) : (
              <img src="/favicon.jpeg" alt="Logo" className="h-8" />
            )}
            <button className="bg-transparent border-none text-slate-900" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-8">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">Quick Links</div>
              <Link to="/about" className="flex items-center gap-3 py-3 text-slate-900 no-underline font-medium active:text-[var(--color-primary)]" onClick={() => setMobileOpen(false)}>
                <List size={18} />
                <span>About AMJStar</span>
              </Link>
            </div>

            <div className="mb-8">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">Join as Partner</div>
              {isAuth ? (
                <>
                  <Link
                    to={isSupplier ? "/supplier/onboarding" : isReseller ? "/reseller/dashboard" : isAdmin ? "/admin/dashboard" : "/profile"}
                    className="flex items-center gap-3 py-3 text-slate-900 no-underline font-medium active:text-[var(--color-primary)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User size={18} />
                    <span>{isAdmin ? 'Control Panel' : 'My Profile'}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to={ROUTES.BUYERS} className="flex items-center gap-3 py-3 text-slate-900 no-underline font-medium active:text-[var(--color-primary)]" onClick={() => setMobileOpen(false)}>
                    <ShoppingBag size={18} />
                    <span>For Buyers</span>
                  </Link>
                  <Link to={ROUTES.SUPPLIERS} className="flex items-center gap-3 py-3 text-slate-900 no-underline font-medium active:text-[var(--color-primary)]" onClick={() => setMobileOpen(false)}>
                    <Store size={18} />
                    <span>For Suppliers</span>
                  </Link>
                  <Link to={ROUTES.RESELLERS} className="flex items-center gap-3 py-3 text-slate-900 no-underline font-medium active:text-[var(--color-primary)]" onClick={() => setMobileOpen(false)}>
                    <Truck size={18} />
                    <span>For Resellers</span>
                  </Link>
                </>
              )}
            </div>

            <hr className="border-t border-slate-200 my-6" />

            <div className="mb-8">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">Browse Categories</div>
              {categories.map((cat) => {
                const hasSubs = cat.subcategories && cat.subcategories.length > 0;
                const isExpanded = expandedCategory === cat._id;
                return (
                  <div key={cat._id}>
                    <div
                      className="flex items-center gap-3 py-3 text-slate-900 no-underline font-medium active:text-[var(--color-primary)]"
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
                      <div className="flex flex-col">
                        <Link
                          to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}`}
                          className="flex items-center gap-3 py-3 text-slate-900 no-underline font-medium pl-9 !text-xs !text-slate-500 active:!text-[var(--color-primary)]"
                          onClick={() => setMobileOpen(false)}
                        >
                          <span>- All {cat.name}</span>
                        </Link>
                        {cat.subcategories.map((sub: any) => (
                          <Link
                            key={sub._id}
                            to={`${ROUTES.PRODUCT_LIST}?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                            className="flex items-center gap-3 py-3 text-slate-900 no-underline font-medium pl-9 !text-xs !text-slate-500 active:!text-[var(--color-primary)]"
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
            <footer className="p-6 border-t border-slate-200">
              <button className="w-full flex items-center justify-center gap-2 p-3.5 bg-red-100 text-red-500 border-none rounded-md font-semibold" onClick={handleSignOut}>
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
