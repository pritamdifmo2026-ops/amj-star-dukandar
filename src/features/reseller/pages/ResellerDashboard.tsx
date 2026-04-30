import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  History,
  LogOut,
  TrendingUp,
  Package,
  Users,
  Search,
  ArrowUpRight,
  Menu,
  Bell,
  Mail,
  LifeBuoy,
  Store,
  UserPlus,
  BarChart3,
  Settings as SettingsIcon,
  Handshake,
  Zap
} from 'lucide-react';

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
import styles from './ResellerDashboard.module.css';

const ResellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.reseller);
  const { user } = useAppSelector(state => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get('tab') as any) || 'overview';

  const setActiveView = (tab: string) => {
    setSearchParams({ tab });
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);

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
  const confirmLogout = () => {
    dispatch(logout());
    window.location.href = '/';
  };

  const renderOverview = () => (
    <div className={styles.overview}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0f9ff', color: '#0369a1' }}><TrendingUp size={24} /></div>
          <div className={styles.statInfo}>
            <label>Total Earnings</label>
            <h3>₹0.00</h3>
            <span className={styles.trend}>+0% this month</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#15803d' }}><ShoppingBag size={24} /></div>
          <div className={styles.statInfo}>
            <label>Total Orders</label>
            <h3>0</h3>
            <span className={styles.trend}>0 active now</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fdf2f8', color: '#be185d' }}><Package size={24} /></div>
          <div className={styles.statInfo}>
            <label>Shared Products</label>
            <h3>0</h3>
            <span className={styles.trend}>Items in your shop</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fff7ed', color: '#c2410c' }}><Users size={24} /></div>
          <div className={styles.statInfo}>
            <label>Customer Reach</label>
            <h3>{profile?.reach || 'N/A'}</h3>
            <span className={styles.trend}>Target Market</span>
          </div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.mainSection}>
          <div className={styles.sectionHeader}>
            <h2>Recent Orders</h2>
            <button onClick={() => setActiveView('orders')}>View All</button>
          </div>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><ShoppingBag size={48} /></div>
            <h3>No orders yet</h3>
            <p>Once your customers start buying from your shop, they will appear here.</p>
            <Button onClick={() => navigate('/products')} className={styles.browseBtn}>
              Browse Products to Sell
            </Button>
          </div>
        </div>

        <div className={styles.sideSection}>
          <div className={styles.profileSummary}>
            <h3>Shop Profile</h3>
            <div className={styles.profileInfo}>
              <div className={styles.infoRow}>
                <label>Store Name</label>
                <p>{profile?.storeName}</p>
              </div>
              <div className={styles.infoRow}>
                <label>Member Since</label>
                <p>{new Date(profile?.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
              <div className={styles.infoRow}>
                <label>Plan</label>
                <span className={styles.planBadge}>{profile?.subscriptionPlan || 'Starter'}</span>
              </div>
            </div>
            <div className={styles.quickActions}>
              <button className={styles.actionLink}>Edit Shop Profile <ArrowUpRight size={14} /></button>
            </div>
          </div>

          <div className={styles.supportCard}>
            <div className={styles.supportHeader}>
              <LifeBuoy size={20} />
              <h3>Need Help?</h3>
            </div>
            <p>Our support team is available 24/7 to help you with your business.</p>
            <div className={styles.supportLinks}>
              <a href="mailto:support@amjstar.com" className={styles.supportItem}>
                <Mail size={14} />
                <span>support@amjstar.com</span>
              </a>
              <a href="mailto:Info@amjstar.com" className={styles.supportItem}>
                <Mail size={14} />
                <span>Info@amjstar.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${styles.dashboardContainer} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
      <header className={styles.mobileHeader}>
        <button 
          className={styles.menuToggle} 
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <div className={styles.mobileTitle}>Reseller Hub</div>
        <button className={styles.notificationBtn}>
          <Bell size={20} />
          <span className={styles.badge} />
        </button>
      </header>

      {isSidebarOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar
        title="Reseller Hub"
        logoSrc="/favicon.jpeg"
        menu={resellerMenu}
        footerMenu={resellerFooterMenu}
        activeTab={activeView}
        onTabChange={(id) => {
          setActiveView(id as any);
          if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
          }
        }}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        brandColor="#e65c00"
      />

      <main className={styles.mainContent}>
        {activeView === 'overview' && (
          <header className={styles.header}>
            <div>
              <h1>Welcome, {profile?.fullName || user?.name}</h1>
              <p>Grow your business with AMJStar's high-quality supplier network.</p>
            </div>
            <Button onClick={() => navigate('/products')} className={styles.shopBtn}>
              <Search size={20} /> Browse Products
            </Button>
          </header>
        )}

        {activeView === 'overview' && renderOverview()}

        {activeView === 'storefront' && <ResellerStorefront />}

        {activeView === 'leads' && (
          <PlaceholderView
            title="Leads Management"
            icon={UserPlus}
            description="Track your potential buyers, their interests, and contact history."
          />
        )}

        {activeView === 'tasks' && <ResellerActionCenter />}

        {activeView === 'browse' && <ResellerBrowseProducts />}

        {activeView === 'my-products' && <ResellerMyProducts />}

        {activeView === 'orders' && (
          <PlaceholderView
            title="Customer Orders"
            icon={ShoppingBag}
            description="Track your customer orders, shipping status, and delivery details."
          />
        )}

        {activeView === 'payouts' && (
          <PlaceholderView
            title="Earnings & Payouts"
            icon={CreditCard}
            description="Monitor your accumulated commission and manage your withdrawal requests."
          />
        )}

        {activeView === 'performance' && <ResellerPerformance />}

        {activeView === 'supplier-partners' && <ResellerSupplierPartners />}
        {activeView === 'history' && <ResellerHistory />}
        {activeView === 'settings' && <ResellerSettings />}
      </main>

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Logout">
        <div className={styles.logoutModalContent}>
          <div className={styles.logoutIcon}><LogOut size={32} /></div>
          <h3>Are you sure?</h3>
          <p>You will need to login again to access your dashboard.</p>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button onClick={confirmLogout} className={styles.confirmBtn}>Sign Out</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ResellerDashboard;
