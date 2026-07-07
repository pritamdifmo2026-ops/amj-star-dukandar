import React, { useState, useEffect } from 'react';
import { Receipt, IndianRupee, Truck, Download, FileText, Table2, FileSpreadsheet, Loader2 } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

interface Stats {
  totalInvoices: number;
  totalProductAmount: number;
  totalGST: number;
  totalShipping: number;
  grandTotal: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  poNumber?: string;
  createdAt: string;
  subtotal: number;
  totalAmount: number;
  shippingCost?: number;
  status: string;
  buyerId?: { name: string; phone?: string };
  snapshot?: {
    buyerName?: string;
    taxableAmount?: number;
    gstAmount?: number;
    gstRate?: number;
    gstType?: string;
  };
  items: { name: string; quantity: number }[];
}


const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SupplierReports: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'csv'>('pdf');
  const [generating, setGenerating] = useState(false);
  const [openingInvoiceId, setOpeningInvoiceId] = useState<string | null>(null);

  const fetchOrders = async (f?: string, t?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f) params.set('from', f);
      if (t) params.set('to', t);
      const res = await apiClient.get(`/orders/supplier${params.toString() ? `?${params}` : ''}`);
      setStats(res.data.stats);
      setOrders(res.data.data);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleOpenInvoice = async (orderId: string) => {
    if (openingInvoiceId) return;
    setOpeningInvoiceId(orderId);
    try {
      const res = await apiClient.get(`/orders/${orderId}/po-download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error('Failed to open invoice');
    } finally {
      setOpeningInvoiceId(null);
    }
  };

  const handleApplyFilter = () => fetchOrders(from, to);
  const handleClearFilter = () => { setFrom(''); setTo(''); fetchOrders(); };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const params = new URLSearchParams({ format });
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await apiClient.get(`/orders/supplier/report?${params}`, { responseType: 'blob' });

      const ext = format === 'xlsx' ? 'xlsx' : format === 'csv' ? 'csv' : 'pdf';
      const mimeMap = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', csv: 'text/csv' };
      const blob = new Blob([res.data], { type: mimeMap[format] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amjstar-report-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success('Report downloaded! Open from your Downloads folder.');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const statCards = stats ? [
    { label: 'Total Invoices',   value: stats.totalInvoices,              icon: Receipt,     color: '#6366f1', bg: '#eef2ff' },
    { label: 'Product Amount',   value: `₹${fmt(stats.totalProductAmount)}`, icon: IndianRupee, color: '#e65c00', bg: '#fff7ed' },
    { label: 'Total GST',        value: `₹${fmt(stats.totalGST)}`,        icon: IndianRupee, color: '#0369a1', bg: '#eff6ff' },
    { label: 'Shipping Charges', value: `₹${fmt(stats.totalShipping)}`,   icon: Truck,       color: '#64748b', bg: '#f1f5f9' },
    { label: 'Grand Total',      value: `₹${fmt(stats.grandTotal)}`,      icon: IndianRupee, color: '#059669', bg: '#ecfdf5' },
  ] : [];

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-[#0f172a]">Reports & Earnings</h2>
        <p className="text-[#64748b] text-sm mt-1">Overview of your sales performance and order history.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#eef2f6] rounded-[12px] p-4 animate-pulse h-21" />
            ))
          : statCards.map(c => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-white border border-[#eef2f6] rounded-[12px] p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: c.bg }}>
                    <Icon size={20} style={{ color: c.color }} />
                  </div>
                  <div>
                    <p className="text-[0.7rem] font-semibold text-[#64748b] uppercase tracking-wide">{c.label}</p>
                    <p className="text-[1.05rem] font-extrabold text-[#0f172a]">{c.value}</p>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Filter + Generate Report */}
      <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 mb-6">
        <p className="text-sm font-bold text-[#0f172a] mb-4">Generate Sales Report</p>

        {/* Date range */}
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#64748b]">From</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="border border-[#e2e8f0] rounded-md px-3 py-2 text-sm text-[#0f172a] bg-white outline-none focus:border-[#e65c00]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#64748b]">To</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="border border-[#e2e8f0] rounded-md px-3 py-2 text-sm text-[#0f172a] bg-white outline-none focus:border-[#e65c00]"
            />
          </div>
          <button
            onClick={handleApplyFilter}
            className="px-4 py-2 rounded-md bg-[#0f172a] text-white text-sm font-semibold cursor-pointer hover:bg-[#1e293b] transition-colors"
          >
            Apply
          </button>
          {(from || to) && (
            <button
              onClick={handleClearFilter}
              className="px-4 py-2 rounded-md bg-[#f1f5f9] text-[#475569] text-sm font-semibold cursor-pointer hover:bg-[#e2e8f0] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Format selector */}
        <p className="text-xs font-semibold text-[#64748b] mb-2">Export Format</p>
        <div className="flex gap-2 mb-4 flex-wrap">
          {([
            { id: 'pdf', label: 'PDF', Icon: FileText },
            { id: 'xlsx', label: 'Excel', Icon: FileSpreadsheet },
            { id: 'csv', label: 'CSV', Icon: Table2 },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setFormat(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-semibold transition-all cursor-pointer ${
                format === id
                  ? 'bg-[#e65c00] text-white border-[#e65c00]'
                  : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-[#e65c00] hover:text-[#e65c00]'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#e65c00] text-white font-bold text-sm cursor-pointer hover:bg-[#c94f00] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {generating ? 'Generating…' : 'Download Report'}
        </button>
      </div>

      {/* Order list */}
      <div className="bg-white border border-[#eef2f6] rounded-[14px] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
          <p className="font-bold text-[#0f172a] text-sm">Order History</p>
          {(from || to) && <span className="text-xs text-[#64748b]">Filtered results</span>}
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#f8fafc] rounded-md animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-[#94a3b8] text-sm">No orders found for the selected period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-225">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-xs font-semibold uppercase">
                  <th className="text-left px-5 py-3">Invoice / PO</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Buyer</th>
                  <th className="text-left px-4 py-3">Products & Qty</th>
                  <th className="text-right px-4 py-3">Product Amt</th>
                  <th className="text-right px-4 py-3">GST</th>
                  <th className="text-right px-4 py-3">Shipping</th>
                  <th className="text-right px-4 py-3">Invoice Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const snap = o.snapshot as any;
                  const buyerName = snap?.buyerName || (o.buyerId as any)?.name || (o.buyerId as any)?.phone || '—';
                  const prodAmt = snap?.taxableAmount ?? o.subtotal ?? 0;
                  const gstAmt = snap?.gstAmount ?? 0;
                  const gstRate = snap?.gstRate != null ? `${snap.gstRate}%` : null;
                  const gstType = snap?.gstType === 'IGST' ? 'IGST' : snap?.gstType === 'CGST_SGST' ? 'CGST+SGST' : snap?.gstType === 'exempt' ? 'Exempt' : null;
                  const shipping = o.shippingCost ?? 0;
                  const itemsFull = o.items.map(i => `${i.name} ×${i.quantity}`).join(', ');
                  const itemsSummary = o.items.slice(0, 2).map(i => `${i.name} ×${i.quantity}`).join(', ') + (o.items.length > 2 ? '…' : '');
                  return (
                    <tr key={o._id} className="border-t border-[#f1f5f9] hover:bg-[#fafafa]">
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleOpenInvoice(o._id)}
                          disabled={openingInvoiceId === o._id}
                          title="Open invoice PDF"
                          className="text-left group cursor-pointer disabled:opacity-60"
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-[#0f172a] group-hover:underline">
                            {openingInvoiceId === o._id
                              ? <Loader2 size={12} className="animate-spin shrink-0" />
                              : <FileText size={12} className="shrink-0 text-[#64748b]" />}
                            <span>{o.poNumber || o.orderNumber}</span>
                          </div>
                          {o.poNumber && <div className="text-xs text-[#94a3b8]">{o.orderNumber}</div>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#475569] whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-[#475569]">{buyerName}</td>
                      <td className="px-4 py-3 text-[#475569] max-w-45 truncate" title={itemsFull}>{itemsSummary}</td>
                      <td className="px-4 py-3 text-right text-[#0f172a]">₹{fmt(prodAmt)}</td>
                      <td className="px-4 py-3 text-right text-[#0369a1]">
                        {gstAmt > 0 ? (
                          <div>
                            <div>₹{fmt(gstAmt)}</div>
                            {(gstType || gstRate) && <div className="text-[0.6rem] text-[#64748b]">{[gstType, gstRate].filter(Boolean).join(' ')}</div>}
                          </div>
                        ) : <span className="text-[#94a3b8] text-xs">Nil</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-[#475569]">{shipping > 0 ? `₹${fmt(shipping)}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a]">₹{fmt(o.totalAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierReports;
