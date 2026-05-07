import React, { useEffect, useState } from 'react';
import { orderApi } from '@/shared/services/order.api';
import { ShoppingBag, ChevronRight, Clock, Package } from 'lucide-react';
import { useSelector } from 'react-redux';
import styles from './OrderList.module.css';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state: any) => state.auth);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderApi.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  const isSupplier = user?.role === 'supplier';

  if (orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <ShoppingBag size={64} strokeWidth={1} />
        <h3>No Orders Yet</h3>
        <p>{isSupplier ? "You haven't received any orders yet." : "You haven't placed any orders yet."}</p>
      </div>
    );
  }

  return (
    <div className={styles.orderListContainer}>
      <div className={styles.listHeader}>
        <h3>{isSupplier ? 'Received Orders' : 'My Orders'} ({orders.length})</h3>
      </div>
      <div className={styles.grid}>
        {orders.map((order) => (
          <div key={order._id} className={styles.orderCard}>
            <div className={styles.orderMain}>
              <div className={styles.orderInfo}>
                <div className={styles.orderHeader}>
                  <span className={styles.orderNumber}>{order.orderNumber}</span>
                  <span className={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className={styles.itemsList}>
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className={styles.itemRow}>
                      <Package size={16} className={styles.itemIcon} />
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemQty}>x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.orderPrice}>
                <span className={styles.priceLabel}>Order Value</span>
                <span className={styles.priceValue}>₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className={styles.orderFooter}>
              <div className={styles.statusSection}>
                <div className={styles.statusBadge}>
                  <Clock size={14} />
                  <span>{isSupplier ? 'To be Processed' : 'Pending (Processing)'}</span>
                </div>
                <span className={styles.supplierName}>
                  {isSupplier 
                    ? `Buyer: ${order.buyerId?.name || 'Customer'}` 
                    : `Seller: ${order.supplierId?.companyName || order.supplierId?.name || 'Unknown'}`
                  }
                </span>
              </div>
              <button className={styles.detailsBtn}>
                Manage Order <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderList;
