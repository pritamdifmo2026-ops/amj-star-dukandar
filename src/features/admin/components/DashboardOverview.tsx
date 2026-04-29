import React from 'react';
import { Users, Store, Clock, Package, CheckCircle } from 'lucide-react';
import type { AdminStats } from '../services/admin.service';
import styles from '../pages/AdminDashboard.module.css';

interface DashboardOverviewProps {
  stats: AdminStats;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats }) => {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <Users />
        <div>
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>
      </div>
      <div className={styles.statCard}>
        <Store />
        <div>
          <h3>Total Suppliers</h3>
          <p>{stats.totalSuppliers}</p>
        </div>
      </div>
      <div className={styles.statCard}>
        <Clock />
        <div>
          <h3>Pending KYC</h3>
          <p>{stats.pendingVerifications}</p>
        </div>
      </div>
      <div className={styles.statCard}>
        <Package />
        <div>
          <h3>Pending Products</h3>
          <p>{stats.pendingProducts}</p>
        </div>
      </div>
      <div className={styles.statCard}>
        <CheckCircle />
        <div>
          <h3>Active Users</h3>
          <p>{stats.activeUsers}</p>
        </div>
      </div>
      <div className={styles.statCard}>
        <Users color="#0284c7" />
        <div>
          <h3>Total Resellers</h3>
          <p>{stats.totalResellers}</p>
        </div>
      </div>
      <div className={styles.statCard}>
        <Clock color="#e11d48" />
        <div>
          <h3>Pending Resellers</h3>
          <p>{stats.pendingResellers}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
