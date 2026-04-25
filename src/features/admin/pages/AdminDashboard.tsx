import React, { useState, useEffect } from 'react';
import adminService from '../services/admin.service';
import type { AdminStats } from '../services/admin.service';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

import styles from './AdminDashboard.module.css';
import {
  Users,
  ShieldCheck,
  BarChart3,
  Clock,
  Package,
  Tags,
  Search
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 'stats';
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [approvedProducts, setApprovedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [supplierSearch, setSupplierSearch] = useState('');

  const adminMenu: MenuItem[] = [
    { id: 'stats', label: 'Overview', icon: BarChart3 },
    { id: 'suppliers', label: 'Pending Suppliers', icon: Clock },
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

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const data = await adminService.getStats();
        setStats(data);
      } else if (activeTab === 'suppliers') {
        const data = await adminService.getAllSuppliers();
        setAllSuppliers(data);
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
    try {
      await adminService.verifySupplier(id, status);
      setAllSuppliers(prev => prev.map(s => s._id === id ? { ...s, kycStatus: status, verifiedByAdmin: status === 'VERIFIED' } : s));
      setMessageModal({
        isOpen: true,
        title: 'Success',
        message: `Supplier ${status.toLowerCase()} successfully`,
        type: 'success'
      });
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
    navigate('/admin/login');
    setShowLogoutModal(false);
  };

  return (
    <div className={`${styles.container} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
      <Sidebar
        title="AMJ Admin"
        logoIcon={ShieldCheck}
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
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'products' && 'Product Queue'}
            {activeTab === 'categories' && 'Category Management'}
          </h2>

          {activeTab === 'suppliers' && (
            <div className={styles.searchBar}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
              />
            </div>
          )}
        </header>

        {loading ? (
          <div className={styles.loader}>Loading...</div>
        ) : (
          <div className={styles.view}>
            {activeTab === 'stats' && stats && <DashboardOverview stats={stats} />}
            {activeTab === 'suppliers' && (
              <SupplierVerification 
                suppliers={allSuppliers} 
                onVerify={handleVerifySupplier} 
                searchQuery={supplierSearch} 
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
