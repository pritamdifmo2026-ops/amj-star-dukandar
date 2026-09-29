import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HandCoins,
  Send,
  Clock,
  AlertCircle,
  Sparkles,
  Layers,
  History,
  CheckCircle2,
  UploadCloud,
  FileText,
  UserCheck,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import supplierConcessionApi from '../services/concession.api';
import uploadService from '@/features/product/services/upload.service';
import type {
  ConcessionRequest,
  ConcessionType,
  ConcessionProposal,
  ConcessionStatus,
} from '@/features/admin/services/concession.api';
import toast from 'react-hot-toast';

export const TYPE_LABEL: Record<ConcessionType, string> = {
  subscription_trial: 'Subscription Trial (Free Trial)',
  subscription_tier_upgrade: 'Subscription Trial (Free Access to Higher Tier)',
  subscription_price: 'Custom Subscription Plan (Discounted Renewal)',
  subscription_duration: 'Custom Subscription Duration (Extended Term)',
  listing_fee_waiver: 'Listing-Fees Waiver (Temporary Fees Exemption)',
  listing_fee_custom: 'Custom Listing Fees (Reduced Listing Fees)',
};

const STATUS_STYLE: Record<ConcessionStatus, string> = {
  pending: 'bg-[#fff7ed] text-[#c2410c] border-[#ffedd5]',
  approved: 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]',
  rejected: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]',
  cancelled: 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]',
};

export const FREE_TRIAL_CRITERIA = [
  'New on digital e-commerce platform',
  'Startup less than one year.',
  'Other (type in comment box)',
];

export const TIER_UPGRADE_CRITERIA = [
  'Over 6 months on Amjstar platform with Basic plan',
  'Performance on Amjstar Platform (Rating over 4.5, no. of deal closed over 10 Monthly)',
  'Other (type in comment box)',
];

export const DISCOUNTED_RENEWAL_CRITERIA = [
  'Startup with less than one year.',
  'Industry run by Female entrepreneur',
  'Startup by Youth having age less than 25 years.',
  'Nature friendly products / Green products',
  'Daily need products FMCG',
  'Sports items and products',
  'Books and Stationery items',
  'Medician and life saving Items',
  'Products manufactured with low carbon emissions in its segment',
  'Handmade Products',
  'Other (type in comment box)',
];

export const EXTENDED_DURATION_CRITERIA = [
  'Performance on Amjstar Platform (Rating over 4.5, no. of deal closed over 50 Monthly)',
  // 'Other (type in comment box)', // Not listed in client requirement — Option 4 is auto-auth only
];

export const LISTING_WAIVER_CRITERIA = [
  'Small Scale enterprise having less than 4 employees.',
  'Having less sales from last 6 months on Amjstar Platform.',
  'Small Enterprises established in Village Promoting natural wellness & dairy products.',
  'Other (type in comment box)',
];

export const REDUCED_LISTING_CRITERIA = [
  'FMCG items',
  'Medician and life saving Items',
  'Books and Stationery items',
  'Sports equipments',
  'Cosmetics and ornaments',
  'Low margin Industrial raw materials supplier',
  'Plumber items',
  'Product more than 500 to sale',
  'Other (type in comment box)',
];

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
      return `${p.tier ?? 'VERIFIED'} · ${p.trialDays ?? 0} days free trial (max 3 mo)`;
    case 'subscription_tier_upgrade':
      return `${p.tier ?? 'GAMMA'} · ${p.trialDays ?? 30} days higher tier trial`;
    case 'subscription_price':
      return `₹${p.price ?? 0} renewal (Basic plan, up to 50% off)`;
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
  const [selectedCriteria, setSelectedCriteria] = useState<string>(FREE_TRIAL_CRITERIA[0] ?? '');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');

  // Proposal State
  const [trialTier, setTrialTier] = useState<'VERIFIED' | 'GAMMA' | 'BETA'>('VERIFIED');
  const [trialDays, setTrialDays] = useState<number | ''>(30);
  const [price, setPrice] = useState<number | ''>(1050); // Default to 50% of Basic 2100
  const [durationMonths, setDurationMonths] = useState<number | ''>(12);
  const [until, setUntil] = useState('');
  const [perProduct, setPerProduct] = useState<number | ''>('');
  const [minMonthly, setMinMonthly] = useState<number | ''>('');

  // Sales Representative fields (Options 1, 5, 6)
  const [salesRepName, setSalesRepName] = useState('');
  const [salesRepPhone, setSalesRepPhone] = useState('');
  const [salesRepVerified, setSalesRepVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [salesRepError, setSalesRepError] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

  // Document Attachment (Option 3)
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentFileName, setDocumentFileName] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Dates for waiver validation
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minWaiverDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 12);
  const maxWaiverDate = maxDate.toISOString().split('T')[0];

  // Helper to switch type and reset criteria appropriately
  const handleTypeChange = (newType: ConcessionType) => {
    setType(newType);
    setFormError('');
    setSalesRepError('');
    setOtpSent(false);
    setOtpCode('');
    setDevOtpHint('');
    if (newType === 'subscription_trial') {
      setSelectedCriteria(FREE_TRIAL_CRITERIA[0] ?? '');
      setTrialTier('VERIFIED');
      setTrialDays(30);
    } else if (newType === 'subscription_tier_upgrade') {
      setSelectedCriteria(TIER_UPGRADE_CRITERIA[0] ?? '');
      setTrialTier('GAMMA');
      setTrialDays(30);
    } else if (newType === 'subscription_price') {
      setSelectedCriteria(DISCOUNTED_RENEWAL_CRITERIA[0] ?? '');
      setPrice(1050);
    } else if (newType === 'subscription_duration') {
      setSelectedCriteria(EXTENDED_DURATION_CRITERIA[0] ?? '');
      setDurationMonths(12);
    } else if (newType === 'listing_fee_waiver') {
      setSelectedCriteria(LISTING_WAIVER_CRITERIA[0] ?? '');
    } else if (newType === 'listing_fee_custom') {
      setSelectedCriteria(REDUCED_LISTING_CRITERIA[0] ?? '');
    }
  };

  // Send OTP to Sales Representative
  const handleSendSalesRepOtp = async () => {
    setSalesRepError('');
    if (!salesRepPhone.trim()) {
      setSalesRepError('Please enter the Sales Representative phone number.');
      return;
    }
    const clean = salesRepPhone.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) {
      setSalesRepError('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await supplierConcessionApi.sendSalesRepOtp(salesRepPhone.trim());
      if (res.success) {
        setOtpSent(true);
        setSalesRepVerified(false);
        setOtpCode('');
        if (res.salesRepName && !salesRepName) {
          setSalesRepName(res.salesRepName);
        }
        if (res.devOtp) {
          setDevOtpHint(res.devOtp);
        }
        toast.success(res.message || 'Verification OTP sent to Sales Representative!');
      } else {
        setSalesRepError(res.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setSalesRepVerified(false);
      const msg = err?.response?.data?.message || 'Failed to send OTP. Number not recognized.';
      setSalesRepError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP for Sales Representative
  const handleVerifySalesRepOtp = async () => {
    setSalesRepError('');
    if (!otpCode.trim()) {
      setSalesRepError('Please enter the 6-digit OTP.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const res = await supplierConcessionApi.verifySalesRepOtp(salesRepPhone.trim(), otpCode.trim());
      if (res.verified && res.salesRep) {
        setSalesRepVerified(true);
        if (res.salesRep.name) {
          setSalesRepName(res.salesRep.name);
        }
        toast.success('Sales Representative verified successfully with OTP!');
      } else {
        setSalesRepVerified(false);
        setSalesRepError(res.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err: any) {
      setSalesRepVerified(false);
      const msg = err?.response?.data?.message || 'OTP verification failed. Please try again.';
      setSalesRepError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Upload Document / Certificate for Option 3
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size cannot exceed 10MB.');
      return;
    }

    try {
      setIsUploadingDoc(true);
      const res = await uploadService.uploadDoc(file);
      if (res.url) {
        setDocumentUrl(res.url);
        setDocumentFileName(file.name);
        toast.success('Certificate attached successfully!');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Load My Requests
  const { data: myRequests = [], isLoading: requestsLoading } = useQuery<ConcessionRequest[]>({
    queryKey: ['supplier-concessions-mine'],
    queryFn: () => supplierConcessionApi.listMine(),
  });

  // Submit Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError('');

      // Validation per option
      const needsSalesRep = ['subscription_trial', 'listing_fee_waiver', 'listing_fee_custom'].includes(type);
      if (needsSalesRep) {
        if (!salesRepPhone.trim()) {
          throw new Error('Please enter the Sales Representative phone number.');
        }
        if (!salesRepVerified) {
          throw new Error('Sales Representative phone number must be verified with OTP before submitting.');
        }
      }

      if (type === 'subscription_price' && !documentUrl) {
        throw new Error('Please upload a supporting certificate or document for this category.');
      }

      const isOther = selectedCriteria.toLowerCase().includes('other');
      if (isOther && !comment.trim()) {
        throw new Error('Please specify your details in the comment box.');
      }

      let proposal: ConcessionProposal = {};

      if (type === 'subscription_trial') {
        if (!trialDays || Number(trialDays) < 1 || Number(trialDays) > 90) {
          throw new Error('Trial duration must be between 1 and 90 days (max 3 months).');
        }
        proposal = {
          tier: trialTier,
          trialDays: Number(trialDays),
        };
      } else if (type === 'subscription_tier_upgrade') {
        proposal = {
          tier: trialTier === 'VERIFIED' ? 'GAMMA' : trialTier,
          trialDays: Number(trialDays) || 30,
        };
      } else if (type === 'subscription_price') {
        if (price === '' || Number(price) < 1050) {
          throw new Error('Discounted renewal is only for Basic plan, max 50% discount (min ₹1,050).');
        }
        proposal = {
          tier: 'VERIFIED',
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
        proposal = {
          perProduct: perProduct !== '' ? Math.round(Number(perProduct)) : undefined,
          minMonthly: minMonthly !== '' ? Math.round(Number(minMonthly)) : undefined,
        };
      }

      const compositeReason = isOther
        ? `${selectedCriteria}: ${comment.trim()}`
        : `${selectedCriteria}${comment.trim() ? ` — ${comment.trim()}` : ''}`;

      return supplierConcessionApi.create({
        type,
        proposal,
        reason: compositeReason,
        criteriaOption: selectedCriteria,
        criteriaComment: comment.trim() || undefined,
        salesRepName: salesRepName.trim() || undefined,
        salesRepPhone: salesRepPhone.trim() || undefined,
        documentUrl: documentUrl || undefined,
      });
    },
    onSuccess: (data: any) => {
      if (data?.isAutoApproved) {
        toast.success('🎉 Concession auto-verified and activated immediately by system criteria!', {
          duration: 5000,
        });
      } else {
        toast.success('Concession request submitted for review!');
      }
      setComment('');
      setDocumentUrl('');
      setDocumentFileName('');
      setSalesRepVerified(false);
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
          Apply for platform concessions, performance-based tier upgrades, discounted renewals, or listing fee waivers.
        </p>
      </div>

      {/* ── Section 1: Request a Concession ── */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#f1f5f9]">
          <Sparkles size={18} className="text-[#2563eb]" />
          <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-wider m-0">
            Choose Concession Option
          </h3>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-xs text-[#b91c1c] font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* 6 Concession Type Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-6">
          {(Object.keys(TYPE_LABEL) as ConcessionType[]).map(t => {
            const isSelected = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`p-3 rounded-[10px] text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0f172a] bg-[#0f172a] text-white shadow-sm'
                    : 'border-[#e2e8f0] bg-white text-[#334155] hover:border-[#cbd5e1] hover:bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#475569]'
                  }`}>
                    {t === 'subscription_tier_upgrade' || t === 'subscription_duration' ? '⚡ Auto-Auth' : t === 'subscription_price' ? '📄 Doc Verified' : '👤 Sales Verified'}
                  </span>
                </div>
                <div className="text-xs font-bold leading-tight">{TYPE_LABEL[t]}</div>
              </button>
            );
          })}
        </div>

        <div className="space-y-5 max-w-3xl">
          {/* Informational banner for Auto-Auth options */}
          {(type === 'subscription_tier_upgrade' || type === 'subscription_duration') && (
            <div className="p-3.5 bg-[#eff6ff] rounded-[10px] border border-[#bfdbfe] text-xs text-[#1e40af] flex items-start gap-2.5">
              <Zap size={18} className="shrink-0 text-[#2563eb] mt-0.5" />
              <div>
                <strong className="block font-bold">Auto-Verified by AMJSTAR Platform Engine</strong>
                <span>
                  {type === 'subscription_tier_upgrade'
                    ? 'Select your qualifying performance criteria below. If your store meets the platform tenure (>6 months on Basic) or review rating (≥4.5 with 10+ monthly closed deals), access is granted immediately without admin delay!'
                    : 'High performing suppliers with average rating ≥ 4.5 and 50+ monthly closed deals are auto-authenticated immediately.'}
                </span>
              </div>
            </div>
          )}

          {/* Option 3 constraints banner */}
          {type === 'subscription_price' && (
            <div className="p-3.5 bg-[#fefce8] rounded-[10px] border border-[#fef08a] text-xs text-[#854d0e] flex items-start gap-2.5">
              <Info size={18} className="shrink-0 text-[#ca8a04] mt-0.5" />
              <div>
                <strong className="block font-bold">Basic Plan Renewal Subsidy (Max 50% Discount)</strong>
                <span>
                  This concession is exclusively for renewing the Basic (VERIFIED) plan at up to 50% discount. A valid certificate or registration document must be attached to verify your business category.
                </span>
              </div>
            </div>
          )}

          {/* Criteria / Option Selection */}
          <div className="p-4 bg-[#f8fafc] rounded-[10px] border border-[#e2e8f0]">
            <label className="text-xs font-extrabold text-[#0f172a] uppercase tracking-wider block mb-2.5">
              Select Qualification Criteria / Reason <span className="text-[#b91c1c]">*</span>
            </label>

            <div className="space-y-2">
              {(type === 'subscription_trial'
                ? FREE_TRIAL_CRITERIA
                : type === 'subscription_tier_upgrade'
                ? TIER_UPGRADE_CRITERIA
                : type === 'subscription_price'
                ? DISCOUNTED_RENEWAL_CRITERIA
                : type === 'subscription_duration'
                ? EXTENDED_DURATION_CRITERIA
                : type === 'listing_fee_waiver'
                ? LISTING_WAIVER_CRITERIA
                : REDUCED_LISTING_CRITERIA
              ).map((opt, idx) => (
                <label
                  key={idx}
                  className={`flex items-start gap-3 p-2.5 rounded-[8px] border transition-all cursor-pointer ${
                    selectedCriteria === opt
                      ? 'border-[#0f172a] bg-white shadow-xs'
                      : 'border-transparent hover:bg-white/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="concessionCriteria"
                    value={opt}
                    checked={selectedCriteria === opt}
                    onChange={() => setSelectedCriteria(opt)}
                    className="mt-0.5 text-[#0f172a] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-[#1e293b] font-medium leading-relaxed">{opt}</span>
                </label>
              ))}
            </div>

            {/* Comment box if "Other" or additional explanation */}
            <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                {selectedCriteria.toLowerCase().includes('other')
                  ? 'Specify Details in Comment Box *'
                  : 'Additional Justification / Comments (Optional)'}
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                placeholder="Enter details..."
                className="w-full border border-[#cbd5e1] rounded-[8px] p-2.5 text-xs text-[#0f172a] bg-white focus:outline-none focus:border-[#0f172a]"
              />
            </div>
          </div>

          {/* Proposal Specific Fields */}
          <div className="p-4 bg-[#f8fafc] rounded-[10px] border border-[#e2e8f0]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-3 flex items-center gap-1.5">
              <Layers size={14} className="text-[#0f172a]" />
              Parameters: {TYPE_LABEL[type]}
            </div>

            {/* Option 1: Free Trial params */}
            {type === 'subscription_trial' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Plan Tier</label>
                  <select
                    value={trialTier}
                    onChange={e => setTrialTier(e.target.value as any)}
                    className="w-full border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white"
                  >
                    <option value="VERIFIED">VERIFIED (Basic Plan)</option>
                    <option value="GAMMA">GAMMA</option>
                    <option value="BETA">BETA</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Trial Days (Max 90 days / 3 months)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={trialDays}
                    onChange={e => setTrialDays(e.target.value === '' ? '' : Math.min(90, Math.max(1, Number(e.target.value))))}
                    className="w-full border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white"
                  />
                </div>
              </div>
            )}

            {/* Option 2: Higher tier trial params */}
            {type === 'subscription_tier_upgrade' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Target Higher Tier</label>
                  <select
                    value={trialTier}
                    onChange={e => setTrialTier(e.target.value as any)}
                    className="w-full border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white"
                  >
                    <option value="GAMMA">GAMMA (Featured Machinery Supplier)</option>
                    <option value="BETA">BETA (Premium Marketplace Leader)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Trial Duration</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={trialDays}
                    onChange={e => setTrialDays(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white"
                  />
                  <span className="text-[11px] text-[#64748b]">Default 30 days free trial access</span>
                </div>
              </div>
            )}

            {/* Option 3: Discounted Renewal params */}
            {type === 'subscription_price' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Eligible Plan</label>
                  <input
                    type="text"
                    disabled
                    value="Basic Plan (VERIFIED) — ₹2,100 Catalog"
                    className="w-full border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-xs text-[#64748b] bg-[#f1f5f9]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Proposed Renewal Price (₹, Excl. GST)</label>
                  <input
                    type="number"
                    min={1050}
                    max={2100}
                    value={price}
                    onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white font-bold"
                  />
                  <span className="text-[11px] text-[#64748b]">Max 50% discount allowed (minimum ₹1,050)</span>
                </div>
              </div>
            )}

            {/* Option 4: Extended Duration params */}
            {type === 'subscription_duration' && (
              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1">Extended Term (Months)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={durationMonths}
                  onChange={e => setDurationMonths(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full max-w-xs border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white font-bold"
                />
                <span className="text-[11px] text-[#64748b] block mt-1">Select months for duration extension</span>
              </div>
            )}

            {/* Option 5: Listing fee waiver */}
            {type === 'listing_fee_waiver' && (
              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1">Waive All Listing Fees Until</label>
                <input
                  type="date"
                  min={minWaiverDate}
                  max={maxWaiverDate}
                  value={until}
                  onChange={e => setUntil(e.target.value)}
                  className="w-full max-w-xs border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white"
                />
                <span className="text-[11px] text-[#64748b] block mt-1">Exemption expires automatically after this date (up to 12 months)</span>
              </div>
            )}

            {/* Option 6: Reduced listing fees */}
            {type === 'listing_fee_custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Custom Per-Product Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 5 (Standard ₹10)"
                    value={perProduct}
                    onChange={e => setPerProduct(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Custom Monthly Minimum (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 299 (Standard ₹499)"
                    value={minMonthly}
                    onChange={e => setMinMonthly(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sales Representative Recommendation & Phone OTP Check (Options 1, 5, 6) */}
          {['subscription_trial', 'listing_fee_waiver', 'listing_fee_custom'].includes(type) && (
            <div className="p-4 bg-[#f8fafc] rounded-[10px] border border-[#e2e8f0]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0f172a] mb-2">
                <UserCheck size={15} />
                Sales Representative Recommendation (Verified with OTP) <span className="text-[#b91c1c]">*</span>
              </div>
              <p className="text-xs text-[#64748b] mb-3">
                Submitted after Sales Representative Recommendation. Enter the name and 10-digit phone number of the AMJSTAR Sales Representative. The representative's phone number must be verified via OTP.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Sales Representative Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Amit Sharma"
                    value={salesRepName}
                    disabled={salesRepVerified}
                    onChange={e => setSalesRepName(e.target.value)}
                    className="w-full border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white disabled:bg-[#f1f5f9] disabled:text-[#64748b]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Sales Representative Phone Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="10-digit phone number"
                      value={salesRepPhone}
                      disabled={salesRepVerified}
                      onChange={e => {
                        setSalesRepPhone(e.target.value.replace(/\D/g, ''));
                        setSalesRepVerified(false);
                        setOtpSent(false);
                        setOtpCode('');
                        setDevOtpHint('');
                        setSalesRepError('');
                      }}
                      className="w-full border border-[#cbd5e1] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] bg-white font-mono disabled:bg-[#f1f5f9] disabled:text-[#64748b]"
                    />
                    {!salesRepVerified && (
                      <button
                        type="button"
                        onClick={handleSendSalesRepOtp}
                        disabled={isSendingOtp || salesRepPhone.length < 10}
                        className="shrink-0 px-3.5 py-1.5 bg-[#0f172a] text-white text-xs font-bold rounded-[8px] hover:bg-[#1e293b] disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        {isSendingOtp ? 'Sending…' : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* OTP Input Section (shown when OTP has been sent and not yet verified) */}
              {otpSent && !salesRepVerified && (
                <div className="mt-3 p-3.5 bg-white border border-[#cbd5e1] rounded-[8px] shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-bold text-[#0f172a]">
                      Enter 6-digit OTP sent to Sales Representative (+91 {salesRepPhone.slice(-10)})
                    </label>
                    <span className="text-[11px] text-[#64748b]">Valid for 5 minutes</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-40 border-2 border-[#cbd5e1] focus:border-[#0f172a] rounded-[8px] px-3 py-1.5 text-base tracking-[0.35em] text-center font-mono font-bold text-[#0f172a] bg-[#f8fafc] outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleVerifySalesRepOtp}
                      disabled={isVerifyingOtp || otpCode.length < 4}
                      className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-[8px] disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={14} />
                      {isVerifyingOtp ? 'Verifying…' : 'Verify OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendSalesRepOtp}
                      disabled={isSendingOtp}
                      className="px-3 py-2 border border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#475569] text-xs font-semibold rounded-[8px] disabled:opacity-50 cursor-pointer"
                    >
                      Resend
                    </button>
                  </div>

                  {(import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development') && (
                    <div className="mt-2.5 p-2 bg-[#f0f9ff] border border-[#bae6fd] rounded-[6px] text-[11px] text-[#0369a1] leading-relaxed">
                      <strong>Testing & Development Mode:</strong> Enter default OTP <code className="bg-white px-1.5 py-0.5 rounded border border-[#bae6fd] font-mono font-bold text-[#0f172a]">123456</code> or master bypass OTP <code className="bg-white px-1.5 py-0.5 rounded border border-[#bae6fd] font-mono font-bold text-[#0f172a]">202526</code>.
                      {devOtpHint && (
                        <span className="block mt-1 font-semibold text-[#1e40af]">
                          Generated Dev OTP: <code className="bg-white px-1.5 py-0.5 rounded border border-[#bae6fd] font-mono font-bold">{devOtpHint}</code>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Verified State Card */}
              {salesRepVerified && (
                <div className="mt-2.5 p-3 bg-[#ecfdf5] border border-[#a7f3d0] rounded-[8px] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-[#059669] font-semibold">
                    <CheckCircle2 size={16} className="text-[#059669] shrink-0" />
                    <span>
                      Verified AMJSTAR Representative: <strong>{salesRepName || 'Sales Sub-Admin'}</strong> (+91 {salesRepPhone.slice(-10)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSalesRepVerified(false);
                      setOtpSent(false);
                      setOtpCode('');
                      setDevOtpHint('');
                    }}
                    className="text-[11px] text-[#64748b] hover:text-[#0f172a] underline font-medium cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}

              {salesRepError && (
                <div className="mt-2.5 p-2.5 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] text-xs text-[#b91c1c] flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{salesRepError}</span>
                </div>
              )}
            </div>
          )}

          {/* Document / Certificate Attachment (Option 3) */}
          {type === 'subscription_price' && (
            <div className="p-4 bg-[#f8fafc] rounded-[10px] border border-[#e2e8f0]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0f172a] mb-2">
                <FileText size={15} />
                Supporting Certificate or Document <span className="text-[#b91c1c]">*</span>
              </div>
              <p className="text-xs text-[#64748b] mb-3">
                Upload proof of eligibility (e.g. MSME / Udyam registration, startup certificate, female proprietorship deed, green certification, etc.).
              </p>

              {documentUrl ? (
                <div className="p-3 bg-[#ecfdf5] border border-[#a7f3d0] rounded-[8px] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#059669]">
                    <ShieldCheck size={18} />
                    <span className="truncate max-w-sm">{documentFileName || 'Supporting Document Attached'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#2563eb] underline hover:text-[#1d4ed8]"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentUrl('');
                        setDocumentFileName('');
                      }}
                      className="text-xs font-bold text-[#b91c1c] hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#cbd5e1] rounded-[10px] bg-white hover:bg-[#f8fafc] transition-colors cursor-pointer">
                  <UploadCloud size={24} className="text-[#64748b] mb-1" />
                  <span className="text-xs font-bold text-[#0f172a]">
                    {isUploadingDoc ? 'Uploading file…' : 'Click to upload certificate or document'}
                  </span>
                  <span className="text-[11px] text-[#94a3b8] mt-0.5">PDF, PNG, JPG up to 10MB</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleDocUpload}
                    disabled={isUploadingDoc}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || isUploadingDoc || isVerifyingOtp || isSendingOtp}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0f172a] text-white text-xs font-bold uppercase tracking-wider rounded-[8px] hover:bg-[#1e293b] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Send size={14} />
              {createMutation.isPending
                ? 'Processing Request…'
                : type === 'subscription_tier_upgrade' || type === 'subscription_duration'
                ? 'Submit & Auto-Authenticate'
                : 'Submit Concession Request'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 2: My Requests History ── */}
      <div className="bg-white rounded-[12px] border border-[#e2e8f0] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#f1f5f9]">
          <History size={18} className="text-[#0f172a]" />
          <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-wider m-0">
            My Concession Requests
          </h3>
        </div>

        {requestsLoading ? (
          <div className="py-10 text-center text-xs text-[#64748b]">Loading requests…</div>
        ) : myRequests.length === 0 ? (
          <div className="py-10 text-center text-[#64748b]">
            <Clock size={28} className="mx-auto mb-2 text-[#94a3b8]" />
            <div className="text-xs font-semibold">No concession requests found</div>
            <p className="text-[11px] text-[#94a3b8] mt-1">Submit your first request above to receive billing adjustments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-[#475569] uppercase tracking-wider text-[11px] border-b border-[#e2e8f0]">
                <tr>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Concession Type</th>
                  <th className="py-3 px-4 font-bold">Proposal / Details</th>
                  <th className="py-3 px-4 font-bold">Criteria / Reason</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Decision / Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {myRequests.map(r => (
                  <tr key={r._id} className="hover:bg-[#f8fafc]/60">
                    <td className="py-3.5 px-4 font-medium text-[#64748b] whitespace-nowrap">
                      {fmtDateTime(r.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0f172a]">{TYPE_LABEL[r.type] || r.type}</div>
                      {r.isAutoApproved && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                          <Zap size={11} /> Auto-Approved
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0f172a]">
                      {summariseProposal(r.proposal, r.type)}
                      {r.documentUrl && (
                        <div className="mt-1">
                          <a
                            href={r.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#2563eb] font-bold underline inline-flex items-center gap-1"
                          >
                            <FileText size={11} /> View Attached Certificate
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#475569] max-w-xs">
                      {r.criteriaOption && (
                        <div className="font-bold text-[#0f172a] mb-0.5">{r.criteriaOption}</div>
                      )}
                      <div className="line-clamp-2 text-[#64748b]">{r.reason}</div>
                      {r.salesRepVerified && r.salesRepPhone && (
                        <div className="text-[10px] text-[#059669] font-semibold mt-1">
                          ✓ Verified Rep: {r.salesRepName || 'Sales Rep'} ({r.salesRepPhone})
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLE[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#475569]">
                      {r.decisionNote ? (
                        <div className="text-xs bg-[#f8fafc] p-2 rounded-[6px] border border-[#e2e8f0]">
                          {r.decisionNote}
                        </div>
                      ) : r.status === 'pending' ? (
                        <span className="text-xs text-[#94a3b8] italic">In Review</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierConcessionRequest;
