import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import {
  Calendar, Wallet, TrendingUp, ShieldCheck, ShieldAlert,
  Package, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw,
  Info, History, Eye, Image as ImageIcon, ArrowLeft, CreditCard,
  Receipt, Download, X, FileText, Sparkles,
} from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import billingApi, { type SubscriptionPaymentRecord } from '../services/billing.api';

interface BillingManagementProps {
  setActiveView: (view: string) => void;
}

const cardCls = 'bg-white rounded-[10px] border border-[#eef2f6] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]';

const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
  });
};

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ── GST Invoice Modal ─────────────────────────────────────────────────────────

const InvoiceModal: React.FC<{
  payment: SubscriptionPaymentRecord;
  supplierName: string;
  supplierGstin?: string;
  supplierAddress?: string;
  onClose: () => void;
}> = ({ payment, supplierName, supplierGstin, supplierAddress, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice ${payment.invoiceNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 32px; }
        h1 { font-size: 22px; font-weight: 900; color: #e65c00; }
        h2 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #e2e8f0; }
        td { padding: 10px 12px; border: 1px solid #e2e8f0; }
        .total-row td { font-weight: 700; background: #fff7ed; }
        .divider { border-top: 1px solid #e2e8f0; margin: 16px 0; }
        .flex { display: flex; justify-content: space-between; }
        .label { color: #64748b; font-size: 12px; }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const cgst = Math.round(payment.gstAmount / 2);
  const sgst = payment.gstAmount - cgst;
  const isUpgrade = payment.type === 'upgrade';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[16px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eef2f6] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-primary" />
            <h3 className="font-extrabold text-[#0f172a] text-base">Tax Invoice</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary border border-primary/30 rounded-[8px] hover:bg-primary hover:text-white transition-colors"
            >
              <Download size={13} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] text-[#64748b]">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable invoice body */}
        <div ref={printRef} className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-primary m-0">AMJ STAR</h1>
              <p className="text-xs text-[#64748b] m-0 mt-1">India ka Apna B2B Marketplace</p>
              <p className="text-xs text-[#64748b] m-0">GSTIN: 27AABCA1234C1Z5</p>
              <p className="text-xs text-[#64748b] m-0">support@amjstar.com</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider m-0">Tax Invoice</p>
              <p className="text-lg font-extrabold text-[#0f172a] m-0">{payment.invoiceNumber}</p>
              <p className="text-xs text-[#64748b] m-0">Date: {fmtDate(payment.createdAt)}</p>
            </div>
          </div>

          <div className="border-t border-[#e2e8f0] my-4" />

          {/* Billed to */}
          <div className="mb-5">
            <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Billed To</p>
            <p className="font-bold text-[#0f172a] text-sm m-0">{supplierName}</p>
            {supplierAddress && <p className="text-xs text-[#475569] m-0 mt-0.5">{supplierAddress}</p>}
            {supplierGstin && <p className="text-xs text-[#475569] m-0 mt-0.5">GSTIN: {supplierGstin}</p>}
          </div>

          {/* Description table */}
          <table className="w-full border-collapse border border-[#e2e8f0] text-sm">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="text-left px-4 py-3 border border-[#e2e8f0] text-xs font-bold text-[#64748b] uppercase">Description</th>
                <th className="text-right px-4 py-3 border border-[#e2e8f0] text-xs font-bold text-[#64748b] uppercase">Period</th>
                <th className="text-right px-4 py-3 border border-[#e2e8f0] text-xs font-bold text-[#64748b] uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 border border-[#e2e8f0]">
                  <p className="font-bold text-[#0f172a] m-0">{payment.planName} — {isUpgrade ? 'Plan Upgrade' : 'Annual Subscription'}</p>
                  {isUpgrade && payment.fromTier && (
                    <p className="text-xs text-[#64748b] m-0 mt-0.5">Upgrade from {payment.fromTier} plan (price difference)</p>
                  )}
                  <p className="text-xs text-[#64748b] m-0 mt-0.5">SAC Code: 998313 — Software & IT Services</p>
                </td>
                <td className="px-4 py-3 border border-[#e2e8f0] text-right text-xs text-[#475569]">
                  {fmtShort(payment.planStartDate)}<br />to {fmtShort(payment.planExpiryDate)}
                </td>
                <td className="px-4 py-3 border border-[#e2e8f0] text-right font-bold">₹{fmt(payment.price)}</td>
              </tr>
              <tr className="bg-[#f8fafc]">
                <td className="px-4 py-3 border border-[#e2e8f0] text-[#475569]">CGST @ {payment.gstPercent / 2}%</td>
                <td className="px-4 py-3 border border-[#e2e8f0]" />
                <td className="px-4 py-3 border border-[#e2e8f0] text-right">₹{fmt(cgst)}</td>
              </tr>
              <tr className="bg-[#f8fafc]">
                <td className="px-4 py-3 border border-[#e2e8f0] text-[#475569]">SGST @ {payment.gstPercent / 2}%</td>
                <td className="px-4 py-3 border border-[#e2e8f0]" />
                <td className="px-4 py-3 border border-[#e2e8f0] text-right">₹{fmt(sgst)}</td>
              </tr>
              <tr className="bg-[#fff7ed]">
                <td colSpan={2} className="px-4 py-3 border border-[#e2e8f0] font-extrabold text-[#0f172a]">Total Payable</td>
                <td className="px-4 py-3 border border-[#e2e8f0] text-right font-extrabold text-primary">₹{fmt(payment.amountPaid)}</td>
              </tr>
            </tbody>
          </table>

          {/* Payment details */}
          <div className="mt-4 p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px]">
            <p className="text-xs font-bold text-[#14532d] m-0 mb-1">Payment Received</p>
            <p className="text-xs text-[#166534] m-0">Via Razorpay · Payment ID: {payment.razorpayPaymentId}</p>
            <p className="text-xs text-[#166534] m-0 mt-0.5">Order ID: {payment.razorpayOrderId}</p>
          </div>

          <div className="border-t border-[#e2e8f0] mt-6 pt-4">
            <p className="text-[11px] text-[#94a3b8] text-center m-0">
              This is a computer-generated invoice. No signature required. · amjstar.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const BillingManagement: React.FC<BillingManagementProps> = ({ setActiveView }) => {
  const [listingHistoryPage, setListingHistoryPage] = useState(1);
  const [subPaymentPage, setSubPaymentPage] = useState(1);
  const [viewBlockedProducts, setViewBlockedProducts] = useState<any[] | null>(null);
  const [invoicePayment, setInvoicePayment] = useState<SubscriptionPaymentRecord | null>(null);

  const profile = useAppSelector(s => s.supplier.profile) as any;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['billing-preview'],
    queryFn: billingApi.getPreview,
    staleTime: 60_000,
  });

  const { data: listingHistoryData, isLoading: listingHistoryLoading } = useQuery({
    queryKey: ['billing-history', listingHistoryPage],
    queryFn: () => billingApi.getHistory(listingHistoryPage, 8),
    staleTime: 60_000,
  });

  const { data: subPaymentsData, isLoading: subPaymentsLoading } = useQuery({
    queryKey: ['subscription-payments', subPaymentPage],
    queryFn: () => billingApi.getSubscriptionPayments(subPaymentPage, 10),
    staleTime: 60_000,
  });

  const preview = data?.preview;
  const walletOk  = preview && preview.walletBalance >= preview.projectedCost;
  const noProducts = preview && preview.totalBillableProducts === 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="h-8 w-56 bg-[#f1f5f9] rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-80 bg-[#f1f5f9] rounded animate-pulse" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`${cardCls} h-[100px] animate-pulse bg-[#f8fafc]`} />
        ))}
      </div>
    );
  }

  // ── Blocked products detail view ──
  if (viewBlockedProducts !== null) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <button
          onClick={() => setViewBlockedProducts(null)}
          className="flex items-center gap-2 text-sm font-bold text-[#64748b] hover:text-[#0f172a] transition-colors w-fit"
        >
          <ArrowLeft size={16} /> Back to Billing
        </button>
        <div>
          <h1 className="text-[1.75rem] font-extrabold text-[#0f172a] tracking-tight">Billing Cycle Details</h1>
          <p className="text-[#64748b] text-[0.95rem] mt-1">Products impacted during this billing cycle.</p>
        </div>
        <div className="bg-white border border-[#eef2f6] rounded-[14px] p-6">
          {viewBlockedProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#f0fdf4] text-[#16a34a] rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-xl font-extrabold text-[#0f172a] m-0 mb-2">All Products Live!</h3>
              <p className="text-sm text-[#64748b] m-0 px-4 max-w-md mx-auto">
                You had sufficient balance. All your products remained live.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-4 bg-[#fff7ed] border border-[#fed7aa] rounded-[10px] mb-6">
                <AlertTriangle size={18} className="text-[#ea580c] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#7c2d12] text-sm">Products Hidden Due to Insufficient Balance</p>
                  <p className="text-xs text-[#9a3412] mt-0.5">These products will restore automatically once you top up your wallet.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {viewBlockedProducts.map((product: any) => (
                  <div key={product._id} className="flex items-center gap-4 p-4 bg-white border border-[#eef2f6] rounded-[10px]">
                    <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-[#f1f5f9] shrink-0">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#94a3b8]"><ImageIcon size={20} /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-[#1e293b] m-0 truncate">{product.name}</p>
                      <p className="text-[0.7rem] font-bold px-2 py-0.5 rounded uppercase mt-2 w-fit bg-[#fef2f2] text-[#dc2626]">
                        {product.status || 'BLOCKED'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (isError || !preview) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[1.75rem] font-extrabold text-[#0f172a] tracking-tight">Billing Management</h1>
          <p className="text-[#64748b] text-[0.95rem] mt-1">Your listing subscription summary and renewal forecast.</p>
        </div>
        <div className="flex flex-col items-center gap-4 py-16 text-[#64748b]">
          <AlertTriangle size={40} className="text-[#f59e0b]" />
          <p className="font-bold text-[#0f172a]">Could not load billing information</p>
          <button onClick={() => refetch()} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {invoicePayment && (
        <InvoiceModal
          payment={invoicePayment}
          supplierName={profile?.businessName || 'Your Business'}
          supplierGstin={profile?.businessDetails?.gstin}
          supplierAddress={[
            profile?.businessDetails?.address,
            profile?.businessDetails?.city,
            profile?.businessDetails?.state,
            profile?.businessDetails?.pinCode,
          ].filter(Boolean).join(', ')}
          onClose={() => setInvoicePayment(null)}
        />
      )}

      <div className="flex flex-col gap-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[1.75rem] font-extrabold text-[#0f172a] tracking-tight">Billing Management</h1>
            <p className="text-[#64748b] text-[0.95rem] mt-1">Your listing subscription summary, membership payments, and invoices.</p>
          </div>
          <button onClick={() => refetch()} className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* ── Next Billing Cycle Card ── */}
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-[10px] p-6 text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-widest text-[#94a3b8] mb-3">Next Billing Cycle</p>
              <p className="text-[2rem] font-extrabold leading-none tracking-tight">{fmtDate(preview.nextBillingDate)}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                <p className="text-[0.78rem] text-[#94a3b8]">
                  Anchored to your onboarding date —{' '}
                  <span className="text-white font-semibold">{fmtDate(preview.onboardingDate)}</span>
                </p>
              </div>
            </div>
            <div className="w-11 h-11 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
              <Calendar size={20} className="text-white" />
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
          <MetricCard label="Wallet Balance" value={`₹${fmt(preview.walletBalance)}`} icon={<Wallet size={16} />} color="#2563eb" bg="#eff6ff" />
          <MetricCard
            label="Projected Cost"
            value={preview.projectedCost > 0 ? `₹${fmt(preview.projectedCost)}` : '₹0'}
            sub={
              preview.totalBillableProducts > 0 && preview.projectedCost === 499
                ? 'Minimum charge applies'
                : preview.totalBillableProducts > 0
                ? `${preview.totalBillableProducts} products × ₹10`
                : 'No billable products'
            }
            icon={<TrendingUp size={16} />}
            color="#e65c00"
            bg="#fff7ed"
          />
          <MetricCard label="Active Listings" value={`${preview.totalBillableProducts}`} sub="approved products" icon={<Package size={16} />} color="#7c3aed" bg="#f5f3ff" />
        </div>

        {/* Status Alert */}
        {noProducts ? (
          <div className="flex items-start gap-3 p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px]">
            <Info size={18} className="text-[#94a3b8] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0f172a] text-sm">No billable listings yet</p>
              <p className="text-xs text-[#64748b] mt-0.5">Once your products are approved and live, they will appear here with an accurate billing forecast.</p>
            </div>
          </div>
        ) : walletOk ? (
          <div className="flex items-start gap-3 p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px]">
            <ShieldCheck size={18} className="text-[#16a34a] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#14532d] text-sm">All {preview.totalBillableProducts} listing{preview.totalBillableProducts > 1 ? 's' : ''} will renew successfully</p>
              <p className="text-xs text-[#166534] mt-0.5">Your wallet covers the full renewal of <strong>₹{fmt(preview.projectedCost)}</strong>. No products will be blocked.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-[#fff7ed] border border-[#fed7aa] rounded-[10px]">
            <ShieldAlert size={18} className="text-[#ea580c] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#7c2d12] text-sm">
                {preview.productsToKeep === 0
                  ? 'All listings will be blocked on your billing date'
                  : `${preview.productsToBlock} listing${preview.productsToBlock > 1 ? 's' : ''} will be blocked on your billing date`}
              </p>
              <p className="text-xs text-[#9a3412] mt-0.5">
                {preview.productsToKeep === 0
                  ? `Your wallet (₹${fmt(preview.walletBalance)}) is below the ₹499 minimum. All ${preview.totalBillableProducts} listings will be hidden.`
                  : `Your wallet covers ${preview.productsToKeep} of ${preview.totalBillableProducts} listings. The newest ${preview.productsToBlock} will be hidden.`}
                {' '}Top up <strong>₹{fmt(preview.shortfallAmount)}</strong> more to keep all listings live.
              </p>
              <button onClick={() => setActiveView('wallet')} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#ea580c] hover:underline">
                Top Up Wallet <ArrowRight size={11} />
              </button>
            </div>
          </div>
        )}

        {/* Renewal Breakdown */}
        {!noProducts && (
          <div className={cardCls}>
            <h2 className="text-base font-bold text-[#0f172a] mb-4">Renewal Breakdown</h2>
            <div className="flex flex-col divide-y divide-[#f1f5f9]">
              <Row label="Total Approved Products" value={`${preview.totalBillableProducts}`} />
              <Row label="Minimum Monthly Charge" value="₹499" sub="Always applies for 1–49 products" />
              <Row label="Your Projected Charge" value={`₹${fmt(preview.projectedCost)}`} sub={preview.projectedCost === 499 ? 'Minimum applies' : `${preview.totalBillableProducts} × ₹10`} bold />
              <Row label="Current Wallet Balance" value={`₹${fmt(preview.walletBalance)}`} />
              {!walletOk && <Row label="Shortfall" value={`₹${fmt(preview.shortfallAmount)}`} highlight="red" />}
              <Row label="Products that will stay live" value={`${preview.productsToKeep}`} highlight={preview.productsToKeep === preview.totalBillableProducts ? 'green' : 'neutral'} />
              {preview.productsToBlock > 0 && (
                <Row label="Products that will be blocked" value={`${preview.productsToBlock}`} sub="Oldest listings are kept live first" highlight="red" />
              )}
            </div>
          </div>
        )}

        {/* Policy Note */}
        <div className="flex gap-3 p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px]">
          <Info size={14} className="text-[#94a3b8] shrink-0 mt-0.5" />
          <p className="text-[0.75rem] text-[#64748b] leading-relaxed m-0">
            <strong className="text-[#475569]">Billing Policy:</strong>{' '}
            The minimum monthly charge is <strong>₹499</strong> (covers up to 49 products).
            For 50+ products the charge is <strong>₹10 per product</strong>.
            If your wallet is below ₹499 on the billing date, all listings are blocked.
            Products unblock automatically as soon as you top up.
          </p>
        </div>

        {/* ── Membership & Plan Payments ── */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4 text-[#0f172a]">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-base font-bold m-0">Membership Payments</h2>
          </div>

          {subPaymentsLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-[8px] bg-[#f8fafc] animate-pulse" />)}
            </div>
          ) : !subPaymentsData?.payments || subPaymentsData.payments.length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8] text-sm">
              <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
              <p className="m-0">No membership payments yet. Your plan payments will appear here with downloadable GST invoices.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {subPaymentsData.payments.map(p => (
                <div key={p._id} className="flex items-center justify-between p-4 rounded-[10px] border border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fff7ed] text-primary flex items-center justify-center shrink-0">
                      {p.type === 'upgrade' ? <Sparkles size={18} /> : <CreditCard size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1e293b] m-0">{p.planName}</p>
                      <p className="text-xs text-[#64748b] m-0 mt-0.5">
                        {p.type === 'upgrade' ? 'Plan Upgrade' : 'Annual Subscription'} · {fmtShort(p.createdAt)}
                      </p>
                      <p className="text-[11px] text-[#94a3b8] m-0 mt-0.5">
                        Valid: {fmtShort(p.planStartDate)} → {fmtShort(p.planExpiryDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1e293b] m-0">₹{fmt(p.amountPaid)}</p>
                      <p className="text-xs text-[#94a3b8] m-0">incl. GST ₹{fmt(p.gstAmount)}</p>
                    </div>
                    <button
                      onClick={() => setInvoicePayment(p)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary bg-[#fff7ed] px-3 py-1.5 rounded-[8px] hover:bg-primary hover:text-white transition-colors"
                    >
                      <Receipt size={12} /> Invoice
                    </button>
                  </div>
                </div>
              ))}

              {(subPaymentsData.totalPages ?? 1) > 1 && (
                <div className="flex justify-center gap-3 mt-3 pt-3 border-t border-[#f1f5f9]">
                  <Button variant="outline" onClick={() => setSubPaymentPage(p => Math.max(1, p - 1))} disabled={subPaymentPage === 1} className="!text-sm !py-1.5">Prev</Button>
                  <span className="text-sm text-[#64748b] self-center">Page {subPaymentPage} of {subPaymentsData.totalPages}</span>
                  <Button variant="outline" onClick={() => setSubPaymentPage(p => p + 1)} disabled={subPaymentPage >= subPaymentsData.totalPages} className="!text-sm !py-1.5">Next</Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Listing Fee Billing History ── */}
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-4 text-[#0f172a]">
            <History size={18} />
            <h2 className="text-base font-bold m-0">Monthly Listing Fee History</h2>
          </div>

          {listingHistoryLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-[8px] bg-[#f8fafc] animate-pulse" />)}
            </div>
          ) : !listingHistoryData?.history || listingHistoryData.history.length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8] text-sm">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p className="m-0">No listing fee history yet. Monthly billing records will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {listingHistoryData.history.map((record: any) => (
                <div key={record._id} className="flex items-center justify-between p-4 rounded-[10px] border border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${record.amountCharged > 0 ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#fff7ed] text-[#ea580c]'}`}>
                      {record.amountCharged > 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1e293b] m-0">{fmtDate(record.billingDate)}</p>
                      <p className="text-xs text-[#64748b] m-0 mt-0.5">{record.totalLiveProducts} total products · {record.productsKept} kept live</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1e293b] m-0">₹{fmt(record.amountCharged)}</p>
                      {record.productsBlocked > 0 ? (
                        <p className="text-xs font-bold text-[#dc2626] m-0 mt-0.5">{record.productsBlocked} blocked</p>
                      ) : (
                        <p className="text-xs font-medium text-[#16a34a] m-0 mt-0.5">All live</p>
                      )}
                    </div>
                    <button
                      onClick={() => setViewBlockedProducts(record.blockedProductIds || [])}
                      className="text-xs font-bold text-[#e65c00] bg-[#fff7ed] px-3 py-1.5 rounded-[8px] hover:bg-[#ffedd5] transition-colors flex items-center gap-1.5"
                    >
                      <Eye size={12} /> Details
                    </button>
                  </div>
                </div>
              ))}

              {(listingHistoryData.totalPages ?? 1) > 1 && (
                <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-[#f1f5f9]">
                  <Button variant="outline" onClick={() => setListingHistoryPage(p => Math.max(1, p - 1))} disabled={listingHistoryPage === 1} className="!text-sm !py-1.5">Prev</Button>
                  <span className="text-sm text-[#64748b] self-center">Page {listingHistoryPage} of {listingHistoryData.totalPages}</span>
                  <Button variant="outline" onClick={() => setListingHistoryPage(p => p + 1)} disabled={listingHistoryPage >= listingHistoryData.totalPages} className="!text-sm !py-1.5">Next</Button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

interface MetricCardProps { label: string; value: string; sub?: string; icon: React.ReactNode; color: string; bg: string; }
const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub, icon, color, bg }) => (
  <div className="bg-white border border-[#eef2f6] rounded-[10px] p-5 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
    <div className="w-11 h-11 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: bg, color }}>{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-[#64748b] font-bold m-0 mb-1 uppercase">{label}</p>
      <p className="text-xl font-extrabold text-[#0f172a] m-0 truncate">{value}</p>
      {sub && <p className="text-[0.7rem] text-[#94a3b8] m-0 mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

interface RowProps { label: string; value: string; sub?: string; bold?: boolean; highlight?: 'green' | 'red' | 'neutral'; }
const Row: React.FC<RowProps> = ({ label, value, sub, bold, highlight }) => {
  const valueColor = highlight === 'green' ? 'text-[#16a34a]' : highlight === 'red' ? 'text-[#dc2626]' : bold ? 'text-[#0f172a]' : 'text-[#334155]';
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className={`text-sm m-0 ${bold ? 'font-bold text-[#0f172a]' : 'text-[#475569]'}`}>{label}</p>
        {sub && <p className="text-xs text-[#94a3b8] m-0 mt-0.5">{sub}</p>}
      </div>
      <div className={`flex items-center gap-1.5 font-extrabold text-sm shrink-0 ${valueColor}`}>
        {highlight === 'green' && <CheckCircle2 size={14} />}
        {highlight === 'red' && <AlertTriangle size={14} />}
        {value}
      </div>
    </div>
  );
};

export default BillingManagement;
