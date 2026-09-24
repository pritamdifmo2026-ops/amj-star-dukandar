import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HandCoins,
  Send,
  Clock,
  AlertCircle,
  Sparkles,
  Layers,
  History
} from 'lucide-react';
import supplierConcessionApi from '../services/concession.api';
import type {
  ConcessionRequest,
  ConcessionType,
  ConcessionProposal,
  ConcessionStatus,
} from '@/features/admin/services/concession.api';
import toast from 'react-hot-toast';

const TYPE_LABEL: Record<ConcessionType, string> = {
  subscription_trial: 'Subscription Trial',
  subscription_price: 'Custom Subscription Price',
  subscription_duration: 'Custom Subscription Duration',
  listing_fee_waiver: 'Listing-Fee Waiver',
  listing_fee_custom: 'Custom Listing Fee',
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
      return `${p.durationMonths ?? 0} months duration`;
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

export const SupplierConcessionRequest: React.FC = () => {
  const qc = useQueryClient();

  // Form State
  const [type, setType] = useState<ConcessionType>('subscription_trial');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  // Proposal State
  const [trialTier, setTrialTier] = useState<'VERIFIED' | 'GAMMA' | 'BETA'>('VERIFIED');
  const [trialDays, setTrialDays] = useState<number | ''>(14);
  const [price, setPrice] = useState<number | ''>('');
  const [durationMonths, setDurationMonths] = useState<number | ''>(12);
  const [until, setUntil] = useState('');
  const [perProduct, setPerProduct] = useState<number | ''>('');
  const [minMonthly, setMinMonthly] = useState<number | ''>('');

  // Dates for waiver validation
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minWaiverDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 12);
  const maxWaiverDate = maxDate.toISOString().split('T')[0];

  // Load My Requests
  const { data: myRequests = [], isLoading: requestsLoading } = useQuery<ConcessionRequest[]>({
    queryKey: ['supplier-concessions-mine'],
    queryFn: () => supplierConcessionApi.listMine(),
  });

  // Submit Mutation
  const createMutation = useMutation({
    mutationFn: () => {
      setFormError('');
      if (!reason.trim()) {
        throw new Error('Please enter a reason or business justification.');
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
          throw new Error('Please select waiver expiry date.');
        }
        const selected = new Date(until);
        if (selected <= new Date()) {
          throw new Error('Waiver expiry date must be in the future.');
        }
        if (selected > maxDate) {
          throw new Error('Waiver duration cannot exceed 12 months.');
        }
        proposal = {
          until: new Date(until).toISOString(),
        };
      } else if (type === 'listing_fee_custom') {
        if (perProduct === '' && minMonthly === '') {
          throw new Error('Please provide at least one custom rate (per-product or minimum monthly).');
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

      return supplierConcessionApi.create({
        type,
        proposal,
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Concession request submitted successfully!');
      setReason('');
      setPrice('');
      setUntil('');
      setPerProduct('');
      setMinMonthly('');
      qc.invalidateQueries({ queryKey: ['supplier-concessions-mine'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit concession request';
      setFormError(msg);
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-black text-[#0f172a] uppercase tracking-wide flex items-center gap-2">
          <HandCoins className="text-[#0f172a]" size={22} />
          Billing Concessions
        </h1>
        <p className="text-xs text-[#64748b] mt-1">
          Ask AMJSTAR for a subscription discount, trial, or listing-fee waiver. Your assigned account manager will review it.
        </p>
      </div>

      {/* ── Section 1: Request a Concession ── */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#f1f5f9]">
          <Sparkles size={18} className="text-[#2563eb]" />
          <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-wider m-0">
            Request a Concession
          </h3>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-xs text-[#b91c1c] font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-4 max-w-3xl">
          {/* Concession Type */}
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
              <option value="subscription_trial">Subscription Trial (Free access to higher tier)</option>
              <option value="subscription_price">Custom Subscription Price (Discounted renewal)</option>
              <option value="subscription_duration">Custom Subscription Duration (Extended term)</option>
              <option value="listing_fee_waiver">Listing-Fee Waiver (Temporary fee exemption)</option>
              <option value="listing_fee_custom">Custom Listing Fee (Reduced per-product or monthly minimum)</option>
            </select>
          </div>

          {/* Proposal Details (Conditional) */}
          <div className="p-4 bg-[#f8fafc] rounded-[10px] border border-[#e2e8f0]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-3 flex items-center gap-1.5">
              <Layers size={14} className="text-[#0f172a]" />
              Proposal Details: {TYPE_LABEL[type]}
            </div>

            {type === 'subscription_trial' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#475569] block mb-1">
                    Requested Tier
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
                <label className="text-xs font-bold text-[#475569] block mb-1">
                  Proposed Price (₹, Excl. GST) <span className="text-[#b91c1c]">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={createMutation.isPending}
                  className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] bg-white"
                  placeholder="e.g. 1499"
                />
                <p className="text-[11px] text-[#64748b] mt-1 m-0">
                  Applied upon approval towards your next subscription renewal cycle.
                </p>
              </div>
            )}

            {type === 'subscription_duration' && (
              <div>
                <label className="text-xs font-bold text-[#475569] block mb-1">
                  Requested Duration (1–60 Months) <span className="text-[#b91c1c]">*</span>
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
                <p className="text-[11px] text-[#b45309] mt-1.5 m-0 font-medium">
                  ⚠️ Waiver auto-expires on this date. Maximum valid duration is 12 months from today.
                </p>
              </div>
            )}

            {type === 'listing_fee_custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#475569] block mb-1">
                    Proposed Per-Product Fee (₹)
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
                    Proposed Min Monthly Charge (₹)
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

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider block mb-1">
              Reason / Proposal Details <span className="text-[#b91c1c]">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={createMutation.isPending}
              placeholder="Explain why you are requesting this concession (e.g. expanding catalog by 1,000 SKUs, trial period to test marketplace demand)..."
              className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#0f172a]"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !reason.trim()}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-[8px] px-5 py-2.5 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={14} />
              {createMutation.isPending ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 2: My Requests ── */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between p-4 border-b border-[#f1f5f9] bg-[#f8fafc]">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[#64748b]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] m-0">
              My Concession Requests ({myRequests.length})
            </h3>
          </div>
        </div>

        {/* Mobile card view / Desktop table view */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm hidden md:table">
            <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wider text-[#475569] border-b border-[#e2e8f0]">
              <tr>
                <th className="py-2.5 px-4 font-bold">Created Date</th>
                <th className="py-2.5 px-4 font-bold">Type</th>
                <th className="py-2.5 px-4 font-bold">Proposal Summary</th>
                <th className="py-2.5 px-4 font-bold">Reason</th>
                <th className="py-2.5 px-4 font-bold">Status</th>
                <th className="py-2.5 px-4 font-bold">Decision Note</th>
              </tr>
            </thead>
            <tbody>
              {requestsLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748b] text-xs">
                    Loading requests…
                  </td>
                </tr>
              ) : myRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#64748b] text-xs">
                    <Clock size={22} className="mx-auto mb-2 text-[#94a3b8]" />
                    You haven't submitted any concession requests yet.
                  </td>
                </tr>
              ) : (
                myRequests.map(item => (
                  <tr key={item._id} className="border-b border-[#f1f5f9] hover:bg-[#fafbfc]">
                    <td className="py-3 px-4 text-xs text-[#64748b] whitespace-nowrap">
                      {fmtDateTime(item.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#0f172a]">
                      {TYPE_LABEL[item.type] || item.type}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#334155] font-medium">
                      {summariseProposal(item.proposal, item.type)}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#475569] max-w-xs truncate" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase ${
                          STATUS_STYLE[item.status]
                        }`}
                      >
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

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[#f1f5f9]">
            {requestsLoading ? (
              <div className="py-8 text-center text-xs text-[#64748b]">Loading requests…</div>
            ) : myRequests.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#94a3b8]">
                <Clock size={22} className="mx-auto mb-2 opacity-50" />
                No requests found.
              </div>
            ) : (
              myRequests.map(item => (
                <div key={item._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#0f172a]">
                        {TYPE_LABEL[item.type] || item.type}
                      </div>
                      <div className="text-[11px] text-[#64748b] mt-0.5">
                        {fmtDateTime(item.createdAt)}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-[4px] border ${
                        STATUS_STYLE[item.status]
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs bg-[#f8fafc] p-2 rounded-[6px] border border-[#e2e8f0] font-medium text-[#0f172a]">
                    {summariseProposal(item.proposal, item.type)}
                  </div>

                  <div className="text-xs text-[#64748b]">
                    <span className="font-semibold text-[#475569]">Reason:</span> {item.reason}
                  </div>

                  {item.decisionNote && (
                    <div className="text-[11px] p-2 rounded-[6px] bg-[#fffbeb] border border-[#fde68a] text-[#92400e]">
                      <span className="font-bold">Decision note:</span> {item.decisionNote}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierConcessionRequest;
