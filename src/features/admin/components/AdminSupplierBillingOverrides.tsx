import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  CreditCard,
  Percent,
  Clock,
  AlertCircle,
  History,
  RotateCcw,
  Lock,
  Megaphone
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import concessionApi, {
  type ConcessionRequest,
  type ConcessionType
} from '../services/concession.api';
import toast from 'react-hot-toast';

interface AdminSupplierBillingOverridesProps {
  supplierId: string;
  supplier: any;
  onChanged?: () => void;
}

const TYPE_LABEL: Record<ConcessionType, string> = {
  subscription_trial: 'Subscription Trial',
  subscription_price: 'Custom Subscription Price',
  subscription_duration: 'Custom Subscription Duration',
  listing_fee_waiver: 'Listing-Fee Waiver',
  listing_fee_custom: 'Custom Listing Fee',
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-[#fff7ed] text-[#c2410c]',
  approved: 'bg-[#ecfdf5] text-[#059669]',
  rejected: 'bg-[#fef2f2] text-[#b91c1c]',
  cancelled: 'bg-[#f1f5f9] text-[#64748b]',
};

function fmtDate(d?: string | Date) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDateTime(d?: string | Date) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const AdminSupplierBillingOverrides: React.FC<AdminSupplierBillingOverridesProps> = ({
  supplierId,
  supplier,
  onChanged,
}) => {
  const qc = useQueryClient();
  const [, setSearchParams] = useSearchParams();
  const { user } = useAppSelector(state => state.auth);
  const isSuperAdmin = user?.role === 'superadmin';

  // ── Form 1: Grant Trial State ──
  const [trialTier, setTrialTier] = useState<'VERIFIED' | 'GAMMA' | 'BETA'>('VERIFIED');
  const [trialDays, setTrialDays] = useState<number | ''>(14);
  const [trialReason, setTrialReason] = useState('');
  const [trialError, setTrialError] = useState('');

  // ── Form 2: Subscription Overrides State ──
  const [customPrice, setCustomPrice] = useState<number | ''>(
    supplier?.subscription?.customPrice != null ? supplier.subscription.customPrice : ''
  );
  const [customDurationMonths, setCustomDurationMonths] = useState<number | ''>(
    supplier?.subscription?.customDurationMonths != null ? supplier.subscription.customDurationMonths : ''
  );
  const [subOverrideReason, setSubOverrideReason] = useState('');
  const [subOverrideError, setSubOverrideError] = useState('');

  // ── Form 3: Listing-Fee Override State ──
  const [listingMode, setListingMode] = useState<'waive' | 'custom' | 'clear'>('waive');
  const [waivedUntil, setWaivedUntil] = useState('');
  const [perProductFee, setPerProductFee] = useState<number | ''>('');
  const [minMonthlyFee, setMinMonthlyFee] = useState<number | ''>('');
  const [listingFeeReason, setListingFeeReason] = useState('');
  const [listingFeeError, setListingFeeError] = useState('');

  // Calculation helpers
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minWaiverDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 12);
  const maxWaiverDate = maxDate.toISOString().split('T')[0];

  const hasActivePaidPlan =
    supplier?.subscription?.status === 'ACTIVE' && !supplier?.subscription?.isTrial;

  // ── History Query ──
  const { data: history = [], isLoading: historyLoading } = useQuery<ConcessionRequest[]>({
    queryKey: ['concession-history', supplierId],
    queryFn: () => concessionApi.history(supplierId),
    enabled: !!supplierId,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'suppliers'] });
    qc.invalidateQueries({ queryKey: ['supplier', supplierId] });
    qc.invalidateQueries({ queryKey: ['concession-history', supplierId] });
    onChanged?.();
  };

  // ── Mutation: Grant Trial ──
  const grantTrialMutation = useMutation({
    mutationFn: () => {
      setTrialError('');
      if (!trialDays || trialDays < 1 || trialDays > 90) {
        throw new Error('Trial duration must be between 1 and 90 days.');
      }
      if (!trialReason.trim()) {
        throw new Error('Please enter a reason for granting this trial.');
      }
      return concessionApi.grantTrial(supplierId, {
        tier: trialTier,
        trialDays: Number(trialDays),
        reason: trialReason.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Trial granted successfully!');
      setTrialReason('');
      invalidateAll();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to grant trial';
      setTrialError(msg);
      toast.error(msg);
    },
  });

  // ── Mutation: Subscription Overrides ──
  const subOverrideMutation = useMutation({
    mutationFn: () => {
      setSubOverrideError('');
      if (!subOverrideReason.trim()) {
        throw new Error('Reason is required for subscription overrides.');
      }
      if (customDurationMonths !== '' && (Number(customDurationMonths) < 1 || Number(customDurationMonths) > 60)) {
        throw new Error('Duration must be between 1 and 60 months.');
      }
      if (customPrice !== '' && Number(customPrice) < 0) {
        throw new Error('Custom price cannot be negative.');
      }
      return concessionApi.setSubscriptionOverride(supplierId, {
        customPrice: customPrice !== '' ? Number(customPrice) : null,
        customDurationMonths: customDurationMonths !== '' ? Number(customDurationMonths) : null,
        reason: subOverrideReason.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Subscription overrides saved!');
      setSubOverrideReason('');
      invalidateAll();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save subscription overrides';
      setSubOverrideError(msg);
      toast.error(msg);
    },
  });

  // ── Mutation: Listing Fee Override ──
  const listingFeeMutation = useMutation({
    mutationFn: () => {
      setListingFeeError('');
      if (listingMode === 'clear') {
        return concessionApi.clearListingFeeOverride(supplierId);
      }

      if (!listingFeeReason.trim()) {
        throw new Error('Reason is required for listing-fee override.');
      }

      if (listingMode === 'waive') {
        if (!waivedUntil) {
          throw new Error('Please select a waiver expiration date.');
        }
        const selectedDate = new Date(waivedUntil);
        if (selectedDate <= new Date()) {
          throw new Error('Waiver expiration date must be in the future.');
        }
        if (selectedDate > maxDate) {
          throw new Error('Waiver duration cannot exceed 12 months.');
        }
        return concessionApi.setListingFeeOverride(supplierId, {
          waived: true,
          waivedUntil,
          reason: listingFeeReason.trim(),
        });
      } else {
        // custom amounts
        if (perProductFee === '' && minMonthlyFee === '') {
          throw new Error('Please provide at least one custom rate (per-product or minimum monthly).');
        }
        if (perProductFee !== '' && Number(perProductFee) < 0) {
          throw new Error('Per-product fee must be 0 or greater.');
        }
        if (minMonthlyFee !== '' && Number(minMonthlyFee) < 0) {
          throw new Error('Minimum monthly fee must be 0 or greater.');
        }
        return concessionApi.setListingFeeOverride(supplierId, {
          perProduct: perProductFee !== '' ? Number(perProductFee) : null,
          minMonthly: minMonthlyFee !== '' ? Number(minMonthlyFee) : null,
          waived: false,
          reason: listingFeeReason.trim(),
        });
      }
    },
    onSuccess: () => {
      toast.success(
        listingMode === 'clear'
          ? 'Listing-fee override cleared'
          : 'Listing-fee override applied!'
      );
      setListingFeeReason('');
      invalidateAll();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update listing-fee override';
      setListingFeeError(msg);
      toast.error(msg);
    },
  });

  return (
    <div className="flex flex-col gap-6 mt-6">
      {/* ── 1. Current State Summary ── */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#f1f5f9]">
          <CreditCard size={18} className="text-[#0f172a]" />
          <h4 className="text-sm font-extrabold text-[#0f172a] m-0">Current Billing & Concession State</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#f8fafc] p-3 rounded-[8px] border border-[#eef2f6]">
            <span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">
              Subscription Status
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  supplier?.subscription?.status === 'ACTIVE'
                    ? 'bg-[#ecfdf5] text-[#059669]'
                    : supplier?.subscription?.status === 'TRIAL'
                    ? 'bg-[#eff6ff] text-[#1d4ed8]'
                    : 'bg-[#f1f5f9] text-[#64748b]'
                }`}
              >
                {supplier?.subscription?.isTrial ? 'TRIAL' : supplier?.subscription?.status || 'NONE'}
              </span>
              <span className="text-xs font-semibold text-[#0f172a]">
                Tier: {supplier?.subscription?.tier || supplier?.tier || 'VERIFIED'}
              </span>
            </div>
            <div className="text-xs text-[#64748b] mt-1.5">
              {supplier?.subscription?.isTrial || supplier?.subscription?.status === 'TRIAL'
                ? `Trial expires: ${fmtDate(supplier?.subscription?.trialExpiryDate || supplier?.subscription?.expiryDate)}`
                : supplier?.subscription?.expiryDate
                ? `Expires: ${fmtDate(supplier?.subscription?.expiryDate)}`
                : 'No active plan'}
            </div>
          </div>

          <div className="bg-[#f8fafc] p-3 rounded-[8px] border border-[#eef2f6]">
            <span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">
              Next-Cycle Subscription Overrides
            </span>
            <div className="text-xs text-[#0f172a] font-medium">
              <div>
                Price:{' '}
                <strong className="text-[#059669]">
                  {supplier?.subscription?.customPrice != null ? `₹${Math.round(supplier.subscription.customPrice)}` : '—'}
                </strong>
              </div>
              <div className="mt-1">
                Duration:{' '}
                <strong>
                  {supplier?.subscription?.customDurationMonths != null
                    ? `${supplier.subscription.customDurationMonths} months`
                    : '—'}
                </strong>
              </div>
            </div>
          </div>

          <div className="bg-[#f8fafc] p-3 rounded-[8px] border border-[#eef2f6]">
            <span className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider block mb-1">
              Listing-Fee Override
            </span>
            {supplier?.listingFeeOverride?.waived ? (
              <div className="text-xs">
                <span className="inline-block font-bold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded-[4px] border border-[#a7f3d0]">
                  Waived Completely
                </span>
                <div className="text-xs text-[#64748b] mt-1">
                  Until: {fmtDate(supplier.listingFeeOverride.waivedUntil)}
                </div>
                {supplier.listingFeeOverride.reason && (
                  <div className="text-[11px] text-[#94a3b8] italic mt-0.5 truncate" title={supplier.listingFeeOverride.reason}>
                    Reason: {supplier.listingFeeOverride.reason}
                  </div>
                )}
              </div>
            ) : supplier?.listingFeeOverride?.perProduct != null || supplier?.listingFeeOverride?.minMonthly != null ? (
              <div className="text-xs text-[#0f172a]">
                <div className="font-semibold">
                  ₹{supplier.listingFeeOverride.perProduct ?? 10}/product · min ₹{supplier.listingFeeOverride.minMonthly ?? 499}/mo
                </div>
                {supplier.listingFeeOverride.reason && (
                  <div className="text-[11px] text-[#94a3b8] italic mt-0.5 truncate" title={supplier.listingFeeOverride.reason}>
                    Reason: {supplier.listingFeeOverride.reason}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#64748b] italic">
                Using platform defaults (₹10 / ₹499)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sub-Admin Access Notice ── */}
      {!isSuperAdmin && (
        <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#ffedd5] flex items-center justify-center shrink-0 mt-0.5">
              <Lock size={18} className="text-[#ea580c]" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-[#9a3412] m-0">Direct Overrides Restricted to SuperAdmin</h5>
              <p className="text-xs text-[#7c2d12] mt-0.5 m-0">
                You do not have permission to directly modify billing overrides. These forms are read-only for sub-admins. To propose changes for this supplier, submit a recommendation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'sales-recommend', supplierId })}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0f172a] text-white text-xs font-bold rounded-[8px] hover:bg-[#1e293b] transition-colors cursor-pointer"
          >
            <Megaphone size={14} /> Recommend Concession
          </button>
        </div>
      )}

      {/* ── 2. Grant Trial Form ── */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#f1f5f9]">
          <ShieldCheck size={18} className="text-[#2563eb]" />
          <h4 className="text-sm font-extrabold text-[#0f172a] m-0">Grant Free Subscription Trial</h4>
          {!isSuperAdmin && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0] px-2 py-0.5 rounded flex items-center gap-1">
              <Lock size={10} /> Read Only
            </span>
          )}
        </div>

        {hasActivePaidPlan && (
          <div className="mb-4 p-3 rounded-[8px] bg-[#fffbeb] border border-[#fde68a] text-xs text-[#92400e] font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            Cannot overwrite an active paid plan. Wait until their subscription expires or set next-cycle overrides instead.
          </div>
        )}

        {trialError && (
          <div className="mb-4 p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-xs text-[#b91c1c] font-semibold">
            {trialError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
              Trial Tier
            </label>
            <select
              value={trialTier}
              onChange={e => setTrialTier(e.target.value as any)}
              disabled={!isSuperAdmin || hasActivePaidPlan || grantTrialMutation.isPending}
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white disabled:bg-[#f8fafc] disabled:opacity-60"
            >
              <option value="VERIFIED">VERIFIED</option>
              <option value="GAMMA">GAMMA</option>
              <option value="BETA">BETA</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
              Duration (Days, 1–90)
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={trialDays}
              onChange={e => setTrialDays(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={!isSuperAdmin || hasActivePaidPlan || grantTrialMutation.isPending}
              placeholder="e.g. 14 or 30"
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white disabled:bg-[#f8fafc] disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
            Reason <span className="text-[#b91c1c]">*</span>
          </label>
          <textarea
            rows={2}
            value={trialReason}
            onChange={e => setTrialReason(e.target.value)}
            disabled={!isSuperAdmin || hasActivePaidPlan || grantTrialMutation.isPending}
            placeholder="Explain why this trial is being granted (e.g. key manufacturer onboarding promotion)..."
            className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#0f172a] disabled:bg-[#f8fafc] disabled:opacity-60"
          />
        </div>

        <div className="mt-4 flex justify-end">
          {!isSuperAdmin ? (
            <button
              disabled
              className="bg-[#f8fafc] text-[#94a3b8] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center gap-1.5"
            >
              <Lock size={12} /> SuperAdmin Access Required
            </button>
          ) : (
            <button
              onClick={() => grantTrialMutation.mutate()}
              disabled={hasActivePaidPlan || grantTrialMutation.isPending || !trialReason.trim()}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-[8px] px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {grantTrialMutation.isPending ? 'Granting Trial…' : 'Grant Trial'}
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Subscription Overrides Form ── */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#f1f5f9]">
          <Percent size={18} className="text-[#059669]" />
          <h4 className="text-sm font-extrabold text-[#0f172a] m-0">Subscription Overrides (Next Cycle)</h4>
          {!isSuperAdmin && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0] px-2 py-0.5 rounded flex items-center gap-1">
              <Lock size={10} /> Read Only
            </span>
          )}
        </div>
        <p className="text-xs text-[#64748b] mb-4">
          Takes effect at the supplier's next paid cycle. Does not touch the current active subscription. Leave fields empty to clear overrides.
        </p>

        {subOverrideError && (
          <div className="mb-4 p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-xs text-[#b91c1c] font-semibold">
            {subOverrideError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
              Custom Price (₹, Excl. GST)
            </label>
            <input
              type="number"
              min={0}
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={!isSuperAdmin || subOverrideMutation.isPending}
              placeholder="e.g. 999 (leave blank for catalog price)"
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white disabled:bg-[#f8fafc] disabled:opacity-60 focus:outline-none focus:border-[#0f172a]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
              Custom Duration (Months, 1–60)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={customDurationMonths}
              onChange={e => setCustomDurationMonths(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={!isSuperAdmin || subOverrideMutation.isPending}
              placeholder="e.g. 12 (leave blank for catalog period)"
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white disabled:bg-[#f8fafc] disabled:opacity-60 focus:outline-none focus:border-[#0f172a]"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
            Reason <span className="text-[#b91c1c]">*</span>
          </label>
          <textarea
            rows={2}
            value={subOverrideReason}
            onChange={e => setSubOverrideReason(e.target.value)}
            disabled={!isSuperAdmin || subOverrideMutation.isPending}
            placeholder="Reason for special price or tenure override..."
            className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#0f172a] disabled:bg-[#f8fafc] disabled:opacity-60"
          />
        </div>

        <div className="mt-4 flex justify-end">
          {!isSuperAdmin ? (
            <button
              disabled
              className="bg-[#f8fafc] text-[#94a3b8] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center gap-1.5"
            >
              <Lock size={12} /> SuperAdmin Access Required
            </button>
          ) : (
            <button
              onClick={() => subOverrideMutation.mutate()}
              disabled={subOverrideMutation.isPending || !subOverrideReason.trim()}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-[8px] px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {subOverrideMutation.isPending ? 'Saving Overrides…' : 'Save Overrides'}
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Listing-Fee Override Form ── */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#f1f5f9]">
          <RotateCcw size={18} className="text-[#ea580c]" />
          <h4 className="text-sm font-extrabold text-[#0f172a] m-0">Monthly Listing-Fee Override</h4>
          {!isSuperAdmin && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0] px-2 py-0.5 rounded flex items-center gap-1">
              <Lock size={10} /> Read Only
            </span>
          )}
        </div>

        {listingFeeError && (
          <div className="mb-4 p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-xs text-[#b91c1c] font-semibold">
            {listingFeeError}
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#0f172a] cursor-pointer">
            <input
              type="radio"
              name="listingMode"
              checked={listingMode === 'waive'}
              onChange={() => setListingMode('waive')}
              disabled={!isSuperAdmin || listingFeeMutation.isPending}
              className="accent-[#0f172a] disabled:opacity-50"
            />
            Waive completely
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#0f172a] cursor-pointer">
            <input
              type="radio"
              name="listingMode"
              checked={listingMode === 'custom'}
              onChange={() => setListingMode('custom')}
              disabled={!isSuperAdmin || listingFeeMutation.isPending}
              className="accent-[#0f172a] disabled:opacity-50"
            />
            Custom amounts
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#0f172a] cursor-pointer">
            <input
              type="radio"
              name="listingMode"
              checked={listingMode === 'clear'}
              onChange={() => setListingMode('clear')}
              disabled={!isSuperAdmin || listingFeeMutation.isPending}
              className="accent-[#0f172a] disabled:opacity-50"
            />
            Clear override (Revert to default)
          </label>
        </div>

        {listingMode === 'waive' && (
          <div className="p-3 bg-[#fffbeb] rounded-[8px] border border-[#fde68a] mb-3">
            <label className="text-xs font-bold text-[#92400e] uppercase tracking-wider block mb-1">
              Waive Until (Max 12 Months) <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              type="date"
              min={minWaiverDate}
              max={maxWaiverDate}
              value={waivedUntil}
              onChange={e => setWaivedUntil(e.target.value)}
              disabled={!isSuperAdmin || listingFeeMutation.isPending}
              className="border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white disabled:bg-[#f8fafc] disabled:opacity-60 focus:outline-none"
            />
            <p className="text-xs text-[#b45309] mt-1.5 m-0 font-medium">
              ⚠️ Waiver auto-expires on this date. The supplier will not be charged listing fees until then.
            </p>
          </div>
        )}

        {listingMode === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Per-Product Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={perProductFee}
                onChange={e => setPerProductFee(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!isSuperAdmin || listingFeeMutation.isPending}
                placeholder="e.g. 5 (default: ₹10)"
                className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white disabled:bg-[#f8fafc] disabled:opacity-60 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
                Minimum Monthly Charge (₹)
              </label>
              <input
                type="number"
                min={0}
                value={minMonthlyFee}
                onChange={e => setMinMonthlyFee(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!isSuperAdmin || listingFeeMutation.isPending}
                placeholder="e.g. 299 (default: ₹499)"
                className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white disabled:bg-[#f8fafc] disabled:opacity-60 focus:outline-none"
              />
            </div>
          </div>
        )}

        {listingMode !== 'clear' ? (
          <div>
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
              Reason <span className="text-[#b91c1c]">*</span>
            </label>
            <textarea
              rows={2}
              value={listingFeeReason}
              onChange={e => setListingFeeReason(e.target.value)}
              disabled={!isSuperAdmin || listingFeeMutation.isPending}
              placeholder="Reason for listing-fee waiver or custom pricing..."
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#0f172a] disabled:bg-[#f8fafc] disabled:opacity-60"
            />
          </div>
        ) : (
          <p className="text-xs text-[#64748b] my-2">
            Revert this supplier's monthly listing fee to the standard platform rates (₹10/live product, min ₹499/mo).
          </p>
        )}

        <div className="mt-4 flex justify-end">
          {!isSuperAdmin ? (
            <button
              disabled
              className="bg-[#f8fafc] text-[#94a3b8] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center gap-1.5"
            >
              <Lock size={12} /> SuperAdmin Access Required
            </button>
          ) : (
            <button
              onClick={() => listingFeeMutation.mutate()}
              disabled={
                listingFeeMutation.isPending ||
                (listingMode !== 'clear' && !listingFeeReason.trim()) ||
                (listingMode === 'waive' && !waivedUntil)
              }
              className={`rounded-[8px] px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                listingMode === 'clear'
                  ? 'bg-white border border-[#e2e8f0] text-[#b91c1c] hover:bg-[#fef2f2]'
                  : 'bg-[#0f172a] hover:bg-[#1e293b] text-white'
              }`}
            >
              {listingFeeMutation.isPending
                ? 'Working…'
                : listingMode === 'clear'
                ? 'Clear Override'
                : 'Apply Override'}
            </button>
          )}
        </div>
      </div>

      {/* ── 5. Concession History Table ── */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 p-4 border-b border-[#f1f5f9] bg-[#f8fafc]">
          <History size={16} className="text-[#64748b]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569] m-0">
            Concession History ({history.length})
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wider text-[#475569] border-b border-[#e2e8f0]">
              <tr>
                <th className="py-2.5 px-4 font-bold">Date</th>
                <th className="py-2.5 px-4 font-bold">Type</th>
                <th className="py-2.5 px-4 font-bold">Source</th>
                <th className="py-2.5 px-4 font-bold">Reason</th>
                <th className="py-2.5 px-4 font-bold">Status</th>
                <th className="py-2.5 px-4 font-bold">Decision Note</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748b] text-xs">
                    Loading history…
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748b] text-xs">
                    <Clock size={20} className="mx-auto mb-1.5 text-[#94a3b8]" />
                    No concession history yet.
                  </td>
                </tr>
              ) : (
                history.map(item => (
                  <tr key={item._id} className="border-b border-[#f1f5f9] hover:bg-[#fafbfc]">
                    <td className="py-3 px-4 text-xs text-[#64748b] whitespace-nowrap">
                      {fmtDateTime(item.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#0f172a]">
                      {TYPE_LABEL[item.type] || item.type}
                    </td>
                    <td className="py-3 px-4 text-xs capitalize text-[#475569]">
                      {item.source}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#334155] max-w-xs truncate" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase ${STATUS_STYLE[item.status] || ''}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#64748b]">
                      {item.decisionNote ? (
                        <span title={item.decisionNote}>{item.decisionNote}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSupplierBillingOverrides;
