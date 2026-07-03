import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { SubscriptionStatus } from '../store/supplier.slice';
import { Clock, X, RefreshCw } from 'lucide-react';
import { PLAN_CATALOG } from '../constants/plans';

interface Props {
  onRenew: () => void;
}

/**
 * Popup shown on the supplier dashboard when their active plan expires within 1 day.
 * Dismissed per session; reappears on next login if still not renewed.
 */
const MembershipRenewalAlert: React.FC<Props> = ({ onRenew }) => {
  const [dismissed, setDismissed] = useState(false);
  const profile = useAppSelector(state => state.supplier.profile);

  if (dismissed) return null;

  const sub = profile?.subscription;
  if (!sub || sub.status !== SubscriptionStatus.ACTIVE || !sub.expiryDate) return null;

  const msLeft = new Date(sub.expiryDate).getTime() - Date.now();
  const daysLeft = msLeft / 86_400_000;

  // Show only within the 1-day-before window (and not already expired)
  if (daysLeft > 1 || daysLeft < 0) return null;

  const tierKey = (sub.tier ?? 'VERIFIED') as keyof typeof PLAN_CATALOG;
  const planName = PLAN_CATALOG[tierKey]?.name ?? 'Plan';
  const expiryStr = new Date(sub.expiryDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const hours = Math.max(0, Math.floor(msLeft / 3_600_000));

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] bg-[#fff7ed]">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-[#d97706]" />
            <h3 className="text-base font-extrabold text-[#0f172a] m-0">
              Membership Expiring Soon
            </h3>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/60 border-none bg-transparent cursor-pointer text-[#64748b]"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="w-14 h-14 bg-[#fff7ed] rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-[#d97706]" />
          </div>
          <h4 className="text-center font-extrabold text-[#0f172a] text-lg m-0 mb-2">
            Your {planName} expires {hours <= 0 ? 'today' : `in ${hours} hour${hours !== 1 ? 's' : ''}`}
          </h4>
          <p className="text-center text-sm text-[#475569] m-0">
            Your membership ends on <strong>{expiryStr}</strong>. Renew now to keep your{' '}
            {tierKey === 'VERIFIED' ? 'GST Verified badge' : 'TrustSEAL badge, featured placement, and higher search ranking'}.
          </p>
        </div>

        <div className="px-6 pb-5 flex flex-col gap-2">
          <button
            onClick={() => { setDismissed(true); onRenew(); }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#d97706] text-white font-bold rounded-[10px] border-none cursor-pointer hover:bg-[#b45309] transition-colors text-sm"
          >
            <RefreshCw size={16} /> Renew Now
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-full py-2.5 text-sm font-semibold text-[#64748b] bg-transparent border-none cursor-pointer hover:text-[#1e293b]"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipRenewalAlert;
