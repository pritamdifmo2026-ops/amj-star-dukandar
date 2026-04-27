import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import productService from '@/features/product/services/product.service';
import Button from '@/shared/components/ui/Button';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Plus, 
  ShieldCheck, 
  Zap, 
  LogOut,
  Trash2,
  FileText,
  MessageCircle
} from 'lucide-react';

// Modular Components
import SupplierStats from '../components/SupplierStats';
import ProductTable from '../components/ProductTable';
import PlaceholderView from '../components/PlaceholderView';
import AddProductForm from '../components/AddProductForm';

import Modal from '@/shared/components/ui/Modal';
import Sidebar, { type MenuItem } from '@/shared/components/layout/Sidebar';
import styles from './SupplierDashboard.module.css';

const SupplierDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.supplier);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get('tab') as any) || 'overview';

  const setActiveView = (tab: string) => {
    setSearchParams({ tab });
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);

  const supplierMenu: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'My Inventory', icon: Package },
  ];

  const supplierFooterMenu: MenuItem[] = [
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'logistics', label: 'Logistics', icon: Truck },
  ];

  const fetchProducts = async () => {
    try {
      const data = await productService.getMyProducts();
      setProducts(data.products);
    } catch (err) {
      console.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setActiveView('edit-product');
  };

  const handleDelete = (product: any) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await productService.deleteProduct(productToDelete._id);
      fetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    dispatch(logout());
    window.location.href = '/';
  };

  const isTrusted = products.filter(p => p.status === 'APPROVED').length >= 4;

  const handleFormSuccess = () => {
    fetchProducts();
    setActiveView('inventory');
    setEditingProduct(null);
  };

  return (
    <div className={`${styles.dashboardContainer} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
      <Sidebar
        title="Supplier Center"
        logoSrc="/favicon.jpeg"
        menu={supplierMenu}
        footerMenu={supplierFooterMenu}
        activeTab={activeView}
        onTabChange={(id) => setActiveView(id as any)}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        brandColor="#0284c7"
      />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1>Welcome back, {profile?.businessName}</h1>
            {isTrusted ? (
              <div className={styles.trustedBadge}>
                <ShieldCheck size={16} />
                <span>Trusted Supplier</span>
              </div>
            ) : (
              <p>Manage your products and orders from your command center.</p>
            )}
            {isTrusted && (
              <div className={styles.autoApprovalNotice}>
                <Zap size={14} />
                <span><strong>Auto-Upload Active:</strong> Your products will now be live instantly!</span>
              </div>
            )}
          </div>
          <Button onClick={() => setActiveView('add-product')} className={styles.addBtn}>
            <Plus size={20} /> Add New Product
          </Button>
        </header>

        {activeView === 'overview' && (
          <>
            <SupplierStats products={products} />
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Recent Products</h2>
                <button className={styles.viewAll} onClick={() => setActiveView('inventory')}>View All</button>
              </div>
              <ProductTable 
                products={products.slice(0, 5)} 
                loading={loading} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
                onAdd={() => setActiveView('add-product')}
              />
            </section>
          </>
        )}

        {activeView === 'inventory' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>My Inventory</h2>
            </div>
            <ProductTable 
              products={products} 
              loading={loading} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              onAdd={() => setActiveView('add-product')}
            />
          </section>
        )}

        {activeView === 'quotations' && (
          <PlaceholderView 
            title="Quotations Management" 
            icon={FileText} 
            description="Track and manage price quotations from potential buyers in one place."
          />
        )}

        {activeView === 'chat' && (
          <PlaceholderView 
            title="Supplier Chat" 
            icon={MessageCircle} 
            description="Communicate directly with buyers to discuss product requirements and deal terms."
          />
        )}

        {activeView === 'logistics' && (
          <PlaceholderView 
            title="Logistics Tracking" 
            icon={Truck} 
            description="Manage your shipments and track delivery status for all your bulk orders."
          />
        )}
      </main>

      {(activeView === 'add-product' || activeView === 'edit-product') && (
        <AddProductForm 
          onBack={() => { setActiveView('inventory'); setEditingProduct(null); }}
          onSuccess={handleFormSuccess}
          editingProduct={editingProduct}
        />
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Product">
        <div className={styles.logoutModalContent}>
          <div className={styles.logoutIcon}><Trash2 size={32} /></div>
          <h3>Delete this product?</h3>
          <p>Are you sure you want to remove <strong>{productToDelete?.name}</strong>? This action cannot be undone.</p>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button onClick={confirmDelete} className={styles.confirmBtn}>Delete</Button>
          </div>
        </div>
      </Modal>

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

export default SupplierDashboard;
