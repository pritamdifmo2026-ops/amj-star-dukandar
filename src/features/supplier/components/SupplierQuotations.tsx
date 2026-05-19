import React, { useEffect, useState } from 'react';
import { quotationApi } from '@/shared/services/quotation.api';
import { FileText, Clock, CheckCircle, XCircle, ShoppingBag, RefreshCw, User } from 'lucide-react';

interface QuotationItem {
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

interface Quotation {
  _id: string;
  status: string;
  totalAmount: number;
  shippingCost: number;
  items: QuotationItem[];
  terms?: string;
  validUntil: string;
  createdAt: string;
  buyerId?: { name?: string; phone?: string };
  orderId?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  pending:  { label: 'Pending',  icon: <Clock size={14} />,        cls: 'pending' },
  accepted: { label: 'Accepted', icon: <CheckCircle size={14} />,  cls: 'accepted' },
  rejected: { label: 'Rejected', icon: <XCircle size={14} />,      cls: 'rejected' },
  ordered:  { label: 'Ordered',  icon: <ShoppingBag size={14} />,  cls: 'ordered' },
  expired:  { label: 'Expired',  icon: <Clock size={14} />,        cls: 'expired' },
};

const SupplierQuotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quotationApi.getSupplierQuotations();
      setQuotations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load quotations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotations(); }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2><FileText size={20} /> Quotations</h2>
        </div>
        <div className={styles.skeletonList}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2><FileText size={20} /> Quotations</h2>
          <button className={styles.refreshBtn} onClick={fetchQuotations}><RefreshCw size={16} /> Retry</button>
        </div>
        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2><FileText size={20} /> Quotations</h2>
        <button className={styles.refreshBtn} onClick={fetchQuotations}><RefreshCw size={16} /> Refresh</button>
      </div>

      {quotations.length === 0 ? (
        <div className={styles.empty}>
          <FileText size={48} />
          <p>No quotations yet. Send a quote from a chat conversation to see it here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {quotations.map(q => {
            const s = STATUS_CONFIG[q.status] ?? STATUS_CONFIG['pending'];
            return (
              <div key={q._id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.buyerRow}>
                    <User size={15} />
                    <span className={styles.buyerName}>{q.buyerId?.name || q.buyerId?.phone || 'Buyer'}</span>
                  </div>
                  <span className={`${styles.badge} ${styles[s.cls]}`}>
                    {s.icon} {s.label}
                  </span>
                </div>

                <div className={styles.items}>
                  {q.items.map((item, idx) => (
                    <div key={idx} className={styles.item}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemDetail}>
                        {item.quantity} {item.unit} × ₹{item.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.cardBottom}>
                  <div className={styles.amounts}>
                    <span>Subtotal: <strong>₹{q.totalAmount.toLocaleString()}</strong></span>
                    {q.shippingCost > 0 && <span>Shipping: <strong>₹{q.shippingCost.toLocaleString()}</strong></span>}
                    <span className={styles.total}>Total: <strong>₹{(q.totalAmount + (q.shippingCost || 0)).toLocaleString()}</strong></span>
                  </div>
                  <div className={styles.meta}>
                    <span>Valid until: {new Date(q.validUntil).toLocaleDateString()}</span>
                    <span>Sent: {new Date(q.createdAt).toLocaleDateString()}</span>
                    {q.orderId && <span className={styles.orderId}>Order: #{String(q.orderId).slice(-6)}</span>}
                  </div>
                </div>

                {q.terms && <div className={styles.terms}>📝 {q.terms}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupplierQuotations;
