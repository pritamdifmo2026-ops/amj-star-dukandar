import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Handshake, Store, MapPin, Phone, Mail, Package } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import toast from 'react-hot-toast';
import supplierService from '../services/supplier.service';
import styles from './SupplierPartnerships.module.css';

const SupplierPartnerships: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'partners'>('requests');

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, partnersRes] = await Promise.all([
        supplierService.getPartnershipRequests(),
        supplierService.getPartners()
      ]);
      setRequests(requestsRes.requests || []);
      setPartners(partnersRes.partners || []);
    } catch (error) {
      console.error('Failed to fetch partnership data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: string, action: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      await supplierService.respondToRequest(id, action, reason);
      toast.success(`Request ${action.toLowerCase()} successfully`);
      setModalType(null);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchData(); // Refresh lists
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to respond');
    }
  };

  const openModal = (req: any, type: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(req);
    setModalType(type);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loader}></div>
        <p>Loading your reseller network...</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'requests' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Partnership Requests 
          {pendingRequests.length > 0 && <span className={styles.badge}>{pendingRequests.length}</span>}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'partners' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('partners')}
        >
          My Reseller Network
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className={styles.list}>
          {pendingRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><Handshake size={40} /></div>
              <h3>No Pending Requests</h3>
              <p>When resellers request to partner with you, they'll appear here for your review.</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req._id} className={styles.requestCard}>
                <div className={styles.productInfo}>
                  {req.product?.images?.[0] ? (
                    <img src={req.product.images[0]} alt={req.product.name} className={styles.productImg} />
                  ) : (
                    <div className={styles.productPlaceholder}><Package size={20} /></div>
                  )}
                  <div className={styles.productText}>
                    <h4>{req.product?.name}</h4>
                    <span className={styles.price}>₹{req.product?.basePrice?.toLocaleString()}</span>
                  </div>
                </div>

                <div className={styles.resellerInfo}>
                  <div className={styles.infoRow}>
                    <Store size={16}/> 
                    <strong>{req.reseller?.storeName}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <MapPin size={16}/> 
                    <span>{req.reseller?.city}, {req.reseller?.state}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <Button variant="outline" className={styles.rejectBtn} onClick={() => openModal(req, 'REJECT')}>
                    <XCircle size={16} /> Reject
                  </Button>
                  <Button className={styles.approveBtn} onClick={() => openModal(req, 'APPROVE')}>
                    <CheckCircle size={16} /> Review & Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'partners' && (
        <div className={styles.list}>
          {partners.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><Store size={40} /></div>
              <h3>No Reseller Partners Yet</h3>
              <p>Accept requests from the 'Requests' tab to start building your distribution network.</p>
            </div>
          ) : (
            partners.map(partner => (
              <div key={partner._id} className={styles.partnerCard}>
                <div className={styles.partnerHeader}>
                  <div className={styles.storeName}><Store size={20}/> {partner.reseller?.storeName}</div>
                  <span className={styles.approvedDate}>Active Partner Since {new Date(partner.respondedAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.partnerDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Reseller Name</span>
                    <span className={styles.detailValue}>{partner.reseller?.user?.name || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Location</span>
                    <span className={styles.detailValue}>{partner.reseller?.city}, {partner.reseller?.state}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Authorized Product</span>
                    <span className={styles.detailValue}>{partner.product?.name}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modalType === 'APPROVE' && selectedRequest && (
        <Modal 
          isOpen={true} 
          onClose={() => setModalType(null)} 
          title="Approve Partnership"
        >
          <div className={styles.modalContent}>
            <p className={styles.modalNotice}>
              You are authorizing <strong>{selectedRequest.reseller?.storeName}</strong> to list and sell <strong>{selectedRequest.product?.name}</strong> on their storefront.
            </p>
            
            <div className={styles.modalDetails}>
              <h4>Partner Profile</h4>
              <div className={styles.modalGrid}>
                <div className={styles.modalField}>
                  <label>Business</label>
                  <span>{selectedRequest.reseller?.storeName}</span>
                </div>
                <div className={styles.modalField}>
                  <label>Contact</label>
                  <span>{selectedRequest.reseller?.user?.name || 'N/A'}</span>
                </div>
                <div className={styles.modalField}>
                  <label><Phone size={10} style={{marginRight: 4}} /> Phone</label>
                  <span>{selectedRequest.reseller?.user?.phone || 'N/A'}</span>
                </div>
                <div className={styles.modalField}>
                  <label><Mail size={10} style={{marginRight: 4}} /> Email</label>
                  <span>{selectedRequest.reseller?.user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <a 
                href={`tel:${selectedRequest.reseller?.user?.phone}`} 
                className={`${styles.modalBtn} ${styles.callBtn}`}
              >
                <Phone size={16} style={{marginRight: 8}} /> Call Reseller
              </a>
              <Button onClick={() => handleRespond(selectedRequest._id, 'APPROVED')} className={styles.modalBtn}>
                Confirm Partnership
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {modalType === 'REJECT' && selectedRequest && (
        <Modal 
          isOpen={true} 
          onClose={() => setModalType(null)} 
          title="Decline Partnership"
        >
          <div className={styles.modalContent}>
            <p className={styles.modalNotice}>
              Declining the request from <strong>{selectedRequest.reseller?.storeName}</strong>. You can provide a reason below.
            </p>
            
            <div className={styles.reasonGroup}>
              <label>Rejection Note (Optional)</label>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. We require a higher MOQ for this product. Please contact us to discuss."
                rows={4}
                className={styles.textarea}
              />
            </div>

            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setModalType(null)} className={styles.modalBtn}>
                Keep Pending
              </Button>
              <Button 
                onClick={() => handleRespond(selectedRequest._id, 'REJECTED', rejectionReason)} 
                className={`${styles.modalBtn} ${styles.rejectConfirmBtn}`}
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SupplierPartnerships;
