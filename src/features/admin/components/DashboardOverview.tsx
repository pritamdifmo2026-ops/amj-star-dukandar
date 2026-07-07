import React from 'react';
import { Users, Store, Clock, Package, CheckCircle, TrendingUp, Shield } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import type { AdminStats } from '../types/admin.types';

interface DashboardOverviewProps {
  stats: AdminStats;
}

const COLORS = ['oklch(0.55 0.16 38)', '#ec4899', '#6366f1'];

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats }) => {
  const growthData = (stats.monthlySignups ?? []).map(m => ({ name: m.month, users: m.users }));

  const userData = [
    { name: 'Suppliers', value: stats.totalSuppliers },
    { name: 'Resellers', value: stats.totalResellers },
    { name: 'Buyers', value: stats.totalUsers - stats.totalSuppliers - stats.totalResellers },
  ];

  const totalProductsCount = stats.totalProducts;
  const productData = [
    { name: 'Pending', count: stats.pendingProducts, fill: '#f59e0b' },
    { name: 'Active', count: Math.max(0, totalProductsCount - stats.pendingProducts), fill: '#10b981' },
  ];

  const statCards = [
    { icon: <Users size={20} />, label: 'Total Users', val: stats.totalUsers, cls: 'bg-[#f0f9ff] text-[#0369a1]' },
    { icon: <Store size={20} />, label: 'Total Suppliers', val: stats.totalSuppliers, cls: 'bg-[#f0fdf4] text-[#15803d]' },
    { icon: <Clock size={20} />, label: 'Pending KYC', val: stats.pendingVerifications, cls: 'bg-[#fffbeb] text-[#a16207]' },
    { icon: <Package size={20} />, label: 'Pending Products', val: stats.pendingProducts, cls: 'bg-[#fdf4ff] text-[#9333ea]' },
    { icon: <CheckCircle size={20} />, label: 'Active Users', val: stats.activeUsers, cls: 'bg-[#f0fdf4] text-[#15803d]' },
    { icon: <TrendingUp size={20} color="oklch(0.55 0.16 38)" />, label: 'Total Resellers', val: stats.totalResellers, cls: 'bg-[#fff7ed] text-[#c2410c]' },
    { icon: <Shield size={20} color="#e11d48" />, label: 'Pending Resellers', val: stats.pendingResellers, cls: 'bg-[#fef2f2] text-[#dc2626]' },
  ];

  const chartCardCls = "bg-white border border-[#eef2f6] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]";

  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <div className={chartCardCls}>
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">User Growth Trend</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="users" stroke="oklch(0.55 0.16 38)" strokeWidth={2} dot={{ r: 4, fill: 'oklch(0.55 0.16 38)' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

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

        <div className={chartCardCls}>
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">Product Analytics</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartCardCls}>
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0 mb-4">Verification Status</h3>
          <div className="flex flex-col gap-5 mt-2">
            {[
              { label: 'Supplier KYC', pct: (stats.activeUsers / stats.totalUsers) * 100, color: '#10b981' },
              { label: 'Reseller Onboarding', pct: (stats.totalResellers / (stats.totalResellers + stats.pendingResellers)) * 100, color: 'oklch(0.55 0.16 38)' },
              { label: 'Product Queue', pct: ((totalProductsCount - stats.pendingProducts) / totalProductsCount) * 100, color: '#f59e0b' },
            ].map(({ label, pct, color }) => (
              <div key={label} className="flex justify-between items-center gap-3">
                <span className="text-sm text-[#64748b] shrink-0 w-[140px]">{label}</span>
                <div className="flex-1 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div style={{ width: `${Math.round(pct)}%`, background: color, height: '100%' }} />
                </div>
                <span className="font-bold text-sm w-10 text-right">{Math.round(pct)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
