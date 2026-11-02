import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HandCoins, Plus, Info, Store, Gavel } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/shared/components/ui/Modal';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import {
  Card, SectionHeader, Badge, FilterTabs, TableWrap, TH, TD, InlineEmpty, FieldLabel, inputCls, type Tone,
} from './partner.ui';
import { shortDate, refName, humanise } from './partner.format';
import { isoDateIn } from './partner.format';
import partnerService, { isPartnerPending, type PartnerProfile } from '../services/partner.service';

type ConcessionFilter = '' | 'pending' | 'approved' | 'rejected';

type ConcessionType =
  | 'subscription_trial'
  | 'subscription_tier_upgrade'
  | 'subscription_price'
  | 'subscription_duration'
  | 'listing_fee_waiver'
  | 'listing_fee_custom';

const TYPE_LABEL: Record<string, string> = {
  subscription_trial: 'Free trial',
  subscription_tier_upgrade: 'Higher-tier trial',
  subscription_price: 'Discounted renewal',
  subscription_duration: 'Extended term',
  listing_fee_waiver: 'Listing-fee waiver',
  listing_fee_custom: 'Custom listing fee',
};

const TYPE_HELP: Record<ConcessionType, string> = {
  subscription_trial:
    'Give a brand-new seller a free run on a paid plan so they can test the platform before committing.',
  subscription_tier_upgrade:
    'Let an existing seller try a higher plan free for a while — useful when they have outgrown Basic.',
  subscription_price:
    'Propose a discounted price for their next renewal. Basic plan only, maximum 50% off, and a supporting document is required.',
  subscription_duration:
    'Propose a longer billing term for a high-performing seller instead of the standard cycle.',
  listing_fee_waiver:
    'Waive the ₹10/month per-listing fee for a period. Waivers always expire — they are never permanent.',
  listing_fee_custom:
    'Propose a reduced per-product fee or monthly minimum instead of a full waiver.',
};

const STATUS_TONE: Record<string, Tone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

const SOURCE_LABEL: Record<string, string> = {
  partner: 'You',
  sales: 'AMJ sales team',
  supplier: 'The seller',
};

/** Renders a proposal object as something a human can read. */
function describeProposal(type: string, proposal: Record<string, unknown>): string {
  const p = proposal || {};
  switch (type) {
    case 'subscription_trial':
    case 'subscription_tier_upgrade':
      return `${p.tier || '—'} plan free for ${p.trialDays || '—'} days`;
    case 'subscription_price':
      return `Renew at ${formatCurrency(Number(p.price) || 0)}`;
    case 'subscription_duration':
      return `${p.durationMonths || '—'} month billing term`;
    case 'listing_fee_waiver':
      return `Fully waived until ${shortDate(p.until as string)}`;
    case 'listing_fee_custom': {
      const bits: string[] = [];
      if (p.perProduct != null) bits.push(`${formatCurrency(Number(p.perProduct))}/listing`);
      if (p.minMonthly != null) bits.push(`${formatCurrency(Number(p.minMonthly))}/month minimum`);
      if (p.until) bits.push(`until ${shortDate(p.until as string)}`);
      return bits.join(' · ') || '—';
    }
    default:
      return '—';
  }
}

const PartnerConcessions: React.FC<{ partner?: PartnerProfile }> = ({ partner }) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ConcessionFilter>('');
  const [showForm, setShowForm] = useState(false);
  // Captured when the form opens so render never reads the clock.
  const [minUntil, setMinUntil] = useState(() => isoDateIn(1));

  const [form, setForm] = useState(() => ({
    supplierId: '',
    type: 'subscription_trial' as ConcessionType,
    reason: '',
    tier: 'GAMMA' as 'VERIFIED' | 'GAMMA' | 'BETA',
    trialDays: '30',
    price: '',
    durationMonths: '12',
    until: isoDateIn(30),
    perProduct: '',
    minMonthly: '',
    documentUrl: '',
  }));

  const { data, isLoading } = useQuery({
    queryKey: ['partner', 'concessions', filter],
    queryFn: () => partnerService.getConcessions(filter ? { status: filter } : undefined),
  });

  const requests = data?.requests || [];
  const eligible = data?.eligibleSuppliers || [];

  const counts = useMemo(() => {
    const all = data?.requests || [];
    return {
      pending: all.filter((r) => r.status === 'pending').length,
      approved: all.filter((r) => r.status === 'approved').length,
      rejected: all.filter((r) => r.status === 'rejected').length,
    };
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => {
      const proposal: Record<string, unknown> = {};
      switch (form.type) {
        case 'subscription_trial':
        case 'subscription_tier_upgrade':
          proposal.tier = form.tier;
          proposal.trialDays = Number(form.trialDays);
          break;
        case 'subscription_price':
          proposal.price = Number(form.price);
          proposal.tier = 'VERIFIED';
          break;
        case 'subscription_duration':
          proposal.durationMonths = Number(form.durationMonths);
          break;
        case 'listing_fee_waiver':
          proposal.until = new Date(form.until).toISOString();
          break;
        case 'listing_fee_custom':
          if (form.perProduct !== '') proposal.perProduct = Number(form.perProduct);
          if (form.minMonthly !== '') proposal.minMonthly = Number(form.minMonthly);
          if (form.until) proposal.until = new Date(form.until).toISOString();
          break;
      }
      return partnerService.recommendConcession({
        supplierId: form.supplierId,
        type: form.type,
        proposal,
        reason: form.reason.trim(),
        ...(form.documentUrl.trim() ? { documentUrl: form.documentUrl.trim() } : {}),
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Recommendation sent to AMJ Star for review');
      setShowForm(false);
      setForm((f) => ({ ...f, supplierId: '', reason: '', documentUrl: '' }));
      queryClient.invalidateQueries({ queryKey: ['partner', 'concessions'] });
      queryClient.invalidateQueries({ queryKey: ['partner', 'dashboard'] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Could not submit the recommendation'),
  });

  const blocked = isPartnerPending(partner?.status) || partner?.status !== 'active';

  const openForm = () => {
    if (blocked) {
      toast.error('Your partner account must be approved and active to recommend concessions');
      return;
    }
    if (!eligible.length) {
      toast.error('You have not referred any sellers yet');
      return;
    }
    setMinUntil(isoDateIn(1));
    setForm((f) => ({ ...f, supplierId: eligible[0]?._id || '', until: isoDateIn(30) }));
    setShowForm(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId) {
      toast.error('Pick one of your sellers');
      return;
    }
    if (form.reason.trim().length < 15) {
      toast.error('Explain why this seller deserves the concession — admins need the context');
      return;
    }
    if (form.type === 'subscription_price') {
      if (!form.price || Number(form.price) <= 0) {
        toast.error('Enter the renewal price you are proposing');
        return;
      }
      if (!form.documentUrl.trim()) {
        toast.error('A supporting document link is required for a discounted renewal');
        return;
      }
    }
    if (form.type === 'listing_fee_custom' && form.perProduct === '' && form.minMonthly === '') {
      toast.error('Set a per-listing fee, a monthly minimum, or both');
      return;
    }
    mutation.mutate();
  };

  const needsTier = form.type === 'subscription_trial' || form.type === 'subscription_tier_upgrade';

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Billing concessions"
        subtitle="Recommend a trial, discount or listing-fee waiver for a seller you referred. AMJ Star reviews every recommendation before it takes effect."
        icon={HandCoins}
        actions={
          <button
            onClick={openForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0f172a] text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer border-none hover:bg-[#1e293b] transition-colors"
          >
            <Plus size={14} />
            Recommend a concession
          </button>
        }
      />

      <div className="flex items-start gap-2.5 p-3.5 rounded-[10px] bg-[#eff6ff] border border-[#bfdbfe]">
        <Info size={15} className="text-[#1d4ed8] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#1e40af] m-0 leading-relaxed">
          <span className="font-bold">You recommend — AMJ Star decides.</span> A concession is a real
          discount on what a seller pays AMJ Star, so every request goes to an admin for approval.
          Use these to close a hesitant manufacturer who needs to see results before paying, and give
          the admin the commercial reason in writing.
        </p>
      </div>

      {/* ── Your sellers, with their current billing posture ── */}
      <Card>
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Your sellers</h3>
          <p className="text-xs text-[#64748b] m-0 mt-1">
            You can only request concessions for sellers who joined through your referral.
          </p>
        </div>
        {eligible.length === 0 ? (
          <InlineEmpty
            icon={Store}
            title="No sellers referred yet"
            description="Once a manufacturer or wholesaler signs up through your seller link, they appear here and you can recommend concessions for them."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={TH}>Seller</th>
                <th className={TH}>Plan tier</th>
                <th className={TH}>KYC</th>
                <th className={TH}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {eligible.map((s) => (
                <tr key={s._id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className={`${TD} font-bold text-[#0f172a]`}>{s.businessName || 'Seller store'}</td>
                  <td className={TD}>
                    <Badge tone="neutral">{s.tier || 'VERIFIED'}</Badge>
                    {s.subscription?.status && (
                      <span className="block text-[10px] text-[#64748b] mt-1">
                        {humanise(s.subscription.status)}
                      </span>
                    )}
                  </td>
                  <td className={TD}>
                    <Badge tone={(s.kycStatus || '').toUpperCase() === 'VERIFIED' ? 'success' : 'warning'}>
                      {s.kycStatus || 'Pending'}
                    </Badge>
                  </td>
                  <td className={TD}>{shortDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {/* ── Request history ── */}
      <Card>
        <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between gap-3 flex-wrap">
          <FilterTabs<ConcessionFilter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: '', label: 'All' },
              { value: 'pending', label: 'Pending', count: counts.pending },
              { value: 'approved', label: 'Approved', count: counts.approved },
              { value: 'rejected', label: 'Rejected', count: counts.rejected },
            ]}
          />
          <span className="text-[11px] text-[#64748b] font-semibold">{requests.length} requests</span>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-xs text-[#64748b]">Loading concessions…</div>
        ) : requests.length === 0 ? (
          <InlineEmpty
            icon={Gavel}
            title={filter ? `No ${filter} requests` : 'No concession requests'}
            description="When you or AMJ Star's sales team file a concession for one of your sellers, it shows up here with its decision."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={TH}>Seller</th>
                <th className={TH}>Concession</th>
                <th className={TH}>Proposal</th>
                <th className={TH}>Raised by</th>
                <th className={TH}>Filed</th>
                <th className={TH}>Decision</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className={`${TD} font-bold text-[#0f172a]`}>
                    {refName(r.supplierId, 'Seller')}
                  </td>
                  <td className={TD}>
                    <Badge tone="info">{TYPE_LABEL[r.type] || humanise(r.type)}</Badge>
                  </td>
                  <td className={TD}>
                    <p className="m-0 text-[#334155]">{describeProposal(r.type, r.proposal)}</p>
                    <p className="text-[10px] text-[#94a3b8] m-0 mt-1 max-w-[220px] leading-snug line-clamp-2">
                      {r.reason}
                    </p>
                  </td>
                  <td className={TD}>
                    <Badge tone={r.source === 'partner' ? 'brand' : 'neutral'}>
                      {SOURCE_LABEL[r.source] || r.source}
                    </Badge>
                  </td>
                  <td className={TD}>{shortDate(r.createdAt)}</td>
                  <td className={TD}>
                    <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{humanise(r.status)}</Badge>
                    {r.decisionNote && (
                      <p className="text-[10px] text-[#64748b] m-0 mt-1 max-w-[180px] leading-snug">
                        {r.decisionNote}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {/* ── Recommendation form ── */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Recommend a concession"
        widthClass="w-[92%] max-w-[560px]"
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <FieldLabel>Which of your sellers?</FieldLabel>
            <select
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              className={inputCls}
            >
              {eligible.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.businessName || 'Seller store'} — {s.tier || 'VERIFIED'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Concession type</FieldLabel>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ConcessionType })}
              className={inputCls}
            >
              {(Object.keys(TYPE_LABEL) as ConcessionType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748b] m-0 mt-1.5 leading-relaxed">{TYPE_HELP[form.type]}</p>
          </div>

          {needsTier && (
            <div className="grid gap-4 grid-cols-2">
              <div>
                <FieldLabel>Plan tier</FieldLabel>
                <select
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value as 'VERIFIED' | 'GAMMA' | 'BETA' })}
                  className={inputCls}
                >
                  <option value="VERIFIED">VERIFIED (Basic)</option>
                  <option value="GAMMA">GAMMA</option>
                  <option value="BETA">BETA</option>
                </select>
              </div>
              <div>
                <FieldLabel>Trial length (days)</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={form.trialDays}
                  onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {form.type === 'subscription_price' && (
            <>
              <div>
                <FieldLabel>Proposed renewal price (₹, excl. GST)</FieldLabel>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 1500"
                />
                <p className="text-[11px] text-[#64748b] m-0 mt-1.5">
                  Basic plan only, and the discount cannot exceed 50% of the list price.
                </p>
              </div>
              <div>
                <FieldLabel>Supporting document link</FieldLabel>
                <input
                  value={form.documentUrl}
                  onChange={(e) => setForm({ ...form, documentUrl: e.target.value })}
                  className={inputCls}
                  placeholder="https://… (certificate, MSME proof, written request)"
                />
              </div>
            </>
          )}

          {form.type === 'subscription_duration' && (
            <div>
              <FieldLabel>Billing term (months)</FieldLabel>
              <input
                type="number"
                min={1}
                max={60}
                value={form.durationMonths}
                onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                className={inputCls}
              />
            </div>
          )}

          {form.type === 'listing_fee_waiver' && (
            <div>
              <FieldLabel>Waive listing fees until</FieldLabel>
              <input
                type="date"
                value={form.until}
                onChange={(e) => setForm({ ...form, until: e.target.value })}
                className={inputCls}
                min={minUntil}
              />
              <p className="text-[11px] text-[#64748b] m-0 mt-1.5">
                Must be in the future and no more than 12 months out.
              </p>
            </div>
          )}

          {form.type === 'listing_fee_custom' && (
            <>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <FieldLabel>Per-listing fee (₹)</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    value={form.perProduct}
                    onChange={(e) => setForm({ ...form, perProduct: e.target.value })}
                    className={inputCls}
                    placeholder="Standard is 10"
                  />
                </div>
                <div>
                  <FieldLabel>Monthly minimum (₹)</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    value={form.minMonthly}
                    onChange={(e) => setForm({ ...form, minMonthly: e.target.value })}
                    className={inputCls}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Applies until (optional)</FieldLabel>
                <input
                  type="date"
                  value={form.until}
                  onChange={(e) => setForm({ ...form, until: e.target.value })}
                  className={inputCls}
                />
              </div>
            </>
          )}

          <div>
            <FieldLabel>Why does this seller deserve it?</FieldLabel>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className={`${inputCls} min-h-[100px] resize-y`}
              placeholder="e.g. 40-machine garment unit in Tirupur, ready to list 120 SKUs, but wants to see enquiry volume before paying for a plan. I have met the owner in person."
              maxLength={1000}
            />
            <p className="text-[10px] text-[#94a3b8] m-0 mt-1 text-right">{form.reason.length}/1000</p>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-xs font-bold cursor-pointer hover:border-[#cbd5e1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-[8px] bg-[#0f172a] text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer border-none disabled:opacity-60 hover:bg-[#1e293b]"
            >
              {mutation.isPending ? 'Submitting…' : 'Send for review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PartnerConcessions;
