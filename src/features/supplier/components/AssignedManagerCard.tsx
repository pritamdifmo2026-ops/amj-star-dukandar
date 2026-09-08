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
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AssignedManagerCardProps {
  profile?: any;
  compact?: boolean;
}

export const AssignedManagerCard: React.FC<AssignedManagerCardProps> = ({ profile, compact = false }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const managerName = profile?.accountManagerName;
  const managerRole = profile?.accountManagerRole || 'Dedicated Account Manager';
  const managerEmail = profile?.accountManagerEmail;
  const rawPhone = profile?.accountManagerPhone || (profile?.accountManagerId && typeof profile.accountManagerId === 'object' ? profile.accountManagerId.phone : null);
  const managerPhone = rawPhone && !String(rawPhone).startsWith('admin_') ? String(rawPhone) : null;

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
  const waLink = (p: string) => `https://wa.me/${p.replace(/[^\d]/g, '')}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Card Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
            <Headphones size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 m-0 leading-tight">
              Merchant Support & Account Desk
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Direct assistance for catalog, orders, logistics, and dispute resolution
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-800 border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Active Support Tier
        </span>
      </div>

      <div className={`p-6 ${compact ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}`}>
        {/* Box 1: Assigned Account Manager (Primary) */}
        <div className="flex flex-col justify-between p-5 rounded-xl border border-blue-100 bg-blue-50/30">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 text-white text-[11px] font-bold tracking-wide uppercase">
                <UserCheck size={13} />
                Primary Point of Contact
              </span>
              {managerName && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                  Assigned Manager
                </span>
              )}
            </div>

            {managerName ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 m-0">
                    {managerName}
                  </h4>
                  <p className="text-xs font-semibold text-blue-700 m-0 mt-0.5 flex items-center gap-1.5">
                    <Shield size={13} />
                    {managerRole}
                  </p>
                </div>

                <p className="text-xs text-slate-600 m-0 leading-relaxed">
                  Your designated account manager handles your day-to-day operations, listing queries, inventory updates, and seller disputes.
                </p>

                {/* Manager Contact Details */}
                <div className="pt-2 border-t border-blue-100/80 space-y-2">
                  {managerEmail && (
                    <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail size={14} className="text-blue-600 shrink-0" />
                        <span className="truncate font-medium">{managerEmail}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(managerEmail, 'Email')}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title="Copy Email"
                        >
                          {copiedField === 'Email' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <a
                          href={`mailto:${managerEmail}`}
                          className="text-xs font-semibold text-blue-600 hover:underline px-1.5 py-0.5"
                        >
                          Mail
                        </a>
                      </div>
                    </div>
                  )}

                  {managerPhone ? (
                    <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone size={14} className="text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800">{managerPhone}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(managerPhone, 'Phone')}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title="Copy Phone"
                        >
                          {copiedField === 'Phone' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <a
                          href={`tel:${cleanPhone(managerPhone)}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline px-1.5 py-0.5"
                        >
                          Call
                        </a>
                        <a
                          href={waLink(managerPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline px-1.5 py-0.5"
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone size={14} className="text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800">{ADMIN_PHONE}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">(AMJ Support Desk Helpline)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(ADMIN_PHONE, 'Phone')}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title="Copy Helpline"
                        >
                          {copiedField === 'Phone' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <a
                          href={`tel:${cleanPhone(ADMIN_PHONE)}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline px-1.5 py-0.5"
                        >
                          Call
                        </a>
                        <a
                          href={waLink(ADMIN_PHONE)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline px-1.5 py-0.5"
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h4 className="text-base font-extrabold text-slate-800 m-0">
                    AMJSTAR Merchant Care Desk
                  </h4>
                  <p className="text-xs font-medium text-slate-500 m-0 mt-0.5">
                    Central Operations & Catalog Support
                  </p>
                </div>
                <p className="text-xs text-slate-600 m-0 leading-relaxed">
                  No individual account manager is assigned to your account yet. You are supported directly by our central merchant operations team.
                </p>
                <div className="pt-2 border-t border-blue-100/80">
                  <a
                    href={`tel:${cleanPhone(ADMIN_PHONE)}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-white px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    <Phone size={14} /> Call Central Support: {ADMIN_PHONE}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-blue-100/60 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-blue-500" /> Typical reply: &lt; 2 hours
            </span>
            <span>Mon–Sat • 9:30 AM – 7:00 PM</span>
          </div>
        </div>

        {/* Box 2: Main Website Admin & Escalation Policy */}
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
              Platform administration, compliance, payouts, and leadership review.
            </p>

            {/* Crucial Notice Required by Rule */}
            <div className="my-3.5 p-3 rounded-lg bg-white border border-amber-300 shadow-sm flex items-start gap-2.5">
              <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-900 m-0">
                  Escalation Rule:
                </p>
                <p className="text-xs text-amber-800 font-medium m-0 mt-0.5 leading-relaxed">
                  If your query or issue is <strong>not resolved by your assigned manager within 24 hours</strong>, only then please connect with the Main Admin.
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
                    href={`mailto:${ADMIN_EMAIL}?subject=Escalation:%20Store%20${encodeURIComponent(profile?.businessName || 'Supplier')}`}
                    className="text-xs font-bold text-amber-700 hover:underline px-1.5 py-0.5"
                  >
                    Email Escalation
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800/80">
            <span>Executive Grievance Cell</span>
            <span>Mon–Sat • 10:00 AM – 7:00 PM IST</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignedManagerCard;
