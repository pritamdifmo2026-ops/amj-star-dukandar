import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, Users, Store, ShoppingBag, Wallet, CircleDollarSign, Banknote, ShieldAlert,
  LifeBuoy, Receipt, CreditCard, ShieldCheck, Clock, MapPin, Phone, Mail,
  Search, Package, ChevronRight, ArrowLeft,
  Truck, Copy, Check,
} from 'lucide-react';
import Loader from '@/shared/components/feedback/Loader';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import partnerService, { type AdminPartnerDetail, type AdminPartnerDeal } from '@/features/partner/services/partner.service';

const thCls =
  'text-left px-3 py-2.5 text-slate-500 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] border-b border-slate-200 bg-slate-50 whitespace-nowrap';
const tdCls = 'px-3 py-2.5 border-b border-slate-100 text-[11px] text-slate-700 align-middle';

export type DossierTab = 'deals' | 'network' | 'commissions' | 'payouts';

function shortDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fullDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

const STATUS_PILL: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  suspended: 'bg-rose-100 text-rose-800 border-rose-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  pending_approval: 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
};

const ORDER_STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  completed: { label: 'Completed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  delivered: { label: 'Delivered', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  shipped: { label: 'Dispatched', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  packed: { label: 'Packed', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing: { label: 'Processing', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Paid', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending_approval: { label: 'Approval Required', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  awaiting_confirmation: { label: 'Awaiting Confirm', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  disputed: { label: 'Disputed', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  cancelled: { label: 'Cancelled', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  completed: { label: 'Paid', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paid: { label: 'Paid', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Payment Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  failed: { label: 'Payment Failed', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  refunded: { label: 'Refunded', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: typeof Wallet;
  accent?: string;
}> = ({ label, value, hint, icon: Icon, accent = 'bg-slate-50 text-slate-600 border-slate-200' }) => (
  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-2.5">
    <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${accent}`}>
      <Icon size={15} />
    </span>
    <div className="min-w-0">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-black text-slate-900 leading-tight break-words">{value}</div>
      {hint && <div className="text-[10px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  </div>
);

/**
 * Everything an admin needs about one Wholesale Service Partner in a single slide-over:
 * who they brought in, what those accounts have actually transacted, full deal details,
 * products, monetary splits, and every payout AMJ Star has made to them.
 */
const AdminPartnerDossier: React.FC<{
  partnerId: string;
  initialTab?: DossierTab;
  onClose: () => void;
  onApprove: (partner: AdminPartnerDetail['partner']) => void;
  onReject: (partner: AdminPartnerDetail['partner']) => void;
  onEdit: (partner: AdminPartnerDetail['partner']) => void;
}> = ({ partnerId, initialTab = 'deals', onClose, onApprove, onReject, onEdit }) => {
  const [tab, setTab] = useState<DossierTab>(initialTab);

  // Deals filtering & search state
  const [dealSearch, setDealSearch] = useState('');
  const [dealStatusFilter, setDealStatusFilter] = useState('all');
  const [dealAttributionFilter, setDealAttributionFilter] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState<AdminPartnerDeal | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);

  const handleCopyOrder = (orderNum: string) => {
    navigator.clipboard.writeText(orderNum);
    setCopiedOrderNumber(orderNum);
    setTimeout(() => setCopiedOrderNumber(null), 2000);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminPartnerDetail', partnerId],
    queryFn: () => partnerService.adminGetPartnerDetail(partnerId),
  });

  const partner = data?.partner;
  const isPending = partner?.status === 'pending' || partner?.status === 'pending_approval';
  const userObj = typeof partner?.userId === 'object' ? partner.userId : null;

  // Filter deals based on admin inputs
  const allDeals: AdminPartnerDeal[] = data?.deals || [];
  const filteredDeals = allDeals.filter((d) => {
    if (dealStatusFilter !== 'all' && d.orderStatus?.toLowerCase() !== dealStatusFilter.toLowerCase()) {
      return false;
    }
    if (dealAttributionFilter !== 'all' && d.attribution?.type !== dealAttributionFilter) {
      return false;
    }
    if (dealSearch.trim()) {
      const q = dealSearch.trim().toLowerCase();
      const matchOrder = d.orderNumber?.toLowerCase().includes(q);
      const matchBuyer =
        d.buyer.name?.toLowerCase().includes(q) ||
        d.buyer.companyName?.toLowerCase().includes(q) ||
        d.buyer.phone?.toLowerCase().includes(q) ||
        d.buyer.email?.toLowerCase().includes(q);
      const matchSupplier =
        d.supplier.businessName?.toLowerCase().includes(q) ||
        d.supplier.name?.toLowerCase().includes(q) ||
        d.supplier.phone?.toLowerCase().includes(q);
      const matchProduct = d.items?.some((it) => it.name?.toLowerCase().includes(q));
      if (!matchOrder && !matchBuyer && !matchSupplier && !matchProduct) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex justify-end animate-fade-in" onClick={onClose}>
      <div
        className="bg-slate-50 w-full max-w-[920px] h-full overflow-y-auto shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {partner?.partnerCode || '—'}
              </span>
              {partner && (
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    STATUS_PILL[partner.status] || STATUS_PILL.pending_approval
                  }`}
                >
                  {isPending ? 'Pending approval' : partner.status}
                </span>
              )}
              {partner?.registrationSource && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {partner.registrationSource === 'admin' ? 'Admin-created' : 'Self-registered'}
                </span>
              )}
            </div>
            <h2 className="text-base font-extrabold text-slate-900 m-0 mt-1.5 truncate">
              {partner?.fullName || userObj?.name || 'Wholesale Service Partner'}
            </h2>
            {partner?.businessName && (
              <p className="text-xs text-slate-500 m-0 mt-0.5">{partner.businessName}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {partner && isPending && (
              <>
                <button
                  onClick={() => onApprove(partner)}
                  className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer border-none hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => onReject(partner)}
                  className="px-3 py-2 rounded-lg border border-rose-200 bg-white text-rose-600 text-[11px] font-extrabold uppercase tracking-wider cursor-pointer hover:bg-rose-50"
                >
                  Reject
                </button>
              </>
            )}
            {partner && !isPending && (
              <button
                onClick={() => onEdit(partner)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-extrabold uppercase tracking-wider cursor-pointer hover:bg-slate-50"
              >
                Manage
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 flex items-center justify-center cursor-pointer hover:bg-slate-50"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 flex justify-center">
            <Loader size="md" />
          </div>
        ) : isError || !data ? (
          <div className="py-24 text-center text-xs text-slate-400">Could not load this partner's record.</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* ── Money ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat
                label="Withdrawable"
                value={formatCurrency(partner?.wallet?.withdrawableBalance || 0)}
                hint="Cleared, awaiting request"
                icon={Wallet}
                accent="bg-emerald-50 text-emerald-600 border-emerald-200"
              />
              <Stat
                label="In escrow"
                value={formatCurrency(partner?.wallet?.pendingBalance || 0)}
                hint={`${data.commissionSummary.pendingCount} deals pending`}
                icon={Clock}
                accent="bg-amber-50 text-amber-600 border-amber-200"
              />
              <Stat
                label="Lifetime earned"
                value={formatCurrency(partner?.metrics?.lifetimeCommissionEarned || 0)}
                hint={`${data.commissionSummary.clearedCount} deals cleared`}
                icon={CircleDollarSign}
                accent="bg-indigo-50 text-indigo-600 border-indigo-200"
              />
              <Stat
                label="Paid out"
                value={formatCurrency(partner?.wallet?.totalWithdrawn || 0)}
                hint={`Net ${formatCurrency(data.payoutSummary.completedNet)} after TDS`}
                icon={Banknote}
                accent="bg-slate-50 text-slate-600 border-slate-200"
              />
            </div>

            {/* ── Network activity ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat
                label="Sellers referred"
                value={data.referrals.totalSuppliers}
                icon={Store}
                accent="bg-orange-50 text-orange-600 border-orange-200"
              />
              <Stat
                label="Buyers referred"
                value={data.referrals.totalBuyers}
                icon={ShoppingBag}
                accent="bg-blue-50 text-blue-600 border-blue-200"
              />
              <div
                onClick={() => setTab('deals')}
                className="cursor-pointer transition-transform hover:scale-[1.01]"
                title="Click to view all deals generated by this partner"
              >
                <Stat
                  label="Deals generated"
                  value={data.deals?.length ?? data.activity.referredOrders}
                  hint={`${formatCurrency(data.dealsSummary?.totalVolume ?? data.activity.referredVolume)} volume · click to view`}
                  icon={Receipt}
                  accent="bg-indigo-50 text-indigo-600 border-indigo-200"
                />
              </div>
              <Stat
                label="Support load"
                value={`${data.activity.disputeCount} / ${data.activity.ticketCount}`}
                hint="Disputes / tickets in their network"
                icon={data.activity.disputeCount > 0 ? ShieldAlert : LifeBuoy}
                accent={
                  data.activity.disputeCount > 0
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }
              />
            </div>

            {/* ── Identity, terms, payout destination ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100">
                  <Users size={13} className="text-indigo-600" /> Identity & terms
                </div>
                <dl className="text-[11px] space-y-1.5 m-0">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Revenue share</dt>
                    <dd className="font-black text-slate-900 m-0 text-right">
                      <div>
                        {partner?.sellerCommissionPercent ?? 15}% <span className="text-slate-400 font-normal">Seller</span> · {partner?.buyerCommissionPercent ?? 10}% <span className="text-slate-400 font-normal">Buyer</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        ({partner?.commissionSharePercent ?? ((partner?.sellerCommissionPercent ?? 15) + (partner?.buyerCommissionPercent ?? 10))}% if both parties referred)
                      </div>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 flex items-center gap-1">
                      <Phone size={10} /> Phone
                    </dt>
                    <dd className="font-mono text-slate-800 m-0">{partner?.phone || userObj?.phone || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 flex items-center gap-1">
                      <Mail size={10} /> Email
                    </dt>
                    <dd className="text-slate-800 m-0 truncate max-w-[180px]">
                      {partner?.email || userObj?.email || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 flex items-center gap-1">
                      <MapPin size={10} /> Location
                    </dt>
                    <dd className="text-slate-800 m-0">
                      {[partner?.city, partner?.state].filter(Boolean).join(', ') || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">PAN</dt>
                    <dd className="font-mono text-slate-800 m-0">{partner?.panNumber || '— (20% TDS)'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">GSTIN</dt>
                    <dd className="font-mono text-slate-800 m-0">{partner?.gstin || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Registered</dt>
                    <dd className="text-slate-800 m-0">{shortDate(partner?.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Approved</dt>
                    <dd className="text-slate-800 m-0">{shortDate(partner?.approvedAt)}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100">
                  <CreditCard size={13} className="text-emerald-600" /> Payout destination
                </div>
                {partner?.bankDetails?.accountNumber || partner?.bankDetails?.upiId ? (
                  <dl className="text-[11px] space-y-1.5 m-0">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Account holder</dt>
                      <dd className="font-semibold text-slate-900 m-0">
                        {partner.bankDetails.accountHolderName || '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Account number</dt>
                      <dd className="font-mono text-slate-800 m-0">{partner.bankDetails.accountNumber || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">IFSC</dt>
                      <dd className="font-mono text-slate-800 m-0">{partner.bankDetails.ifscCode || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Bank</dt>
                      <dd className="text-slate-800 m-0">{partner.bankDetails.bankName || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">UPI</dt>
                      <dd className="font-mono text-slate-800 m-0">{partner.bankDetails.upiId || '—'}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-[11px] text-amber-700 m-0">
                    No bank account or UPI on file — this partner cannot be paid yet.
                  </p>
                )}

                {partner?.applicationNote && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Application note
                    </div>
                    <p className="text-[11px] text-slate-700 m-0 leading-relaxed">{partner.applicationNote}</p>
                  </div>
                )}
                {partner?.adminNotes && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Internal admin notes
                    </div>
                    <p className="text-[11px] text-slate-700 m-0 leading-relaxed">{partner.adminNotes}</p>
                  </div>
                )}
                {partner?.rejectionReason && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                      Rejection reason
                    </div>
                    <p className="text-[11px] text-rose-700 m-0 leading-relaxed">{partner.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Tabbed detail ── */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-1.5 p-3 border-b border-slate-100 flex-wrap">
                {(
                  [
                    ['deals', `Deals & Orders (${data.deals?.length ?? data.activity.referredOrders})`],
                    ['network', `Network (${data.referrals.totalBuyers + data.referrals.totalSuppliers})`],
                    ['commissions', `Commission ledger (${data.commissions.length})`],
                    ['payouts', `Payouts (${data.payouts.length})`],
                  ] as Array<[DossierTab, string]>
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider cursor-pointer border transition-colors ${
                      tab === key
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Deals tab view */}
              {tab === 'deals' && (
                <div className="p-4 space-y-4">
                  {/* Deals Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deals Count</div>
                      <div className="text-base font-black text-slate-900">
                        {filteredDeals.length}
                        {filteredDeals.length !== allDeals.length && (
                          <span className="text-xs font-normal text-slate-400 ml-1">/ {allDeals.length}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">Attributed to partner</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Deal Value</div>
                      <div className="text-base font-black text-slate-900">
                        {formatCurrency(filteredDeals.reduce((sum, d) => sum + (d.totalAmount || 0), 0))}
                      </div>
                      <div className="text-[10px] text-slate-500">Total customer orders</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform Fee</div>
                      <div className="text-base font-black text-slate-900">
                        {formatCurrency(filteredDeals.reduce((sum, d) => sum + (d.platformFee || 0), 0))}
                      </div>
                      <div className="text-[10px] text-slate-500">AMJ commission pool</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Partner Earnings</div>
                      <div className="text-base font-black text-indigo-700">
                        {formatCurrency(filteredDeals.reduce((sum, d) => sum + (d.commission?.earnedAmount || 0), 0))}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold">
                        {formatCurrency(
                          filteredDeals
                            .filter((d) => d.commission?.status === 'cleared')
                            .reduce((sum, d) => sum + (d.commission?.earnedAmount || 0), 0)
                        )}{' '}
                        cleared
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1 max-w-sm">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={dealSearch}
                        onChange={(e) => setDealSearch(e.target.value)}
                        placeholder="Search order #, customer, store, product..."
                        className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                      {dealSearch && (
                        <button
                          type="button"
                          onClick={() => setDealSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer border-none bg-transparent"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={dealStatusFilter}
                        onChange={(e) => setDealStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="all">All Order Statuses</option>
                        <option value="completed">Completed / Delivered</option>
                        <option value="shipped">Dispatched / Shipped</option>
                        <option value="processing">Processing</option>
                        <option value="packed">Packed</option>
                        <option value="pending">Pending</option>
                        <option value="disputed">Disputed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <select
                        value={dealAttributionFilter}
                        onChange={(e) => setDealAttributionFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="all">All Attributions</option>
                        <option value="both">Both Buyer & Seller Referred</option>
                        <option value="buyer_referred">Buyer Referred Only</option>
                        <option value="supplier_referred">Seller Referred Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Deals List */}
                  {filteredDeals.length === 0 ? (
                    <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                      <ShoppingBag size={28} className="mx-auto text-slate-300 mb-2" />
                      <h4 className="text-xs font-bold text-slate-700 m-0">No deals found</h4>
                      <p className="text-[11px] text-slate-400 m-0 mt-1 max-w-md mx-auto">
                        {dealSearch || dealStatusFilter !== 'all' || dealAttributionFilter !== 'all'
                          ? 'No deals match your current filters. Try resetting search or status filters.'
                          : 'No customer orders have been attributed to this partner network yet. As referred buyers and suppliers transact on AMJSTAR, full deal breakdowns will appear here.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                      {filteredDeals.map((deal) => {
                        const orderStatusCfg =
                          ORDER_STATUS_CONFIG[deal.orderStatus?.toLowerCase()] || {
                            label: deal.orderStatus,
                            badge: 'bg-slate-100 text-slate-700 border-slate-200',
                          };

                        return (
                          <div
                            key={deal._id}
                            onClick={() => setSelectedDeal(deal)}
                            className="p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            {/* Left: Customer / Parties & Order # */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {deal.orderNumber}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {shortDate(deal.createdAt)}
                                </span>

                                {/* Attribution Badge */}
                                {deal.attribution?.type === 'both' ? (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                    Both Referred
                                  </span>
                                ) : deal.attribution?.type === 'buyer_referred' ? (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    Buyer Referred
                                  </span>
                                ) : deal.attribution?.type === 'supplier_referred' ? (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                    Seller Referred
                                  </span>
                                ) : null}

                                {/* Order Status Badge */}
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${orderStatusCfg.badge}`}
                                >
                                  {orderStatusCfg.label}
                                </span>
                              </div>

                              {/* Names: Buyer & Seller */}
                              <div className="flex items-center gap-1.5 text-xs text-slate-800 flex-wrap">
                                <span className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                  {deal.buyer.name || deal.buyer.companyName || 'Buyer'}
                                </span>
                                {deal.buyer.isReferredByThisPartner && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                    Partner Customer
                                  </span>
                                )}
                                <span className="text-slate-400 font-normal">➔</span>
                                <span className="font-bold text-slate-700 text-xs">
                                  {deal.supplier.businessName || deal.supplier.name || 'Seller'}
                                </span>
                                {deal.supplier.isReferredByThisPartner && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 border border-orange-200">
                                    Partner Seller
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                <span>
                                  {deal.items.length} {deal.items.length === 1 ? 'product' : 'products'}
                                  {deal.items[0]?.name ? ` · ${deal.items[0].name}${deal.items.length > 1 ? ` (+${deal.items.length - 1} more)` : ''}` : ''}
                                </span>
                              </div>
                            </div>

                            {/* Right: Deal Money, Partner Commission & View More CTA */}
                            <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              <div className="text-left sm:text-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deal Money</div>
                                <div className="text-sm font-black text-slate-900">
                                  {formatCurrency(deal.totalAmount)}
                                </div>
                                <div className="text-[11px] font-semibold text-indigo-700">
                                  +{formatCurrency(deal.commission.earnedAmount)} commission
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDeal(deal);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-extrabold flex items-center gap-1 border border-indigo-200 hover:border-indigo-600 transition-all cursor-pointer shadow-2xs"
                              >
                                <span>View More</span>
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Slide-over drawer for deal details with products & quantities ── */}
                  {selectedDeal && (
                    <div
                      className="fixed inset-0 z-[10001] bg-black/60 flex justify-end animate-fade-in"
                      onClick={() => setSelectedDeal(null)}
                    >
                      <div
                        className="bg-slate-50 w-full max-w-[720px] h-full overflow-y-auto shadow-2xl animate-slide-up flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Sticky Drawer Header */}
                        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedDeal(null)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer border border-slate-200 flex items-center gap-1 text-xs font-bold"
                              title="Back to deals list"
                            >
                              <ArrowLeft size={14} /> Back
                            </button>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1.5">
                                  {selectedDeal.orderNumber}
                                  <button
                                    type="button"
                                    onClick={() => handleCopyOrder(selectedDeal.orderNumber)}
                                    title="Copy order number"
                                    className="text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent p-0 flex items-center"
                                  >
                                    {copiedOrderNumber === selectedDeal.orderNumber ? (
                                      <Check size={11} className="text-emerald-600" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {fullDateTime(selectedDeal.createdAt)}
                                </span>
                              </div>
                              <h3 className="text-sm font-extrabold text-slate-900 m-0 mt-0.5 truncate">
                                Deal & Order Dossier
                              </h3>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedDeal(null)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer border border-slate-200"
                            title="Close drawer"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-5 space-y-4 flex-1">
                          {/* Status Pills Strip */}
                          <div className="flex items-center gap-2 flex-wrap bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                            {/* Attribution Tag */}
                            {selectedDeal.attribution?.type === 'both' ? (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                Both Parties Referred
                              </span>
                            ) : selectedDeal.attribution?.type === 'buyer_referred' ? (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                Buyer Referred
                              </span>
                            ) : selectedDeal.attribution?.type === 'supplier_referred' ? (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                Seller Referred
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                Partner Attributed
                              </span>
                            )}

                            {/* Order Status */}
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                ORDER_STATUS_CONFIG[selectedDeal.orderStatus?.toLowerCase()]?.badge ||
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {ORDER_STATUS_CONFIG[selectedDeal.orderStatus?.toLowerCase()]?.label || selectedDeal.orderStatus}
                            </span>

                            {/* Payment Status */}
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                PAYMENT_STATUS_CONFIG[selectedDeal.paymentStatus?.toLowerCase()]?.badge ||
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {PAYMENT_STATUS_CONFIG[selectedDeal.paymentStatus?.toLowerCase()]?.label || selectedDeal.paymentStatus}
                            </span>
                          </div>

                          {/* Customer Involvement & Relationship Flow */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                              <span>Customer Involvement & Flow</span>
                              <span className="text-[10px] font-medium text-slate-500 italic">
                                {selectedDeal.attribution?.narrative}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Buyer Box */}
                              <div
                                className={`p-3.5 rounded-lg border text-xs ${
                                  selectedDeal.buyer.isReferredByThisPartner
                                    ? 'bg-blue-50/50 border-blue-200'
                                    : 'bg-slate-50/70 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                    <ShoppingBag size={11} className="text-blue-600" /> Buyer (Customer)
                                  </span>
                                  {selectedDeal.buyer.isReferredByThisPartner ? (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                      Partner's Customer
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-600">
                                      Platform Buyer
                                    </span>
                                  )}
                                </div>
                                <div className="font-extrabold text-slate-900 text-sm truncate">
                                  {selectedDeal.buyer.name || selectedDeal.buyer.companyName || 'Buyer'}
                                </div>
                                {selectedDeal.buyer.companyName && selectedDeal.buyer.companyName !== selectedDeal.buyer.name && (
                                  <div className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                                    {selectedDeal.buyer.companyName}
                                  </div>
                                )}
                                <div className="space-y-1 mt-2 text-[11px] text-slate-600 font-mono">
                                  {selectedDeal.buyer.phone && <div>📞 {selectedDeal.buyer.phone}</div>}
                                  {selectedDeal.buyer.email && <div>✉️ {selectedDeal.buyer.email}</div>}
                                </div>
                              </div>

                              {/* Seller / Supplier Box */}
                              <div
                                className={`p-3.5 rounded-lg border text-xs ${
                                  selectedDeal.supplier.isReferredByThisPartner
                                    ? 'bg-orange-50/50 border-orange-200'
                                    : 'bg-slate-50/70 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                    <Store size={11} className="text-orange-600" /> Seller / Supplier
                                  </span>
                                  {selectedDeal.supplier.isReferredByThisPartner ? (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 border border-orange-200">
                                      Partner's Seller
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-600">
                                      Platform Supplier
                                    </span>
                                  )}
                                </div>
                                <div className="font-extrabold text-slate-900 text-sm truncate">
                                  {selectedDeal.supplier.businessName || selectedDeal.supplier.name || 'Supplier'}
                                </div>
                                {selectedDeal.supplier.tier && (
                                  <div className="text-[10px] text-orange-700 uppercase font-extrabold mt-0.5">
                                    Tier: {selectedDeal.supplier.tier}
                                  </div>
                                )}
                                <div className="space-y-1 mt-2 text-[11px] text-slate-600 font-mono">
                                  {selectedDeal.supplier.phone && <div>📞 {selectedDeal.supplier.phone}</div>}
                                  {selectedDeal.supplier.name && selectedDeal.supplier.name !== selectedDeal.supplier.businessName && (
                                    <div>👤 {selectedDeal.supplier.name}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Deal Financials Breakdown */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                              Deal Money & Partner Commission Breakdown
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Total Deal Money
                                </div>
                                <div className="text-base font-black text-slate-900 mt-0.5">
                                  {formatCurrency(selectedDeal.totalAmount)}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Items: {formatCurrency(selectedDeal.subtotal)}
                                  {selectedDeal.shippingCost > 0 && ` + Ship: ${formatCurrency(selectedDeal.shippingCost)}`}
                                </div>
                              </div>

                              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  AMJ Platform Fee
                                </div>
                                <div className="text-base font-extrabold text-slate-800 mt-0.5">
                                  {formatCurrency(selectedDeal.platformFee)}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Method: {selectedDeal.paymentMethod || 'direct'}
                                </div>
                              </div>

                              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Partner Cut Rate
                                </div>
                                <div className="text-base font-extrabold text-slate-800 mt-0.5">
                                  {selectedDeal.commission.partnerSharePercent}%
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">Of platform fee</div>
                              </div>

                              <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                                  Partner Commission
                                </div>
                                <div className="text-base font-black text-indigo-700 mt-0.5 flex items-center gap-1.5">
                                  {formatCurrency(selectedDeal.commission.earnedAmount)}
                                  <span
                                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border ${
                                      selectedDeal.commission.status === 'cleared'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : selectedDeal.commission.status === 'reversed'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    {selectedDeal.commission.status === 'cleared'
                                      ? 'Cleared'
                                      : selectedDeal.commission.status === 'reversed'
                                      ? 'Reversed'
                                      : 'In Escrow'}
                                  </span>
                                </div>
                                {selectedDeal.commission.clearedAt && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Cleared: {shortDate(selectedDeal.commission.clearedAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Logistics & Dispatch Info (if available) */}
                          {(selectedDeal.fulfillment?.courierName || selectedDeal.fulfillment?.trackingId) && (
                            <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 text-xs text-indigo-950 shadow-2xs">
                              <div className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Truck size={13} /> Fulfillment & Dispatch Details
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                                {selectedDeal.fulfillment.courierName && (
                                  <div>
                                    <span className="text-indigo-400 block text-[10px] uppercase font-bold">Courier</span>
                                    <span className="font-semibold">{selectedDeal.fulfillment.courierName}</span>
                                  </div>
                                )}
                                {selectedDeal.fulfillment.trackingId && (
                                  <div>
                                    <span className="text-indigo-400 block text-[10px] uppercase font-bold">Tracking #</span>
                                    <span className="font-mono font-bold">{selectedDeal.fulfillment.trackingId}</span>
                                  </div>
                                )}
                                {selectedDeal.fulfillment.driverPhone && (
                                  <div>
                                    <span className="text-indigo-400 block text-[10px] uppercase font-bold">Driver Contact</span>
                                    <span>📞 {selectedDeal.fulfillment.driverPhone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Products & Quantity Table (Detailed) */}
                          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                              <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                <Package size={14} className="text-indigo-600" /> Products & Quantities in Deal ({selectedDeal.items.length})
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">
                                Subtotal: {formatCurrency(selectedDeal.subtotal)}
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left min-w-[500px]">
                                <thead>
                                  <tr>
                                    <th className={thCls}>Product Item</th>
                                    <th className={thCls}>Quantity</th>
                                    <th className={thCls}>Unit Price</th>
                                    <th className={thCls}>GST Slab</th>
                                    <th className={`${thCls} text-right`}>Line Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedDeal.items.map((item, idx) => (
                                    <tr key={`drawer-it-${idx}`} className="hover:bg-slate-50/50">
                                      <td className={`${tdCls} font-semibold text-slate-900`}>
                                        <div className="flex items-center gap-2.5">
                                          {item.image ? (
                                            <img
                                              src={item.image}
                                              alt={item.name}
                                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                            />
                                          ) : (
                                            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                              <Package size={14} />
                                            </div>
                                          )}
                                          <div className="min-w-0">
                                            <div className="font-extrabold text-slate-900 text-xs">
                                              {item.name}
                                            </div>
                                            {item.hsnCode && (
                                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                HSN: {item.hsnCode}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className={tdCls}>
                                        <span className="font-black text-slate-900 text-xs">{item.quantity}</span>{' '}
                                        <span className="text-slate-500 text-[11px]">{item.unit || 'units'}</span>
                                      </td>
                                      <td className={`${tdCls} font-medium`}>{formatCurrency(item.price)}</td>
                                      <td className={tdCls}>
                                        {item.gstRate !== undefined ? `${item.gstRate}%` : 'Standard'}
                                      </td>
                                      <td className={`${tdCls} text-right font-black text-slate-900 text-xs`}>
                                        {formatCurrency(item.lineTotal || item.price * item.quantity)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="overflow-x-auto">
                {tab === 'network' && (
                  <table className="w-full text-left min-w-[560px]">
                    <thead>
                      <tr>
                        <th className={thCls}>Account</th>
                        <th className={thCls}>Type</th>
                        <th className={thCls}>Contact</th>
                        <th className={thCls}>Standing</th>
                        <th className={thCls}>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.referrals.totalBuyers + data.referrals.totalSuppliers === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-[11px] text-slate-400">
                            This partner has not referred anyone yet.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {data.referrals.suppliers.map((s) => (
                            <tr key={`s-${s._id}`} className="hover:bg-slate-50/70">
                              <td className={`${tdCls} font-semibold text-slate-900`}>
                                {s.businessName || 'Seller store'}
                              </td>
                              <td className={tdCls}>
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                                  Seller
                                </span>
                                {s.tier && <span className="ml-1 text-[10px] text-slate-400">{s.tier}</span>}
                              </td>
                              <td className={`${tdCls} font-mono`}>{s.phone || '—'}</td>
                              <td className={tdCls}>{s.kycStatus || 'KYC pending'}</td>
                              <td className={tdCls}>{shortDate(s.createdAt)}</td>
                            </tr>
                          ))}
                          {data.referrals.buyers.map((b) => (
                            <tr key={`b-${b._id}`} className="hover:bg-slate-50/70">
                              <td className={`${tdCls} font-semibold text-slate-900`}>{b.name || 'Buyer'}</td>
                              <td className={tdCls}>
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  {b.role === 'reseller' ? 'Reseller' : 'Buyer'}
                                </span>
                              </td>
                              <td className={`${tdCls} font-mono`}>{b.phone || '—'}</td>
                              <td className={tdCls}>{b.isActive === false ? 'Inactive' : 'Active'}</td>
                              <td className={tdCls}>{shortDate(b.createdAt)}</td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                )}

                {tab === 'commissions' && (
                  <table className="w-full text-left min-w-[620px]">
                    <thead>
                      <tr>
                        <th className={thCls}>Order</th>
                        <th className={thCls}>Date</th>
                        <th className={thCls}>Platform fee</th>
                        <th className={thCls}>Share</th>
                        <th className={thCls}>Earned</th>
                        <th className={thCls}>Attribution</th>
                        <th className={thCls}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.commissions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-[11px] text-slate-400">
                            No commission has been recorded for this partner yet.
                          </td>
                        </tr>
                      ) : (
                        data.commissions.map((c) => (
                          <tr key={c._id} className="hover:bg-slate-50/70">
                            <td className={`${tdCls} font-semibold text-slate-900`}>{c.orderNumber}</td>
                            <td className={tdCls}>{shortDate(c.createdAt)}</td>
                            <td className={tdCls}>{formatCurrency(c.amjPlatformFee ?? 0)}</td>
                            <td className={tdCls}>{c.partnerSharePercent}%</td>
                            <td className={`${tdCls} font-black text-slate-900`}>
                              {formatCurrency(c.earnedAmount)}
                            </td>
                            <td className={tdCls}>{c.attributionType.replace(/_/g, ' ')}</td>
                            <td className={tdCls}>
                              <span
                                className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${
                                  c.status === 'cleared'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : c.status === 'reversed'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {tab === 'payouts' && (
                  <table className="w-full text-left min-w-[620px]">
                    <thead>
                      <tr>
                        <th className={thCls}>Requested</th>
                        <th className={thCls}>Amount</th>
                        <th className={thCls}>TDS</th>
                        <th className={thCls}>Net paid</th>
                        <th className={thCls}>Status</th>
                        <th className={thCls}>UTR</th>
                        <th className={thCls}>Processed by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payouts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-[11px] text-slate-400">
                            This partner has never requested a payout.
                          </td>
                        </tr>
                      ) : (
                        data.payouts.map((p) => (
                          <tr key={p._id} className="hover:bg-slate-50/70">
                            <td className={tdCls}>{shortDate(p.createdAt)}</td>
                            <td className={`${tdCls} font-black text-slate-900`}>{formatCurrency(p.amount)}</td>
                            <td className={tdCls}>
                              <span className="text-slate-700 font-semibold block">−{formatCurrency(p.tdsDeducted)}</span>
                              <span className="text-[10px] text-slate-500">
                                ({p.amount && p.tdsDeducted ? Math.round((p.tdsDeducted / p.amount) * 100) : (p.tdsRate ? Math.round(p.tdsRate * 100) : 5)}% TDS)
                              </span>
                            </td>
                            <td className={`${tdCls} font-bold text-emerald-600`}>
                              {formatCurrency(p.netPayable)}
                            </td>
                            <td className={tdCls}>
                              <span
                                className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${
                                  p.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : p.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {p.status}
                              </span>
                              {p.rejectionReason && (
                                <div className="text-[10px] text-rose-600 mt-0.5 max-w-[160px] leading-snug">
                                  {p.rejectionReason}
                                </div>
                              )}
                            </td>
                            <td className={`${tdCls} font-mono text-[10px]`}>{p.paymentReference || '—'}</td>
                            <td className={tdCls}>
                              {typeof p.processedByAdminId === 'object' && p.processedByAdminId
                                ? p.processedByAdminId.name || '—'
                                : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {partner?.status === 'active' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                <ShieldCheck size={14} className="shrink-0" />
                This partner is live — their referral code attributes new sign-ups and their
                commission accrues on every deal their network closes.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPartnerDossier;
