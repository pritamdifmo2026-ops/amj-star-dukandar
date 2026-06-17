import React, { useEffect, useMemo, useRef } from 'react';
import { ShieldCheck, Zap, Plus, AlertTriangle, Wallet, Receipt, IndianRupee, ShoppingBag, PackageCheck } from 'lucide-react';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import Button from '@/shared/components/ui/Button';
import SupplierStats from './SupplierStats';
import { useQuery } from '@tanstack/react-query';
import walletApi from '../services/wallet.api';
import toast from 'react-hot-toast';
import { orderApi } from '@/features/order/services/order.api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SupplierOverviewProps {
  profile: any;
  products: any[];
  isTrusted: boolean;
  handleRefresh?: () => void;
  setActiveView: (view: string) => void;
  renderProductListing: (products: any[]) => React.ReactNode;
}

const SupplierOverview: React.FC<SupplierOverviewProps> = ({
  profile, products, isTrusted, setActiveView, renderProductListing
}) => {
  const { data: walletData } = useQuery({ queryKey: ['wallet'], queryFn: walletApi.getWallet });
  const { data: orderData, isLoading: ordersLoading } = useQuery({
    queryKey: ['supplier', 'dashboard-orders'],
    queryFn: orderApi.supplierOrders,
  });
  const commissionRate = walletData?.commissionRate;
  const commissionNotSet = walletData !== undefined && commissionRate == null;
  const toastShown = useRef(false);
  const orders = orderData?.data || [];
  const orderStats = orderData?.stats;

  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const money = (n: number) => `₹${fmt(n || 0)}`;

  const getGreeting = () => {
    const now = new Date();
    let istHours = now.getUTCHours() + 5;
    let istMinutes = now.getUTCMinutes() + 30;
    if (istMinutes >= 60) {
      istHours += 1;
      istMinutes -= 60;
    }
    istHours = istHours % 24;

    if (istHours >= 4 && istHours < 12) {
      return "Good morning";
    } else if (istHours >= 12 && istHours < 17) {
      return "Good afternoon";
    } else {
      return "Good day to you";
    }
  };

  const { salesTrend, orderStatusData, topProductData } = useMemo(() => {
    const monthMap = new Map<string, { month: string; sales: number; orders: number }>();
    const statusMap = new Map<string, number>();
    const productMap = new Map<string, number>();
    const formatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });

    orders.forEach((order: any) => {
      const date = order.createdAt ? new Date(order.createdAt) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      const current = monthMap.get(key) || { month: formatter.format(date), sales: 0, orders: 0 };
      current.sales += Number(order.totalAmount || 0);
      current.orders += 1;
      monthMap.set(key, current);

      const status = String(order.status || 'Confirmed').replace(/_/g, ' ');
      statusMap.set(status, (statusMap.get(status) || 0) + 1);

      (order.items || []).forEach((item: any) => {
        const name = item.name || 'Product';
        productMap.set(name, (productMap.get(name) || 0) + Number(item.quantity || 0));
      });
    });

    return {
      salesTrend: Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, value]) => value),
      orderStatusData: Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })),
      topProductData: Array.from(productMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name: name.length > 18 ? `${name.slice(0, 18)}...` : name, quantity })),
    };
  }, [orders]);

  const dashboardCards = [
    { label: 'Confirmed Orders', value: orderStats?.totalInvoices ?? orders.length, icon: Receipt, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Total Sales', value: money(orderStats?.grandTotal ?? 0), icon: IndianRupee, color: '#059669', bg: '#ecfdf5' },
    { label: 'Product Amount', value: money(orderStats?.totalProductAmount ?? 0), icon: ShoppingBag, color: '#e65c00', bg: '#fff7ed' },
    { label: 'Live Products', value: products.filter(p => p.status === 'APPROVED').length, icon: PackageCheck, color: '#7c3aed', bg: '#f5f3ff' },
  ];

  const statusColors = ['#2563eb', '#059669', '#e65c00', '#dc2626', '#7c3aed'];
  const chartCardCls = 'bg-white rounded-[10px] border border-[#eef2f6] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] min-h-[300px]';

  useEffect(() => {
    if (!walletData || toastShown.current) return;
    const available: number = walletData.wallet?.availableBalance ?? 0;
    const minBalance: number = walletData.minimumWalletBalance ?? 500;
    if (available < minBalance) {
      toastShown.current = true;
      toast.custom(
        t => (
          <div
            className={`flex items-start gap-3 bg-white border border-[#fcd34d] rounded-[12px] shadow-lg px-4 py-3 max-w-sm w-full transition-all ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
          >
            <div className="w-9 h-9 rounded-full bg-[#fffbeb] flex items-center justify-center shrink-0 mt-0.5">
              <Wallet size={18} className="text-[#d97706]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#92400e] m-0">Low wallet balance</p>
              <p className="text-xs text-[#b45309] mt-0.5 m-0">
                ₹{available.toFixed(2)} available — minimum is ₹{minBalance}. Top up to avoid PO blocks.
              </p>
              <button
                onClick={() => { setActiveView('wallet'); toast.dismiss(t.id); }}
                className="mt-2 text-xs font-bold text-[#e65c00] bg-transparent border-none cursor-pointer p-0 hover:underline"
              >
                Add wallet balance →
              </button>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-[#94a3b8] bg-transparent border-none cursor-pointer text-lg leading-none p-0 shrink-0 hover:text-[#475569]"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ),
        { duration: Infinity, position: 'top-right' }
      );
    }
  }, [walletData]);

  return (
    <>
      <div className="flex justify-between items-start mb-10 gap-6 max-lg:flex-col max-lg:items-stretch max-lg:gap-4 max-lg:mb-6">
        <div>
          <h1 className="text-[1.75rem] text-[#0f172a] mb-2 font-extrabold tracking-tight max-sm:text-2xl">
            {getGreeting()} {profile?.name || profile?.fullName || profile?.businessName || 'Supplier'}!
          </h1>
          {isTrusted ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold mt-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
              <ShieldCheck size={16} /> <span>Trusted Supplier</span>
            </div>
          ) : (
            null
          )}
          {isTrusted && (
            <div className="mt-4 px-4 py-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[6px] text-[#166534] text-[0.85rem] flex items-center gap-2">
              <Zap size={14} />
              <span><strong>Auto-Upload Active:</strong> Your products will now be live instantly!</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 max-sm:grid max-sm:grid-cols-2">
          <NotificationBell />
          <Button onClick={() => setActiveView('add-product')}>
            <Plus size={20} /> Add New Product
          </Button>
        </div>
      </div>

      {commissionNotSet && (
        <button
          onClick={() => setActiveView('settings')}
          className="w-full flex items-start gap-3 p-4 mb-6 bg-[#fffbeb] border border-[#fcd34d] rounded-[10px] text-left hover:bg-[#fef3c7] transition-colors cursor-pointer group"
        >
          <AlertTriangle size={20} className="text-[#d97706] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm text-[#92400e]">Commission rate not configured</p>
            <p className="text-xs text-[#b45309] mt-0.5">PO generation is paused until AMJSTAR sets your commission rate. Tap to go to Settings and find the contact CTA.</p>
          </div>
          <span className="text-xs font-bold text-[#d97706] group-hover:underline whitespace-nowrap">Go to Settings →</span>
        </button>
      )}

      <SupplierStats products={products} />

      <section className="mb-8">
        <div className="grid grid-cols-4 gap-4 mb-5 max-xl:grid-cols-2 max-sm:grid-cols-1">
          {dashboardCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white border border-[#eef2f6] rounded-[10px] p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: card.bg, color: card.color }}>
                  <Icon size={21} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#64748b] font-bold m-0 mb-1 uppercase">{card.label}</p>
                  <p className="text-xl font-extrabold text-[#0f172a] m-0 truncate">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
          <div className={chartCardCls}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-[1rem] text-[#0f172a] m-0 font-extrabold">Sales Trend</h2>
              <span className="text-xs font-semibold text-[#94a3b8]">Backend orders</span>
            </div>
            <div className="h-[230px]">
              {ordersLoading ? (
                <div className="h-full bg-[#f8fafc] rounded-[8px] animate-pulse" />
              ) : salesTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#94a3b8]">No sales data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={value => `₹${Number(value) / 1000}k`} />
                    <Tooltip formatter={(value, name) => {
                      const key = String(name);
                      const num = Number(value || 0);
                      return [key === 'sales' ? money(num) : num, key === 'sales' ? 'Sales' : 'Orders'];
                    }} contentStyle={{ borderRadius: '8px', border: '1px solid #eef2f6' }} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#e65c00" strokeWidth={3} dot={{ r: 4, fill: '#e65c00' }} />
                    <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={chartCardCls}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-[1rem] text-[#0f172a] m-0 font-extrabold">Order Status</h2>
              <span className="text-xs font-semibold text-[#94a3b8]">{orders.length} orders</span>
            </div>
            <div className="h-[230px]">
              {ordersLoading ? (
                <div className="h-full bg-[#f8fafc] rounded-[8px] animate-pulse" />
              ) : orderStatusData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#94a3b8]">No order status data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={orderStatusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={4}>
                      {orderStatusData.map((_, i) => <Cell key={i} fill={statusColors[i % statusColors.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={`${chartCardCls} col-span-2 max-lg:col-span-1`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-[1rem] text-[#0f172a] m-0 font-extrabold">Top Products by Quantity</h2>
              <button onClick={() => setActiveView('reports')} className="text-xs font-bold text-[#e65c00] bg-transparent border-none cursor-pointer hover:underline">
                Open reports
              </button>
            </div>
            <div className="h-[250px]">
              {ordersLoading ? (
                <div className="h-full bg-[#f8fafc] rounded-[8px] animate-pulse" />
              ) : topProductData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#94a3b8]">No product quantity data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} height={52} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #eef2f6' }} />
                    <Bar dataKey="quantity" name="Quantity" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] mb-8 max-lg:p-5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[1.25rem] text-[#1e293b] m-0 font-extrabold">Recent Products</h2>
          <button onClick={() => setActiveView('inventory')} className="bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] font-bold cursor-pointer text-[0.8rem] px-4 py-2 rounded-[8px] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]">
            View All
          </button>
        </div>
        {renderProductListing(products.slice(0, 5))}
      </section>
    </>
  );
};

export default SupplierOverview;
