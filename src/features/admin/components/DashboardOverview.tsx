import React from 'react';
import { Users, Store, Clock, Package, CheckCircle, TrendingUp, Shield, ShoppingBag, IndianRupee, BadgePercent } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import type { AdminStats } from '../types/admin.types';
import { getGreeting } from '@/shared/utils/greeting';
import { useAppSelector } from '@/store/hooks';

interface DashboardOverviewProps {
  stats: AdminStats;
}

const COLORS = ['oklch(0.55 0.16 38)', '#ec4899', '#6366f1'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#a78bfa',
  packed: '#38bdf8',
  shipped: '#3b82f6',
  awaiting_confirmation: '#8b5cf6',
  completed: '#10b981',
  disputed: '#ef4444',
  cancelled: '#94a3b8',
};

const fmt = (n: number) =>
  n >= 1_00_00_000 ? `\u20B9${(n / 1_00_00_000).toFixed(1)}Cr`
    : n >= 1_00_000 ? `\u20B9${(n / 1_00_000).toFixed(1)}L`
      : n >= 1_000 ? `\u20B9${(n / 1_000).toFixed(1)}K`
        : `\u20B9${n}`;

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats }) => {
  const adminName = useAppSelector(state => state.auth.user?.name) || 'Admin';
  const growthData = (stats.monthlySignups ?? []).map(m => ({ name: m.month, users: m.users }));
  const revenueData = (stats.monthlyRevenue ?? []).map(m => ({ name: m.month, gmv: m.gmv, commission: m.commission }));

  const userData = [
    { name: 'Suppliers', value: stats.totalSuppliers },
    { name: 'Resellers', value: stats.totalResellers },
    { name: 'Buyers', value: Math.max(0, stats.totalUsers - stats.totalSuppliers - stats.totalResellers) },
  ];

  const totalProductsCount = stats.totalProducts;

  const orderStatusData = (stats.ordersByStatus ?? [])
    .filter(s => s.status !== 'cancelled')
    .map(s => ({ name: s.status.replace('_', ' '), count: s.count, fill: STATUS_COLORS[s.status] ?? '#94a3b8' }));

  const statCards = [
    { icon: <Users size={20} />, label: 'Total Users', val: stats.totalUsers, cls: 'bg-[#f0f9ff] text-[#0369a1]' },
    { icon: <Store size={20} />, label: 'Total Suppliers', val: stats.totalSuppliers, cls: 'bg-[#f0fdf4] text-[#15803d]' },
    { icon: <Clock size={20} />, label: 'Pending KYC', val: stats.pendingVerifications, cls: 'bg-[#fffbeb] text-[#a16207]' },
    { icon: <Package size={20} />, label: 'Pending Products', val: stats.pendingProducts, cls: 'bg-[#fdf4ff] text-[#9333ea]' },
    { icon: <CheckCircle size={20} />, label: 'Active Users', val: stats.activeUsers, cls: 'bg-[#f0fdf4] text-[#15803d]' },
    { icon: <TrendingUp size={20} color="oklch(0.55 0.16 38)" />, label: 'Total Resellers', val: stats.totalResellers, cls: 'bg-[#fff7ed] text-[#c2410c]' },
    { icon: <Shield size={20} color="#e11d48" />, label: 'Pending Resellers', val: stats.pendingResellers, cls: 'bg-[#fef2f2] text-[#dc2626]' },
    { icon: <ShoppingBag size={20} />, label: 'Total Orders', val: stats.totalOrders ?? 0, cls: 'bg-[#f0f9ff] text-[#0369a1]' },
  ];

  const revenueCards = [
    { icon: <IndianRupee size={20} />, label: 'Platform GMV', val: fmt(stats.totalGMV ?? 0), cls: 'bg-[#f0fdf4] text-[#15803d]' },
    { icon: <BadgePercent size={20} />, label: 'Commission Earned', val: fmt(stats.totalCommissionEarned ?? 0), cls: 'bg-[#fff7ed] text-[#c2410c]' },
    { icon: <IndianRupee size={20} />, label: 'Listing Fees Earned', val: fmt(stats.totalListingFeesEarned ?? 0), cls: 'bg-[#fdf4ff] text-[#9333ea]' },
  ];

  const chartCardCls = 'bg-white border border-[#eef2f6] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]';

  return (
    <div className="flex flex-col gap-6">
      {/* Time-of-day greeting */}
      <h1 className="text-[1.75rem] text-[#0f172a] font-extrabold tracking-tight max-sm:text-2xl m-0">
        {getGreeting()} {adminName}!
      </h1>

      {/* User + order stat cards */}
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {statCards.map(({ icon, label, val, cls }) => (
          <div key={label} className="bg-white border border-[#eef2f6] rounded-[12px] p-5 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${cls}`}>{icon}</div>
            <div>
              <p className="text-xs text-[#94a3b8] font-bold m-0 mb-0.5">{label}</p>
              <h3 className="text-2xl font-extrabold text-[#0f172a] m-0">{val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue summary cards */}
      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        {revenueCards.map(({ icon, label, val, cls }) => (
          <div key={label} className="bg-white border border-[#eef2f6] rounded-[12px] p-5 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${cls}`}>{icon}</div>
            <div>
              <p className="text-xs text-[#94a3b8] font-bold m-0 mb-0.5">{label}</p>
              <h3 className="text-xl font-extrabold text-[#0f172a] m-0">{val}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        {/* Monthly Revenue Trend - GMV + Commission */}
        <div className={chartCardCls}>
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-1">Monthly Revenue Trend</h3>
          <p className="text-xs text-[#94a3b8] m-0 mb-4">GMV vs Commission earned (last 6 months)</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                <YAxis
                  yAxisId="gmv"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                  stroke="#10b981"
                />
                <YAxis
                  yAxisId="commission"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v)}
                  stroke="oklch(0.55 0.16 38)"
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name) => {
                    const formattedValue = typeof value === 'number'
                      ? value.toLocaleString('en-IN')
                      : String(value ?? 0);

                    return [
                      `\u20B9${formattedValue}`,
                      name === 'gmv' ? 'GMV' : 'Commission'
                    ];
                  }}
                />
                <Legend formatter={v => v === 'gmv' ? 'GMV' : 'Commission'} />
                <Line yAxisId="gmv" type="monotone" dataKey="gmv" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line yAxisId="commission" type="monotone" dataKey="commission" stroke="oklch(0.55 0.16 38)" strokeWidth={2} dot={{ r: 4, fill: 'oklch(0.55 0.16 38)' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className={chartCardCls}>
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">Platform Distribution</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={userData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {userData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Volume by Status */}
        <div className={chartCardCls}>
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">Order Volume by Status</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={110} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Status */}
        <div className={chartCardCls}>
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">Verification Status</h3>
          <div className="flex flex-col gap-5 mt-2">
            {[
              { label: 'Supplier KYC', pct: (stats.activeUsers / (stats.totalUsers || 1)) * 100, color: '#10b981' },
              { label: 'Reseller Onboarding', pct: (stats.totalResellers / ((stats.totalResellers + stats.pendingResellers) || 1)) * 100, color: 'oklch(0.55 0.16 38)' },
              { label: 'Product Queue', pct: ((totalProductsCount - stats.pendingProducts) / (totalProductsCount || 1)) * 100, color: '#f59e0b' },
            ].map(({ label, pct, color }) => (
              <div key={label} className="flex justify-between items-center gap-3">
                <span className="text-sm text-[#64748b] shrink-0 w-[140px]">{label}</span>
                <div className="flex-1 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div style={{ width: `${Math.min(100, Math.round(pct))}%`, background: color, height: '100%' }} />
                </div>
                <span className="font-bold text-sm w-10 text-right">{Math.min(100, Math.round(pct))}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Growth Trend */}
        <div className={`${chartCardCls} col-span-2 max-lg:col-span-1`}>
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">User Growth Trend</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
