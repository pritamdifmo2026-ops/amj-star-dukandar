import React from 'react';
import { ShieldCheck, Zap, RefreshCw, Plus } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import SupplierStats from './SupplierStats';
import styles from '../pages/SupplierDashboard.module.css';

interface SupplierOverviewProps {
  profile: any;
  products: any[];
  isTrusted: boolean;
  handleRefresh: () => void;
  setActiveView: (view: string) => void;
  renderProductListing: (products: any[]) => React.ReactNode;
}

const SupplierOverview: React.FC<SupplierOverviewProps> = ({
  profile,
  products,
  isTrusted,
  handleRefresh,
  setActiveView,
  renderProductListing
}) => {
  return (
    <>
      <div className={styles.header}>
        <div>
          <h1>Welcome back, {profile?.businessName || 'Supplier'}</h1>
          {isTrusted ? (
            <div className={styles.trustedBadge}>
              <ShieldCheck size={16} />
              <span>Trusted Supplier</span>
            </div>
          ) : (
            <p>Manage your products and orders from your command center.</p>
          )}
          {isTrusted && (
            <div className={styles.autoApprovalNotice}>
              <Zap size={14} />
              <span><strong>Auto-Upload Active:</strong> Your products will now be live instantly!</span>
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={handleRefresh} className={styles.refreshBtn}>
            <RefreshCw size={18} /> Refresh
          </Button>
          <Button onClick={() => setActiveView('add-product')} className={styles.addBtn}>
            <Plus size={20} /> Add New Product
          </Button>
        </div>
      </div>

      <SupplierStats products={products} />
      
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Products</h2>
          <button className={styles.viewAll} onClick={() => setActiveView('inventory')}>View All</button>
        </div>
        {renderProductListing(products.slice(0, 5))}
      </section>
    </>
  );
};

export default SupplierOverview;
