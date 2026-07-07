import React, { useEffect, useRef, useState } from 'react';
import { orderApi } from '@/features/order/services/order.api';
import {
  ShoppingBag, Package, Truck, CheckCircle, Clock, XCircle,
  ChevronRight, Download, Search, AlertTriangle, Boxes,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSocket } from '@/shared/contexts/SocketContext';
import OrderManage from './OrderManage';

// ─── Status display config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.FC<any> }> = {
  paid:                   { label: 'Pending Dispatch',       color: '#a16207', bg: '#fefce8', border: '#fde047',  Icon: Clock },
  processing:             { label: 'Pending Dispatch',       color: '#a16207', bg: '#fefce8', border: '#fde047',  Icon: Clock },
  pending:                { label: 'Processing',             color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd',  Icon: Clock },
  packed:                 { label: 'Packed',                 color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc',  Icon: Boxes },
  shipped:                { label: 'Dispatched',             color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd',  Icon: Truck },
  awaiting_confirmation:  { label: 'Awaiting Confirmation',  color: '#9333ea', bg: '#faf5ff', border: '#d8b4fe',  Icon: Clock },
  completed:              { label: 'Completed',              color: '#15803d', bg: '#f0fdf4', border: '#86efac',  Icon: CheckCircle },
  delivered:              { label: 'Delivered',              color: '#15803d', bg: '#f0fdf4', border: '#86efac',  Icon: CheckCircle },
  disputed:               { label: 'Disputed',               color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',  Icon: AlertTriangle },
  cancelled:              { label: 'Cancelled',              color: '#dc2626', bg: '#fef2f2', border: '#fca5a5',  Icon: XCircle },
};
const getStatusConfig = (s: string) => STATUS_CONFIG[s] ?? { label: s, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', Icon: Clock };

const PAGE_SIZE = 10;
type StatusFilter = 'all' | 'processing' | 'shipped' | 'completed' | 'disputed' | 'cancelled';
const SUPPLIER_FILTERS: { key: StatusFilter; label: string; statuses: string[] }[] = [
  { key: 'all',        label: 'All',              statuses: [] },
  { key: 'processing', label: 'Pending Dispatch', statuses: ['paid', 'processing', 'pending', 'packed'] },
  { key: 'shipped',    label: 'In Transit',       statuses: ['shipped', 'awaiting_confirmation'] },
  { key: 'completed',  label: 'Completed',        statuses: ['completed', 'delivered'] },
  { key: 'disputed',   label: 'Disputed',         statuses: ['disputed'] },
  { key: 'cancelled',  label: 'Cancelled',        statuses: ['cancelled'] },
];

// Does this order need attention from the current viewer?
const needsAttention = (o: any, isSupplier: boolean) => {
  if (isSupplier) {
    if (['pending', 'paid', 'processing', 'packed'].includes(o.status)) return true;
    if (o.status === 'disputed' && o._dispute && ['validated', 'reopened'].includes(o._dispute.status)) return true;
    return false;
  }
  if (['shipped', 'awaiting_confirmation', 'delivered'].includes(o.status)) return true;
  if (o.status === 'disputed' && o._dispute?.status === 'supplier_resolved') return true;
  return false;
};

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [manageOrder, setManageOrder] = useState<any | null>(null);
  const { user } = useSelector((state: any) => state.auth);
  const profile = useSelector((state: any) => state.supplier?.profile);
  const { socket } = useSocket();

  const isSupplier = user?.role === 'supplier';
  // V1: AMJ provides no logistics — every supplier ships with their own courier.
  // (V2 will re-introduce AMJ logistics via profile.usesOwnShipping.)
  const isOwnShipping = true;

  // Resolution methods this supplier offers (from onboarding policy); legacy/unset → both
  const policy = profile?.businessDetails?.returnPolicyType;
  const allowedMethods: ('refund' | 'replacement')[] =
    policy === 'refund'      ? ['refund'] :
    policy === 'replacement' ? ['replacement'] :
    ['refund', 'replacement'];

  useEffect(() => { fetchOrders(); }, [user?.role]);

  const fetchOrdersRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchOrdersRef.current();
    socket.on('order_update', handler);
    return () => { socket.off('order_update', handler); };
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const res = user?.role === 'supplier' ? await orderApi.supplierOrders() : await orderApi.list();
      const list = (res.data ?? []) as any[];
      const disputed = list.filter(o => o.status === 'disputed');
      if (disputed.length) {
        const disputes = await Promise.all(disputed.map(o => orderApi.getDispute(o._id).catch(() => null)));
        const map = new Map(disputed.map((o, i) => [o._id, disputes[i]]));
        list.forEach(o => { if (map.has(o._id)) o._dispute = map.get(o._id); });
      }
      const DONE = new Set(['completed', 'delivered', 'cancelled']);
      list.sort((a, b) => {
        const aDone = DONE.has(a.status) ? 1 : 0;
        const bDone = DONE.has(b.status) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setOrders(list);
      // keep the managed order's dispute data fresh if its card is open
      setManageOrder((cur: any) => cur ? (list.find(o => o._id === cur._id) ?? cur) : cur);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };
  fetchOrdersRef.current = fetchOrders;

  // ── Manage page (full-screen, replaces list) ──
  if (manageOrder) {
    return (
      <OrderManage
        order={manageOrder}
        isSupplier={isSupplier}
        isOwnShipping={isOwnShipping}
        allowedMethods={allowedMethods}
        onBack={() => setManageOrder(null)}
        onRefresh={fetchOrders}
      />
    );
  }

  // ── Filtering + pagination ──
  const filteredOrders = (() => {
    let result = orders;
    if (isSupplier && statusFilter !== 'all') {
      const cfg = SUPPLIER_FILTERS.find(f => f.key === statusFilter);
      if (cfg) result = result.filter(o => cfg.statuses.includes(o.status));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(o => {
        const buyerName = (o.snapshot?.buyerName || o.buyerId?.name || '').toLowerCase();
        const buyerPhone = (o.snapshot?.buyerPhone || o.buyerId?.phone || '').toLowerCase();
        const orderNum = (o.orderNumber || '').toLowerCase();
        const itemNames = (o.items || []).map((i: any) => i.name.toLowerCase()).join(' ');
        const amount = String(o.totalAmount || '');
        return buyerName.includes(q) || buyerPhone.includes(q) || orderNum.includes(q) || itemNames.includes(q) || amount.includes(q);
      });
    }
    return result;
  })();

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-[#64748b]">
        <div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-primary rounded-full animate-spin" />
        <p className="text-sm m-0">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-[#64748b]">
        <ShoppingBag size={64} strokeWidth={1} />
        <h3 className="text-lg font-bold text-[#1e293b] m-0">No Orders Yet</h3>
        <p className="text-sm text-center m-0">{isSupplier ? "You haven't received any orders yet." : "You haven't placed any orders yet."}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header + search */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-base font-extrabold text-[#0f172a] m-0 shrink-0">
          {isSupplier ? 'Received Orders' : 'My Orders'}
          <span className="ml-2 text-xs font-bold text-[#94a3b8] bg-[#f1f5f9] px-2 py-0.5 rounded-full">{filteredOrders.length}</span>
        </h3>
        <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2 bg-[#f8fafc] focus-within:border-primary focus-within:bg-white transition-colors min-w-[220px] max-w-[320px] flex-1">
          <Search size={14} className="text-[#94a3b8] shrink-0" />
          <input className="border-none outline-none text-sm bg-transparent flex-1 text-[#1e293b] placeholder:text-[#94a3b8]"
            placeholder={isSupplier ? 'Order ID, buyer, item, amount…' : 'Search orders…'}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button onClick={() => { setSearch(''); setPage(1); }} className="text-[#94a3b8] hover:text-[#475569] bg-transparent border-none cursor-pointer p-0 leading-none">×</button>}
        </div>
      </div>

      {/* Supplier status tabs */}
      {isSupplier && (
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SUPPLIER_FILTERS.map(f => {
            const base = search.trim()
              ? orders.filter(o => {
                  const q = search.trim().toLowerCase();
                  const buyerName = (o.snapshot?.buyerName || o.buyerId?.name || '').toLowerCase();
                  const orderNum = (o.orderNumber || '').toLowerCase();
                  const itemNames = (o.items || []).map((i: any) => i.name.toLowerCase()).join(' ');
                  return buyerName.includes(q) || orderNum.includes(q) || itemNames.includes(q);
                })
              : orders;
            const count = f.key === 'all' ? base.length : base.filter(o => f.statuses.includes(o.status)).length;
            const isActive = statusFilter === f.key;
            return (
              <button key={f.key} onClick={() => { setStatusFilter(f.key); setPage(1); }}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-[8px] border transition-colors cursor-pointer ${isActive ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary hover:text-primary'}`}>
                {f.label}
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {paginatedOrders.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 text-[#64748b]">
          <ShoppingBag size={48} strokeWidth={1} />
          <p className="text-sm font-semibold m-0">No orders in this category.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {paginatedOrders.map(order => {
          const cfg = getStatusConfig(order.status);
          const StatusIcon = cfg.Icon;
          const product = order.quotationId?.conversationId?.productId;
          const productImage = product?.images?.[0] || '';
          const attention = needsAttention(order, isSupplier);

          return (
            <div key={order._id} className="bg-white border border-[#eef2f6] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-5 py-4 bg-[#fafbfc] border-b border-[#f1f5f9] flex items-center justify-between flex-wrap gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Order ID</span>
                  <span className="text-xs font-extrabold text-[#0f172a] bg-[#e2e8f0] px-2.5 py-1 rounded-full">{order.orderNumber}</span>
                </div>
                <span>Ordered: <strong className="text-[#475569]">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
              </div>

              {/* Body */}
              <div className="p-5 flex gap-5 items-start max-sm:flex-col">
                <div className="w-[88px] h-[88px] rounded-[12px] overflow-hidden bg-[#f8fafc] border border-[#eef2f6] shrink-0 flex items-center justify-center shadow-inner max-sm:w-full max-sm:h-[120px]">
                  {productImage ? <img src={productImage} alt={order.items[0]?.name || 'Product'} className="w-full h-full object-cover" /> : (
                    <div className="flex flex-col items-center justify-center gap-1 text-[#cbd5e1]"><Package size={28} strokeWidth={1.5} /><span className="text-[8px] font-bold uppercase tracking-wide text-[#94a3b8]">No Image</span></div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx}>
                      <h4 className="text-sm font-extrabold text-[#0f172a] m-0 line-clamp-2">{item.name}</h4>
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
                        <span>₹{item.price.toLocaleString('en-IN')}/{item.unit || 'pcs'}</span><span className="text-[#cbd5e1]">•</span><span>Qty: {item.quantity} {item.unit || 'pcs'}</span>
                      </div>
                    </div>
                  ))}
                  {order.status === 'disputed' && order._dispute && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#b91c1c] bg-[#fef2f2] border border-[#fca5a5] px-2 py-0.5 rounded-full w-fit mt-1">
                      <AlertTriangle size={10} /> {order._dispute.issueType} issue
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end justify-between self-stretch shrink-0 text-right min-h-[88px] max-sm:items-start max-sm:text-left max-sm:w-full max-sm:self-auto max-sm:min-h-0 max-sm:gap-3 max-sm:border-t max-sm:border-[#f1f5f9] max-sm:pt-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider m-0 mb-1">Total Amount</p>
                    <p className="text-xl font-extrabold text-[#0f172a] m-0">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm w-fit" style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
                    <StatusIcon size={12} /> {cfg.label}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-[#64748b]">
                  <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse shrink-0" />
                  {isSupplier
                    ? <span>Buyer: <strong className="text-[#475569]">{order.snapshot?.buyerName || order.buyerId?.name || 'Customer'}</strong></span>
                    : <span>Supplier: <strong className="text-[#475569]">{order.snapshot?.supplierBusinessName || order.supplierId?.companyName || order.supplierId?.name || 'Unknown'}</strong></span>}
                </div>

                <div className="flex items-center gap-2">
                  {!isSupplier && order.poNumber && (
                    <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/api/orders/${order._id}/po-download`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0369a1] bg-[#eff6ff] border border-[#bfdbfe] rounded-[6px] no-underline hover:bg-[#dbeafe]">
                      <Download size={12} /> PO
                    </a>
                  )}
                  {attention && <span className="text-[10px] font-bold text-[#dc2626] bg-[#fef2f2] border border-[#fca5a5] px-2 py-0.5 rounded-full">Action needed</span>}
                  <button onClick={() => setManageOrder(order)} className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-primary rounded-[6px] hover:opacity-90 border-none cursor-pointer">
                    {isSupplier ? 'Manage Order' : 'View Order'} <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#f1f5f9]">
          <p className="text-xs text-[#94a3b8] m-0">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-bold text-[#475569] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs font-bold rounded-[6px] border cursor-pointer transition-colors ${p === page ? 'bg-primary text-white border-primary' : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary hover:text-primary'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-bold text-[#475569] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
