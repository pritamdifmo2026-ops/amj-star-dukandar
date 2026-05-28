import React, { useEffect, useState } from 'react';
import { orderApi } from '@/features/order/services/order.api';
import { ShoppingBag, Package, X, Truck, CheckCircle, Clock, XCircle, ChevronRight, Download, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.FC<any> }> = {
  paid:       { label: 'Pending Dispatch', color: '#a16207', bg: '#fefce8', border: '#fde047', Icon: Clock },
  processing: { label: 'Pending Dispatch', color: '#a16207', bg: '#fefce8', border: '#fde047', Icon: Clock },
  shipped:    { label: 'Dispatched',       color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', Icon: Truck },
  delivered:  { label: 'Delivered',        color: '#15803d', bg: '#f0fdf4', border: '#86efac', Icon: CheckCircle },
  cancelled:  { label: 'Cancelled',        color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', Icon: XCircle },
  pending:    { label: 'Processing',       color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', Icon: Clock },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? { label: status, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', Icon: Clock };

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const SUPPLIER_FILTERS: { key: StatusFilter; label: string; statuses: string[] }[] = [
  { key: 'all',        label: 'All',              statuses: [] },
  { key: 'processing', label: 'Pending Dispatch',  statuses: ['paid', 'processing', 'pending'] },
  { key: 'shipped',    label: 'Dispatched',         statuses: ['shipped'] },
  { key: 'delivered',  label: 'Delivered',          statuses: ['delivered'] },
  { key: 'cancelled',  label: 'Cancelled',          statuses: ['cancelled'] },
];

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ trackingId: string } | null>(null);
  const [dispatchError, setDispatchError] = useState('');
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState<string | null>(null);
  const [deliveryConfirming, setDeliveryConfirming] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { user } = useSelector((state: any) => state.auth);

  useEffect(() => { fetchOrders(); }, [user?.role]);

  const fetchOrders = async () => {
    try {
      if (user?.role === 'supplier') {
        const res = await orderApi.supplierOrders();
        setOrders(res.data ?? []);
      } else {
        const res = await orderApi.list();
        setOrders(res.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!selectedOrder) return;
    setDispatching(true);
    setDispatchError('');
    try {
      const result = await orderApi.dispatch(selectedOrder._id);
      setDispatchResult(result);
      setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, status: 'shipped', trackingId: result.trackingId } : o));
      setSelectedOrder((prev: any) => prev ? { ...prev, status: 'shipped', trackingId: result.trackingId } : null);
    } catch (err: any) {
      setDispatchError(err?.response?.data?.message || 'Failed to dispatch order. Please try again.');
    } finally {
      setDispatching(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setDispatchResult(null);
    setDispatchError('');
  };

  const handleConfirmDelivery = async (orderId: string) => {
    setDeliveryConfirming(true);
    try {
      await orderApi.confirmDelivery(orderId);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'delivered' } : o));
      setConfirmingDeliveryId(null);
      toast.success('Delivery confirmed! Thank you.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setDeliveryConfirming(false);
    }
  };

  const isSupplier = user?.role === 'supplier';

  const filteredOrders = (() => {
    let result = orders;
    // Status filter (supplier only)
    if (isSupplier && statusFilter !== 'all') {
      const cfg = SUPPLIER_FILTERS.find(f => f.key === statusFilter);
      if (cfg) result = result.filter(o => cfg.statuses.includes(o.status));
    }
    // Search filter
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
    <>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h3 className="text-base font-extrabold text-[#0f172a] m-0 shrink-0">
            {isSupplier ? 'Received Orders' : 'My Orders'}
            <span className="ml-2 text-xs font-bold text-[#94a3b8] bg-[#f1f5f9] px-2 py-0.5 rounded-full">
              {filteredOrders.length}
            </span>
          </h3>
          <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2 bg-[#f8fafc] focus-within:border-primary focus-within:bg-white transition-colors min-w-[220px] max-w-[320px] flex-1">
            <Search size={14} className="text-[#94a3b8] shrink-0" />
            <input
              className="border-none outline-none text-sm bg-transparent flex-1 text-[#1e293b] placeholder:text-[#94a3b8]"
              placeholder={isSupplier ? 'Order ID, buyer, item, amount…' : 'Search orders…'}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="text-[#94a3b8] hover:text-[#475569] bg-transparent border-none cursor-pointer p-0 leading-none">×</button>
            )}
          </div>
        </div>

        {/* Status filter tabs — supplier only */}
        {isSupplier && (
          <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUPPLIER_FILTERS.map(f => {
              const base = search.trim()
                ? (() => {
                    const q = search.trim().toLowerCase();
                    return orders.filter(o => {
                      const buyerName = (o.snapshot?.buyerName || o.buyerId?.name || '').toLowerCase();
                      const buyerPhone = (o.snapshot?.buyerPhone || o.buyerId?.phone || '').toLowerCase();
                      const orderNum = (o.orderNumber || '').toLowerCase();
                      const itemNames = (o.items || []).map((i: any) => i.name.toLowerCase()).join(' ');
                      const amount = String(o.totalAmount || '');
                      return buyerName.includes(q) || buyerPhone.includes(q) || orderNum.includes(q) || itemNames.includes(q) || amount.includes(q);
                    });
                  })()
                : orders;
              const count = f.key === 'all' ? base.length : base.filter(o => f.statuses.includes(o.status)).length;
              const isActive = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => { setStatusFilter(f.key); setPage(1); }}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-[8px] border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary hover:text-primary'
                  }`}
                >
                  {f.label}
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state for current filter */}
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
            
            // Extract product from populated quotationId -> conversationId -> productId
            const product = order.quotationId?.conversationId?.productId;
            const productImage = product?.images?.[0] || '';
            const brand = product?.brand;
            const category = product?.category;
            const specs = product?.specifications || {};
            
            // Build attributes chips
            const attributes: string[] = [];
            if (brand) attributes.push(`Brand: ${brand}`);
            if (category) attributes.push(`Category: ${category}`);
            if (specs && typeof specs === 'object') {
              Object.entries(specs).slice(0, 3).forEach(([k, v]) => {
                if (typeof v === 'string') {
                  attributes.push(`${k}: ${v}`);
                }
              });
            }

            return (
              <div key={order._id} className="bg-white border border-[#eef2f6] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all overflow-hidden flex flex-col">
                {/* Header Section */}
                <div className="px-5 py-4 bg-[#fafbfc] border-b border-[#f1f5f9] flex items-center justify-between flex-wrap gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Order ID</span>
                    <span className="text-xs font-extrabold text-[#0f172a] bg-[#e2e8f0] px-2.5 py-1 rounded-full">{order.orderNumber}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#94a3b8] font-medium">
                    <span>Ordered: <strong className="text-[#475569]">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1] max-sm:hidden" />
                    <span>Last Update: <strong className="text-[#475569]">{new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  </div>
                </div>

                {/* Main Content Body */}
                <div className="p-5 flex gap-5 items-start max-sm:flex-col">
                  {/* Left Side: Product Image */}
                  <div className="w-[88px] h-[88px] rounded-[12px] overflow-hidden bg-[#f8fafc] border border-[#eef2f6] shrink-0 flex items-center justify-center shadow-inner max-sm:w-full max-sm:h-[120px]">
                    {productImage ? (
                      <img src={productImage} alt={order.items[0]?.name || 'Product'} className="w-full h-full object-cover transition-transform hover:scale-105" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 text-[#cbd5e1]">
                        <Package size={28} strokeWidth={1.5} />
                        <span className="text-[8px] font-bold uppercase tracking-wide text-[#94a3b8]">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Middle Section: Items and Attributes */}
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <h4 className="text-sm font-extrabold text-[#0f172a] m-0 line-clamp-2 hover:text-primary transition-colors">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
                            <span>Price: ₹{item.price.toLocaleString('en-IN')}/{item.unit || 'pcs'}</span>
                            <span className="text-[#cbd5e1]">•</span>
                            <span>Qty: {item.quantity} {item.unit || 'pcs'}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Attributes chips list */}
                    {attributes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {attributes.map((attr, idx) => (
                          <span key={idx} className="text-[10px] font-bold text-[#475569] bg-[#f1f5f9] px-2 py-0.5 rounded-[6px] border border-[#e2e8f0]/40">
                            {attr}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Pricing and Status */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0 text-right min-h-[88px] max-sm:items-start max-sm:text-left max-sm:w-full max-sm:self-auto max-sm:min-h-0 max-sm:gap-4 max-sm:border-t max-sm:border-[#f1f5f9] max-sm:pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider m-0 mb-1">Total Amount</p>
                      <p className="text-xl font-extrabold text-[#0f172a] m-0">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 max-sm:items-start">
                      <div
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm w-fit"
                        style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
                      >
                        <StatusIcon size={12} />
                        {cfg.label}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="px-5 py-3.5 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-[#64748b]">
                    <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse shrink-0" />
                    {isSupplier ? (
                      <div className="flex flex-col gap-0.5">
                        <span>Buyer: <strong className="text-[#475569]">{order.snapshot?.buyerName || order.buyerId?.name || 'Customer'}</strong></span>
                        {(order.snapshot?.buyerPhone || order.buyerId?.phone) && (
                          <a
                            href={`tel:${order.snapshot?.buyerPhone || order.buyerId?.phone}`}
                            className="text-[#0369a1] font-semibold no-underline hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            📞 {order.snapshot?.buyerPhone || order.buyerId?.phone}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span>Supplier: <strong className="text-[#475569]">{order.snapshot?.supplierBusinessName || order.supplierId?.companyName || order.supplierId?.name || 'Unknown'}</strong></span>
                    )}
                  </div>

                  {isSupplier && (
                    <button
                      onClick={() => { setSelectedOrder(order); setDispatchResult(null); setDispatchError(''); }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-[6px] hover:opacity-90 transition-opacity border-none cursor-pointer"
                    >
                      <span>Manage Order</span>
                      <ChevronRight size={13} />
                    </button>
                  )}

                  {!isSupplier && (
                    <div className="flex items-center gap-2">
                      {order.poNumber && (
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/api/orders/${order._id}/po-download`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0369a1] bg-[#eff6ff] border border-[#bfdbfe] rounded-[6px] no-underline hover:bg-[#dbeafe] transition-colors"
                        >
                          <Download size={12} /> PO
                        </a>
                      )}
                      {order.status === 'shipped' && confirmingDeliveryId !== order._id && (
                        <button
                          onClick={() => setConfirmingDeliveryId(order._id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#059669] rounded-[6px] border-none cursor-pointer hover:bg-[#047857]"
                        >
                          <CheckCircle size={12} /> Confirm Delivery
                        </button>
                      )}
                      {order.status === 'shipped' && confirmingDeliveryId === order._id && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#64748b]">Received your order?</span>
                          <button
                            onClick={() => setConfirmingDeliveryId(null)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0] rounded-[6px] cursor-pointer border-none"
                          >No</button>
                          <button
                            onClick={() => handleConfirmDelivery(order._id)}
                            disabled={deliveryConfirming}
                            className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#059669] rounded-[6px] border-none cursor-pointer disabled:opacity-50"
                          >{deliveryConfirming ? 'Confirming…' : 'Yes, Delivered'}</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#f1f5f9]">
            <p className="text-xs text-[#94a3b8] m-0">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-bold text-[#475569] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs font-bold rounded-[6px] border cursor-pointer transition-colors ${
                    p === page
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-primary hover:text-primary'
                  }`}
                >{p}</button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-bold text-[#475569] bg-white border border-[#e2e8f0] rounded-[6px] cursor-pointer hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Manage Order Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px]"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full sm:max-w-lg bg-white rounded-t-[20px] sm:rounded-[16px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
              <div>
                <h3 className="text-base font-extrabold text-[#0f172a] m-0">Manage Order</h3>
                <p className="text-xs text-[#94a3b8] m-0 mt-0.5">{selectedOrder.orderNumber}</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] transition-colors border-none bg-transparent cursor-pointer text-[#64748b]">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
              {/* Order date + buyer */}
              <div className="flex items-center justify-between text-xs text-[#64748b]">
                <span>Buyer: <strong className="text-[#0f172a]">{selectedOrder.snapshot?.buyerName || selectedOrder.buyerId?.name || 'Customer'}</strong></span>
                <span>{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>

              {/* Items */}
              <div className="bg-[#f8fafc] rounded-[10px] border border-[#eef2f6] divide-y divide-[#f1f5f9]">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package size={14} className="text-[#94a3b8] shrink-0" />
                      <span className="text-sm text-[#1e293b] font-medium truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-xs text-[#94a3b8]">×{item.quantity} {item.unit || 'pcs'}</span>
                      <span className="ml-2 text-sm font-bold text-[#0f172a]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}

                {/* Cost breakdown from snapshot */}
                {(() => {
                  const snap = selectedOrder.snapshot || {};
                  const taxable = snap.taxableAmount ?? selectedOrder.subtotal ?? 0;
                  const gstAmt = snap.gstAmount ?? 0;
                  const shipping = selectedOrder.shippingCost ?? 0;
                  const gstType = snap.gstType;
                  const gstRate = snap.gstRate ?? 0;
                  const halfRate = gstRate / 2;
                  const showGst = gstType && gstType !== 'exempt' && gstAmt > 0;
                  return (
                    <>
                      <div className="flex items-center justify-between px-4 py-2 text-xs text-[#64748b]">
                        <span>Taxable Amount</span>
                        <span className="font-medium text-[#0f172a]">₹{taxable.toLocaleString('en-IN')}</span>
                      </div>
                      {showGst && gstType === 'IGST' && (
                        <div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]">
                          <span>IGST @ {gstRate}%</span>
                          <span className="font-medium">₹{gstAmt.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {showGst && gstType === 'CGST_SGST' && (
                        <>
                          <div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]">
                            <span>CGST @ {halfRate}%</span>
                            <span className="font-medium">₹{(gstAmt / 2).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center justify-between px-4 py-2 text-xs text-[#0369a1]">
                            <span>SGST @ {halfRate}%</span>
                            <span className="font-medium">₹{(gstAmt / 2).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}
                      {!showGst && (
                        <div className="flex items-center justify-between px-4 py-2 text-xs text-[#94a3b8]">
                          <span>GST</span><span>Exempt / Nil</span>
                        </div>
                      )}
                      {shipping > 0 && (
                        <div className="flex items-center justify-between px-4 py-2 text-xs text-[#64748b]">
                          <span>Shipping</span>
                          <span className="font-medium text-[#0f172a]">₹{shipping.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="flex items-center justify-between px-4 py-3 bg-[#fff7ed]">
                  <span className="text-sm font-bold text-[#0f172a]">Grand Total</span>
                  <span className="text-base font-extrabold text-primary">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Delivery timeline & shipping notes from snapshot */}
              {(selectedOrder.snapshot?.deliveryTimeline || selectedOrder.snapshot?.shippingNotes) && (
                <div className="bg-[#f8fafc] rounded-[8px] border border-[#eef2f6] px-4 py-3 flex flex-col gap-1">
                  {selectedOrder.snapshot?.deliveryTimeline && (
                    <p className="text-xs text-[#64748b] m-0">
                      Delivery: <strong className="text-[#0f172a]">{selectedOrder.snapshot.deliveryTimeline}</strong>
                    </p>
                  )}
                  {selectedOrder.snapshot?.shippingNotes && (
                    <p className="text-xs text-[#64748b] m-0">
                      Notes: <span className="text-[#475569]">{selectedOrder.snapshot.shippingNotes}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Current status */}
              {(() => {
                const cfg = getStatusConfig(selectedOrder.status);
                const StatusIcon = cfg.Icon;
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#94a3b8] font-medium">Status:</span>
                    <span
                      className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      <StatusIcon size={11} />
                      {cfg.label}
                    </span>
                  </div>
                );
              })()}

              {/* Dispatch success state */}
              {dispatchResult && (
                <div className="bg-[#f0fdf4] border border-[#86efac] rounded-[10px] px-4 py-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[#15803d] font-bold text-sm">
                    <CheckCircle size={16} />
                    Order Dispatched Successfully!
                  </div>
                  <p className="text-xs text-[#166534] m-0">Tracking ID: <strong>{dispatchResult.trackingId}</strong></p>
                  <p className="text-xs text-[#166534] m-0">Courier: AMJSTAR COURIER SERVICES</p>
                  <p className="text-xs text-[#4ade80] m-0 mt-1">✓ Buyer notified via chat &amp; email</p>
                </div>
              )}

              {/* Tracking info if already dispatched */}
              {selectedOrder.status === 'shipped' && !dispatchResult && selectedOrder.trackingId && (
                <div className="bg-[#eff6ff] border border-[#93c5fd] rounded-[10px] px-4 py-3">
                  <p className="text-xs text-[#1d4ed8] font-bold m-0 mb-1">Dispatched</p>
                  <p className="text-xs text-[#1e40af] m-0">Tracking ID: <strong>{selectedOrder.trackingId}</strong></p>
                  <p className="text-xs text-[#1e40af] m-0">Courier: AMJSTAR COURIER SERVICES</p>
                </div>
              )}

              {/* Error */}
              {dispatchError && (
                <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-[10px] px-4 py-3 text-xs text-[#dc2626] font-medium">
                  {dispatchError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-[#f1f5f9] bg-[#fafafa]">
              {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && !dispatchResult ? (
                <button
                  onClick={handleDispatch}
                  disabled={dispatching}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-[10px] text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed border-none cursor-pointer"
                >
                  {dispatching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <Truck size={16} />
                      Ready to Dispatch
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={closeModal}
                  className="w-full py-3 rounded-[10px] text-sm font-bold text-[#64748b] bg-[#f1f5f9] border-none cursor-pointer hover:bg-[#e2e8f0] transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderList;
