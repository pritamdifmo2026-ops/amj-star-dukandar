import React, { useState, useEffect } from 'react';
import adminService from '../services/admin.service';
import type { AdminStats } from '../services/admin.service';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';
import { useNavigate, Link } from 'react-router-dom';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { ROUTES } from '@/shared/constants/routes';
import styles from './AdminDashboard.module.css';
import {
  Users,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Power,
  BarChart3,
  Package,
  Tags,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'suppliers' | 'users' | 'products' | 'categories'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCategory, setNewCategory] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Search & Pagination States
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierPage, setSupplierPage] = useState(1);
  const SUPPLIERS_PER_PAGE = 5;


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
        const data = await adminService.getPendingProducts();
        setPendingProducts(data);
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

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await adminService.verifySupplier(id, status);
      setAllSuppliers(prev => prev.map(s => s._id === id ? { ...s, kycStatus: status, verifiedByAdmin: status === 'VERIFIED' } : s));
      alert(`Supplier ${status.toLowerCase()} successfully`);
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleVerifyProduct = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await adminService.verifyProduct(id, status);
      setPendingProducts(prev => prev.filter(p => p._id !== id));
      alert(`Product ${status.toLowerCase()} successfully`);
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await adminService.toggleUserStatus(id, !currentStatus);
      setAllUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/admin/login');
    setShowLogoutModal(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setCategoryLoading(true);
    try {
      const { categoryService } = await import('@/features/product/services/category.service');
      await categoryService.create(newCategory);
      setNewCategory('');
      const data = await categoryService.getAll();
      setCategories(data.categories);
    } catch (err) {
      alert('Failed to add category');
    } finally {
      setCategoryLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Link to={ROUTES.HOME} className={styles.logo}>
          <ShieldCheck />
          <span>AMJ Admin</span>
        </Link>
        <nav className={styles.nav}>
          <button
            className={activeTab === 'stats' ? styles.active : ''}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 size={20} /> Overview
          </button>
          <button
            className={activeTab === 'suppliers' ? styles.active : ''}
            onClick={() => setActiveTab('suppliers')}
          >
            <Clock size={20} /> Pending Suppliers
          </button>
          <button
            className={activeTab === 'users' ? styles.active : ''}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} /> User Management
          </button>
          <button
            className={activeTab === 'products' ? styles.active : ''}
            onClick={() => setActiveTab('products')}
          >
            <Package size={20} /> Product Queue
          </button>
          <button
            className={activeTab === 'categories' ? styles.active : ''}
            onClick={() => setActiveTab('categories')}
          >
            <Tags size={20} /> Categories
          </button>

          <button className={styles.logoutBtn} onClick={() => setShowLogoutModal(true)}>
            <Power size={20} /> Sign Out
          </button>
        </nav>
      </aside>

      <main className={styles.content}>
        <header className={styles.header}>
          <h2>{activeTab === 'stats' ? 'Platform Overview' : activeTab === 'suppliers' ? 'Supplier Verifications' : 'System Users'}</h2>

          {activeTab === 'suppliers' && (
            <div className={styles.searchBar}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name, company or phone..."
                value={supplierSearch}
                onChange={(e) => { setSupplierSearch(e.target.value); setSupplierPage(1); }}
              />
            </div>
          )}
        </header>

        {loading ? (
          <div className={styles.loader}>Loading...</div>
        ) : (
          <div className={styles.view}>
            {activeTab === 'stats' && stats && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <Users />
                  <div>
                    <h3>Total Users</h3>
                    <p>{stats.totalUsers}</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Store />
                  <div>
                    <h3>Total Suppliers</h3>
                    <p>{stats.totalSuppliers}</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Clock />
                  <div>
                    <h3>Pending KYC</h3>
                    <p>{stats.pendingVerifications}</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Package />
                  <div>
                    <h3>Pending Products</h3>
                    <p>{stats.pendingProducts}</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <CheckCircle />
                  <div>
                    <h3>Active Users</h3>
                    <p>{stats.activeUsers}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'suppliers' && (() => {
              const filteredSuppliers = allSuppliers.filter(s =>
                s.businessName?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                s.businessDetails?.ownerName?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                s.phone?.includes(supplierSearch)
              );

              const totalPages = Math.ceil(filteredSuppliers.length / SUPPLIERS_PER_PAGE);
              const paginatedSuppliers = filteredSuppliers.slice(
                (supplierPage - 1) * SUPPLIERS_PER_PAGE,
                supplierPage * SUPPLIERS_PER_PAGE
              );

              return (
                <>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Business Name</th>
                          <th>Owner</th>
                          <th>Contact</th>
                          <th>Status</th>
                          <th>Tier</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSuppliers.map(s => (
                          <tr key={s._id}>
                            <td>{s.businessName}</td>
                            <td>{s.businessDetails?.ownerName || s.userId?.name || 'N/A'}</td>
                            <td>{s.phone}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${s.kycStatus === 'VERIFIED' ? styles.statusVerified : styles.statusPending}`}>
                                {s.kycStatus}
                              </span>
                            </td>
                            <td><span className={styles.badge}>{s.tier}</span></td>
                            <td className={styles.actions}>
                              <button
                                onClick={() => { setSelectedSupplier(s); setShowInfoModal(true); }}
                                className={styles.viewTextBtn}
                              >
                                View
                              </button>

                              {s.kycStatus === 'PENDING' && (
                                <>
                                  <button onClick={() => handleVerify(s._id, 'VERIFIED')} className={styles.approveBtn} title="Verify">
                                    <CheckCircle size={18} />
                                  </button>
                                  <button onClick={() => handleVerify(s._id, 'REJECTED')} className={styles.rejectBtn} title="Reject">
                                    <XCircle size={18} />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredSuppliers.length === 0 && (
                          <tr><td colSpan={6} className={styles.empty}>No suppliers found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      <button
                        disabled={supplierPage === 1}
                        onClick={() => setSupplierPage(p => p - 1)}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span>Page {supplierPage} of {totalPages}</span>
                      <button
                        disabled={supplierPage === totalPages}
                        onClick={() => setSupplierPage(p => p + 1)}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              );
            })()}

            {activeTab === 'products' && (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Supplier</th>
                      <th>Price</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProducts.map(p => (
                      <tr key={p._id}>
                        <td>{p.name}</td>
                        <td>{p.supplierId?.businessName}</td>
                        <td>₹{p.basePrice}</td>
                        <td>{p.category}</td>
                        <td className={styles.actions}>
                          <button onClick={() => handleVerifyProduct(p._id, 'APPROVED')} className={styles.approveBtn}>
                            <CheckCircle size={18} />
                          </button>
                          <button onClick={() => handleVerifyProduct(p._id, 'REJECTED')} className={styles.rejectBtn}>
                            <XCircle size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingProducts.length === 0 && (
                      <tr><td colSpan={5} className={styles.empty}>No pending products</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className={styles.categoryView}>
                <form onSubmit={handleAddCategory} className={styles.categoryForm}>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category name (e.g. Textiles)"
                    required
                  />
                  <Button type="submit" disabled={categoryLoading}>
                    {categoryLoading ? 'Adding...' : 'Add Category'}
                  </Button>
                </form>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Slug</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c._id}>
                          <td>{c.name}</td>
                          <td>{c.slug}</td>
                          <td><span className={styles.badge}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td>
                            <button className={styles.rejectBtn}>
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u._id}>
                        <td>{u.name || 'N/A'}</td>
                        <td>{u.phone}</td>
                        <td><span className={styles.roleBadge}>{u.role}</span></td>
                        <td>
                          <span className={u.isActive ? styles.statusActive : styles.statusInactive}>
                            {u.isActive ? 'Active' : 'Banned'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleStatus(u._id, u.isActive)}
                            className={u.isActive ? styles.banBtn : styles.unbanBtn}
                          >
                            <Power size={18} /> {u.isActive ? 'Ban' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Supplier Full Information"
        footer={<Button onClick={() => setShowInfoModal(false)}>Close</Button>}
      >
        {selectedSupplier && (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Business Name</label>
              <p>{selectedSupplier.businessName}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Owner Name</label>
              <p>{selectedSupplier.businessDetails?.ownerName || 'N/A'}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Contact Phone</label>
              <p>{selectedSupplier.phone}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Email Address</label>
              <p>{selectedSupplier.businessDetails?.email || selectedSupplier.userId?.email || 'N/A'}</p>
            </div>
            <div className={styles.infoItem}>
              <label>GST Number</label>
              <p>{selectedSupplier.businessDetails?.gstin || 'N/A'}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Established</label>
              <p>{selectedSupplier.businessDetails?.yearOfEstablishment || 'N/A'}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Plan Selected</label>
              <p><span className={styles.badge}>{selectedSupplier.tier}</span></p>
            </div>
            <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
              <label>Full Address</label>
              <p>
                {selectedSupplier.businessDetails?.address}, {selectedSupplier.businessDetails?.city}, {selectedSupplier.businessDetails?.state} - {selectedSupplier.businessDetails?.pinCode}
              </p>
            </div>
            <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
              <label>About Company</label>
              <p>{selectedSupplier.businessDetails?.about || 'No description provided'}</p>
            </div>
            {selectedSupplier.businessDetails?.isWomenEntrepreneur && (
              <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
                <div className={styles.womenBadgeAdmin}>
                  <ShieldCheck size={16} /> Registered as Woman-led Business
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
