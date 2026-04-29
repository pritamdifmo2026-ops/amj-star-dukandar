import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Handshake, Store, MapPin } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
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
      alert(`Request ${action.toLowerCase()} successfully`);
      setModalType(null);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchData(); // Refresh lists
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to respond');
    }
  };

  const openModal = (req: any, type: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(req);
    setModalType(type);
    setRejectionReason('');
  };

  if (loading) {
    return <div className={styles.loading}>Loading partnerships...</div>;
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'requests' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          New Requests 
          {pendingRequests.length > 0 && <span className={styles.badge}>{pendingRequests.length}</span>}
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'partners' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('partners')}
        >
          My Reseller Partners
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className={styles.list}>
          {pendingRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <Handshake size={48} />
              <h3>No pending requests</h3>
              <p>You have no new requests from resellers at the moment.</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req._id} className={styles.requestCard}>
                <div className={styles.productInfo}>
                  {req.product?.images?.[0] ? (
                    <img src={req.product.images[0]} alt={req.product.name} className={styles.productImg} />
                  ) : (
                    <div className={styles.productPlaceholder}>IMG</div>
                  )}
                  <div>
                    <h4>{req.product?.name}</h4>
                    <span className={styles.price}>₹{req.product?.basePrice}</span>
                  </div>
                </div>

                <div className={styles.resellerInfo}>
                  <div className={styles.infoRow}><Store size={14}/> <strong>{req.reseller?.storeName}</strong> ({req.reseller?.profileType})</div>
                  <div className={styles.infoRow}><MapPin size={14}/> {req.reseller?.city}, {req.reseller?.state}</div>
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
              <Store size={48} />
              <h3>No active partners</h3>
              <p>Approve requests to build your reseller network.</p>
            </div>
          ) : (
            partners.map(partner => (
              <div key={partner._id} className={styles.partnerCard}>
                <div className={styles.partnerHeader}>
                  <div className={styles.storeName}><Store size={18}/> {partner.reseller?.storeName}</div>
                  <span className={styles.approvedDate}>Approved on {new Date(partner.respondedAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.partnerDetails}>
                  <p><strong>Contact:</strong> {partner.reseller?.user?.name} ({partner.reseller?.user?.phone})</p>
                  <p><strong>Location:</strong> {partner.reseller?.city}, {partner.reseller?.state}</p>
                  <p><strong>Approved Product:</strong> {partner.product?.name}</p>
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
          title="Approve Partnership Request"
        >
          <div className={styles.modalContent}>
            <p>You are approving <strong>{selectedRequest.reseller?.storeName}</strong> to sell <strong>{selectedRequest.product?.name}</strong>.</p>
            
            <div className={styles.modalSupplierDetails}>
              <h4>Reseller Details</h4>
              <p><strong>Business Name:</strong> {selectedRequest.reseller?.storeName}</p>
              <p><strong>Contact Name:</strong> {selectedRequest.reseller?.user?.name || selectedRequest.reseller?.fullName || 'N/A'}</p>
              <p><strong>Phone:</strong> {selectedRequest.reseller?.user?.phone || 'N/A'}</p>
              <p><strong>Email:</strong> {selectedRequest.reseller?.user?.email || selectedRequest.reseller?.email || 'N/A'}</p>
            </div>

            <div className={styles.modalActions}>
              <a 
                href={`tel:${selectedRequest.reseller?.user?.phone}`} 
                className={`${styles.modalBtn} ${styles.callBtn}`}
              >
                Call Reseller
              </a>
              <Button onClick={() => handleRespond(selectedRequest._id, 'APPROVED')} className={styles.modalBtn}>
                Confirm Approve
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {modalType === 'REJECT' && selectedRequest && (
        <Modal 
          isOpen={true} 
          onClose={() => setModalType(null)} 
          title="Reject Partnership Request"
        >
          <div className={styles.modalContent}>
            <p>You are rejecting the request from <strong>{selectedRequest.reseller?.storeName}</strong>.</p>
            
            <div className={styles.reasonInput}>
              <label>Reason for rejection (optional, will be visible to reseller)</label>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please contact us to negotiate pricing before approval."
                rows={4}
                className={styles.textarea}
              />
            </div>

            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setModalType(null)} className={styles.modalBtn}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleRespond(selectedRequest._id, 'REJECTED', rejectionReason)} 
                className={`${styles.modalBtn} ${styles.rejectConfirmBtn}`}
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SupplierPartnerships;
