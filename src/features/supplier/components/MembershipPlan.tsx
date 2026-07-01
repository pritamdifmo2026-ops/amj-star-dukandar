import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Crown, Check, ArrowUpCircle, Clock, ShieldCheck } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { SubscriptionStatus, UpgradeStatus, SupplierTier } from '../store/supplier.slice';
import { getPlan, getUpgradeOptions, formatINR } from '../constants/plans';
import PlanBadge from './PlanBadge';
import Button from '@/shared/components/ui/Button';

const cardCls = 'bg-white rounded-[10px] border border-[#eef2f6] p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)]';
const cardHeaderCls = 'flex items-center gap-3 mb-6 pb-4 border-b border-[#f1f5f9]';

const MembershipPlan: React.FC = () => {
  const [, setSearchParams] = useSearchParams();
  const profile = useAppSelector(state => state.supplier.profile);

  if (!profile) return null;

  const currentTier = (profile.subscription?.tier || profile.tier) as SupplierTier;
  const currentPlan = getPlan(currentTier);
  const sub = profile.subscription;
  const isActive =
    sub?.status === SubscriptionStatus.ACTIVE &&
    (!sub?.expiryDate || new Date(sub.expiryDate) > new Date());
  const pu = profile.pendingUpgrade;
  const verificationPending = pu?.status === UpgradeStatus.VERIFICATION_PENDING;
  const upgradeOptions = getUpgradeOptions(currentTier);

  return (
    <div className={`${cardCls} mt-6`}>
      <div className={cardHeaderCls}>
        <Crown size={20} className="text-primary" />
        <h3 className="text-base font-bold text-[#1e293b] m-0">Membership Plan</h3>
        <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${isActive ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fff7ed] text-[#c2410c]'}`}>
          {isActive ? 'ACTIVE' : (sub?.status || 'NONE')}
        </span>
      </div>

      {/* Current plan */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-extrabold text-[#0f172a] m-0">{currentPlan.name}</h4>
            <PlanBadge supplier={profile as any} />
          </div>
          <p className="text-sm text-[#64748b] m-0 mt-0.5">{currentPlan.description}</p>
          {isActive && sub?.expiryDate && (
            <p className="text-xs text-[#94a3b8] m-0 mt-1">Renews / expires on {new Date(sub.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-[#0f172a]">{formatINR(currentPlan.price)}</div>
          <div className="text-xs text-[#64748b]">/year + GST</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {currentPlan.features.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] px-2.5 py-1 rounded-full font-semibold">
            <Check size={12} className="text-emerald-600" /> {f}
          </span>
        ))}
      </div>

      {/* Verification pending banner */}
      {verificationPending && pu?.targetTier && (
        <div className="flex items-start gap-3 p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] text-[#1e40af]">
          <Clock size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm m-0">Upgrade to {getPlan(pu.targetTier).name} — Verification Pending</p>
            <p className="text-sm m-0 mt-0.5 text-[#334155]">
              Payment received. An AMJSTAR expert will complete your physical verification, then activate the new plan.
              You keep all your <strong>{currentPlan.name}</strong> benefits until then.
            </p>
          </div>
        </div>
      )}

      {/* Upgrade CTA — opens the dedicated upgrade page */}
      {!verificationPending && isActive && upgradeOptions.length > 0 && (
        <Button onClick={() => setSearchParams({ tab: 'upgrade-plan' })} className="flex items-center gap-2">
          <ArrowUpCircle size={18} /> Upgrade Plan
        </Button>
      )}
      {!verificationPending && isActive && upgradeOptions.length === 0 && (
        <p className="text-sm text-[#64748b] m-0 flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-600" /> You're on our top plan.</p>
      )}
      {!isActive && !verificationPending && (
        <p className="text-sm text-[#c2410c] m-0">Activate your plan from the dashboard banner to unlock its benefits and upgrades.</p>
      )}
    </div>
  );
};

export default MembershipPlan;
