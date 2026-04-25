import React from 'react';
import { Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import styles from '../pages/SupplierDashboard.module.css';

interface SupplierStatsProps {
  products: any[];
}

const SupplierStats: React.FC<SupplierStatsProps> = ({ products }) => {
  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: '#2563eb' },
    { label: 'Live', value: products.filter(p => p.status === 'APPROVED').length, icon: CheckCircle, color: '#059669' },
    { label: 'Pending', value: products.filter(p => p.status === 'PENDING').length, icon: Clock, color: '#d97706' },
    { label: 'Rejected', value: products.filter(p => p.status === 'REJECTED').length, icon: AlertCircle, color: '#dc2626' },
  ];

  return (
    <div className={styles.statsGrid}>
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <Icon size={24} />
            </div>
            <div className={styles.statInfo}>
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SupplierStats;
