import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone,
  Clock,
  AlertCircle,
  Sparkles,
  Send
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import adminService from '../services/admin.service';
import concessionApi, {
  type ConcessionType,
  type ConcessionProposal,
  type ConcessionStatus,
} from '../services/concession.api';
import toast from 'react-hot-toast';

const TYPE_LABEL: Record<ConcessionType, string> = {
  subscription_trial: 'Subscription Trial',
  subscription_price: 'Custom Subscription Price',
  subscription_duration: 'Custom Subscription Duration',
  listing_fee_waiver: 'Listing-Fee Waiver',
  listing_fee_custom: 'Custom Listing Fee',
};

const PLAN_PRICE_DEFAULTS: Record<string, number> = {
  VERIFIED: 2100,
  GAMMA: 21000,
  BETA: 51000,
};

const STATUS_STYLE: Record<ConcessionStatus, string> = {
  pending: 'bg-[#fff7ed] text-[#c2410c] border-[#ffedd5]',
  approved: 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]',
  rejected: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]',
  cancelled: 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]',
};

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDateTime(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function summariseProposal(p: ConcessionProposal = {}, type: ConcessionType): string {
  switch (type) {
    case 'subscription_trial':
      return `${p.tier ?? 'VERIFIED'} · ${p.trialDays ?? 0} days free trial`;
    case 'subscription_price':
      return `₹${p.price ?? 0} for next cycle`;
    case 'subscription_duration':
      return `${p.durationMonths ?? 0} months period`;
    case 'listing_fee_waiver':
      return `Waived until ${p.until ? fmtDate(p.until) : '—'}`;
    case 'listing_fee_custom': {
      const parts: string[] = [];
      if (p.perProduct != null) parts.push(`₹${p.perProduct}/product`);
      if (p.minMonthly != null) parts.push(`min ₹${p.minMonthly}/mo`);
      return parts.join(' · ') || 'Custom listing fee';
    }
  }
}

export const AdminSalesRecommendConcession: React.FC = () => {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector(state => state.auth);
  const isSuperadmin = user?.role === 'superadmin';

  // Form State
  const [supplierId, setSupplierId] = useState(() => searchParams.get('supplierId') || '');
  const [type, setType] = useState<ConcessionType>('subscription_trial');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  // Proposal states
  const [trialTier, setTrialTier] = useState<'VERIFIED' | 'GAMMA' | 'BETA'>('VERIFIED');
  const [trialDays, setTrialDays] = useState<number | ''>(14);
  const [price, setPrice] = useState<number | ''>('');
  const [durationMonths, setDurationMonths] = useState<number | ''>(12);
  const [until, setUntil] = useState('');
  const [perProduct, setPerProduct] = useState<number | ''>('');
  const [minMonthly, setMinMonthly] = useState<number | ''>('');

  // Past recommendations filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Dates for waiver validation
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minWaiverDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 12);
  const maxWaiverDate = maxDate.toISOString().split('T')[0];

  // Load platform settings for dynamic plan prices
  const { data: platformSettings } = useQuery({
    queryKey: ['admin', 'platformSettings'],
    queryFn: () => adminService.getPlatformSettings(),
  });

  const planPrices: Record<string, number> = React.useMemo(() => ({
    VERIFIED: platformSettings?.planPrices?.VERIFIED ?? PLAN_PRICE_DEFAULTS.VERIFIED,
    GAMMA: platformSettings?.planPrices?.GAMMA ?? PLAN_PRICE_DEFAULTS.GAMMA,
    BETA: platformSettings?.planPrices?.BETA ?? PLAN_PRICE_DEFAULTS.BETA,
  }), [platformSettings]);

  // Load suppliers
  const { data: allSuppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['admin', 'suppliers', 'all'],
    queryFn: () => adminService.getAllSuppliers(),
  });

  // Filter suppliers based on role
  const eligibleSuppliers = React.useMemo(() => {
    if (isSuperadmin) return allSuppliers;
    return allSuppliers.filter(s => {
      const mgr = (s as any).accountManagerId;
      const mgrId = typeof mgr === 'object' && mgr !== null ? mgr._id : mgr;
      const currentUserId = (user as any)?._id?.toString() || (user as any)?.id?.toString();
      const isAssigned = (user as any)?.assignedSuppliers?.includes(s._id);
      return mgrId?.toString() === currentUserId || isAssigned;
    });
  }, [allSuppliers, isSuperadmin, user]);

  // Selected supplier info
  const selectedSupplier = React.useMemo(() => {
    if (!supplierId) return null;
    return eligibleSuppliers.find(s => s._id === supplierId) || null;
  }, [supplierId, eligibleSuppliers]);

  const selectedTier = (selectedSupplier?.tier || 'VERIFIED') as string;
  const selectedPlanPrice = planPrices[selectedTier] ?? PLAN_PRICE_DEFAULTS.VERIFIED;
  const hasActivePlan = selectedSupplier?.subscription?.status === 'ACTIVE' || selectedSupplier?.subscription?.status === 'TRIAL';

  // Load past recommendations
  const {
    data: myRecommendations = [],
    isLoading: recommendationsLoading,
  } = useQuery({
    queryKey: ['admin-concessions-mine'],
    queryFn: () => concessionApi.listMine(),
  });

  // Filter recommendations by status
  const filteredRecommendations = React.useMemo(() => {
    if (statusFilter === 'all') return myRecommendations;
    return myRecommendations.filter(r => r.status === statusFilter);
  }, [myRecommendations, statusFilter]);

  // Submit Mutation
  const createMutation = useMutation({
    mutationFn: () => {
      setFormError('');
      if (!supplierId) {
        throw new Error('Please select a supplier.');
      }
      if (!reason.trim()) {
        throw new Error('Please enter a reason for this recommendation.');
      }

      let proposal: ConcessionProposal = {};

      if (type === 'subscription_trial') {
        if (!trialDays || Number(trialDays) < 1 || Number(trialDays) > 90) {
          throw new Error('Trial duration must be between 1 and 90 days.');
        }
        proposal = {
          tier: trialTier,
          trialDays: Number(trialDays),
        };
      } else if (type === 'subscription_price') {
        if (price === '' || Number(price) < 0) {
          throw new Error('Please enter a valid price (₹0 or greater).');
        }
        if (hasActivePlan && Number(price) > selectedPlanPrice) {
          throw new Error(`Proposed price (₹${Number(price).toLocaleString('en-IN')}) cannot be higher than the current ${selectedTier} plan price (₹${selectedPlanPrice.toLocaleString('en-IN')}). Concessions are for discounts only.`);
        }
        proposal = {
          price: Math.round(Number(price)),
        };
      } else if (type === 'subscription_duration') {
        if (!durationMonths || Number(durationMonths) < 1 || Number(durationMonths) > 60) {
          throw new Error('Duration must be between 1 and 60 months.');
        }
        proposal = {
          durationMonths: Math.round(Number(durationMonths)),
        };
      } else if (type === 'listing_fee_waiver') {
        if (!until) {
          throw new Error('Please specify waiver expiration date.');
        }
        const selected = new Date(until);
        if (selected <= new Date()) {
          throw new Error('Waiver expiration date must be in the future.');
        }
        if (selected > maxDate) {
          throw new Error('Waiver duration cannot exceed 12 months.');
        }
        proposal = {
          until: new Date(until).toISOString(),
        };
      } else if (type === 'listing_fee_custom') {
        if (perProduct === '' && minMonthly === '') {
          throw new Error('Provide at least one custom rate (per-product or minimum monthly).');
        }
        if (perProduct !== '' && Number(perProduct) < 0) {
          throw new Error('Per-product fee must be 0 or greater.');
        }
        if (minMonthly !== '' && Number(minMonthly) < 0) {
          throw new Error('Minimum monthly fee must be 0 or greater.');
        }
        proposal = {
          perProduct: perProduct !== '' ? Math.round(Number(perProduct)) : undefined,
          minMonthly: minMonthly !== '' ? Math.round(Number(minMonthly)) : undefined,
        };
      }

      return concessionApi.create({
        supplierId,
        type,
        proposal,
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Recommendation submitted successfully!');
      setReason('');
      setPrice('');
      setUntil('');
      setPerProduct('');
      setMinMonthly('');
      qc.invalidateQueries({ queryKey: ['admin-concessions-mine'] });
      qc.invalidateQueries({ queryKey: ['admin', 'concessions'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit recommendation';
      setFormError(msg);
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-[#0f172a] uppercase tracking-wide flex items-center gap-2">
          <Megaphone className="text-[#0f172a]" size={22} />
          Recommend Billing Concession
        </h1>
        <p className="text-xs text-[#64748b] mt-1">
          Propose custom pricing, trial access, or listing-fee waivers for suppliers. Superadmin will review and approve.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Form (7 cols) ── */}
        <div className="lg:col-span-7 bg-white rounded-[12px] border border-[#e2e8f0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 mb-5 border-b border-[#f1f5f9]">
            <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-wider m-0">
              New Recommendation
            </h3>
            {isSuperadmin ? (
              <span className="text-[11px] font-semibold text-[#059669] bg-[#ecfdf5] px-2.5 py-0.5 rounded-full border border-[#a7f3d0]">
                Superadmin Mode: All suppliers
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#64748b] bg-[#f8fafc] px-2.5 py-0.5 rounded-full border border-[#e2e8f0]">
                My Assigned Suppliers Only
              </span>
            )}
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-xs text-[#b91c1c] font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Field 1: Supplier Picker */}
            <div>
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Target Supplier <span className="text-[#b91c1c]">*</span>
              </label>
              {suppliersLoading ? (
                <div className="text-xs text-[#64748b] py-2">Loading suppliers…</div>
              ) : eligibleSuppliers.length === 0 ? (
                <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] text-xs text-[#64748b]">
                  {isSuperadmin
                    ? 'No suppliers found in the database.'
                    : 'You have no suppliers assigned to your account. Ask a Superadmin to assign suppliers to you.'}
                </div>
              ) : (
                <select
                  value={supplierId}
                  onChange={e => { setSupplierId(e.target.value); setFormError(''); }}
                  disabled={createMutation.isPending}
                  className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white focus:outline-none focus:border-[#0f172a]"
                >
                  <option value="">-- Select a supplier --</option>
                  {eligibleSuppliers.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.businessName} ({s.tier || 'VERIFIED'} · {s.subscription?.status || 'NONE'})
                    </option>
                  ))}
                </select>
              )}
              {selectedSupplier && (
                <div className="mt-2 p-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-[8px]">
                  <div className="text-xs font-bold text-[#0369a1] mb-1">Selected Supplier Info</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#0c4a6e]">
                    <span>Current Tier:</span>
                    <span className="font-bold">{selectedTier}</span>
                    <span>Plan Price:</span>
                    <span className="font-bold">₹{selectedPlanPrice.toLocaleString('en-IN')}/year</span>
                    <span>Status:</span>
                    <span className="font-bold">{selectedSupplier.subscription?.status || 'NONE'}</span>
                    {selectedSupplier.subscription?.customPrice != null && (
                      <>
                        <span>Custom Price:</span>
                        <span className="font-bold text-[#059669]">₹{selectedSupplier.subscription.customPrice.toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Field 2: Concession Type */}
            <div>
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Concession Type <span className="text-[#b91c1c]">*</span>
              </label>
              <select
                value={type}
                onChange={e => {
                  setType(e.target.value as ConcessionType);
                  setFormError('');
                }}
                disabled={createMutation.isPending}
                className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white focus:outline-none focus:border-[#0f172a]"
              >
                <option value="subscription_trial">Subscription Trial</option>
                <option value="subscription_price">Custom Subscription Price</option>
                <option value="subscription_duration">Custom Subscription Duration</option>
                <option value="listing_fee_waiver">Listing-Fee Waiver</option>
                <option value="listing_fee_custom">Custom Listing Fee</option>
              </select>
            </div>

            {/* Field 3: Proposal Details (Conditional) */}
            <div className="p-4 bg-[#f8fafc] rounded-[10px] border border-[#e2e8f0]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-3 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#0f172a]" />
                Proposal Details: {TYPE_LABEL[type]}
              </div>

              {type === 'subscription_trial' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#475569] block mb-1">
                      Tier
                    </label>
                    <select
                      value={trialTier}
                      onChange={e => setTrialTier(e.target.value as any)}
                      disabled={createMutation.isPending}
                      className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white"
                    >
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="GAMMA">GAMMA</option>
                      <option value="BETA">BETA</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#475569] block mb-1">
                      Trial Duration (1–90 Days) <span className="text-[#b91c1c]">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={trialDays}
                      onChange={e => setTrialDays(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={createMutation.isPending}
                      className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white"
                      placeholder="e.g. 14"
                    />
                  </div>
                </div>
              )}

              {type === 'subscription_price' && (
                <div>
                  {hasActivePlan && (
                    <div className="mb-3 p-2.5 bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] text-xs text-[#9a3412]">
                      <span className="font-bold">{selectedTier}</span> plan default price: <span className="font-bold">₹{selectedPlanPrice.toLocaleString('en-IN')}</span>/year.
                      Proposed price should be lower than this (discount).
                    </div>
                  )}
                  <label className="text-xs font-bold text-[#475569] block mb-1">
                    Proposed Subscription Price (₹, Excl. GST) <span className="text-[#b91c1c]">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={hasActivePlan ? selectedPlanPrice : undefined}
                    value={price}
                    onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={createMutation.isPending}
                    className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white"
                    placeholder={hasActivePlan ? `e.g. ${Math.round(selectedPlanPrice * 0.7)} (max ₹${selectedPlanPrice.toLocaleString('en-IN')})` : 'e.g. 1499'}
                  />
                  {price !== '' && hasActivePlan && Number(price) > selectedPlanPrice && (
                    <p className="text-[11px] text-[#b91c1c] mt-1 m-0 font-semibold">
                      ⚠️ Proposed price (₹{Number(price).toLocaleString('en-IN')}) is higher than current plan price (₹{selectedPlanPrice.toLocaleString('en-IN')}). Concessions should be discounts.
                    </p>
                  )}
                  {price !== '' && hasActivePlan && Number(price) <= selectedPlanPrice && (
                    <p className="text-[11px] text-[#059669] mt-1 m-0 font-semibold">
                      Discount: ₹{(selectedPlanPrice - Number(price)).toLocaleString('en-IN')} off ({Math.round(((selectedPlanPrice - Number(price)) / selectedPlanPrice) * 100)}% discount)
                    </p>
                  )}
                  {!hasActivePlan && (
                    <p className="text-[11px] text-[#64748b] mt-1 m-0">
                      No active plan — any amount is allowed. Takes effect upon next renewal/paid cycle.
                    </p>
                  )}
                </div>
              )}

              {type === 'subscription_duration' && (
                <div>
                  <label className="text-xs font-bold text-[#475569] block mb-1">
                    Custom Duration (1–60 Months) <span className="text-[#b91c1c]">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={durationMonths}
                    onChange={e => setDurationMonths(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={createMutation.isPending}
                    className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white"
                    placeholder="e.g. 12"
                  />
                </div>
              )}

              {type === 'listing_fee_waiver' && (
                <div>
                  <label className="text-xs font-bold text-[#475569] block mb-1">
                    Waive Until (Max 12 Months) <span className="text-[#b91c1c]">*</span>
                  </label>
                  <input
                    type="date"
                    min={minWaiverDate}
                    max={maxWaiverDate}
                    value={until}
                    onChange={e => setUntil(e.target.value)}
                    disabled={createMutation.isPending}
                    className="border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white"
                  />
                  <p className="text-[11px] text-[#b45309] mt-1 m-0 font-medium">
                    ⚠️ Waiver auto-expires on this date. Maximum validity is 12 months.
                  </p>
                </div>
              )}

              {type === 'listing_fee_custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#475569] block mb-1">
                      Per-Product Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={perProduct}
                      onChange={e => setPerProduct(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={createMutation.isPending}
                      placeholder="e.g. 5"
                      className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#475569] block mb-1">
                      Min Monthly Charge (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={minMonthly}
                      onChange={e => setMinMonthly(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={createMutation.isPending}
                      placeholder="e.g. 299"
                      className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Field 4: Reason */}
            <div>
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Commercial Justification / Reason <span className="text-[#b91c1c]">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={createMutation.isPending}
                placeholder="Explain the commercial rationale (e.g. large volume seller committing to exclusive catalog, onboarding promo)..."
                className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#0f172a]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !supplierId || !reason.trim()}
                className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-[8px] px-5 py-2.5 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={14} />
                {createMutation.isPending ? 'Submitting…' : 'Submit Recommendation'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Past Recommendations (5 cols) ── */}
        <div className="lg:col-span-5 bg-white rounded-[12px] border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-4">
            <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-wider m-0">
              My Recommendations
            </h3>
            <span className="text-xs font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-full">
              {myRecommendations.length}
            </span>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 mb-4 p-1 bg-[#f8fafc] rounded-[8px] border border-[#e2e8f0]">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex-1 py-1 text-[11px] font-bold uppercase rounded-[6px] capitalize transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Cards List */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {recommendationsLoading ? (
              <div className="py-8 text-center text-xs text-[#64748b]">
                Loading recommendations…
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#94a3b8]">
                <Clock size={24} className="mx-auto mb-2 opacity-50" />
                No {statusFilter !== 'all' ? statusFilter : ''} recommendations found.
              </div>
            ) : (
              filteredRecommendations.map(item => {
                const sObj = typeof item.supplierId === 'object' ? item.supplierId : null;
                const supplierName = sObj?.businessName || 'Supplier';

                return (
                  <div
                    key={item._id}
                    className="p-3.5 rounded-[10px] border border-[#e2e8f0] bg-[#fafbfc] hover:bg-white hover:border-[#cbd5e1] transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0f172a] truncate">
                          {supplierName}
                        </div>
                        <div className="text-[11px] text-[#64748b] flex items-center gap-1 mt-0.5">
                          <span>{TYPE_LABEL[item.type] || item.type}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-[4px] border shrink-0 ${
                          STATUS_STYLE[item.status]
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-[#334155] bg-white p-2 rounded-[6px] border border-[#f1f5f9]">
                      {summariseProposal(item.proposal, item.type)}
                    </div>

                    <div className="text-xs text-[#64748b] line-clamp-2" title={item.reason}>
                      <span className="font-semibold text-[#475569]">Reason:</span> {item.reason}
                    </div>

                    {item.decisionNote && (
                      <div className="text-[11px] p-2 rounded-[6px] bg-[#f8fafc] border border-[#e2e8f0] text-[#475569]">
                        <span className="font-bold">Decision note:</span> {item.decisionNote}
                      </div>
                    )}

                    <div className="text-[10px] text-[#94a3b8] flex justify-between items-center pt-1 border-t border-[#f1f5f9]">
                      <span>{fmtDateTime(item.createdAt)}</span>
                      {item.decidedAt && (
                        <span>Decided: {fmtDate(item.decidedAt)}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesRecommendConcession;
