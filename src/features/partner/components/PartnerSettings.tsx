import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, UserCog, Percent, ShieldCheck, Clock, Info, Landmark, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import {
  Card, SectionHeader, Badge, FieldLabel, inputCls, type Tone,
} from './partner.ui';
import { dateTime, shortDate } from './partner.format';
import partnerService, { isPartnerPending, type PartnerProfile } from '../services/partner.service';

const STATUS_COPY: Record<string, { label: string; tone: Tone; blurb: string }> = {
  active: {
    label: 'Active',
    tone: 'success',
    blurb: 'Your account is live. Referrals earn commission and payouts are open.',
  },
  pending_approval: {
    label: 'Awaiting approval',
    tone: 'warning',
    blurb: 'An AMJ Star admin is reviewing your registration. Referrals are still being tracked against your code.',
  },
  pending: {
    label: 'Awaiting approval',
    tone: 'warning',
    blurb: 'An AMJ Star admin is reviewing your registration. Referrals are still being tracked against your code.',
  },
  suspended: {
    label: 'Suspended',
    tone: 'danger',
    blurb: 'New referrals will not earn and payouts are blocked. Earned balance is safe.',
  },
  rejected: {
    label: 'Not approved',
    tone: 'danger',
    blurb: 'This partner application was declined.',
  },
};

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function maskAccount(acc?: string): string {
  if (!acc) return '';
  if (acc.length <= 4) return acc;
  return `•••• •••• ${acc.slice(-4)}`;
}

const PartnerSettings: React.FC<{ partner?: PartnerProfile }> = ({ partner }) => {
  const queryClient = useQueryClient();
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    fullName: partner?.fullName || '',
    businessName: partner?.businessName || '',
    city: partner?.city || '',
    state: partner?.state || '',
    panNumber: partner?.panNumber || '',
    gstin: partner?.gstin || '',
  });

  const sellerRate = partner?.sellerCommissionPercent ?? 15;
  const buyerRate = partner?.buyerCommissionPercent ?? 10;
  const totalRate = partner?.commissionSharePercent ?? (sellerRate + buyerRate);

  const hasBank = !!(
    partner?.bankDetails?.accountNumber &&
    partner?.bankDetails?.ifscCode &&
    partner?.bankDetails?.accountHolderName
  );
  const hasUpi = !!partner?.bankDetails?.upiId;

  const currentPan = (form.panNumber || '').trim().toUpperCase();
  const isValidPan = PAN_RE.test(currentPan);

  const mutation = useMutation({
    mutationFn: () => partnerService.updateProfile(form),
    onSuccess: () => {
      toast.success('Profile saved');
      queryClient.invalidateQueries({ queryKey: ['partner', 'dashboard'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not save your profile';
      toast.error(msg);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!form.fullName.trim()) {
      errs.fullName = 'Your name is required';
    }

    const cleanPan = form.panNumber.trim().toUpperCase();
    if (cleanPan && !PAN_RE.test(cleanPan)) {
      errs.panNumber = 'Valid 10-character PAN is required (e.g. ABCDE1234F)';
    }

    const cleanGst = form.gstin.trim().toUpperCase();
    if (cleanGst && !GSTIN_RE.test(cleanGst)) {
      errs.gstin = 'Invalid GSTIN format (15 characters, e.g. 22AAAAA0000A1Z5)';
    }

    setSettingsErrors(errs);
    const keys = Object.keys(errs);
    if (keys.length > 0) {
      toast.error(errs[keys[0]]);
      return;
    }

    mutation.mutate();
  };

  const status = STATUS_COPY[partner?.status || 'pending_approval'] || STATUS_COPY.pending_approval!;
  const contactEmail =
    partner?.email || (typeof partner?.userId === 'object' ? partner.userId.email : undefined);
  const contactPhone =
    partner?.phone || (typeof partner?.userId === 'object' ? partner.userId.phone : undefined);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Account & settings"
        subtitle="Your partner identity, commercial terms and tax details."
        icon={Settings}
      />

      {/* ── Top Grid: Account Standing & Commission Structure ── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Left Card: Account Standing */}
        <Card className="p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">
                  Account status
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {partner?.registrationSource === 'admin' && (
                    <Badge tone="neutral">Created by AMJ Star</Badge>
                  )}
                </div>
                <p className="text-xs text-[#64748b] m-0 mt-2 leading-relaxed max-w-[460px]">{status.blurb}</p>
                {partner?.status === 'rejected' && partner.rejectionReason && (
                  <p className="text-xs text-[#b91c1c] m-0 mt-2 leading-relaxed">
                    <span className="font-bold">Reason:</span> {partner.rejectionReason}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">
                  Partner code
                </p>
                <code className="inline-block mt-1.5 px-3 py-1.5 rounded-[8px] bg-[#0f172a] text-white font-mono text-sm font-bold tracking-widest">
                  {partner?.partnerCode || '—'}
                </code>
              </div>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mt-5 pt-5 border-t border-[#f1f5f9]">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] m-0">Joined</p>
              <p className="text-xs font-bold text-[#0f172a] m-0 mt-1">{shortDate(partner?.createdAt)}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] m-0">Approved</p>
              <p className="text-xs font-bold text-[#0f172a] m-0 mt-1">
                {partner?.approvedAt ? shortDate(partner.approvedAt) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] m-0">Phone</p>
              <p className="text-xs font-bold text-[#0f172a] m-0 mt-1 break-all">{contactPhone || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] m-0">Email</p>
              <p className="text-xs font-bold text-[#0f172a] m-0 mt-1 break-all">{contactEmail || '—'}</p>
            </div>
          </div>
        </Card>

        {/* Right Card: Modern Two-Part Commission Structure */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-[8px] bg-[#fff7ed] border border-[#fed7aa] text-[#c2410c] flex items-center justify-center shrink-0">
                  <Percent size={15} />
                </span>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">
                  Commission Structure
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                Dual Attribution
              </span>
            </div>

            {/* Split cards: Buyer vs Seller */}
            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <div className="p-2.5 rounded-[8px] bg-[#fff7ed] border border-[#fed7aa]/70">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9a3412] m-0">
                  Seller Referral
                </p>
                <p className="text-2xl font-extrabold text-[#7c2d12] m-0 mt-0.5 leading-tight">
                  {sellerRate}%
                </p>
                <p className="text-[9px] text-[#9a3412]/80 m-0 mt-0.5 font-medium">
                  On supplier sales
                </p>
              </div>
              <div className="p-2.5 rounded-[8px] bg-[#eff6ff] border border-[#bfdbfe]/70">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1e40af] m-0">
                  Buyer Referral
                </p>
                <p className="text-2xl font-extrabold text-[#1e3a8a] m-0 mt-0.5 leading-tight">
                  {buyerRate}%
                </p>
                <p className="text-[9px] text-[#1e40af]/80 m-0 mt-0.5 font-medium">
                  On buyer purchases
                </p>
              </div>
            </div>

            {/* Both parties referred summary bar */}
            <div className="mt-2.5 p-2 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between text-xs">
              <span className="text-[#64748b] text-[11px] font-medium">Both sides referred by you:</span>
              <span className="font-extrabold text-[#0f172a] text-xs">{totalRate}% full share</span>
            </div>

            <p className="text-[10px] text-[#64748b] m-0 mt-2.5 leading-relaxed">
              Carved from AMJ Star's platform fee on deals closed by your network. Rates are set by AMJ Star admins.
            </p>
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#f1f5f9] grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] m-0">
                Lifetime earned
              </p>
              <p className="text-sm font-extrabold text-[#0f172a] m-0 mt-0.5">
                {formatCurrency(partner?.metrics?.lifetimeCommissionEarned || 0)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] m-0">
                Deals settled
              </p>
              <p className="text-sm font-extrabold text-[#0f172a] m-0 mt-0.5">
                {partner?.metrics?.totalOrdersReferred || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Editable Profile & Tax Details ── */}
      <Card className="p-5">
        <div className="flex items-start gap-3 mb-5">
          <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] flex items-center justify-center">
            <UserCog size={18} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Your Details & Tax Profile</h3>
            <p className="text-xs text-[#64748b] m-0 mt-1">
              Keep these current — AMJ Star uses them on your commission statements, invoices, and TDS filings.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <FieldLabel>Full name</FieldLabel>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className={inputCls}
                placeholder="Your name as per PAN"
              />
              {settingsErrors.fullName && (
                <p className="text-[11px] text-rose-500 font-semibold mt-1 m-0">{settingsErrors.fullName}</p>
              )}
            </div>
            <div>
              <FieldLabel>Business / trade name</FieldLabel>
              <input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className={inputCls}
                placeholder="Optional firm / company name"
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <FieldLabel>City</FieldLabel>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputCls}
                placeholder="e.g. Surat"
              />
            </div>
            <div>
              <FieldLabel>State</FieldLabel>
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className={inputCls}
                placeholder="e.g. Gujarat"
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <FieldLabel>PAN number</FieldLabel>
                {isValidPan ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    5% TDS · Sec 194H
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    20% TDS · Sec 206AA
                  </span>
                )}
              </div>
              <input
                value={form.panNumber}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                  setForm({ ...form, panNumber: val });
                  if (settingsErrors.panNumber) setSettingsErrors((prev) => ({ ...prev, panNumber: '' }));
                }}
                className={`${inputCls} font-mono uppercase ${settingsErrors.panNumber ? '!border-rose-500 !bg-rose-50/20' : ''}`}
                placeholder="ABCDE1234F"
                maxLength={10}
              />
              {settingsErrors.panNumber ? (
                <p className="text-[11px] text-rose-500 font-semibold mt-1 m-0">{settingsErrors.panNumber}</p>
              ) : isValidPan ? (
                <p className="text-[10px] text-emerald-600 font-medium m-0 mt-1.5">
                  ✓ Valid PAN on file. Standard 5% TDS will be deducted under Section 194H.
                </p>
              ) : (
                <p className="text-[10px] text-amber-700 font-medium m-0 mt-1.5">
                  ⚠️ A valid PAN is required to avoid penal 20% TDS under Section 206AA.
                </p>
              )}
            </div>
            <div>
              <FieldLabel>GSTIN</FieldLabel>
              <input
                value={form.gstin}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                  setForm({ ...form, gstin: val });
                  if (settingsErrors.gstin) setSettingsErrors((prev) => ({ ...prev, gstin: '' }));
                }}
                className={`${inputCls} font-mono uppercase ${settingsErrors.gstin ? '!border-rose-500 !bg-rose-50/20' : ''}`}
                placeholder="Optional (15 chars, e.g. 24AAAAA0000A1Z5)"
                maxLength={15}
              />
              {settingsErrors.gstin ? (
                <p className="text-[11px] text-rose-500 font-semibold mt-1 m-0">{settingsErrors.gstin}</p>
              ) : (
                <p className="text-[10px] text-[#64748b] m-0 mt-1.5">
                  Provide your GSTIN if registered to receive input tax credit invoices.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 rounded-[8px] bg-[#0f172a] text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer border-none disabled:opacity-60 hover:bg-[#1e293b] shadow-sm"
            >
              {mutation.isPending ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </Card>

      {/* ── Payout Destination / Bank Account Overview ── */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] flex items-center justify-center">
              <Landmark size={18} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Payout Destination</h3>
                {hasBank ? (
                  <Badge tone="success">Bank Active</Badge>
                ) : hasUpi ? (
                  <Badge tone="neutral">UPI Active</Badge>
                ) : (
                  <Badge tone="warning">Not Configured</Badge>
                )}
              </div>
              {hasBank ? (
                <div className="mt-2 text-xs text-[#334155] leading-relaxed">
                  <p className="m-0 font-bold text-[#0f172a]">{partner?.bankDetails?.accountHolderName}</p>
                  <p className="m-0 font-mono text-[11px] text-[#475569]">
                    {maskAccount(partner?.bankDetails?.accountNumber)} · {partner?.bankDetails?.ifscCode}
                    {partner?.bankDetails?.bankName ? ` (${partner.bankDetails.bankName})` : ''}
                  </p>
                  {hasUpi && <p className="m-0 text-[#64748b] text-[11px] mt-0.5">UPI: {partner?.bankDetails?.upiId}</p>}
                </div>
              ) : hasUpi ? (
                <p className="text-xs text-[#475569] m-0 mt-2 font-mono">UPI: {partner?.bankDetails?.upiId}</p>
              ) : (
                <p className="text-xs text-[#b45309] m-0 mt-2">
                  No bank account or UPI registered yet. Configure your payout destination to withdraw commissions.
                </p>
              )}
            </div>
          </div>
          <a
            href="/partner/dashboard?tab=wallet"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#0f172a] text-white text-[11px] font-extrabold uppercase tracking-wider no-underline hover:bg-[#1e293b] transition-colors shadow-xs"
          >
            Manage in Wallet <ArrowRight size={12} />
          </a>
        </div>
      </Card>

      {/* ── How the partner programme works (Updated Commercial Terms) ── */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] flex items-center justify-center">
            <Info size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#0f172a] m-0">How the partner programme works</h3>
            <ul className="text-xs text-[#475569] mt-3 mb-0 pl-4 flex flex-col gap-2.5 leading-relaxed">
              <li>
                <span className="font-bold text-[#0f172a]">Independent Wholesale Service Partner:</span> You
                are an independent partner earning exclusively on the trade your network generates.
                There is no fixed quota, salary, or lock-in.
              </li>
              <li>
                <span className="font-bold text-[#0f172a]">Permanent Lifetime Attribution:</span> Anyone who
                registers using your partner link or code is credited to your partner account for as long
                as they trade on AMJ Star.
              </li>
              <li>
                <span className="font-bold text-[#0f172a]">Two-Part Split Commission:</span> You earn{' '}
                <span className="font-bold text-[#0f172a]">{sellerRate}%</span> on sales made by your
                referred sellers, and <span className="font-bold text-[#0f172a]">{buyerRate}%</span> on
                purchases by your referred buyers. If you referred both sides on a deal, you earn the full{' '}
                <span className="font-bold text-[#0f172a]">{totalRate}%</span> share. Your commission is
                carved directly from AMJ Star's platform fee — buyers and sellers pay standard market prices.
              </li>
              <li>
                <span className="font-bold text-[#0f172a]">Earnings Clear on Delivery:</span> Commission sits
                as pending in escrow while the order is processed, and becomes fully withdrawable once the buyer
                confirms delivery. Cancelled orders automatically reverse pending commissions.
              </li>
              <li>
                <span className="font-bold text-[#0f172a]">Indian Tax & TDS Compliance:</span> Standard 5%
                TDS is deducted under Section 194H when a valid PAN is on file. Without a PAN, statutory 20%
                penal TDS is deducted under Section 206AA. TDS credit certificates are issued quarterly.
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {partner && isPartnerPending(partner.status) && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-[10px] bg-[#fffbeb] border border-[#fde68a]">
          <Clock size={15} className="text-[#b45309] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#92400e] m-0 leading-relaxed">
            Filling in your PAN and bank details now ensures your first payout is not delayed once approved.
            Submitted {dateTime(partner.createdAt)}.
          </p>
        </div>
      )}

      {partner?.status === 'active' && partner.approvedAt && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-[10px] bg-[#ecfdf5] border border-[#a7f3d0]">
          <ShieldCheck size={15} className="text-[#047857] shrink-0" />
          <p className="text-[11px] text-[#065f46] m-0">
            Account approved by the AMJ Star team on {dateTime(partner.approvedAt)}.
          </p>
        </div>
      )}
    </div>
  );
};

export default PartnerSettings;
