import React, { useState } from 'react';
import {
  Headphones,
  UserCheck,
  Shield,
  Phone,
  Mail,
  MessageCircle,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  Building2,
  Handshake,
  Tag,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '@/store/hooks';

interface BuyerHelpDeskCardProps {
  compact?: boolean;
}

export const BuyerHelpDeskCard: React.FC<BuyerHelpDeskCardProps> = ({ compact = false }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const user = useAppSelector((state) => state.auth.user);

  // Attributed Wholesale Service Partner (if buyer joined via partner code / link)
  const partner = user?.partnerContact;
  const rawPartnerPhone = partner?.phone;
  const partnerPhone = rawPartnerPhone && !String(rawPartnerPhone).startsWith('admin_') ? String(rawPartnerPhone) : null;
  const partnerEmail = partner?.email;
  const partnerName = partner?.name;
  const partnerBiz = partner?.businessName;
  const partnerCode = partner?.partnerCode || user?.partnerCodeUsed;

  // Main Admin Official Contact
  const ADMIN_PHONE = '+91 9034440673';
  const ADMIN_EMAIL = 'support@amjstar.com';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanPhone = (p: string) => p.replace(/[^\d+]/g, '');
  const waLink = (p: string, isPartner = false) => {
    const text = isPartner
      ? `Hi ${partnerName || 'Partner'}, I am registered on AMJSTAR under your referral. I need assistance with a wholesale purchase.`
      : 'Hi AMJSTAR Support, I am a registered buyer and need help with an order/inquiry.';
    return `https://wa.me/${p.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Card Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
            {partner ? <Handshake size={20} /> : <Headphones size={20} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 m-0 leading-tight">
              {partner ? 'Assigned Partner & Buyer Help Desk' : 'Buyer Support & Central Helpline'}
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              {partner
                ? 'Your regional wholesale partner and central platform escalation helpline'
                : 'Direct assistance for product sourcing, quotations, orders, and payment protection'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {partner && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <Handshake size={13} className="text-indigo-600" />
              Referred Buyer Account
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Priority Desk
          </span>
        </div>
      </div>

      <div className={`p-6 ${compact ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}`}>
        {/* Box 1: Primary Point of Contact (Wholesale Partner if referred, or Central Buyer Care) */}
        <div className={`flex flex-col justify-between p-5 rounded-xl border ${partner ? 'border-indigo-100 bg-indigo-50/30' : 'border-blue-100 bg-blue-50/30'}`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-white text-[11px] font-bold tracking-wide uppercase ${partner ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                {partner ? <Handshake size={13} /> : <UserCheck size={13} />}
                Primary Point of Contact
              </span>
              {partner && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded border border-indigo-200">
                  <Tag size={11} /> Code: {partnerCode || 'PARTNER'}
                </span>
              )}
            </div>

            {partner ? (
              /* Wholesale Service Partner Primary View */
              <div className="space-y-3">
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 m-0">
                    {partnerName}
                  </h4>
                  {partnerBiz && partnerBiz !== partnerName && (
                    <p className="text-xs font-semibold text-indigo-700 m-0 mt-0.5">
                      {partnerBiz}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 m-0 mt-0.5 flex items-center gap-1.5 font-medium">
                    <Shield size={13} className="text-indigo-600" />
                    Accredited Wholesale Service Partner {partner.city ? `• ${partner.city}` : ''}
                  </p>
                </div>

                <p className="text-xs text-slate-600 m-0 leading-relaxed">
                  You joined AMJSTAR through this accredited Wholesale Service Partner. They assist you with supplier discovery, quotation negotiations, bulk sample orders, and dispatch tracking.
                </p>

                {/* Partner Contact Details */}
                <div className="pt-2 border-t border-indigo-100/80 space-y-2">
                  {partnerPhone ? (
                    <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone size={14} className="text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800">{partnerPhone}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(partnerPhone, 'Partner Phone')}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title="Copy Phone"
                        >
                          {copiedField === 'Partner Phone' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <a
                          href={`tel:${cleanPhone(partnerPhone)}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline px-1.5 py-0.5"
                        >
                          Call
                        </a>
                        <a
                          href={waLink(partnerPhone, true)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline px-1.5 py-0.5"
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {partnerEmail ? (
                    <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail size={14} className="text-indigo-600 shrink-0" />
                        <span className="truncate font-medium">{partnerEmail}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(partnerEmail, 'Partner Email')}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title="Copy Email"
                        >
                          {copiedField === 'Partner Email' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <a
                          href={`mailto:${partnerEmail}`}
                          className="text-xs font-semibold text-indigo-600 hover:underline px-1.5 py-0.5"
                        >
                          Mail
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              /* Central Buyer Desk View (Fallback when not referred by a partner) */
              <div className="space-y-3">
                <div>
                  <h4 className="text-base font-extrabold text-slate-800 m-0">
                    AMJSTAR Central Buyer Desk
                  </h4>
                  <p className="text-xs font-medium text-slate-500 m-0 mt-0.5">
                    Central Sourcing, Orders & Payment Support
                  </p>
                </div>
                <p className="text-xs text-slate-600 m-0 leading-relaxed">
                  You are supported directly by our central wholesale sourcing team. Call or message us for bulk price quotations, vendor verifications, or order fulfillment help.
                </p>
                <div className="pt-2 border-t border-blue-100/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone size={14} className="text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">{ADMIN_PHONE}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">(Central Buyer Helpline)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(ADMIN_PHONE, 'Helpline')}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                        title="Copy Helpline"
                      >
                        {copiedField === 'Helpline' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                      <a
                        href={`tel:${cleanPhone(ADMIN_PHONE)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline px-1.5 py-0.5"
                      >
                        Call
                      </a>
                      <a
                        href={waLink(ADMIN_PHONE, false)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline px-1.5 py-0.5"
                      >
                        <MessageCircle size={12} />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={12} className={partner ? 'text-indigo-500' : 'text-blue-500'} /> Typical reply: &lt; 2 hours
            </span>
            <span>Mon–Sat • 9:30 AM – 7:00 PM IST</span>
          </div>
        </div>

        {/* Box 2: Central Platform Administration & Escalation Policy (Always Secondary / Central) */}
        <div className="flex flex-col justify-between p-5 rounded-xl border border-amber-200 bg-amber-50/40">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-600 text-white text-[11px] font-bold tracking-wide uppercase">
                <Shield size={13} />
                Central Escalation Desk
              </span>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Main Admin
              </span>
            </div>

            <h4 className="text-base font-extrabold text-slate-900 m-0 flex items-center gap-2">
              <Building2 size={16} className="text-amber-700" />
              AMJSTAR Central Management
            </h4>
            <p className="text-xs text-slate-600 m-0 mt-0.5">
              Escrow payment safety, buyer dispute resolution, and leadership grievance review.
            </p>

            {/* Crucial Notice Required by Rule */}
            <div className="my-3.5 p-3 rounded-lg bg-white border border-amber-300 shadow-sm flex items-start gap-2.5">
              <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-900 m-0">
                  Resolution & Escalation Policy:
                </p>
                <p className="text-xs text-amber-800 font-medium m-0 mt-0.5 leading-relaxed">
                  {partner ? (
                    <>
                      Please connect with your <strong>assigned partner ({partnerName}) first</strong> for immediate assistance. If your inquiry or order issue is <strong>not resolved within 24 hours</strong>, connect with the Main Admin helpline.
                    </>
                  ) : (
                    <>
                      For any platform disputes, billing queries, or unresolved seller issues, contact the Main Admin directly.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Main Admin Direct Contact */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone size={14} className="text-amber-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{ADMIN_PHONE}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ADMIN_PHONE, 'Admin Phone')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                    title="Copy Admin Phone"
                  >
                    {copiedField === 'Admin Phone' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                  <a
                    href={`tel:${cleanPhone(ADMIN_PHONE)}`}
                    className="text-xs font-bold text-amber-700 hover:underline px-1.5 py-0.5"
                  >
                    Call Admin
                  </a>
                  <a
                    href={waLink(ADMIN_PHONE, false)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline px-1.5 py-0.5"
                  >
                    <MessageCircle size={12} />
                    WhatsApp
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail size={14} className="text-amber-600 shrink-0" />
                  <span className="truncate font-medium">{ADMIN_EMAIL}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ADMIN_EMAIL, 'Admin Email')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                    title="Copy Admin Email"
                  >
                    {copiedField === 'Admin Email' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                  <a
                    href={`mailto:${ADMIN_EMAIL}?subject=Buyer%20Escalation:%20Account%20${encodeURIComponent(user?.name || 'Buyer')}`}
                    className="text-xs font-bold text-amber-700 hover:underline px-1.5 py-0.5"
                  >
                    Email Escalation
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800/80">
            <span>Central Buyer Safety Cell</span>
            <span>Mon–Sat • 10:00 AM – 7:00 PM IST</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerHelpDeskCard;
