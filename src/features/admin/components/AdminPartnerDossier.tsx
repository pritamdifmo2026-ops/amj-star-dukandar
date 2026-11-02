import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, Users, Store, ShoppingBag, Wallet, CircleDollarSign, Banknote, ShieldAlert,
  LifeBuoy, Receipt, CreditCard, ShieldCheck, Clock, MapPin, Phone, Mail,
} from 'lucide-react';
import Loader from '@/shared/components/feedback/Loader';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import partnerService, { type AdminPartnerDetail } from '@/features/partner/services/partner.service';

const thCls =
  'text-left px-3 py-2.5 text-slate-500 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] border-b border-slate-200 bg-slate-50 whitespace-nowrap';
const tdCls = 'px-3 py-2.5 border-b border-slate-100 text-[11px] text-slate-700 align-middle';

type DossierTab = 'network' | 'commissions' | 'payouts';

function shortDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_PILL: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  suspended: 'bg-rose-100 text-rose-800 border-rose-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  pending_approval: 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
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
 * who they brought in, what those accounts have actually transacted, the commission they
 * earned on it, and every payout AMJ Star has made to them.
 */
const AdminPartnerDossier: React.FC<{
  partnerId: string;
  onClose: () => void;
  onApprove: (partner: AdminPartnerDetail['partner']) => void;
  onReject: (partner: AdminPartnerDetail['partner']) => void;
  onEdit: (partner: AdminPartnerDetail['partner']) => void;
}> = ({ partnerId, onClose, onApprove, onReject, onEdit }) => {
  const [tab, setTab] = useState<DossierTab>('network');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminPartnerDetail', partnerId],
    queryFn: () => partnerService.adminGetPartnerDetail(partnerId),
  });

  const partner = data?.partner;
  const isPending = partner?.status === 'pending' || partner?.status === 'pending_approval';
  const userObj = typeof partner?.userId === 'object' ? partner.userId : null;

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
              <Stat
                label="Deals generated"
                value={data.activity.referredOrders}
                hint={`${formatCurrency(data.activity.referredVolume)} volume`}
                icon={Receipt}
                accent="bg-slate-50 text-slate-600 border-slate-200"
              />
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
                            <td className={tdCls}>{formatCurrency(c.amjPlatformFee)}</td>
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
