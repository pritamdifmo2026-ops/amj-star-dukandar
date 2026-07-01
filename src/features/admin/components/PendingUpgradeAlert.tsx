import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';
import adminService from '../services/admin.service';

interface Props {
  /** Navigate to a supplier's detail view to run the verification. */
  onReview: (supplierId: string) => void;
}

/**
 * Login/session alert shown to admins whenever suppliers have paid for a plan
 * upgrade and are awaiting physical verification. Dismissible for the session,
 * but reappears on the next login/refresh until every upgrade is verified.
 */
const PendingUpgradeAlert: React.FC<Props> = ({ onReview }) => {
  const [dismissed, setDismissed] = useState(false);

  const { data: pending = [] } = useQuery({
    queryKey: ['admin', 'pending-upgrades'],
    queryFn: adminService.getPendingUpgrades,
    refetchInterval: 60_000,
  });

  if (dismissed || pending.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg bg-white rounded-[16px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9] bg-[#eff6ff]">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-[#1d4ed8]" />
            <h3 className="text-base font-extrabold text-[#0f172a] m-0">
              Physical Verification Needed ({pending.length})
            </h3>
          </div>
          <button onClick={() => setDismissed(true)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/60 border-none bg-transparent cursor-pointer text-[#64748b]" aria-label="Dismiss">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-[#475569] m-0 mb-4">
            These suppliers paid for a plan upgrade and are waiting for an AMJSTAR physical
            verification. Review each and approve the upgrade once verification is complete.
          </p>

          <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto">
            {pending.map(s => (
              <div key={s._id} className="flex items-center justify-between gap-3 p-3 border border-[#eef2f6] rounded-[10px]">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0f172a] m-0 truncate">{s.businessName}</p>
                  <p className="text-xs text-[#64748b] m-0">
                    Upgrade to <strong>{s.pendingUpgrade?.targetTier}</strong>
                    {s.phone ? ` · ${s.phone}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => { setDismissed(true); onReview(s._id); }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#1d4ed8] rounded-[8px] border-none cursor-pointer hover:bg-[#1e40af]"
                >
                  Review &amp; Verify <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-[#f1f5f9] flex justify-end">
          <button onClick={() => setDismissed(true)} className="text-sm font-semibold text-[#64748b] bg-transparent border-none cursor-pointer hover:text-[#1e293b]">
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingUpgradeAlert;
