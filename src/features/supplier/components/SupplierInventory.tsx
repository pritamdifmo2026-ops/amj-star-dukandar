import React from 'react';
import { RefreshCw } from 'lucide-react';
import styles from '../pages/SupplierDashboard.module.css';

interface SupplierInventoryProps {
  products: any[];
  handleRefresh: () => void;
  renderProductListing: (products: any[]) => React.ReactNode;
}

const SupplierInventory: React.FC<SupplierInventoryProps> = ({
  products,
  handleRefresh,
  renderProductListing
}) => {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>My Inventory</h2>
        <button className={styles.viewAll} onClick={handleRefresh}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      {renderProductListing(products)}
    </section>
  );
};

export default SupplierInventory;
