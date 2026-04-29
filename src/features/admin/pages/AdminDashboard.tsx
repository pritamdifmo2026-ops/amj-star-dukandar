import React, { useState, useEffect } from 'react';
import adminService from '../services/admin.service';
import type { AdminStats } from '../services/admin.service';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { useSearchParams } from 'react-router-dom';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import MessageModal from '@/shared/components/ui/MessageModal';
import Sidebar, { type MenuItem } from '@/shared/components/layout/Sidebar';

// Modular Components
import DashboardOverview from '../components/DashboardOverview';
import SupplierVerification from '../components/SupplierVerification';
import UserManagement from '../components/UserManagement';
import ProductQueue from '../components/ProductQueue';
import CategoryManagement from '../components/CategoryManagement';
import ResellerVerification from '../components/ResellerVerification';

import styles from './AdminDashboard.module.css';
import {
  Users,
  ShieldCheck,
  BarChart3,
  Package,
  Tags
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 'stats';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [allResellers, setAllResellers] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [approvedProducts, setApprovedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const adminMenu: MenuItem[] = [
    { id: 'stats', label: 'Overview', icon: BarChart3 },
    { id: 'suppliers', label: 'Manage Suppliers', icon: Users },
    { id: 'resellers', label: 'Manage Resellers', icon: Users },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'products', label: 'Product Queue', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tags },
  ];

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Custom Action Modals
  const [confirmVerify, setConfirmVerify] = useState<{ isOpen: boolean; id: string; type: 'supplier' | 'reseller' }>({ isOpen: false, id: '', type: 'supplier' });
  const [rejectPrompt, setRejectPrompt] = useState<{ isOpen: boolean; id: string; type: 'supplier' | 'reseller' }>({ isOpen: false, id: '', type: 'supplier' });
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');


  const dispatch = useAppDispatch();

  useEffect(() => {
    if (activeTab === 'reseller-detail') {
      setSearchParams({ tab: 'resellers' });
    } else if (activeTab === 'supplier-detail' || activeTab === 'supplier-products') {
      setSearchParams({ tab: 'suppliers' });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const data = await adminService.getStats();
        setStats(data);
      } else if (activeTab === 'suppliers' || activeTab === 'supplier-detail' || activeTab === 'supplier-products') {
        const data = await adminService.getAllSuppliers();
        setAllSuppliers(data);
      } else if (activeTab === 'resellers' || activeTab === 'reseller-detail') {
        const data = await adminService.getAllResellers();
        setAllResellers(data);
      } else if (activeTab === 'users') {
        const data = await adminService.getAllUsers();
        setAllUsers(data);
      } else if (activeTab === 'products') {
        const [pending, approved] = await Promise.all([
          adminService.getPendingProducts(),
          adminService.getAllProducts()
        ]);
        setPendingProducts(pending);
        setApprovedProducts(approved);
      } else if (activeTab === 'categories') {
        const { categoryService } = await import('@/features/product/services/category.service');
        const data = await categoryService.getAll();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySupplier = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    if (status === 'VERIFIED') {
      setConfirmVerify({ isOpen: true, id, type: 'supplier' });
    } else {
      setRejectPrompt({ isOpen: true, id, type: 'supplier' });
      setRejectionReasonInput('');
    }
  };

  const handleVerifyReseller = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (status === 'APPROVED') {
      setConfirmVerify({ isOpen: true, id, type: 'reseller' });
    } else {
      setRejectPrompt({ isOpen: true, id, type: 'reseller' });
      setRejectionReasonInput('');
    }
  };

  const executeVerify = async () => {
    const { id, type } = confirmVerify;
    try {
      if (type === 'supplier') {
        await adminService.verifySupplier(id, 'VERIFIED');
        setAllSuppliers(prev => prev.map(s => s._id === id ? { ...s, kycStatus: 'VERIFIED', verifiedByAdmin: true } : s));
      } else {
        await adminService.verifyReseller(id, 'APPROVED');
        setAllResellers(prev => prev.map(r => r._id === id ? { ...r, status: 'APPROVED' } : r));
      }
      setConfirmVerify({ isOpen: false, id: '', type: 'supplier' });
      setMessageModal({ isOpen: true, title: 'Success', message: `${type === 'supplier' ? 'Supplier' : 'Reseller'} verified successfully`, type: 'success' });
    } catch (err) {
      setMessageModal({ isOpen: true, title: 'Error', message: 'Action failed', type: 'error' });
    }
  };

  const executeReject = async () => {
    const { id, type } = rejectPrompt;
    if (!rejectionReasonInput.trim()) {
      alert('Please provide a reason');
      return;
    }
    try {
      if (type === 'supplier') {
        await adminService.verifySupplier(id, 'REJECTED', rejectionReasonInput);
        setAllSuppliers(prev => prev.map(s => s._id === id ? { ...s, kycStatus: 'REJECTED', verifiedByAdmin: false, rejectionReason: rejectionReasonInput } : s));
      } else {
        await adminService.verifyReseller(id, 'REJECTED', rejectionReasonInput);
        setAllResellers(prev => prev.map(r => r._id === id ? { ...r, status: 'REJECTED', rejectionReason: rejectionReasonInput } : r));
      }
      setRejectPrompt({ isOpen: false, id: '', type: 'supplier' });
      setMessageModal({ isOpen: true, title: 'Success', message: `${type === 'supplier' ? 'Supplier' : 'Reseller'} rejected successfully`, type: 'success' });
    } catch (err) {
      setMessageModal({ isOpen: true, title: 'Error', message: 'Action failed', type: 'error' });
    }
  };

  const handleVerifyProduct = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await adminService.verifyProduct(id, status);
      if (status === 'APPROVED') fetchData();
      else setPendingProducts(prev => prev.filter(p => p._id !== id));

      setMessageModal({
        isOpen: true,
        title: 'Success',
        message: `Product ${status.toLowerCase()} successfully`,
        type: 'success'
      });
    } catch (err) {
      setMessageModal({ isOpen: true, title: 'Error', message: 'Action failed', type: 'error' });
    }
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      await adminService.toggleUserStatus(id, !currentStatus);
      setAllUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
    } catch (err) {
      setMessageModal({ isOpen: true, title: 'Error', message: 'Action failed', type: 'error' });
    }
  };

  const handleAddCategory = async (name: string) => {
    const { categoryService } = await import('@/features/product/services/category.service');
    await categoryService.create(name);
    const data = await categoryService.getAll();
    setCategories(data.categories);
  };

  const handleSignOut = () => {
    dispatch(logout());
    window.location.href = '/';
  };

  return (
    <div className={`${styles.container} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
      <Sidebar
        title="AMJ Admin"
        logoSrc="/favicon.jpeg"
        menu={adminMenu}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        onLogout={() => setShowLogoutModal(true)}
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        brandColor="#0284c7"
      />

      <main className={styles.content}>
        <header className={styles.header}>
          <h2>
            {activeTab === 'stats' && 'Platform Overview'}
            {activeTab === 'suppliers' && 'Supplier Verifications'}
            {activeTab === 'supplier-detail' && 'Supplier Profile'}
            {activeTab === 'supplier-products' && 'Supplier Products'}
            {activeTab === 'resellers' && 'Reseller Verifications'}
            {activeTab === 'reseller-detail' && 'Reseller Profile'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'products' && 'Product Queue'}
            {activeTab === 'categories' && 'Category Management'}
          </h2>

        </header>

        {loading ? (
          <div className={styles.loader}>Loading...</div>
        ) : (
          <div className={styles.view}>
            {activeTab === 'stats' && stats && <DashboardOverview stats={stats} />}
            {(activeTab === 'suppliers' || activeTab === 'supplier-detail' || activeTab === 'supplier-products') && (
              <SupplierVerification
                suppliers={allSuppliers}
                onVerify={handleVerifySupplier}
              />
            )}
            {(activeTab === 'resellers' || activeTab === 'reseller-detail') && (
              <ResellerVerification
                resellers={allResellers}
                onVerify={handleVerifyReseller}
              />
            )}
            {activeTab === 'users' && (
              <UserManagement
                users={allUsers}
                onToggleStatus={handleToggleUserStatus}
              />
            )}
            {activeTab === 'products' && (
              <ProductQueue
                pendingProducts={pendingProducts}
                approvedProducts={approvedProducts}
                onVerify={handleVerifyProduct}
              />
            )}
            {activeTab === 'categories' && (
              <CategoryManagement
                categories={categories}
                onAddCategory={handleAddCategory}
              />
            )}
          </div>
        )}
      </main>

      {/* Verification Confirmation Modal */}
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
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <ShieldCheck size={48} color="#e65c00" style={{ marginBottom: '16px', margin: '0 auto' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Are you sure you want to verify this {confirmVerify.type} and onboard them?</p>
          {confirmVerify.type === 'reseller' && (
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '8px' }}>
              They will be notified and can start using their reseller dashboard.
            </p>
          )}
        </div>
      </Modal>

      {/* Rejection Reason Modal */}
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
        <div style={{ padding: '10px 0' }}>
          <p style={{ marginBottom: '12px', fontWeight: 500 }}>Please provide a reason for rejection:</p>
          <textarea
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              minHeight: '100px',
              resize: 'vertical'
            }}
            placeholder="e.g. Invalid GST document, Address mismatch..."
            value={rejectionReasonInput}
            onChange={(e) => setRejectionReasonInput(e.target.value)}
          />
        </div>
      </Modal>

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
