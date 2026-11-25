import React, { useState } from 'react';
import {
  Headphones,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { PartnerProfile } from '../services/partner.service';

interface PartnerHelplineCardProps {
  partner?: PartnerProfile | null;
  compact?: boolean;
  className?: string;
}

export const PartnerHelplineCard: React.FC<PartnerHelplineCardProps> = ({
  partner,
  compact = false,
  className = '',
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Resolved contact details configured by Admin on approval / settings
  const assigned = partner?.assignedAdminContact;
  const adminPhone =
    assigned?.phone || partner?.adminSupportPhone || '+91 9034440673';
  const adminEmail =
    assigned?.email || partner?.adminSupportEmail || 'support@amjstar.com';
  const managerName =
    assigned?.name || partner?.adminSupportName || 'AMJ Star Partner Support Desk';

  const cleanDigits = adminPhone.replace(/[^\d+]/g, '');
  const cleanNumberForWa = adminPhone.replace(/[^\d]/g, '');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const waUrl = `https://wa.me/${cleanNumberForWa}?text=${encodeURIComponent(
    `Hello AMJ Star Team, I am Wholesale Partner (${partner?.fullName || partner?.partnerCode || 'Partner'}), Partner Code: ${partner?.partnerCode || '—'}. I need assistance regarding my partner account/network.`
  )}`;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Card Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center shadow-sm">
            <Headphones size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white m-0 leading-tight">
                Assigned Platform Helpline & Support Desk
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck size={11} /> Dedicated Manager
              </span>
            </div>
            <p className="text-xs text-slate-300 m-0 mt-0.5">
              Direct administrative helpline configured specifically for your Wholesale Partner account
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Priority Channel
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className={`p-5 ${compact ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-5'}`}>
        {/* Left Column: Assigned Manager Info & Contact Actions */}
        <div className="flex flex-col justify-between p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
                <Building2 size={12} /> Assigned Support Lead
              </span>
              <span className="text-[11px] font-semibold text-indigo-700">
                Direct AMJ Star Escalation
              </span>
            </div>

            <h4 className="text-base font-extrabold text-slate-900 m-0">
              {managerName}
            </h4>
            <p className="text-xs text-slate-600 m-0 mt-1 leading-relaxed">
              Assigned directly by AMJ Star operations. Contact them whenever you or your referred buyers/sellers need assistance with deal negotiations, pending commission clearance, or order fulfillment.
            </p>

            {/* Direct Phone & WhatsApp */}
            <div className="mt-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone size={14} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">{adminPhone}</span>
                    <span className="text-[10px] text-slate-400 block font-normal">Direct Helpline Phone</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(adminPhone, 'Helpline Number')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                    title="Copy Number"
                  >
                    {copiedField === 'Helpline Number' ? (
                      <Check size={13} className="text-emerald-600" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                  <a
                    href={`tel:${cleanDigits}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline px-1.5 py-0.5"
                  >
                    Call
                  </a>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline px-1.5 py-0.5"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Direct Email (if configured) */}
              {adminEmail && (
                <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail size={14} className="text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-slate-800 truncate block">{adminEmail}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Direct Support Mailbox</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(adminEmail, 'Support Email')}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      title="Copy Email"
                    >
                      {copiedField === 'Support Email' ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                    <a
                      href={`mailto:${adminEmail}?subject=Partner%20Assistance%20Request%20(${encodeURIComponent(
                        partner?.partnerCode || 'Partner'
                      )})`}
                      className="inline-flex items-center text-xs font-bold text-indigo-600 hover:underline px-1.5 py-0.5"
                    >
                      Email
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-indigo-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-indigo-500" /> Typical reply: &lt; 2 hours
            </span>
            <span>Mon–Sat • 9:30 AM – 7:00 PM IST</span>
          </div>
        </div>

        {/* Right Column: Guidance & Escalation Scope */}
        <div className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/60">
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-800">
              <HelpCircle size={15} className="text-indigo-600" />
              What can you contact your assigned desk for?
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-4 m-0 list-disc leading-relaxed">
              <li>
                <strong>Deal Commission Disputes:</strong> Queries regarding order attribution, platform fee cuts, or fractional paise reconciliations.
              </li>
              <li>
                <strong>Payout Verification & UTR:</strong> Inquiries regarding bank account verification, tax deductions (TDS 194H), or settlement timing.
              </li>
              <li>
                <strong>Buyer & Seller Onboarding Blocker:</strong> If a wholesale merchant or bulk buyer in your network is stuck during KYC or catalog verification.
              </li>
              <li>
                <strong>Volume Brackets & Incentive Upgrades:</strong> Guidance on expanding your territory and qualifying for higher commission slabs.
              </li>
            </ul>
          </div>

          <div className="mt-3.5 p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-[11px] text-blue-900 flex items-center justify-between">
            <span className="font-semibold">
              Partner Referral Code: <span className="font-mono font-bold text-blue-700">{partner?.partnerCode || '—'}</span>
            </span>
            <span className="text-blue-700 font-medium">Keep code ready when calling</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerHelplineCard;
