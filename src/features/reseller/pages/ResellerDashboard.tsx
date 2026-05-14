import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { LayoutDashboard, ShoppingBag, CreditCard, History, LogOut, TrendingUp, Package, Users, Search, ArrowUpRight, Menu, Bell, Mail, LifeBuoy, Store, UserPlus, BarChart3, Settings as SettingsIcon, Handshake, Zap } from 'lucide-react';
import Sidebar, { type MenuItem } from '@/shared/components/layout/Sidebar';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import PlaceholderView from '@/features/supplier/components/PlaceholderView';
import ResellerBrowseProducts from '../components/ResellerBrowseProducts';
import ResellerMyProducts from '../components/ResellerMyProducts';
import ResellerHistory from '../components/ResellerHistory';
import ResellerSupplierPartners from '../components/ResellerSupplierPartners';
import ResellerSettings from '../components/ResellerSettings';
import ResellerStorefront from '../components/ResellerStorefront';
import ResellerPerformance from '../components/ResellerPerformance';
import ResellerActionCenter from '../components/ResellerActionCenter';

const ResellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.reseller);
  const { user } = useAppSelector(state => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get('tab') as any) || 'overview';
  const setActiveView = (tab: string) => setSearchParams({ tab });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 1024);

  React.useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resellerMenu: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'storefront', label: 'My Storefront', icon: Store },
    { id: 'leads', label: 'Leads', icon: UserPlus },
    { id: 'browse', label: 'Browse Products', icon: Search },
    { id: 'my-products', label: 'My Products', icon: Package },
    { id: 'supplier-partners', label: 'Supplier Partnership', icon: Handshake },
    { id: 'orders', label: 'Customer Orders', icon: ShoppingBag },
  ];

  const resellerFooterMenu: MenuItem[] = [
    { id: 'payouts', label: 'Earnings & Payouts', icon: CreditCard },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'history', label: 'Activity History', icon: History },
    { id: 'tasks', label: 'Action Center', icon: Zap },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => { dispatch(logout()); window.location.href = '/'; };

  const statsData = [
    { label: 'Total Earnings', val: '₹0.00', sub: '+0% this month', icon: <TrendingUp size={22} />, iconCls: 'bg-[#f0f9ff] text-[#0369a1]' },
    { label: 'Total Orders', val: '0', sub: '0 active now', icon: <ShoppingBag size={22} />, iconCls: 'bg-[#f0fdf4] text-[#15803d]' },
    { label: 'Shared Products', val: '0', sub: 'Items in your shop', icon: <Package size={22} />, iconCls: 'bg-[#fdf2f8] text-[#be185d]' },
    { label: 'Customer Reach', val: String(profile?.reach || 'N/A'), sub: 'Target Market', icon: <Users size={22} />, iconCls: 'bg-[#fff7ed] text-[#c2410c]' },
  ];

  const renderOverview = () => (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {statsData.map(({ label, val, sub, icon, iconCls }) => (
          <div key={label} className="bg-white border border-[#eef2f6] rounded-[12px] p-5 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 ${iconCls}`}>{icon}</div>
            <div>
              <label className="text-xs text-[#94a3b8] font-bold block mb-1">{label}</label>
              <h3 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-0.5">{val}</h3>
              <span className="text-xs text-[#64748b]">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5 max-lg:grid-cols-1">
        <div className="bg-white border border-[#eef2f6] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-extrabold text-[#0f172a] m-0">Recent Orders</h2>
            <button className="text-xs text-primary font-bold bg-none border-none cursor-pointer" onClick={() => setActiveView('orders')}>View All</button>
          </div>
          <div className="flex flex-col items-center gap-3 py-12 text-[#64748b]">
            <div className="w-20 h-20 bg-[#f1f5f9] rounded-full flex items-center justify-center"><ShoppingBag size={36} className="text-[#94a3b8]" /></div>
            <h3 className="text-base font-bold text-[#1e293b] m-0">No orders yet</h3>
            <p className="text-sm text-center m-0 max-w-[300px]">Once your customers start buying from your shop, they will appear here.</p>
            <Button onClick={() => navigate('/products')}>Browse Products to Sell</Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#eef2f6] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">Shop Profile</h3>
            <div className="flex flex-col gap-3 mb-4">
              {[['Store Name', profile?.storeName], ['Member Since', new Date(profile?.createdAt || Date.now()).toLocaleDateString()]].map(([label, val]) => (
                <div key={label}>
                  <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-0.5">{label}</label>
                  <p className="text-sm font-semibold text-[#1e293b] m-0">{val}</p>
                </div>
              ))}
              <div>
                <label className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-0.5">Plan</label>
                <span className="inline-block bg-primary text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{profile?.subscriptionPlan || 'Starter'}</span>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-primary font-bold bg-none border-none cursor-pointer p-0">
              Edit Shop Profile <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="bg-white border border-[#eef2f6] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2.5 mb-3">
              <LifeBuoy size={18} className="text-primary" />
              <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Need Help?</h3>
            </div>
            <p className="text-xs text-[#64748b] mb-3">Our support team is available 24/7 to help you with your business.</p>
            <div className="flex flex-col gap-2">
              {['support@amjstar.com', 'Info@amjstar.com'].map(email => (
                <a key={email} href={`mailto:${email}`} className="flex items-center gap-2 text-xs text-primary no-underline hover:underline">
                  <Mail size={12} /> {email}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white overflow-x-hidden w-full relative max-lg:flex-col">
      {/* Mobile Header */}
      <header className="hidden max-lg:flex items-center justify-between px-4 py-3 bg-white border-b border-[#eef2f6] sticky top-0 z-30">
        <button className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-[#f1f5f9] text-[#475569] border-none cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={20} />
        </button>
        <div className="font-bold text-[#0f172a] text-sm">Reseller Hub</div>
        <button className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-[#f1f5f9] text-[#475569] border-none cursor-pointer relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#dc2626] rounded-full" />
        </button>
      </header>

      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] z-40 max-lg:block hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar
        title="Reseller Hub"
        logoSrc="/favicon.jpeg"
        menu={resellerMenu}
        footerMenu={resellerFooterMenu}
        activeTab={activeView}
        onTabChange={id => { setActiveView(id as any); if (window.innerWidth <= 1024) setIsSidebarOpen(false); }}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        brandColor="#e65c00"
        user={user || undefined}
        profile={profile || undefined}
      />

      <main className="flex-1 ml-[260px] p-10 transition-all max-lg:ml-0 max-lg:p-4">
        {activeView === 'overview' && (
          <header className="flex justify-between items-start mb-8 max-sm:flex-col max-sm:gap-4">
            <div>
              <h1 className="text-[1.75rem] font-extrabold text-[#0f172a] m-0 mb-1">Welcome, {profile?.fullName || user?.name}</h1>
              <p className="text-[#64748b] m-0">Grow your business with AMJStar's high-quality supplier network.</p>
            </div>
            <Button onClick={() => navigate('/products')} className="flex items-center gap-2">
              <Search size={18} /> Browse Products
            </Button>
          </header>
        )}

        {activeView === 'overview' && renderOverview()}
        {activeView === 'storefront' && <ResellerStorefront />}
        {activeView === 'leads' && <PlaceholderView title="Leads Management" icon={UserPlus} description="Track your potential buyers, their interests, and contact history." />}
        {activeView === 'tasks' && <ResellerActionCenter />}
        {activeView === 'browse' && <ResellerBrowseProducts />}
        {activeView === 'my-products' && <ResellerMyProducts />}
        {activeView === 'orders' && <PlaceholderView title="Customer Orders" icon={ShoppingBag} description="Track your customer orders, shipping status, and delivery details." />}
        {activeView === 'payouts' && <PlaceholderView title="Earnings & Payouts" icon={CreditCard} description="Monitor your accumulated commission and manage your withdrawal requests." />}
        {activeView === 'performance' && <ResellerPerformance />}
        {activeView === 'supplier-partners' && <ResellerSupplierPartners />}
        {activeView === 'history' && <ResellerHistory />}
        {activeView === 'settings' && <ResellerSettings />}
      </main>

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Logout">
        <div className="flex flex-col items-center gap-4 p-4 text-center">
          <div className="w-16 h-16 bg-[#fef2f2] rounded-full flex items-center justify-center text-[#dc2626]"><LogOut size={28} /></div>
          <h3 className="text-base font-bold text-[#0f172a] m-0">Are you sure?</h3>
          <p className="text-sm text-[#64748b] m-0">You will need to login again to access your dashboard.</p>
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={() => setShowLogoutModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={confirmLogout} className="flex-1 !bg-[#dc2626]">Sign Out</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResellerDashboard;
