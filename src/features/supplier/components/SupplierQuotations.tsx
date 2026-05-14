import React, { useEffect, useState } from 'react';
import { quotationApi } from '@/features/supplier/services/quotation.api';
import { FileText, Clock, CheckCircle, XCircle, ShoppingBag, RefreshCw, User } from 'lucide-react';

interface QuotationItem { name: string; quantity: number; price: number; unit: string; }
interface Quotation {
  _id: string; status: string; totalAmount: number; shippingCost: number;
  items: QuotationItem[]; terms?: string; validUntil: string; createdAt: string;
  buyerId?: { name?: string; phone?: string }; orderId?: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  pending:  { label: 'Pending',  icon: <Clock size={14} />,        cls: 'bg-[#fff7ed] text-[#c2410c]' },
  accepted: { label: 'Accepted', icon: <CheckCircle size={14} />,  cls: 'bg-[#ecfdf5] text-[#059669]' },
  rejected: { label: 'Rejected', icon: <XCircle size={14} />,      cls: 'bg-[#fef2f2] text-[#dc2626]' },
  ordered:  { label: 'Ordered',  icon: <ShoppingBag size={14} />,  cls: 'bg-[#eff6ff] text-[#1d4ed8]' },
  expired:  { label: 'Expired',  icon: <Clock size={14} />,        cls: 'bg-[#f8fafc] text-[#64748b]' },
};

const sectionCls = "bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] max-lg:p-5";
const refreshBtnCls = "flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] font-bold cursor-pointer text-[0.8rem] px-4 py-2 rounded-[8px] transition-all hover:bg-[#f1f5f9] hover:text-[#1e293b]";

const SupplierQuotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotations = async () => {
    setLoading(true); setError(null);
    try {
      const data = await quotationApi.getSupplierQuotations();
      setQuotations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load quotations.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchQuotations(); }, []);

  const Header = () => (
    <div className="flex justify-between items-center mb-6">
      <h2 className="flex items-center gap-2 text-[1.25rem] text-[#1e293b] m-0 font-extrabold"><FileText size={20} /> Quotations</h2>
      <button className={refreshBtnCls} onClick={fetchQuotations}><RefreshCw size={16} /> {loading ? 'Refresh' : 'Refresh'}</button>
    </div>
  );

  if (loading) return (
    <div className={sectionCls}>
      <Header />
      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[#f1f5f9] rounded-[8px] animate-pulse" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className={sectionCls}>
      <Header />
      <div className="bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] px-4 py-3 rounded-[6px] text-sm">{error}</div>
    </div>
  );

  return (
    <div className={sectionCls}>
      <Header />
      {quotations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-[#64748b]">
          <FileText size={48} />
          <p>No quotations yet. Send a quote from a chat conversation to see it here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {quotations.map(q => {
            const s = statusConfig[q.status] ?? statusConfig.pending;
            return (
              <div key={q._id} className="border border-[#eef2f6] rounded-[8px] p-5 bg-white">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-sm text-[#334155]">
                    <User size={15} />
                    <span className="font-semibold">{q.buyerId?.name || q.buyerId?.phone || 'Buyer'}</span>
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}>
                    {s.icon} {s.label}
                  </span>
                </div>

                <div className="flex flex-col gap-1 mb-3">
                  {q.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="font-medium text-[#1e293b]">{item.name}</span>
                      <span className="text-[#64748b]">{item.quantity} {item.unit} × ₹{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-end text-sm border-t border-[#f1f5f9] pt-3">
                  <div className="flex flex-col gap-0.5 text-[#475569]">
                    <span>Subtotal: <strong>₹{q.totalAmount.toLocaleString()}</strong></span>
                    {q.shippingCost > 0 && <span>Shipping: <strong>₹{q.shippingCost.toLocaleString()}</strong></span>}
                    <span className="text-[#0f172a] font-bold">Total: ₹{(q.totalAmount + (q.shippingCost || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-xs text-[#94a3b8]">
                    <span>Valid until: {new Date(q.validUntil).toLocaleDateString()}</span>
                    <span>Sent: {new Date(q.createdAt).toLocaleDateString()}</span>
                    {q.orderId && <span className="text-primary font-semibold">Order: #{String(q.orderId).slice(-6)}</span>}
                  </div>
                </div>

                {q.terms && <div className="mt-3 text-xs text-[#64748b] bg-[#f8fafc] px-3 py-2 rounded-[6px]">📝 {q.terms}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupplierQuotations;
