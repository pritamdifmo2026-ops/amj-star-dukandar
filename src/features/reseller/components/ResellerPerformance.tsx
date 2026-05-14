import React, { useState, useEffect } from 'react';
import { Eye, ShoppingCart, Percent, TrendingUp, MousePointer, Users, BarChart2, ArrowUpRight, Package, Info } from 'lucide-react';
import resellerService from '../services/reseller.service';

const thCls = "text-left px-4 py-3.5 text-[#94a3b8] text-[0.7rem] font-extrabold uppercase tracking-[0.1em] border-b border-[#f1f5f9]";
const tdCls = "px-4 py-4 border-b border-[#f8fafc] text-sm text-[#334155]";

const ResellerPerformance: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await resellerService.getRequests();
        setProducts((data.requests || []).filter((r: any) => r.status === 'APPROVED'));
      } catch (err) { console.error('Failed to fetch products', err); }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  const stats = { totalVisits: 0, uniqueVisitors: 0, totalClicks: 0, totalOrders: 0, conversionRate: '0%', avgOrderValue: '₹0' };

  const topProducts = products.slice(0, 5).map(req => {
    const base = req.product?.basePrice || 0;
    const selling = req.sellingPrice || Math.round(base * 1.3);
    return { name: req.customTitle || req.product?.name || 'Unnamed Product', views: req.views || 0, orders: req.orders || 0, margin: `₹${selling - base}` };
  });

  const timePeriods = ['Last 7 days', 'Last 30 days', 'All time'];

  const kpis = [
    { icon: <Eye size={22} />, label: 'Total Store Visits', val: stats.totalVisits, sub: '-- vs last month', iconCls: 'bg-[#f0f9ff] text-[#0369a1]' },
    { icon: <MousePointer size={22} />, label: 'Product Clicks', val: stats.totalClicks, sub: '-- vs last month', iconCls: 'bg-[#fff7ed] text-[#c2410c]' },
    { icon: <ShoppingCart size={22} />, label: 'Total Orders', val: stats.totalOrders, sub: '-- this week', iconCls: 'bg-[#f0fdf4] text-[#15803d]' },
    { icon: <Percent size={22} />, label: 'Conversion Rate', val: stats.conversionRate, sub: 'Orders / Visits', iconCls: 'bg-[#fdf4ff] text-[#9333ea]' },
    { icon: <Users size={22} />, label: 'Unique Visitors', val: stats.uniqueVisitors, sub: 'Distinct customers', iconCls: 'bg-[#fefce8] text-[#a16207]' },
    { icon: <TrendingUp size={22} />, label: 'Avg. Order Value', val: stats.avgOrderValue, sub: 'Per transaction', iconCls: 'bg-[#fdf2f8] text-[#be185d]' },
  ];

  return (
    <div>
      <div className="flex justify-between items-start gap-4 mb-6 max-md:flex-col">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Store Performance</h2>
          <p className="text-sm text-[#64748b] m-0">Track how your storefront is doing — visits, clicks, orders, and conversions.</p>
        </div>
        <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-[8px]">
          {timePeriods.map((p, i) => (
            <button key={p} className={`px-3 py-1.5 text-xs font-bold rounded-[6px] border-none cursor-pointer transition-all ${i === 1 ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-[#64748b] hover:text-[#1e293b]'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 bg-[#fffbeb] border border-[#fde68a] rounded-[10px] px-4 py-3 text-[#b45309] mb-5">
        <Info size={18} className="shrink-0 mt-0.5" />
        <div>
          <strong className="text-sm">Analytics Backend Under Construction</strong>
          <p className="text-xs mt-1 m-0">Real-time analytics integration (visits, clicks, conversion) will be developed soon. Currently displaying your real products with base metrics.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] px-4 py-3 text-[#1d4ed8] text-sm mb-5">
        <Users size={16} className="shrink-0" />
        <div><strong>What your buyers see:</strong> Your store name, curated product list, your final prices — no supplier info is ever shown to buyers.</div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {kpis.map(({ icon, label, val, sub, iconCls }) => (
          <div key={label} className="bg-white border border-[#eef2f6] rounded-[12px] p-5 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 ${iconCls}`}>{icon}</div>
            <div>
              <label className="text-xs text-[#94a3b8] font-bold block mb-1">{label}</label>
              <h3 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-0.5">{val}</h3>
              <span className="text-xs text-[#64748b] flex items-center gap-1"><ArrowUpRight size={11} /> {sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[10px] border border-[#eef2f6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#f1f5f9]">
          <BarChart2 size={16} className="text-primary" />
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Top Performing Products</h3>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-[#64748b]">Loading your products...</div>
        ) : topProducts.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#64748b]">No approved products yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Product</th>
                  <th className={`${thCls} text-center`}>Views</th>
                  <th className={`${thCls} text-center`}>Orders</th>
                  <th className={`${thCls} text-center`}>Conversion</th>
                  <th className={`${thCls} text-right`}>Your Margin</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-[#fafbfc]">
                    <td className={tdCls}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 bg-[#f1f5f9] rounded-full flex items-center justify-center text-[10px] font-extrabold text-[#475569] shrink-0">#{i + 1}</div>
                        <span className="font-semibold text-[#0f172a]">{p.name}</span>
                      </div>
                    </td>
                    <td className={`${tdCls} text-center`}>{p.views}</td>
                    <td className={`${tdCls} text-center`}>{p.orders}</td>
                    <td className={`${tdCls} text-center`}>
                      <span className="bg-[#f1f5f9] text-[#475569] text-xs font-bold px-2 py-0.5 rounded-full">
                        {p.views > 0 ? ((p.orders / p.views) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <span className="bg-[#ecfdf5] text-[#059669] text-xs font-bold px-2 py-0.5 rounded-full">{p.margin}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center gap-2 px-5 py-3 border-t border-[#f1f5f9] text-xs text-[#94a3b8]">
          <Package size={12} />
          <span>Real-time data will be available once orders start flowing through your storefront (Backend in development).</span>
        </div>
      </div>
    </div>
  );
};

export default ResellerPerformance;
