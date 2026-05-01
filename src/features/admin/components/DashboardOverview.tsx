import React from 'react';
import { Users, Store, Clock, Package, CheckCircle, TrendingUp, Shield } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import type { AdminStats } from '../services/admin.service';
import styles from '../pages/AdminDashboard.module.css';

interface DashboardOverviewProps {
  stats: AdminStats;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats }) => {
  // Mock data for user growth trend
  const growthData = [
    { name: 'Jan', users: Math.floor(stats.totalUsers * 0.4) },
    { name: 'Feb', users: Math.floor(stats.totalUsers * 0.55) },
    { name: 'Mar', users: Math.floor(stats.totalUsers * 0.7) },
    { name: 'Apr', users: Math.floor(stats.totalUsers * 0.85) },
    { name: 'May', users: stats.totalUsers },
  ];

  // User distribution data
  const userData = [
    { name: 'Suppliers', value: stats.totalSuppliers },
    { name: 'Resellers', value: stats.totalResellers },
    { name: 'Buyers', value: stats.totalUsers - stats.totalSuppliers - stats.totalResellers },
  ];

  // Product status data
  const totalProductsCount = stats.totalProducts || stats.pendingProducts + 10;
  const productData = [
    { name: 'Pending', count: stats.pendingProducts, fill: '#f59e0b' },
    { name: 'Active', count: Math.max(0, totalProductsCount - stats.pendingProducts), fill: '#10b981' },
  ];

  const COLORS = ['#0284c7', '#ec4899', '#6366f1'];

  return (
    <div className={styles.dashboardOverview}>
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
          <TrendingUp color="#0284c7" />
          <div>
            <h3>Total Resellers</h3>
            <p>{stats.totalResellers}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Shield color="#e11d48" />
          <div>
            <h3>Pending Resellers</h3>
            <p>{stats.pendingResellers}</p>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>User Growth Trend</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#0284c7" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#0284c7' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Platform Distribution</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Product Analytics</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Verification Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '14px' }}>Supplier KYC</span>
              <div style={{ flex: 1, height: '8px', background: '#f1f5f9', margin: '0 15px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(stats.activeUsers / stats.totalUsers) * 100}%`, height: '100%', background: '#10b981' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{Math.round((stats.activeUsers / stats.totalUsers) * 100)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '14px' }}>Reseller Onboarding</span>
              <div style={{ flex: 1, height: '8px', background: '#f1f5f9', margin: '0 15px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(stats.totalResellers / (stats.totalResellers + stats.pendingResellers)) * 100}%`, height: '100%', background: '#0284c7' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{Math.round((stats.totalResellers / (stats.totalResellers + stats.pendingResellers)) * 100)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '14px' }}>Product Queue</span>
              <div style={{ flex: 1, height: '8px', background: '#f1f5f9', margin: '0 15px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${((totalProductsCount - stats.pendingProducts) / totalProductsCount) * 100}%`, height: '100%', background: '#f59e0b' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{Math.round(((totalProductsCount - stats.pendingProducts) / totalProductsCount) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
