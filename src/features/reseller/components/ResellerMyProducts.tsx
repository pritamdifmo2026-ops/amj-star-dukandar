import React, { useState, useEffect } from 'react';
import { Package, Building, Tag, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import resellerService from '../services/reseller.service';
import styles from './ResellerMyProducts.module.css';

const ResellerMyProducts: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const data = await resellerService.getRequests();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to fetch my products', err);
    } finally {
      setLoading(false);
    }
  };

  const approvedProducts = requests.filter(r => r.status === 'APPROVED');
  const pendingOrRejectedProducts = requests.filter(r => r.status === 'PENDING' || r.status === 'REJECTED');

  if (loading) {
    return <div className={styles.loading}>Loading your products...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>My Products</h2>
          <p>Manage the products you've requested and the ones approved for your storefront.</p>
        </div>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'approved' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Active in Storefront
          <span className={styles.badge}>{approvedProducts.length}</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'pending' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Requests & Status
          {pendingOrRejectedProducts.filter(p => p.status === 'PENDING').length > 0 && (
            <span className={styles.pendingBadge}>{pendingOrRejectedProducts.filter(p => p.status === 'PENDING').length}</span>
          )}
        </button>
      </div>

      {activeTab === 'approved' && (
        <div className={styles.grid}>
          {approvedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <Package size={48} />
              <h3>No approved products yet</h3>
              <p>Go to the Product Catalog to find products and send requests to suppliers.</p>
            </div>
          ) : (
            approvedProducts.map(req => (
              <div key={req._id} className={styles.card}>
                <div className={styles.imageContainer}>
                  {req.product?.images?.[0] ? (
                    <img src={req.product.images[0]} alt={req.product.name} />
                  ) : (
                    <div className={styles.placeholderImage}><Package size={40} /></div>
                  )}
                  <div className={styles.statusBadgeApproved}><CheckCircle size={12}/> Approved</div>
                </div>
                
                <div className={styles.cardContent}>
                  <h3 className={styles.productName}>{req.product?.name}</h3>
                  <div className={styles.priceRow}>
                    <span className={styles.label}>Base Price:</span>
                    <span className={styles.price}>₹{req.product?.basePrice}</span>
                  </div>
                  
                  <div className={styles.supplierDetails}>
                    <div className={styles.supplierInfoRow}>
                      <Building size={14} />
                      <span>{req.supplier?.businessName}</span>
                    </div>
                  </div>

                  <div className={styles.marginSection}>
                    <div className={styles.marginHeader}>
                      <Tag size={14} /> <span>Your Margin Setting</span>
                    </div>
                    <p className={styles.marginText}>Pricing logic will be added here in the future.</p>
                    <Button variant="outline" className={styles.marginBtn} disabled>
                      Set Selling Price
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className={styles.list}>
          {pendingOrRejectedProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <Clock size={48} />
              <h3>No pending requests</h3>
              <p>You haven't made any requests recently.</p>
            </div>
          ) : (
            pendingOrRejectedProducts.map(req => (
              <div key={req._id} className={styles.requestItem}>
                <div className={styles.reqProduct}>
                  {req.product?.images?.[0] ? (
                    <img src={req.product.images[0]} alt={req.product.name} className={styles.reqImg} />
                  ) : (
                    <div className={styles.reqPlaceholder}>IMG</div>
                  )}
                  <div>
                    <h4>{req.product?.name}</h4>
                    <span className={styles.reqSupplier}><Building size={12}/> {req.supplier?.businessName}</span>
                  </div>
                </div>
                
                <div className={styles.reqStatus}>
                  {req.status === 'PENDING' ? (
                    <span className={styles.statusPending}><Clock size={16}/> Waiting for approval</span>
                  ) : (
                    <div className={styles.rejectedContainer}>
                      <span className={styles.statusRejected}><XCircle size={16}/> Rejected by Supplier</span>
                      {req.rejectionReason && (
                        <div className={styles.rejectionReason}>
                          <AlertCircle size={12}/> {req.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ResellerMyProducts;
