import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/features/auth/store/auth.slice';
import { useSearchParams } from 'react-router-dom';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import MessageModal from '@/shared/components/ui/MessageModal';
import Sidebar, { type MenuItem } from '@/shared/components/layout/Sidebar';
import { ShieldCheck, Users, BarChart3, Package, Tags, Menu, Image as ImageIcon, MessageSquare, Settings, Wallet, TrendingUp, FileText, AlertTriangle } from 'lucide-react';
import logo from '@/assets/logoo.png';
import { useQuery } from '@tanstack/react-query';

import DashboardOverview from '../components/DashboardOverview';
import SupplierVerification from '../components/SupplierVerification';
import UserManagement from '../components/UserManagement';
import ProductQueue from '../components/ProductQueue';
import CategoryManagement from '../components/CategoryManagement';
import ResellerVerification from '../components/ResellerVerification';
import BannerManagement from '../components/BannerManagement';
import EnquiryManagement from '../components/EnquiryManagement';
import AdminPlatformSettings from '../components/AdminPlatformSettings';
import AdminWithdrawals from '../components/AdminWithdrawals';
import AdminEarnings from '../components/AdminEarnings';
import AdminPerformance from '../components/AdminPerformance';
import AdminDisputes from '../components/AdminDisputes';
import BuyerQueries from '../components/BuyerQueries';
import ControlAuthority from '../components/ControlAuthority';
import RequirementManagement from '../components/RequirementManagement';
import AdminPages from '../components/AdminPages';

import { useAdminDashboard } from '../hooks/useAdminDashboard';
import adminService from '../services/admin.service';
import { Navigate } from 'react-router-dom';

const tabLabel: Record<string, string> = {
  stats: 'Platform Overview',
  suppliers: 'Supplier Verifications',
  'supplier-detail': 'Supplier Profile',
  'supplier-products': 'Supplier Products',
  resellers: 'Reseller Verifications',
  'reseller-detail': 'Reseller Profile',
  users: 'User Management',
  products: 'Product Queue',
  categories: 'Category Management',
  banners: 'Banner Management',
  enquiry: 'Customer Enquiries',
  earnings: 'AMJStar Earnings',
  performance: 'Supplier Performance',
  disputes: 'Disputes',
  'platform-settings': 'Platform Settings',
  withdrawals: 'Withdrawal Requests',
  pages: 'Manage Pages',
  'requirement-management': 'Requirement Management',
  'buyer-queries': 'Buyer Queries',
};

const AdminDashboard: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'stats';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 1024);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { data: newEnquiryCount = 0 } = useQuery<number>({
    queryKey: ['admin', 'enquiry', 'count'],
    queryFn: () => adminService.getEnquiryNewCount(),
    refetchInterval: 60_000,
  });

  const adminMenu: MenuItem[] = [
    { id: 'stats', label: 'Overview', icon: BarChart3 },
    { id: 'suppliers', label: 'Manage Suppliers', icon: Users },
    { id: 'resellers', label: 'Manage Resellers', icon: Users },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'products', label: 'Product Queue', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'banners', label: 'Banner Ads', icon: ImageIcon },
    { id: 'buyer-queries', label: 'Buyer Queries', icon: MessageSquare },
    { id: 'enquiry', label: 'Enquiries', icon: MessageSquare, badge: newEnquiryCount || undefined },
    { id: 'requirement-management', label: 'Requirements', icon: FileText },
    { id: 'earnings', label: 'AMJ Earnings', icon: TrendingUp },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'pages', label: 'Manage Pages', icon: FileText },
    { id: 'platform-settings', label: 'Platform Settings', icon: Settings },
  ];

  const hasPermission = (perm: string) => {
    if (user?.role === 'superadmin') return true;
    return user?.permissions?.includes(perm) || false;
  };

  const filteredMenu = adminMenu.filter(item => {
    if (user?.role === 'superadmin') return true;
    if (item.id === 'stats') return true;
    if (item.id === 'suppliers') return hasPermission('supplier_verify');
    if (item.id === 'resellers') return hasPermission('reseller_verify');
    if (item.id === 'users') return hasPermission('user_management');
    if (item.id === 'products') return hasPermission('product_queue');
    if (item.id === 'categories') return hasPermission('category_management');
    if (item.id === 'banners') return hasPermission('banner_management');
    if (item.id === 'buyer-queries') return true;
    if (item.id === 'enquiry') return hasPermission('enquiry_management');
    if (item.id === 'requirement-management') return hasPermission('requirement_management');
    if (item.id === 'earnings') return hasPermission('earnings');
    if (item.id === 'performance') return hasPermission('performance');
    if (item.id === 'disputes') return hasPermission('disputes');
    if (item.id === 'withdrawals') return hasPermission('withdrawals');
    if (item.id === 'pages') return hasPermission('pages_management');
    if (item.id === 'platform-settings') return hasPermission('platform_settings');
    return false;
  });

  if (user?.role === 'superadmin') {
    filteredMenu.push({ id: 'control-authority', label: 'Control Authority', icon: ShieldCheck });
  }

  // Redirect if mustChangePassword is true
  if (user?.mustChangePassword) {
    return <Navigate to="/admin/change-password" replace />;
  }

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeTab === 'reseller-detail') setSearchParams({ tab: 'resellers' });
    else if (activeTab === 'supplier-detail' || activeTab === 'supplier-products') setSearchParams({ tab: 'suppliers' });
  }, []);

  const {
    stats, allSuppliers, allResellers, allUsers,
    pendingProducts, approvedProducts, loading,
    // ui state
    messageModal, setMessageModal,
    confirmVerify, setConfirmVerify,
    rejectPrompt, setRejectPrompt,
    rejectionReasonInput, setRejectionReasonInput,
    // handlers
    handleVerifySupplier, handleVerifyReseller,
    executeVerify, executeReject,
    handleVerifyProduct, handleToggleUserStatus
  } = useAdminDashboard(activeTab);

  const handleSignOut = () => { dispatch(logout()); window.location.href = '/'; };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] overflow-x-hidden w-full relative max-lg:flex-col">
      <header className="hidden max-lg:flex items-center justify-between px-4 py-3 bg-white border-b border-[#eef2f6] sticky top-0 z-30">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-[#f1f5f9] text-[#475569] border-none cursor-pointer"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <div className="font-bold text-[#0f172a] text-sm">AMJ Admin</div>
        <div className="w-9 h-9" />
      </header>

      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.4)] z-40 max-lg:block hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        title="AMJ Admin"
        logoSrc={logo}
        menu={filteredMenu}
        activeTab={activeTab}
        onTabChange={id => { setActiveTab(id); if (window.innerWidth <= 1024) setIsSidebarOpen(false); }}
        onLogout={() => setShowLogoutModal(true)}
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
        brandColor="#0284c7"
        user={user || undefined}
        theme="admin"
      />

      <main className={`flex-1 p-8 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] max-lg:ml-0 max-lg:p-4 ${isSidebarOpen ? 'ml-[280px]' : 'ml-24'}`}>
        <header className="mb-6">
          <h2 className="text-xl font-extrabold text-[#0f172a] m-0">{tabLabel[activeTab] || ''}</h2>
        </header>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#64748b]">Loading...</div>
        ) : (
          <div>
            {activeTab === 'stats' && stats && <DashboardOverview stats={stats} />}
            {['suppliers', 'supplier-detail', 'supplier-products'].includes(activeTab) && (
              <SupplierVerification suppliers={allSuppliers} onVerify={handleVerifySupplier} onVerifyProduct={handleVerifyProduct} />
            )}
            {['resellers', 'reseller-detail'].includes(activeTab) && (
              <ResellerVerification resellers={allResellers} onVerify={handleVerifyReseller} />
            )}
            {activeTab === 'users' && (
              <UserManagement users={allUsers} onToggleStatus={handleToggleUserStatus} />
            )}
            {activeTab === 'products' && (
              <ProductQueue
                pendingProducts={pendingProducts}
                approvedProducts={approvedProducts}
                onVerify={handleVerifyProduct}
              />
            )}
            {activeTab === 'categories' && <CategoryManagement />}
            {activeTab === 'banners' && <BannerManagement />}
            
            {activeTab === 'earnings' && <AdminEarnings />}
            {activeTab === 'performance' && <AdminPerformance />}
            {activeTab === 'disputes' && <AdminDisputes />}
            {activeTab === 'enquiry' && <EnquiryManagement />}
            {activeTab === 'buyer-queries' && <BuyerQueries />}
            {activeTab === 'pages' && <AdminPages />}
            {activeTab === 'requirement-management' && <RequirementManagement />}
            {activeTab === 'platform-settings' && <AdminPlatformSettings />}
            {activeTab === 'withdrawals' && <AdminWithdrawals />}
            {activeTab === 'control-authority' && user?.role === 'superadmin' && <ControlAuthority />}
          </div>
        )}
      </main>

      {/* Confirm verify modal */}
      <Modal
        isOpen={confirmVerify.isOpen}
        onClose={() => setConfirmVerify({ isOpen: false, id: '', type: 'supplier' })}
        title={`Verify ${confirmVerify.type === 'supplier' ? 'Supplier' : 'Reseller'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmVerify({ isOpen: false, id: '', type: 'supplier' })}>Cancel</Button>
            <Button onClick={executeVerify}>Confirm</Button>
          </>
        }
      >
        <div className="text-center py-5">
          <ShieldCheck size={48} color="#e65c00" className="mx-auto mb-4" />
          <p className="text-base font-semibold">
            Are you sure you want to verify this {confirmVerify.type} and onboard them?
          </p>
          {confirmVerify.type === 'reseller' && (
            <p className="text-sm text-[#64748b] mt-2">
              They will be notified and can start using their reseller dashboard.
            </p>
          )}
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal
        isOpen={rejectPrompt.isOpen}
        onClose={() => setRejectPrompt({ isOpen: false, id: '', type: 'supplier' })}
        title="Reject Application"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectPrompt({ isOpen: false, id: '', type: 'supplier' })}>Cancel</Button>
            <Button variant="danger" onClick={executeReject}>Confirm Rejection</Button>
          </>
        }
      >
        <div className="py-2">
          <p className="font-medium mb-3">Please provide a reason for rejection:</p>
          <textarea
            className="w-full px-3 py-3 rounded-[8px] border border-[#e2e8f0] text-sm min-h-[100px] resize-y outline-none focus:border-primary"
            placeholder="e.g. Invalid GST document, Address mismatch..."
            value={rejectionReasonInput}
            onChange={e => setRejectionReasonInput(e.target.value)}
          />
        </div>
      </Modal>

      {/* Logout modal */}
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
        Are you sure you want to sign out of the Admin Portal?
      </Modal>

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </div>
  );
};

export default AdminDashboard;
