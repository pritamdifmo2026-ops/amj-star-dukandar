import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import productService from '@/features/product/services/product.service';
import Button from '@/shared/components/ui/Button';
import {
  LayoutDashboard,
  Package,
  Truck,
  LogOut,
  Trash2,
  FileText,
  MessageCircle,
  Handshake,
  Menu,
  Edit,
  Image as ImageIcon,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle,
  ShoppingBag,
  Settings as SettingsIcon
} from 'lucide-react';

import ProductTable from '../components/ProductTable';
import PlaceholderView from '../components/PlaceholderView';
import AddProductForm from '../components/AddProductForm';
import SupplierPartnerships from '../components/SupplierPartnerships';
import SupplierOverview from '../components/SupplierOverview';
import SupplierInventory from '../components/SupplierInventory';
import SupplierSettings from '../components/SupplierSettings';
import ChatInbox from '@/features/chat/components/ChatInbox';
import Modal from '@/shared/components/ui/Modal';
import Sidebar, { type MenuItem } from '@/shared/components/layout/Sidebar';
import styles from './SupplierDashboard.module.css';

// ✅ Product Grid Component – Horizontal Card Layout (like first image)
interface ProductGridProps {
  products: any[];
  loading: boolean;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  onAdd?: () => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, onEdit, onDelete, onAdd }) => {
  if (loading) {
    return (
      <div className={styles.gridLoading}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={styles.cardSkeleton}>
            <div className={styles.skeletonImage}></div>
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonTitle}></div>
              <div className={styles.skeletonText}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.emptyProducts}>
        <Package size={48} />
        <p>No products found. Start by adding your first product!</p>
        {onAdd && <Button onClick={onAdd}>+ Add Product</Button>}
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'approved': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'rejected': return <AlertCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className={styles.productGrid}>
      {products.map((product) => (
        <div key={product._id} className={styles.productCard}>
          {/* Small fixed-size image */}
          <div className={styles.cardImage}>
            {product.images && product.images[0] ? (
              <img src={product.images[0]} alt={product.name} />
            ) : (
              <div className={styles.imagePlaceholder}>
                <ImageIcon size={24} />
              </div>
            )}
          </div>

          {/* Product details */}
          <div className={styles.cardContent}>
            <h3 className={styles.productName}>{product.name}</h3>
            <div className={styles.productMeta}>
              <span className={styles.price}>
                ₹{product.basePrice?.toLocaleString()}
              </span>
              <span className={styles.moq}>
                <Layers size={14} /> MOQ: {product.moq}
              </span>
            </div>
          </div>

          {/* Status and actions */}
          <div className={styles.cardRight}>
            <div className={`${styles.cardStatus} ${styles[product.status?.toLowerCase() || 'pending']}`}>
              {getStatusIcon(product.status)} {product.status || 'PENDING'}
            </div>
            <div className={styles.cardActions}>
              <button 
                className={`${styles.actionBtn} ${styles.editBtn}`}
                onClick={() => onEdit(product)}
                aria-label="Edit product"
              >
                <Edit size={16} />
              </button>
              <button 
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={() => onDelete(product)}
                aria-label="Delete product"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SupplierDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.supplier);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get('tab') as any) || 'overview';

  const setActiveView = (tab: string) => {
    setSearchParams({ tab });
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  };
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);

  // Lock body scroll when mobile sidebar or modal is open
  useEffect(() => {
    const isMobileView = window.innerWidth <= 1024;
    const shouldLock = (isMobileView && isSidebarOpen) || showDeleteModal || showLogoutModal;
    if (shouldLock) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isSidebarOpen, showDeleteModal, showLogoutModal]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(true);
      } else {
        // Only auto-close if it was open and we just crossed the threshold
        if (window.innerWidth <= 1024 && !isMobile) {
          setIsSidebarOpen(false);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const supplierMenu: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'My Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'partnerships', label: 'Reseller Partnerships', icon: Handshake },
  ];

  const supplierFooterMenu: MenuItem[] = [
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'logistics', label: 'Logistics', icon: Truck },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const fetchProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      console.log('Fetching products...');
      const data = await productService.getMyProducts();
      console.log('Products fetched:', data);
      const productList = data.products || data.data?.products || data || [];
      setProducts(Array.isArray(productList) ? productList : []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err?.message || 'Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
      await fetchProducts();
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

  const handleFormSuccess = async () => {
    await fetchProducts();
    setActiveView('inventory');
    setEditingProduct(null);
  };

  const handleRefresh = () => {
    fetchProducts(true);
  };

  const renderProductListing = (productList: any[]) => {
    if (isMobile) {
      return (
        <ProductGrid 
          products={productList} 
          loading={loading} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          onAdd={() => setActiveView('add-product')}
        />
      );
    }
    return (
      <ProductTable 
        products={productList} 
        loading={loading} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        onAdd={() => setActiveView('add-product')}
      />
    );
  };

  return (
    <div className={`${styles.dashboardContainer} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
      <Sidebar
        title="Supplier Hub"
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

      <header className={styles.mobileHeader}>
        <button 
          className={styles.menuToggle} 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <div className={styles.mobileTitle}>Supplier Center</div>
      </header>

      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div className={styles.mobileOverlay} onClick={() => setIsSidebarOpen(false)} />
      )}

      <main className={`${styles.mainContent} ${activeView === 'chat' ? styles.noPadding : ''}`}>
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={handleRefresh}>Retry</button>
          </div>
        )}

        {activeView === 'overview' && (
          <SupplierOverview 
            profile={profile}
            products={products}
            isTrusted={isTrusted}
            handleRefresh={handleRefresh}
            setActiveView={setActiveView}
            renderProductListing={renderProductListing}
          />
        )}
        
        {activeView === 'inventory' && (
          <SupplierInventory 
            products={products}
            handleRefresh={handleRefresh}
            renderProductListing={renderProductListing}
          />
        )}

        {activeView === 'orders' && (
          <PlaceholderView
            title="Orders Management"
            icon={ShoppingBag}
            description="Track and manage all your customer and reseller orders in one place."
          />
        )}

        {activeView === 'quotations' && (
          <PlaceholderView
            title="Quotations Management"
            icon={FileText}
            description="Track and manage price quotations from potential buyers in one place."
          />
        )}

        {activeView === 'chat' && (
          <div style={{ height: '100vh', width: '100%' }}>
            <ChatInbox />
          </div>
        )}

        {activeView === 'logistics' && (
          <PlaceholderView
            title="Logistics Tracking"
            icon={Truck}
            description="Manage your shipments and track delivery status for all your bulk orders."
          />
        )}

        {activeView === 'partnerships' && <SupplierPartnerships />}

        {activeView === 'settings' && <SupplierSettings profile={profile} />}
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