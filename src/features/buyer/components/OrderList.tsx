import React, { useEffect, useState } from 'react';
import { orderApi } from '@/features/order/services/order.api';
import { ShoppingBag, Package, X, Truck, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';

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

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ trackingId: string } | null>(null);
  const [dispatchError, setDispatchError] = useState('');
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

  const isSupplier = user?.role === 'supplier';

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-[#0f172a] m-0">{isSupplier ? 'Received Orders' : 'My Orders'} ({orders.length})</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {orders.map(order => {
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
                    <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
                    <span>
                      {isSupplier
                        ? <>Buyer: <strong className="text-[#475569]">{order.buyerId?.name || 'Customer'}</strong></>
                        : <>Supplier: <strong className="text-[#475569]">{order.supplierId?.companyName || order.supplierId?.name || 'Unknown'}</strong></>}
                    </span>
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
                </div>
              </div>
            );
          })}
        </div>
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
                <span>Buyer: <strong className="text-[#0f172a]">{selectedOrder.buyerId?.name || 'Customer'}</strong></span>
                <span>{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>

              {/* Items */}
              <div className="bg-[#f8fafc] rounded-[10px] border border-[#eef2f6] divide-y divide-[#f1f5f9]">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-[#94a3b8]" />
                      <span className="text-sm text-[#1e293b] font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#94a3b8]">×{item.quantity} {item.unit}</span>
                      <span className="ml-3 text-sm font-bold text-[#0f172a]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 bg-[#fff7ed]">
                  <span className="text-sm font-bold text-[#0f172a]">Total</span>
                  <span className="text-base font-extrabold text-primary">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

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
