import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet, Banknote, ArrowUpRight, Building, CreditCard, ShieldCheck, Landmark, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/shared/components/ui/Modal';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import {
  Card, SectionHeader, Badge, TableWrap, TH, TD, InlineEmpty, FieldLabel, inputCls, type Tone,
} from './partner.ui';
import { dateTime, shortDate, formatPartnerMoney } from './partner.format';
import partnerService, {
  isPartnerPending,
  type PartnerProfile,
  type PartnerWallet,
  type PartnerPayoutItem,
} from '../services/partner.service';

const MIN_PAYOUT = 100;

const PAYOUT_TONE: Record<PartnerPayoutItem['status'], Tone> = {
  requested: 'warning',
  processing: 'info',
  completed: 'success',
  rejected: 'danger',
};

/** Shows only the last four digits of an account number. */
function maskAccount(value?: string): string {
  if (!value) return '—';
  const clean = value.trim();
  if (clean.length <= 4) return clean;
  return `${'•'.repeat(Math.min(8, clean.length - 4))}${clean.slice(-4)}`;
}

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACC_NUM_RE = /^\d{9,18}$/;
const NAME_RE = /^[a-zA-Z\s.'-]{3,100}$/;
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

const PartnerWalletView: React.FC<{
  partner?: PartnerProfile;
  wallet?: PartnerWallet;
}> = ({ partner, wallet }) => {
  const queryClient = useQueryClient();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankErrors, setBankErrors] = useState<Record<string, string>>({});

  const openBankModal = () => {
    setBankErrors({});
    setShowBank(true);
  };

  // Seeded once from the loaded profile — the hub remounts this view (keyed on the
  // partner id) when the profile arrives, so no effect is needed to sync it.
  const [bankForm, setBankForm] = useState({
    accountHolderName: partner?.bankDetails?.accountHolderName || '',
    accountNumber: partner?.bankDetails?.accountNumber || '',
    ifscCode: partner?.bankDetails?.ifscCode || '',
    bankName: partner?.bankDetails?.bankName || '',
    upiId: partner?.bankDetails?.upiId || '',
    panNumber: partner?.panNumber || '',
    gstin: partner?.gstin || '',
    businessName: partner?.businessName || '',
  });

  const { data: payouts = [], isLoading: payoutsLoading } = useQuery({
    queryKey: ['partner', 'payouts'],
    queryFn: () => partnerService.getPayouts(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['partner', 'dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['partner', 'payouts'] });
  };

  const withdrawMutation = useMutation({
    mutationFn: (value: number) => partnerService.requestPayout(value),
    onSuccess: (res) => {
      toast.success(res?.message || 'Payout requested');
      setShowWithdraw(false);
      setAmount('');
      invalidate();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not request payout';
      toast.error(msg);
    },
  });

  const bankMutation = useMutation({
    mutationFn: () =>
      partnerService.updateProfile({
        businessName: bankForm.businessName,
        panNumber: bankForm.panNumber,
        gstin: bankForm.gstin,
        bankDetails: {
          accountHolderName: bankForm.accountHolderName,
          accountNumber: bankForm.accountNumber,
          ifscCode: bankForm.ifscCode,
          bankName: bankForm.bankName,
          upiId: bankForm.upiId,
        },
      }),
    onSuccess: () => {
      toast.success('Payout details saved');
      setShowBank(false);
      invalidate();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not save details';
      toast.error(msg);
    },
  });

  const pending = isPartnerPending(partner?.status);
  const blocked = pending || partner?.status === 'suspended' || partner?.status === 'rejected';
  const withdrawable = wallet?.withdrawableBalance || 0;
  const hasBank = !!(
    partner?.bankDetails?.accountNumber &&
    partner?.bankDetails?.ifscCode &&
    partner?.bankDetails?.accountHolderName
  );
  const hasUpi = !!partner?.bankDetails?.upiId;
  const hasValidPan = PAN_RE.test((partner?.panNumber || '').trim().toUpperCase());

  // Mirrors the server's Section 194H logic so the partner sees the same net figure.
  const parsedAmount = Number(amount) || 0;
  const tdsRate = hasValidPan ? 0.05 : 0.2;
  const estTds = Math.round(parsedAmount * tdsRate * 100) / 100;
  const estNet = Math.round((parsedAmount - estTds) * 100) / 100;

  const openWithdraw = () => {
    if (blocked) {
      toast.error(
        pending
          ? 'Your account is still awaiting admin approval'
          : 'Payouts are unavailable while your account is not active'
      );
      return;
    }
    if (!hasBank && !hasUpi) {
      toast.error('Add your bank account or UPI ID first');
      openBankModal();
      return;
    }
    if (withdrawable < MIN_PAYOUT) {
      toast.error(`You need at least ${formatCurrency(MIN_PAYOUT)} cleared to withdraw`);
      return;
    }
    setAmount(String(withdrawable));
    setShowWithdraw(true);
  };

  const submitWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount < MIN_PAYOUT) {
      toast.error(`Minimum withdrawal is ${formatCurrency(MIN_PAYOUT)}`);
      return;
    }
    if (parsedAmount > withdrawable) {
      toast.error('Amount is more than your withdrawable balance');
      return;
    }
    withdrawMutation.mutate(parsedAmount);
  };

  const validateBankForm = (): { isValid: boolean; firstError?: string } => {
    const errs: Record<string, string> = {};

    // 1. PAN validation (if entered)
    const cleanPan = bankForm.panNumber.trim().toUpperCase();
    if (cleanPan && !PAN_RE.test(cleanPan)) {
      errs.panNumber = 'Valid 10-character PAN is required (e.g. ABCDE1234F)';
    }

    // 2. GSTIN validation (if entered)
    const cleanGst = bankForm.gstin.trim().toUpperCase();
    if (cleanGst && !GSTIN_RE.test(cleanGst)) {
      errs.gstin = 'Invalid GSTIN format (15 characters, e.g. 22AAAAA0000A1Z5)';
    }

    // 3. Bank Account vs UPI check
    const wantsBank = !!(
      bankForm.accountNumber.trim() ||
      bankForm.ifscCode.trim() ||
      bankForm.accountHolderName.trim() ||
      bankForm.bankName.trim()
    );
    const wantsUpi = !!bankForm.upiId.trim();

    if (!wantsBank && !wantsUpi) {
      errs.general = 'Please provide bank account details or a UPI ID for payouts';
    }

    if (wantsBank) {
      const cleanName = bankForm.accountHolderName.trim();
      if (!cleanName) {
        errs.accountHolderName = 'Account holder name is required';
      } else if (cleanName.length < 3) {
        errs.accountHolderName = 'Minimum 3 characters required';
      } else if (!NAME_RE.test(cleanName)) {
        errs.accountHolderName = "Only letters, spaces and . ' - are allowed (numbers not allowed)";
      }

      const cleanAcc = bankForm.accountNumber.trim();
      if (!cleanAcc) {
        errs.accountNumber = 'Account number is required';
      } else if (!ACC_NUM_RE.test(cleanAcc)) {
        errs.accountNumber = 'Account number must be 9–18 digits (numbers only)';
      }

      const cleanIfsc = bankForm.ifscCode.trim().toUpperCase();
      if (!cleanIfsc) {
        errs.ifscCode = 'IFSC code is required';
      } else if (!IFSC_RE.test(cleanIfsc)) {
        errs.ifscCode = 'Invalid format. Must be: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234)';
      }

      if (bankForm.bankName.trim() && bankForm.bankName.trim().length < 2) {
        errs.bankName = 'Bank name must be at least 2 characters';
      }
    }

    if (wantsUpi) {
      const cleanUpi = bankForm.upiId.trim();
      if (!UPI_RE.test(cleanUpi)) {
        errs.upiId = 'Invalid UPI ID format (e.g. name@okhdfcbank)';
      }
    }

    setBankErrors(errs);
    const keys = Object.keys(errs);
    return { isValid: keys.length === 0, firstError: keys.length > 0 ? errs[keys[0]] : undefined };
  };

  const submitBank = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateBankForm();
    if (!result.isValid) {
      toast.error(result.firstError || 'Please correct the highlighted errors');
      return;
    }

    bankMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Wallet & payouts"
        subtitle="Your commission clears into a withdrawable balance once buyers confirm delivery. Request a transfer any time you are above the minimum."
        icon={Wallet}
        actions={
          <>
            <button
              onClick={openBankModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-[11px] font-extrabold uppercase tracking-wider cursor-pointer hover:border-[#cbd5e1] transition-colors"
            >
              <Building size={13} />
              {hasBank || hasUpi ? 'Edit payout details' : 'Add payout details'}
            </button>
            <button
              onClick={openWithdraw}
              disabled={blocked}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#059669] text-white text-[11px] font-extrabold uppercase tracking-wider cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#047857] transition-colors"
            >
              <ArrowUpRight size={14} />
              Withdraw
            </button>
          </>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 border-l-[3px] border-l-[#059669] min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0 truncate">Withdrawable</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1 tracking-tight truncate" title={formatCurrency(withdrawable)}>
            {formatPartnerMoney(withdrawable)}
          </p>
          <p className="text-[11px] text-[#94a3b8] m-0 truncate">Cleared and available</p>
        </Card>
        <Card className="p-4 border-l-[3px] border-l-[#f59e0b] min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0 truncate">Pending</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1 tracking-tight truncate" title={formatCurrency(wallet?.pendingBalance || 0)}>
            {formatPartnerMoney(wallet?.pendingBalance || 0)}
          </p>
          <p className="text-[11px] text-[#94a3b8] m-0 truncate">Awaiting delivery confirmation</p>
        </Card>
        <Card className="p-4 border-l-[3px] border-l-[#1d4ed8] min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0 truncate">In transit</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1 tracking-tight truncate" title={formatCurrency(wallet?.inFlightPayouts || 0)}>
            {formatPartnerMoney(wallet?.inFlightPayouts || 0)}
          </p>
          <p className="text-[11px] text-[#94a3b8] m-0 truncate">Requested, not yet paid</p>
        </Card>
        <Card className="p-4 border-l-[3px] border-l-[#0f172a] min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] m-0 truncate">Total withdrawn</p>
          <p className="text-xl font-extrabold text-[#0f172a] m-0 mt-1 tracking-tight truncate" title={formatCurrency(wallet?.totalWithdrawn || 0)}>
            {formatPartnerMoney(wallet?.totalWithdrawn || 0)}
          </p>
          <p className="text-[11px] text-[#94a3b8] m-0 truncate">Transfers completed to date</p>
        </Card>
      </div>

      {/* ── Payout destination ── */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] flex items-center justify-center">
              <Landmark size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Payout destination</h3>
              {hasBank ? (
                <div className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                  <p className="m-0 font-bold text-[#0f172a]">{partner?.bankDetails?.accountHolderName}</p>
                  <p className="m-0">
                    {maskAccount(partner?.bankDetails?.accountNumber)} · {partner?.bankDetails?.ifscCode}
                    {partner?.bankDetails?.bankName ? ` · ${partner.bankDetails.bankName}` : ''}
                  </p>
                  {hasUpi && <p className="m-0 text-[#64748b]">UPI: {partner?.bankDetails?.upiId}</p>}
                </div>
              ) : hasUpi ? (
                <p className="text-xs text-[#475569] m-0 mt-1.5">UPI: {partner?.bankDetails?.upiId}</p>
              ) : (
                <p className="text-xs text-[#b45309] m-0 mt-1.5">
                  No payout destination yet — add a bank account or UPI ID to withdraw.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {hasValidPan ? (
              <Badge tone="success">
                <ShieldCheck size={11} /> PAN on file · 5% TDS
              </Badge>
            ) : (
              <Badge tone="warning">No valid PAN · 20% TDS</Badge>
            )}
            {partner?.gstin && <Badge tone="neutral">GSTIN {partner.gstin}</Badge>}
          </div>
        </div>
      </Card>

      {/* ── Tax & GST Transparency Card ── */}
      <div className="p-4 rounded-[12px] bg-slate-50 border border-slate-200 flex flex-col gap-2 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-900">Tax & GST Breakdown on Partner Payouts</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] leading-relaxed">
          <div className="bg-white p-3 rounded-lg border border-slate-200/80">
            <div className="font-bold text-slate-800 mb-1">1. Income Tax (TDS - Sec 194H)</div>
            <p className="m-0 text-slate-600">
              As per Indian tax laws, <strong>5% TDS</strong> is deducted at source when paying commission to PAN-registered partners (or 20% if PAN is missing under Sec 206AA). AMJ Star deposits this with the government, and you can claim it as a tax credit via Form 26AS/16A.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200/80">
            <div className="font-bold text-slate-800 mb-1">2. Goods & Services Tax (GST)</div>
            <p className="m-0 text-slate-600">
              • <strong>Unregistered Partner (Turnover &lt; ₹20L):</strong> No GST is charged or paid. You receive Commission minus 5% TDS directly into your bank.<br />
              • <strong>GST-Registered Firm:</strong> If you have an active GSTIN, you raise an invoice for commission + 18% GST (SAC 998399). AMJ Star pays the GST, which it claims as Input Tax Credit (ITC).
            </p>
          </div>
        </div>
      </div>

      {/* ── Payout history ── */}
      <Card>
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-sm font-extrabold text-[#0f172a] m-0">Payout history</h3>
          <p className="text-xs text-[#64748b] m-0 mt-1">
            Every transfer request, with TDS and the bank reference once paid.
          </p>
        </div>

        {payoutsLoading ? (
          <div className="py-14 text-center text-xs text-[#64748b]">Loading payouts…</div>
        ) : payouts.length === 0 ? (
          <InlineEmpty
            icon={Banknote}
            title="No payouts yet"
            description={`Once you have at least ${formatCurrency(MIN_PAYOUT)} cleared, request your first transfer and it will appear here.`}
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={TH}>Requested</th>
                <th className={TH}>Amount</th>
                <th className={TH}>TDS</th>
                <th className={TH}>Net paid</th>
                <th className={TH}>Destination</th>
                <th className={TH}>Status</th>
                <th className={TH}>Reference</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p._id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className={TD}>{dateTime(p.createdAt)}</td>
                  <td className={`${TD} font-extrabold text-[#0f172a]`}>{formatCurrency(p.amount)}</td>
                  <td className={TD}>
                    <span className="text-[#b91c1c] font-semibold">− {formatCurrency(p.tdsDeducted)}</span>
                    <span className="block text-[10px] text-[#64748b]">
                      ({p.amount && p.tdsDeducted ? Math.round((p.tdsDeducted / p.amount) * 100) : (p.tdsRate ? Math.round(p.tdsRate * 100) : 5)}% TDS)
                    </span>
                  </td>
                  <td className={`${TD} font-bold text-[#059669]`}>{formatCurrency(p.netPayable)}</td>
                  <td className={TD}>
                    {p.bankSnapshot?.accountNumber
                      ? `${maskAccount(p.bankSnapshot.accountNumber)}${p.bankSnapshot.ifscCode ? ` · ${p.bankSnapshot.ifscCode}` : ''}`
                      : p.bankSnapshot?.upiId || '—'}
                  </td>
                  <td className={TD}>
                    <Badge tone={PAYOUT_TONE[p.status]}>{p.status}</Badge>
                    {p.status === 'rejected' && p.rejectionReason && (
                      <span className="block text-[10px] text-[#b91c1c] mt-1 max-w-[180px] leading-snug">
                        {p.rejectionReason}
                      </span>
                    )}
                    {p.status === 'completed' && p.paidAt && (
                      <span className="block text-[10px] text-[#94a3b8] mt-1">{shortDate(p.paidAt)}</span>
                    )}
                  </td>
                  <td className={`${TD} font-mono text-[10px]`}>{p.paymentReference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {/* ── Withdraw modal ── */}
      <Modal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        title="Request a payout"
        widthClass="w-[92%] max-w-[460px]"
      >
        <form onSubmit={submitWithdraw} className="flex flex-col gap-4">
          <div className="p-3.5 rounded-[10px] bg-[#f8fafc] border border-[#e2e8f0]">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] m-0">
              Available to withdraw
            </p>
            <p className="text-2xl font-extrabold text-[#0f172a] m-0 mt-0.5">{formatCurrency(withdrawable)}</p>
          </div>

          <div>
            <FieldLabel>Amount (₹)</FieldLabel>
            <input
              type="number"
              min={MIN_PAYOUT}
              max={withdrawable}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              placeholder={`Minimum ${MIN_PAYOUT}`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setAmount(String(withdrawable))}
              className="mt-2 text-[11px] font-extrabold uppercase tracking-wider text-[#1d4ed8] bg-transparent border-none cursor-pointer p-0 hover:underline"
            >
              Withdraw everything
            </button>
          </div>

          {parsedAmount >= MIN_PAYOUT && (
            <div className="p-3.5 rounded-[10px] bg-[#eff6ff] border border-[#bfdbfe] text-xs text-[#1e40af]">
              <div className="flex items-center justify-between">
                <span>Gross</span>
                <span className="font-bold">{formatCurrency(parsedAmount)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span>TDS @ {hasValidPan ? '5%' : '20%'} (Section {hasValidPan ? '194H' : '206AA'})</span>
                <span className="font-bold">− {formatCurrency(estTds)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#bfdbfe]">
                <span className="font-extrabold">You receive</span>
                <span className="font-extrabold text-base">{formatCurrency(estNet)}</span>
              </div>
              {!hasValidPan && (
                <p className="text-[10px] m-0 mt-2 leading-snug">
                  Adding a valid PAN drops your TDS from 20% to 5%.
                </p>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 text-[11px] text-[#64748b] leading-relaxed">
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>
              The amount leaves your withdrawable balance immediately so it cannot be double-spent. An
              admin then transfers it and records the bank reference. If a request is rejected, the
              full amount returns to your balance.
            </span>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowWithdraw(false)}
              className="px-4 py-2.5 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-xs font-bold cursor-pointer hover:border-[#cbd5e1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="px-5 py-2.5 rounded-[8px] bg-[#059669] text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer border-none disabled:opacity-60 hover:bg-[#047857]"
            >
              {withdrawMutation.isPending ? 'Requesting…' : 'Request payout'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Bank / KYC modal ── */}
      <Modal
        isOpen={showBank}
        onClose={() => setShowBank(false)}
        title="Payout & tax details"
        widthClass="w-[92%] max-w-[560px]"
      >
        <form onSubmit={submitBank} className="flex flex-col gap-4">
          <p className="text-xs text-[#64748b] m-0 leading-relaxed">
            AMJ Star transfers your commission to this account. A valid PAN keeps TDS at 5% under
            Section 194H instead of the 20% penal rate.
          </p>

          {bankErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-700 font-semibold leading-relaxed">
              {bankErrors.general}
            </div>
          )}

          <div>
            <FieldLabel>Business / trade name (optional)</FieldLabel>
            <input
              value={bankForm.businessName}
              onChange={(e) => setBankForm({ ...bankForm, businessName: e.target.value })}
              className={inputCls}
              placeholder="e.g. Sharma Trading Co."
            />
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <FieldLabel>PAN number</FieldLabel>
              <input
                value={bankForm.panNumber}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                  setBankForm({ ...bankForm, panNumber: val });
                  if (bankErrors.panNumber) setBankErrors((prev) => ({ ...prev, panNumber: '' }));
                }}
                className={`${inputCls} font-mono uppercase ${bankErrors.panNumber ? '!border-rose-500 !bg-rose-50/20' : ''}`}
                placeholder="ABCDE1234F"
                maxLength={10}
              />
              {bankErrors.panNumber ? (
                <p className="text-[11px] text-rose-500 font-semibold mt-1 m-0">{bankErrors.panNumber}</p>
              ) : (
                <p className="text-[10px] text-[#64748b] mt-1 m-0">10 characters (e.g. ABCDE1234F)</p>
              )}
            </div>
            <div>
              <FieldLabel>GSTIN (optional)</FieldLabel>
              <input
                value={bankForm.gstin}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                  setBankForm({ ...bankForm, gstin: val });
                  if (bankErrors.gstin) setBankErrors((prev) => ({ ...prev, gstin: '' }));
                }}
                className={`${inputCls} font-mono uppercase ${bankErrors.gstin ? '!border-rose-500 !bg-rose-50/20' : ''}`}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
              {bankErrors.gstin ? (
                <p className="text-[11px] text-rose-500 font-semibold mt-1 m-0">{bankErrors.gstin}</p>
              ) : (
                <p className="text-[10px] text-[#64748b] mt-1 m-0">15 characters (e.g. 22AAAAA0000A1Z5)</p>
              )}
            </div>
          </div>

          <div className="pt-1 border-t border-[#f1f5f9]">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#475569] mt-3 mb-3 flex items-center gap-1.5">
              <CreditCard size={13} /> Bank account
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel>Account holder name</FieldLabel>
                <input
                  value={bankForm.accountHolderName}
                  onChange={(e) => {
                    setBankForm({ ...bankForm, accountHolderName: e.target.value });
                    if (bankErrors.accountHolderName) setBankErrors((prev) => ({ ...prev, accountHolderName: '' }));
                  }}
                  className={`${inputCls} ${bankErrors.accountHolderName ? '!border-rose-500 !bg-rose-50/20' : ''}`}
                  placeholder="As printed on the passbook (e.g. Ramesh Chandra)"
                  maxLength={100}
                />
                {bankErrors.accountHolderName && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1 m-0">{bankErrors.accountHolderName}</p>
                )}
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <FieldLabel>Account number</FieldLabel>
                  <input
                    value={bankForm.accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                      setBankForm({ ...bankForm, accountNumber: val });
                      if (bankErrors.accountNumber) setBankErrors((prev) => ({ ...prev, accountNumber: '' }));
                    }}
                    className={`${inputCls} font-mono ${bankErrors.accountNumber ? '!border-rose-500 !bg-rose-50/20' : ''}`}
                    placeholder="9482394239"
                    maxLength={18}
                  />
                  {bankErrors.accountNumber ? (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1 m-0">{bankErrors.accountNumber}</p>
                  ) : (
                    <p className="text-[10px] text-[#64748b] mt-1 m-0">9 to 18 digits (numbers only)</p>
                  )}
                </div>
                <div>
                  <FieldLabel>IFSC code</FieldLabel>
                  <input
                    value={bankForm.ifscCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                      setBankForm({ ...bankForm, ifscCode: val });
                      if (bankErrors.ifscCode) setBankErrors((prev) => ({ ...prev, ifscCode: '' }));
                    }}
                    className={`${inputCls} font-mono uppercase ${bankErrors.ifscCode ? '!border-rose-500 !bg-rose-50/20' : ''}`}
                    placeholder="HDFC0001234"
                    maxLength={11}
                  />
                  {bankErrors.ifscCode ? (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1 m-0">{bankErrors.ifscCode}</p>
                  ) : (
                    <p className="text-[10px] text-[#64748b] mt-1 m-0">11 characters (e.g. HDFC0001234)</p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <FieldLabel>Bank name (optional)</FieldLabel>
                  <input
                    value={bankForm.bankName}
                    onChange={(e) => {
                      setBankForm({ ...bankForm, bankName: e.target.value });
                      if (bankErrors.bankName) setBankErrors((prev) => ({ ...prev, bankName: '' }));
                    }}
                    className={`${inputCls} ${bankErrors.bankName ? '!border-rose-500 !bg-rose-50/20' : ''}`}
                    placeholder="HDFC Bank"
                  />
                  {bankErrors.bankName && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1 m-0">{bankErrors.bankName}</p>
                  )}
                </div>
                <div>
                  <FieldLabel>UPI ID (optional)</FieldLabel>
                  <input
                    value={bankForm.upiId}
                    onChange={(e) => {
                      setBankForm({ ...bankForm, upiId: e.target.value.trim() });
                      if (bankErrors.upiId) setBankErrors((prev) => ({ ...prev, upiId: '' }));
                    }}
                    className={`${inputCls} ${bankErrors.upiId ? '!border-rose-500 !bg-rose-50/20' : ''}`}
                    placeholder="name@okhdfcbank"
                  />
                  {bankErrors.upiId && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1 m-0">{bankErrors.upiId}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowBank(false)}
              className="px-4 py-2.5 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-xs font-bold cursor-pointer hover:border-[#cbd5e1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bankMutation.isPending}
              className="px-5 py-2.5 rounded-[8px] bg-[#0f172a] text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer border-none disabled:opacity-60 hover:bg-[#1e293b]"
            >
              {bankMutation.isPending ? 'Saving…' : 'Save details'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PartnerWalletView;
