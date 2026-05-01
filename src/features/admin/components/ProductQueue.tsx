import React, { useState } from 'react';
import { Package, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import styles from '../pages/AdminDashboard.module.css';

interface ProductQueueProps {
  pendingProducts: any[];
  approvedProducts: any[];
  onVerify: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
}

const ProductQueue: React.FC<ProductQueueProps> = ({ pendingProducts, approvedProducts, onVerify }) => {
  const [productConfirm, setProductConfirm] = useState<{ product: any; status: 'APPROVED' | 'REJECTED' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const handleConfirmAction = async () => {
    if (!productConfirm) return;
    setLoading(true);
    try {
      await onVerify(productConfirm.product._id, productConfirm.status);
      setProductConfirm(null);
    } finally {
      setLoading(false);
    }
  };

  const renderPagination = (totalItems: number, currentPage: number, onPageChange: (p: number) => void) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
      const pages = [];
      if (totalPages <= 4) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        // 1, 2, ..., totalPages
        pages.push(1);
        pages.push(2);
        if (currentPage > 3) pages.push('...');
        if (currentPage > 2 && currentPage < totalPages - 1) {
          if (!pages.includes(currentPage)) pages.push(currentPage);
        }
        if (currentPage < totalPages - 2) pages.push('...');
        if (!pages.includes(totalPages)) pages.push(totalPages);
      }

      return pages.map((p, idx) => {
        if (p === '...') return <span key={`dots-${idx}`} className={styles.dots}>...</span>;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`${styles.pageNumber} ${currentPage === p ? styles.activePage : ''}`}
          >
            {p}
          </button>
        );
      });
    };

    return (
      <div className={styles.pagination}>
        <button 
          disabled={currentPage === 1} 
          onClick={() => onPageChange(currentPage - 1)}
          className={styles.pageBtn}
        >
          <ChevronLeft size={16} />
          Prev
        </button>
        
        <div className={styles.pageNumbers}>
          {renderPageNumbers()}
        </div>

        <button 
          disabled={currentPage === totalPages} 
          onClick={() => onPageChange(currentPage + 1)}
          className={styles.pageBtn}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  const renderProductTable = (products: any[], isPending: boolean, currentPage: number) => {
    const pagedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Supplier</th>
              <th>Price</th>
              <th>Category</th>
              {isPending ? <th>Actions</th> : <th>Status</th>}
            </tr>
          </thead>
          <tbody>
            {pagedProducts.map(p => (
              <tr key={p._id}>
                <td data-label="Product" className={styles.productCell}>
                  <div className={styles.productInfo} style={{ justifyContent: 'flex-end' }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className={styles.productThumb} />
                    ) : (
                      <div className={styles.productThumbPlaceholder}>
                        <Package size={16} />
                      </div>
                    )}
                    <span>{p.name}</span>
                  </div>
                </td>
                <td data-label="Supplier">{p.supplierId?.businessName}</td>
                <td data-label="Price">₹{p.basePrice}</td>
                <td data-label="Category">{p.category}</td>
                {isPending ? (
                  <td data-label="Actions" className={styles.actions}>
                    <button 
                      onClick={() => setProductConfirm({ product: p, status: 'APPROVED' })} 
                      className={styles.approveBtn}
                      title="Approve"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => setProductConfirm({ product: p, status: 'REJECTED' })} 
                      className={styles.rejectBtn}
                      title="Reject"
                    >
                      <XCircle size={18} />
                    </button>
                  </td>
                ) : (
                  <td data-label="Status">
                    <span className={styles.statusActive}>
                      <CheckCircle size={14} style={{ marginRight: '4px' }} />
                      Approved
                    </span>
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className={styles.empty}>No {isPending ? 'pending' : 'approved'} products</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.productQueueContainer}>
      <div className={styles.sectionHeader}>
        <h3>Pending Products</h3>
        <span className={styles.countBadge}>{pendingProducts.length} items</span>
      </div>
      {renderProductTable(pendingProducts, true, pendingPage)}
      {renderPagination(pendingProducts.length, pendingPage, setPendingPage)}

      <div className={`${styles.sectionHeader} ${styles.marginTop}`}>
        <h3>Approved Products</h3>
        <span className={styles.countBadge}>{approvedProducts.length} items</span>
      </div>
      {renderProductTable(approvedProducts, false, approvedPage)}
      {renderPagination(approvedProducts.length, approvedPage, setApprovedPage)}

      <Modal
        isOpen={!!productConfirm}
        onClose={() => setProductConfirm(null)}
        title={productConfirm?.status === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setProductConfirm(null)}>Cancel</Button>
            <Button 
              variant={productConfirm?.status === 'APPROVED' ? 'primary' : 'danger'} 
              onClick={handleConfirmAction}
              loading={loading}
            >
              Confirm {productConfirm?.status === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <p>Are you sure you want to <strong>{productConfirm?.status.toLowerCase()}</strong> the product "<strong>{productConfirm?.product.name}</strong>"?</p>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          {productConfirm?.status === 'APPROVED' 
            ? 'This product will become visible to all buyers immediately.' 
            : 'This product will be removed from the queue and the supplier will be notified.'}
        </p>
      </Modal>
    </div>
  );
};

export default ProductQueue;
