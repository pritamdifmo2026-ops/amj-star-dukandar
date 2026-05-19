import React, { useEffect, useState } from 'react';
import { orderApi } from '@/shared/services/order.api';
import { ShoppingBag, ChevronRight, Clock, Package } from 'lucide-react';
import { useSelector } from 'react-redux';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state: any) => state.auth);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderApi.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-[60px] text-center flex flex-col items-center gap-4 text-gray-500">
        <div className="w-10 h-10 border-3 border-gray-100 border-t-[#e65c00] rounded-full animate-spin"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  const isSupplier = user?.role === 'supplier';

  if (orders.length === 0) {
    return (
      <div className="py-5">
        <div className="px-5 py-[80px] text-center flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-200 rounded-[16px] min-h-[400px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <ShoppingBag size={64} strokeWidth={1.5} />
          <h3 className="text-gray-900 my-5 text-[20px] font-bold">No Orders Yet</h3>
          <p className="max-w-[300px] text-[14px]">{isSupplier ? "You haven't received any orders yet." : "You haven't placed any orders yet."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-5">
      <div className="mb-6">
        <h3 className="text-[20px] font-bold text-gray-900">{isSupplier ? 'Received Orders' : 'My Orders'} ({orders.length})</h3>
      </div>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white border border-gray-200 rounded-[16px] overflow-hidden transition-all duration-200 ease shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#e65c00] hover:shadow-[0_4px_12px_rgba(230,92,0,0.08)] hover:-translate-y-[2px]">
            <div className="p-5 flex justify-between gap-5 border-b border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-['JetBrains_Mono',monospace] font-bold text-gray-900 text-[14px] bg-gray-100 px-2.5 py-1 rounded-md">{order.orderNumber}</span>
                  <span className="text-[13px] text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-700 text-[14px]">
                      <Package size={16} className="text-gray-400" />
                      <span className="font-medium flex-1">{item.name}</span>
                      <span className="text-gray-500 font-semibold">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end justify-center min-w-[120px]">
                <span className="text-[12px] text-gray-500 uppercase tracking-widest mb-1">Order Value</span>
                <span className="text-[20px] font-extrabold text-[#e65c00]">₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="py-3 px-5 bg-[#fafafa] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-[#fff7f0] text-[#e65c00] px-2.5 py-1 rounded-[20px] text-[12px] font-bold border border-[#ffecd9]">
                  <Clock size={14} />
                  <span>{isSupplier ? 'To be Processed' : 'Pending (Processing)'}</span>
                </div>
                <span className="text-[13px] text-gray-500 font-medium">
                  {isSupplier 
                    ? `Buyer: ${order.buyerId?.name || 'Customer'}` 
                    : `Seller: ${order.supplierId?.companyName || order.supplierId?.name || 'Unknown'}`
                  }
                </span>
              </div>
              <button className="bg-transparent border border-gray-200 py-1.5 px-3.5 rounded-lg text-[13px] font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer transition-all duration-200 ease hover:bg-white hover:border-gray-900 hover:text-gray-900">
                Manage Order <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderList;
