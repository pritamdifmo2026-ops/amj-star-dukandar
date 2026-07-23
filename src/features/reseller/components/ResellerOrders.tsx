import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Package, Truck, CheckCircle2, Clock, XCircle, FileText, X, Phone, Mail, IndianRupee } from 'lucide-react';
import apiClient from '@/api/client';
import Button from '@/shared/components/ui/Button';
import resellerService from '../services/reseller.service';

interface ResellerOrder {
  _id: string;
  orderNumber: string;
  buyerId?: { _id: string; name?: string; phone?: string; email?: string };
  supplierId?: { _id: string; name?: string; companyName?: string };
  items: Array<{ name: string; quantity: number; price: number; unit?: string }>;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  poNumber?: string;
  poUrl?: string;
  trackingId?: string;
  courierName?: string;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
}

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:                { label: 'Processing', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock size={13} /> },
  paid:                   { label: 'Processing', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock size={13} /> },
  packed:                 { label: 'Packed', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Package size={13} /> },
  dispatched:             { label: 'Shipped', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Truck size={13} /> },
  awaiting_confirmation:  { label: 'Delivered', cls: 'bg-teal-50 text-teal-700 border-teal-200', icon: <CheckCircle2 size={13} /> },
  completed:              { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 size={13} /> },
  disputed:               { label: 'Disputed', cls: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle size={13} /> },
  cancelled:              { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: <XCircle size={13} /> },
};

const statusMeta = (status: string) => STATUS_META[status] || { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Clock size={13} /> };

const TIMELINE_STEPS = ['pending', 'packed', 'dispatched', 'awaiting_confirmation', 'completed'];
const TIMELINE_LABELS: Record<string, string> = {
  pending: 'Order Placed', packed: 'Packed', dispatched: 'Shipped',
  awaiting_confirmation: 'Delivered', completed: 'Completed',
};

const ResellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<ResellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<ResellerOrder | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await resellerService.getOrders();
      setOrders(data.orders || []);
    } catch (err) { console.error('Failed to fetch reseller orders', err); }
    finally { setLoading(false); }
  };

  const downloadInvoice = async (order: ResellerOrder) => {
    setDownloading(true);
    try {
      const res = await apiClient.get(`/order/${order._id}/po-download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.poNumber || order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Invoice download failed', err);
      alert('Could not download the invoice. Please try again.');
    } finally { setDownloading(false); }
  };

  const filtered = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      o.orderNumber?.toLowerCase().includes(term) ||
      o.buyerId?.name?.toLowerCase().includes(term) ||
      o.items?.some(i => i.name?.toLowerCase().includes(term));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
  const totalValue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.totalAmount || 0), 0);

  const timelineIndex = (status: string) => {
    if (status === 'paid') return 0;
    const idx = TIMELINE_STEPS.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">Customer Orders</h2>
          <p className="text-sm text-[#64748b] m-0">Orders placed by buyers through your storefront.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Processing</option>
            <option value="packed">Packed</option>
            <option value="dispatched">Shipped</option>
            <option value="awaiting_confirmation">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
        {[
          { label: 'Total Orders', val: String(orders.length), icon: <ShoppingBag size={20} />, cls: 'bg-blue-100 text-blue-800' },
          { label: 'Active Orders', val: String(activeCount), icon: <Truck size={20} />, cls: 'bg-amber-100 text-amber-800' },
          { label: 'Total Order Value', val: `₹${totalValue.toLocaleString('en-IN')}`, icon: <IndianRupee size={20} />, cls: 'bg-green-100 text-green-800' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-extrabold text-gray-900">{stat.val}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.cls}`}>{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading orders...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingBag size={36} className="text-gray-300" />
                      <p className="font-semibold text-gray-700 m-0">No orders yet</p>
                      <p className="text-xs m-0">Orders placed via your storefront will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(order => {
                  const meta = statusMeta(order.status);
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block">{order.orderNumber}</span>
                        {order.poNumber && <span className="text-[11px] text-gray-500">PO: {order.poNumber}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800 block">{order.buyerId?.name || 'Customer'}</span>
                        {order.buyerId?.phone && <span className="text-xs text-gray-500">{order.buyerId.phone}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700 block truncate max-w-[200px]">{order.items?.[0]?.name}</span>
                        {order.items?.length > 1 && <span className="text-xs text-gray-500">+{order.items.length - 1} more</span>}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.cls}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelected(order)}
                          className="text-xs font-bold text-primary bg-none border-none cursor-pointer hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail drawer/modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 z-10">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 m-0">{selected.orderNumber}</h3>
                <span className="text-xs text-gray-500">
                  Placed {new Date(selected.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg border-none bg-transparent cursor-pointer" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              {/* Status timeline */}
              {!['cancelled', 'disputed'].includes(selected.status) ? (
                <div className="flex items-center">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const reached = idx <= timelineIndex(selected.status);
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reached ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {reached ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                          </div>
                          <span className={`text-[10px] font-bold text-center ${reached ? 'text-gray-900' : 'text-gray-400'}`}>{TIMELINE_LABELS[step]}</span>
                        </div>
                        {idx < TIMELINE_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mb-5 ${idx < timelineIndex(selected.status) ? 'bg-primary' : 'bg-gray-200'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className={`px-4 py-3 rounded-lg border text-sm font-semibold ${statusMeta(selected.status).cls}`}>
                  This order is {statusMeta(selected.status).label.toLowerCase()}.
                </div>
              )}

              {/* Tracking */}
              {selected.trackingId && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                  <strong>Shipment:</strong> {selected.courierName || 'Courier'} — Tracking ID <strong>{selected.trackingId}</strong>
                </div>
              )}

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 m-0 mb-2">Customer</p>
                  <p className="font-bold text-gray-900 m-0 mb-1">{selected.buyerId?.name || 'Customer'}</p>
                  {selected.buyerId?.phone && <p className="text-xs text-gray-600 m-0 flex items-center gap-1.5"><Phone size={11} /> {selected.buyerId.phone}</p>}
                  {selected.buyerId?.email && <p className="text-xs text-gray-600 m-0 flex items-center gap-1.5 mt-0.5"><Mail size={11} /> {selected.buyerId.email}</p>}
                </div>
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 m-0 mb-2">Fulfilled By (Supplier)</p>
                  <p className="font-bold text-gray-900 m-0">{selected.supplierId?.companyName || selected.supplierId?.name || 'Supplier'}</p>
                </div>
              </div>

              {/* Items */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 text-xs font-bold">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selected.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-semibold text-gray-800">{item.name}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{item.quantity} {item.unit || ''}</td>
                        <td className="px-4 py-3 text-right text-gray-600">₹{item.price?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">₹{(item.price * item.quantity)?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-xs text-gray-500">Subtotal</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-800">₹{selected.subtotal?.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-xs text-gray-500">Shipping</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-800">₹{selected.shippingCost?.toLocaleString('en-IN') || 0}</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-gray-900">Total</td>
                      <td className="px-4 py-3 text-right text-base font-extrabold text-primary">₹{selected.totalAmount?.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                {(selected.poNumber || selected.poUrl) && (
                  <Button onClick={() => downloadInvoice(selected)} disabled={downloading} className="flex items-center gap-2">
                    <FileText size={16} /> {downloading ? 'Downloading...' : 'Download Invoice'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResellerOrders;
