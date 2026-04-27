import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ShieldCheck, ChevronLeft, ChevronRight, Search, Package, ExternalLink } from 'lucide-react';
import styles from '../pages/AdminDashboard.module.css';
import adminService from '../services/admin.service';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';

interface SupplierVerificationProps {
  suppliers: any[];
  onVerify: (id: string, status: 'VERIFIED' | 'REJECTED') => Promise<void>;
}

interface SupplierTableProps {
  title: string;
  suppliers: any[];
  onVerify: (id: string, status: 'VERIFIED' | 'REJECTED') => Promise<void>;
  onView: (supplierId: string) => void;
  showActions?: boolean;
}

const SupplierTable: React.FC<SupplierTableProps> = ({ title, suppliers, onVerify, onView, showActions }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = suppliers.filter(s =>
    s.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    s.businessDetails?.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeaderRow}>
        <h3 className={styles.tableTitle}>{title} ({filtered.length})</h3>
        <div className={styles.tableSearch}>
          <Search size={16} />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

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
            {paginated.map(s => (
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
                  <button onClick={() => onView(s._id)} className={styles.viewTextBtn}>View</button>
                  {showActions && s.kycStatus === 'PENDING' && (
                    <>
                      <button onClick={() => onVerify(s._id, 'VERIFIED')} className={styles.approveBtn} title="Verify">
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => onVerify(s._id, 'REJECTED')}
                        className={styles.rejectBtn}
                        title="Reject"
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className={styles.empty}>No {title.toLowerCase()} found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={18} />
          </button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

const SupplierProducts: React.FC<{ supplierId: string; businessName: string; onBack: () => void }> = ({ supplierId, businessName, onBack }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; productId: string; name: string } | null>(null);

  const fetchProducts = async () => {
    try {
      const data = await adminService.getSupplierProducts(supplierId);
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch supplier products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [supplierId]);

  const handleApprove = async () => {
    if (!confirmModal) return;
    try {
      await adminService.verifyProduct(confirmModal.productId, 'APPROVED');
      setConfirmModal(null);
      fetchProducts();
    } catch (err) {
      alert('Failed to approve product');
    }
  };

  return (
    <div className={styles.detailPage}>
      <div className={styles.detailHeader}>
        <button onClick={onBack} className={styles.backLink}>
          <ChevronLeft size={20} /> Back to Profile
        </button>
        <h2 className={styles.tableTitle} style={{ fontSize: '16px' }}>Products by {businessName}</h2>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading products...</div>
      ) : (
        <div className={styles.tableSection}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />}
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>₹{p.basePrice}/{p.unit}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${p.status === 'APPROVED' ? styles.statusVerified : styles.statusPending}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      {p.status === 'PENDING' && (
                        <button onClick={() => setConfirmModal({ isOpen: true, productId: p._id, name: p.name })} className={styles.approveBtn} title="Approve">
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {p.status === 'APPROVED' && (
                        <a href={`/products/${p._id}`} target="_blank" rel="noreferrer" className={styles.viewTextBtn} title="View on website">
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={5} className={styles.empty}>No products found for this supplier</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmModal && (
        <Modal 
          isOpen={confirmModal.isOpen} 
          onClose={() => setConfirmModal(null)}
          title="Verify Product"
        >
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: '#f0fdf4', 
              color: '#16a34a', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px' 
            }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>Verify this product?</h3>
            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.5', fontSize: '14px' }}>
              Do you want to verify this product? This will make the product <strong>{confirmModal.name}</strong> live on the website.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button onClick={handleApprove}>Confirm & Publish</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const SupplierVerification: React.FC<SupplierVerificationProps> = ({ suppliers, onVerify }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'suppliers';
  const supplierId = searchParams.get('id');

  const selectedSupplier = suppliers.find(s => s._id === supplierId);

  const pendingSuppliers = suppliers.filter(s => s.kycStatus === 'PENDING');
  const verifiedSuppliers = suppliers.filter(s => s.kycStatus === 'VERIFIED');

  if (activeTab === 'supplier-products' && selectedSupplier) {
    return (
      <SupplierProducts 
        supplierId={selectedSupplier._id} 
        businessName={selectedSupplier.businessName} 
        onBack={() => setSearchParams({ tab: 'supplier-detail', id: selectedSupplier._id })} 
      />
    );
  }

  if (activeTab === 'supplier-detail' && selectedSupplier) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.detailHeader}>
          <button onClick={() => setSearchParams({ tab: 'suppliers' })} className={styles.backLink}>
            <ChevronLeft size={20} /> Back to List
          </button>
          <div className={styles.headerActions}>
            {selectedSupplier.kycStatus === 'VERIFIED' && (
              <button 
                onClick={() => setSearchParams({ tab: 'supplier-products', id: selectedSupplier._id })} 
                className={styles.viewProductsBtn}
              >
                <Package size={18} /> View Products
              </button>
            )}
            
            {selectedSupplier.kycStatus === 'PENDING' && (
              <>
                <button
                  className={styles.largeRejectBtn}
                  onClick={() => onVerify(selectedSupplier._id, 'REJECTED')}
                >
                  <XCircle size={18} /> Reject
                </button>
                <button
                  className={styles.verifyBtn}
                  onClick={() => onVerify(selectedSupplier._id, 'VERIFIED')}
                >
                  <CheckCircle size={18} /> Verify Supplier
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.detailCard}>
          <div className={styles.detailSection}>
            <div className={styles.sectionHeader}>
              <ShieldCheck size={20} />
              <h3>Business Verification Profile</h3>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <label>Business Name</label>
                <p>{selectedSupplier.businessName}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Owner Name</label>
                <p>{selectedSupplier.businessDetails?.ownerName || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Contact Phone</label>
                <p>{selectedSupplier.phone}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Email Address</label>
                <p>{selectedSupplier.businessDetails?.email || selectedSupplier.userId?.email || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>GST Number</label>
                <p>{selectedSupplier.businessDetails?.gstin || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Established</label>
                <p>{selectedSupplier.businessDetails?.yearOfEstablishment || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Tier</label>
                <span className={`${styles.badge} ${styles[selectedSupplier.tier]}`}>{selectedSupplier.tier}</span>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h3>Location & About</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                <label>Full Address</label>
                <p>
                  {selectedSupplier.businessDetails?.address}, {selectedSupplier.businessDetails?.city},
                  {selectedSupplier.businessDetails?.state} - {selectedSupplier.businessDetails?.pinCode}
                </p>
              </div>
              <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                <label>About Company</label>
                <p className={styles.aboutText}>{selectedSupplier.businessDetails?.about || 'No description provided'}</p>
              </div>
            </div>
          </div>

          {selectedSupplier.businessDetails?.isFoodSupplier && (
            <div className={styles.detailSection} style={{ border: '2px solid #ffedd5', background: '#fffaf5' }}>
              <h3 style={{ color: '#ea580c' }}>🍴 FSSAI Compliance</h3>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <label>FSSAI License Number</label>
                  <p className={styles.fssaiNumber}>{selectedSupplier.businessDetails.fssaiLicenseNumber}</p>
                </div>
                <div className={styles.detailItem}>
                  <label>Verification Document</label>
                  {selectedSupplier.businessDetails.fssaiCertificate ? (
                    <a
                      href={selectedSupplier.businessDetails.fssaiCertificate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.docLink}
                    >
                      <ShieldCheck size={18} /> View FSSAI Certificate
                    </a>
                  ) : (
                    <p style={{ color: '#ef4444' }}>Document not uploaded</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedSupplier.businessDetails?.isWomenEntrepreneur && (
            <div className={styles.detailSection}>
              <div className={styles.womenBadgeAdmin}>
                <ShieldCheck size={16} /> Registered as Woman-led Business
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.verificationContainer}>
      <SupplierTable
        title="Pending Suppliers"
        suppliers={pendingSuppliers}
        onVerify={onVerify}
        onView={(id) => setSearchParams({ tab: 'supplier-detail', id })}
        showActions
      />

      <div style={{ margin: '40px 0', borderTop: '2px solid #e2e8f0' }} />

      <SupplierTable
        title="Approved Suppliers"
        suppliers={verifiedSuppliers}
        onVerify={onVerify}
        onView={(id) => setSearchParams({ tab: 'supplier-detail', id })}
      />
    </div>
  );
};

export default SupplierVerification;
