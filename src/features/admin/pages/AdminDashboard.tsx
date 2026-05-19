import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/features/auth/store/auth.slice';
import { useSearchParams } from 'react-router-dom';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import MessageModal from '@/shared/components/ui/MessageModal';
import Sidebar, { type MenuItem } from '@/shared/components/layout/Sidebar';
import { ShieldCheck, Users, BarChart3, Package, Tags, Menu, Image as ImageIcon, MessageSquare, Settings, Wallet } from 'lucide-react';
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
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import adminService from '../services/admin.service';

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
  'platform-settings': 'Platform Settings',
  withdrawals: 'Withdrawal Requests',
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
    { id: 'enquiry', label: 'Enquiries', icon: MessageSquare, badge: newEnquiryCount || undefined },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'platform-settings', label: 'Platform Settings', icon: Settings },
  ];

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
        logoSrc="/favicon.jpeg"
        menu={adminMenu}
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
            {activeTab === 'enquiry' && <EnquiryManagement />}
            {activeTab === 'platform-settings' && <AdminPlatformSettings />}
            {activeTab === 'withdrawals' && <AdminWithdrawals />}
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
