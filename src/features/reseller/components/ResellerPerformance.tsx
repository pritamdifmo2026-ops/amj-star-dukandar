import React, { useState, useEffect } from 'react';
import { Eye, ShoppingCart, Percent, TrendingUp, MousePointer, Users, BarChart2, ArrowUpRight, Package, Info } from 'lucide-react';
import resellerService from '../services/reseller.service';
import styles from './ResellerPerformance.module.css';

const ResellerPerformance: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await resellerService.getRequests();
        const approved = (data.requests || []).filter((r: any) => r.status === 'APPROVED');
        setProducts(approved);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // For now, since real analytics endpoints aren't built yet, we use 0
  const stats = {
    totalVisits: 0,
    uniqueVisitors: 0,
    totalClicks: 0,
    totalOrders: 0,
    conversionRate: '0%',
    avgOrderValue: '₹0',
  };

  const topProducts = products.slice(0, 5).map(req => {
    const base = req.product?.basePrice || 0;
    const selling = req.sellingPrice || Math.round(base * 1.3);
    const margin = selling - base;

    return {
      name: req.customTitle || req.product?.name || 'Unnamed Product',
      views: req.views || 0,
      orders: req.orders || 0,
      margin: `₹${margin}`
    };
  });

  const timePeriods = ['Last 7 days', 'Last 30 days', 'All time'];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>Store Performance</h2>
          <p>Track how your storefront is doing — visits, clicks, orders, and conversions.</p>
        </div>
        <div className={styles.periodSelector}>
          {timePeriods.map((p, i) => (
            <button key={p} className={`${styles.periodBtn} ${i === 1 ? styles.periodBtnActive : ''}`}>{p}</button>
          ))}
        </div>
      </header>

      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: '#b45309', marginBottom: '1rem' }}>
        <Info size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong>Analytics Backend Under Construction</strong>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Real-time analytics integration (visits, clicks, conversion) will be developed soon. Currently displaying your real products with base metrics.</p>
        </div>
      </div>

      {/* ── What Buyer Sees Banner ── */}
      <div className={styles.buyerBanner}>
        <Users size={18} />
        <div>
          <strong>What your buyers see:</strong> Your store name, curated product list, your final prices — no supplier info is ever shown to buyers.
        </div>
      </div>

      {/* ── Main KPI Grid ── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#f0f9ff', color: '#0369a1' }}>
            <Eye size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <label>Total Store Visits</label>
            <h3>{stats.totalVisits}</h3>
            <span className={styles.kpiTrend}><ArrowUpRight size={12} /> -- vs last month</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#fff7ed', color: '#c2410c' }}>
            <MousePointer size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <label>Product Clicks</label>
            <h3>{stats.totalClicks}</h3>
            <span className={styles.kpiTrend}><ArrowUpRight size={12} /> -- vs last month</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#f0fdf4', color: '#15803d' }}>
            <ShoppingCart size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <label>Total Orders</label>
            <h3>{stats.totalOrders}</h3>
            <span className={styles.kpiTrend}><ArrowUpRight size={12} /> -- this week</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#fdf4ff', color: '#9333ea' }}>
            <Percent size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <label>Conversion Rate</label>
            <h3>{stats.conversionRate}</h3>
            <span className={styles.kpiSub}>Orders / Visits</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#fefce8', color: '#a16207' }}>
            <Users size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <label>Unique Visitors</label>
            <h3>{stats.uniqueVisitors}</h3>
            <span className={styles.kpiSub}>Distinct customers</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#fdf2f8', color: '#be185d' }}>
            <TrendingUp size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <label>Avg. Order Value</label>
            <h3>{stats.avgOrderValue}</h3>
            <span className={styles.kpiSub}>Per transaction</span>
          </div>
        </div>
      </div>

      {/* ── Top Performing Products ── */}
      <div className={styles.topProducts}>
        <div className={styles.tableHeader}>
          <BarChart2 size={16} />
          <h3>Top Performing Products</h3>
        </div>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading your products...</div>
        ) : topProducts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No approved products yet.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th className={styles.centerCol}>Views</th>
                <th className={styles.centerCol}>Orders</th>
                <th className={styles.centerCol}>Conversion</th>
                <th className={styles.rightCol}>Your Margin</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i}>
                  <td>
                    <div className={styles.productCell}>
                      <div className={styles.productRank}>#{i + 1}</div>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className={styles.centerCol}>{p.views}</td>
                  <td className={styles.centerCol}>{p.orders}</td>
                  <td className={styles.centerCol}>
                    <span className={styles.convBadge}>
                      {p.views > 0 ? ((p.orders / p.views) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </td>
                  <td className={styles.rightCol}>
                    <span className={styles.marginBadge}>{p.margin}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className={styles.analyticsNote}>
          <Package size={14} />
          <span>Real-time data will be available once orders start flowing through your storefront (Backend in development).</span>
        </div>
      </div>
    </div>
  );
};

export default ResellerPerformance;
