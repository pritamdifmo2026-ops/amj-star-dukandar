import React from 'react';
import { Clock, ShieldX, PauseCircle } from 'lucide-react';
import type { PartnerProfile } from '../services/partner.service';
import { isPartnerPending } from '../services/partner.service';

/**
 * Explains, at the top of every view, why a hub is read-only.
 *
 * Self-registered partners can sign in and explore immediately, but they do not earn and
 * cannot withdraw until an admin confirms them — so the hub has to say that plainly
 * rather than letting them share links and wonder why nothing accrues.
 */
const PartnerApprovalNotice: React.FC<{ partner?: PartnerProfile }> = ({ partner }) => {
  if (!partner) return null;

  if (isPartnerPending(partner.status)) {
    return (
      <div className="mb-6 flex items-start gap-3 p-4 rounded-[12px] bg-[#fffbeb] border border-[#fde68a] text-[#92400e]">
        <Clock size={20} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm m-0">Awaiting admin confirmation</p>
          <p className="text-xs m-0 mt-1 leading-relaxed">
            Your Wholesale Service Partner account is in the AMJ Star approval queue. You can set up
            your profile and bank details now, but referrals will only start earning commission — and
            payouts will only unlock — once an admin confirms your account. Your referral code{' '}
            <span className="font-mono font-bold">{partner.partnerCode}</span> already works, so
            anyone who signs up with it will be credited to you from day one.
          </p>
        </div>
      </div>
    );
  }

  if (partner.status === 'rejected') {
    return (
      <div className="mb-6 flex items-start gap-3 p-4 rounded-[12px] bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]">
        <ShieldX size={20} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm m-0">Application not approved</p>
          <p className="text-xs m-0 mt-1 leading-relaxed">
            {partner.rejectionReason
              ? `Reason given: ${partner.rejectionReason}`
              : 'The AMJ Star team did not approve this partner application.'}{' '}
            Contact the AMJ Star team if you believe this was a mistake.
          </p>
        </div>
      </div>
    );
  }

  if (partner.status === 'suspended') {
    return (
      <div className="mb-6 flex items-start gap-3 p-4 rounded-[12px] bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]">
        <PauseCircle size={20} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm m-0">Account suspended</p>
          <p className="text-xs m-0 mt-1 leading-relaxed">
            New referrals will not earn commission and payout requests are blocked while your account
            is suspended. Any balance you have already earned is safe. Contact the AMJ Star team to
            resolve this.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default PartnerApprovalNotice;
