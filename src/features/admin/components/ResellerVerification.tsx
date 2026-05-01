import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ShieldCheck, ChevronLeft, Search, ExternalLink } from 'lucide-react';
import styles from '../pages/AdminDashboard.module.css';
import Pagination from '@/shared/components/ui/Pagination';

interface ResellerVerificationProps {
  resellers: any[];
  onVerify: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
}

interface ResellerTableProps {
  title: string;
  resellers: any[];
  onVerify: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  onView: (resellerId: string) => void;
  showActions?: boolean;
}

const ResellerTable: React.FC<ResellerTableProps> = ({ title, resellers, onVerify, onView, showActions }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = resellers.filter(r =>
    r.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search)
  );

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
              <th>Store Name</th>
              <th>Reseller Name</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Reach</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(r => (
              <tr key={r._id}>
                <td data-label="Store Name">{r.storeName}</td>
                <td data-label="Reseller Name">{r.fullName || r.user?.name || 'N/A'}</td>
                <td data-label="Contact">{r.phone || r.user?.phone || r.user?.email || 'N/A'}</td>
                <td data-label="Status">
                  <span className={`${styles.statusBadge} ${r.status === 'APPROVED' ? styles.statusVerified : r.status === 'REJECTED' ? styles.statusRejected : styles.statusPending}`}>
                    {r.status}
                  </span>
                </td>
                <td data-label="Plan"><span className={styles.badge} style={{ background: '#f0f9ff', color: '#0369a1' }}>{r.subscriptionPlan || 'Starter'}</span></td>
                <td data-label="Reach"><span className={styles.badge}>{r.reach}</span></td>
                <td data-label="Actions" className={styles.actions}>
                  <button onClick={() => onView(r._id)} className={styles.viewTextBtn}>View</button>
                  {showActions && r.status === 'PENDING' && (
                    <>
                      <button onClick={() => onVerify(r._id, 'APPROVED')} className={styles.approveBtn} title="Approve">
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => onVerify(r._id, 'REJECTED')}
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

      <Pagination 
        totalItems={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={page}
        onPageChange={setPage}
        styles={styles}
      />
    </div>
  );
};

const ResellerVerification: React.FC<ResellerVerificationProps> = ({ resellers, onVerify }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'resellers';
  const resellerId = searchParams.get('id');

  const selectedReseller = resellers.find(r => r._id === resellerId);

  const pendingResellers = resellers.filter(r => r.status === 'PENDING');
  const approvedResellers = resellers.filter(r => r.status === 'APPROVED');

  if (activeTab === 'reseller-detail' && selectedReseller) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.detailHeader}>
          <button onClick={() => setSearchParams({ tab: 'resellers' })} className={styles.backLink}>
            <ChevronLeft size={20} /> Back to List
          </button>
          <div className={styles.headerActions}>
            {selectedReseller.status === 'PENDING' && (
              <>
                <button
                  className={styles.largeRejectBtn}
                  onClick={() => onVerify(selectedReseller._id, 'REJECTED')}
                >
                  <XCircle size={18} /> Reject Application
                </button>
                <button
                  className={styles.verifyBtn}
                  onClick={() => onVerify(selectedReseller._id, 'APPROVED')}
                >
                  <CheckCircle size={18} /> Approve Reseller
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.detailCard}>
          <div className={styles.detailSection}>
            <div className={styles.sectionHeader}>
              <ShieldCheck size={20} />
              <h3>Reseller Onboarding Profile</h3>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <label>Store Name</label>
                <p>{selectedReseller.storeName}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Full Name</label>
                <p>{selectedReseller.fullName || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Location</label>
                <p>{selectedReseller.city}, {selectedReseller.state}, {selectedReseller.country}</p>
              </div>
              <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                <label>Full Address</label>
                <p>{selectedReseller.address || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Contact Info</label>
                <p>
                  {selectedReseller.phone || selectedReseller.user?.phone || 'N/A'}
                  <br />
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    {selectedReseller.email || selectedReseller.user?.email || 'No email provided'}
                  </span>
                </p>
              </div>
              <div className={styles.detailItem}>
                <label>Profile Type</label>
                <p>{selectedReseller.profileType || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Experience</label>
                <p>{selectedReseller.experience || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Reach</label>
                <span className={styles.badge}>{selectedReseller.reach}</span>
              </div>
               <div className={styles.detailItem}>
                <label>Monthly Volume</label>
                <p>{selectedReseller.monthlyVolume || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Subscription Plan</label>
                <span className={styles.badge} style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #10b981' }}>
                  {selectedReseller.subscriptionPlan || 'Free Starter'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <label>Sales Experience</label>
                <p>{selectedReseller.experience} ({selectedReseller.soldBefore ? 'Has sold before' : 'New seller'})</p>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h3>Channels & Platforms</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                <label>Selling Platforms</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {selectedReseller.platforms?.map((p: string) => (
                    <span key={p} className={styles.badge} style={{ background: '#f1f5f9', color: '#475569' }}>{p}</span>
                  )) || 'None listed'}
                </div>
              </div>
              <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                <label>About Business</label>
                <p className={styles.aboutText}>{selectedReseller.profileDescription || 'No description provided'}</p>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h3>Bank & Tax Details</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                <label>Account Holder Name</label>
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedReseller.accountName || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Bank Name</label>
                <p>{selectedReseller.bankName || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Account Number</label>
                <p>{selectedReseller.accountNumber || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>IFSC Code</label>
                <p>{selectedReseller.ifscCode || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>GST Number</label>
                <p style={{ color: '#0f172a', fontWeight: 700 }}>{selectedReseller.gstNumber || 'N/A'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>PAN Number</label>
                <p>{selectedReseller.panNumber || 'N/A'}</p>
              </div>
              <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                <label>Verification Document</label>
                {selectedReseller.idProofUrl ? (
                  <a
                    href={selectedReseller.idProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.docLink}
                  >
                    <ExternalLink size={18} /> View ID Proof Document
                  </a>
                ) : (
                  <p style={{ color: '#ef4444' }}>Document not uploaded</p>
                )}
              </div>
            </div>
          </div>

          {selectedReseller.status === 'REJECTED' && (
            <div className={styles.detailSection} style={{ border: '2px solid #fee2e2', background: '#fffafb' }}>
              <h3 style={{ color: '#ef4444' }}>Rejection Reason</h3>
              <p style={{ color: '#7f1d1d', marginTop: '8px' }}>{selectedReseller.rejectionReason || 'No reason provided'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.verificationContainer}>
      <ResellerTable
        title="Pending Resellers"
        resellers={pendingResellers}
        onVerify={onVerify}
        onView={(id) => setSearchParams({ tab: 'reseller-detail', id })}
        showActions
      />

      <div style={{ margin: '40px 0', borderTop: '2px solid #e2e8f0' }} />

      <ResellerTable
        title="Approved Resellers"
        resellers={approvedResellers}
        onVerify={onVerify}
        onView={(id) => setSearchParams({ tab: 'reseller-detail', id })}
      />
    </div>
  );
};

export default ResellerVerification;
