import React, { useState } from 'react';
import { CheckCircle, XCircle, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import styles from '../pages/AdminDashboard.module.css';

interface SupplierVerificationProps {
  suppliers: any[];
  onVerify: (id: string, status: 'VERIFIED' | 'REJECTED') => Promise<void>;
  searchQuery: string;
}

const SupplierVerification: React.FC<SupplierVerificationProps> = ({ suppliers, onVerify, searchQuery }) => {
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filteredSuppliers = suppliers.filter(s =>
    s.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.businessDetails?.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);
  const paginatedSuppliers = filteredSuppliers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
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
                      <button onClick={() => onVerify(s._id, 'VERIFIED')} className={styles.approveBtn} title="Verify">
                        <CheckCircle size={18} />
                      </button>
                      <button onClick={() => onVerify(s._id, 'REJECTED')} className={styles.rejectBtn} title="Reject">
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
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={18} />
          </button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

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
    </>
  );
};

export default SupplierVerification;
