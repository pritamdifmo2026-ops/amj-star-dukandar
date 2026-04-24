import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/store/slices/auth.slice';
import productService from '@/features/product/services/product.service';
import Button from '@/shared/components/ui/Button';
import { LayoutDashboard, Package, MessageSquare, Truck, Plus, CheckCircle, Clock, AlertCircle, Menu, ChevronLeft, LogOut, X } from 'lucide-react';
import AddProductModal from '../components/AddProductModal';
import Modal from '@/shared/components/ui/Modal';
import styles from './SupplierDashboard.module.css';

const SupplierDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { profile } = useAppSelector(state => state.supplier);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'inventory'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: '#2563eb' },
    { label: 'Live', value: products.filter(p => p.status === 'APPROVED').length, icon: CheckCircle, color: '#059669' },
    { label: 'Pending', value: products.filter(p => p.status === 'PENDING').length, icon: Clock, color: '#d97706' },
    { label: 'Rejected', value: products.filter(p => p.status === 'REJECTED').length, icon: AlertCircle, color: '#dc2626' },
  ];

  const handleComingSoon = (feature: string) => {
    alert(`${feature} is coming soon! We are working to bring this feature to you.`);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    window.location.href = '/';
  };

  return (
    <div className={`${styles.dashboardContainer} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <LayoutDashboard size={20} />
            <span>Supplier Center</span>
          </div>
          <button className={styles.toggleBtn} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={activeView === 'overview' ? styles.active : ''}
            onClick={() => setActiveView('overview')}
          >
            <LayoutDashboard size={18} /> Overview
          </button>
          <button
            className={activeView === 'inventory' ? styles.active : ''}
            onClick={() => setActiveView('inventory')}
          >
            <Package size={18} /> My Inventory
          </button>

          <div className={styles.navDivider}>Future Features</div>

          <button className={styles.disabledLink} onClick={() => handleComingSoon('Quotation System')}>
            <MessageSquare size={18} /> Quotations
          </button>
          <button className={styles.disabledLink} onClick={() => handleComingSoon('Customer Chat')}>
            <MessageSquare size={18} /> Chat
          </button>
          <button className={styles.disabledLink} onClick={() => handleComingSoon('Logistics Integration')}>
            <Truck size={18} /> Logistics
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1>Welcome back, {profile?.businessName}</h1>
            <p>Manage your products and orders from your command center.</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className={styles.addBtn}>
            <Plus size={20} /> Add New Product
          </Button>
        </header>

        <div className={styles.statsGrid}>
          {stats.map(stat => (
            <div key={stat.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Recent Products</h2>
            <button className={styles.viewAll} onClick={() => setActiveView('inventory')}>View All</button>
          </div>
          <div className={styles.productTableWrapper}>
            {loading ? (
              <p>Loading products...</p>
            ) : products.length > 0 ? (
              <table className={styles.productTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>MOQ</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 5).map(product => (
                    <tr key={product._id}>
                      <td>
                        <div className={styles.productCell}>
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className={styles.productThumbnail} />
                          ) : (
                            <div className={styles.productImgPlaceholder} />
                          )}
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td>₹{product.basePrice}</td>
                      <td>{product.moq} {product.unit}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[product.status.toLowerCase()]}`}>
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyProducts}>
                <Package size={48} />
                <p>No products added yet.</p>
                <Button variant="outline" onClick={() => setShowAddModal(true)}>Add your first product</Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <AddProductModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchProducts}
      />

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Confirm Logout">
        <div className={styles.logoutModalContent}>
          <div className={styles.logoutIcon}>
            <LogOut size={32} />
          </div>
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
