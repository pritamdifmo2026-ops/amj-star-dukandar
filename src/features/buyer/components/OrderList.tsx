import React, { useEffect, useState } from 'react';
import { orderApi } from '@/features/order/services/order.api';
import { ShoppingBag, ChevronRight, Clock, Package } from 'lucide-react';
import { useSelector } from 'react-redux';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state: any) => state.auth);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try { const res = await orderApi.list(); setOrders(res.data ?? []); }
    catch (err) { console.error('Failed to fetch orders', err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-[#64748b]">
        <div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-primary rounded-full animate-spin" />
        <p className="text-sm m-0">Loading orders...</p>
      </div>
    );
  }

  const isSupplier = user?.role === 'supplier';

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-extrabold text-[#0f172a] m-0">{isSupplier ? 'Received Orders' : 'My Orders'} ({orders.length})</h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {orders.map(order => (
          <div key={order._id} className="bg-white border border-[#eef2f6] rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-5 flex items-start justify-between gap-4 max-sm:flex-col">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold text-primary bg-[#fff7ed] px-2.5 py-1 rounded-full">{order.orderNumber}</span>
                  <span className="text-xs text-[#94a3b8]">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-[#475569]">
                      <Package size={14} className="text-[#94a3b8] shrink-0" />
                      <span>{item.name}</span>
                      <span className="text-[#94a3b8]">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-[#94a3b8] m-0 mb-1">Order Value</p>
                <p className="text-lg font-extrabold text-[#0f172a] m-0">₹{order.totalAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="px-5 py-3 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#a16207]">
                  <Clock size={12} /> {isSupplier ? 'To be Processed' : 'Pending (Processing)'}
                </div>
                <span className="text-xs text-[#94a3b8]">
                  {isSupplier ? `Buyer: ${order.buyerId?.name || 'Customer'}` : `Seller: ${order.supplierId?.companyName || order.supplierId?.name || 'Unknown'}`}
                </span>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-bold text-primary bg-transparent border-none cursor-pointer hover:underline p-0">
                Manage Order <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderList;
