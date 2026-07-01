import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Check, ChevronLeft, ShieldCheck, Crown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSupplierProfile, SubscriptionStatus, UpgradeStatus, SupplierTier } from '../store/supplier.slice';
import supplierService from '../services/supplier.service';
import { loadRazorpay } from '../utils/loadRazorpay';
import { getPlan, getUpgradeOptions, getUpgradeCost, formatINR, type PlanDefinition } from '../constants/plans';
import PlanBadge from './PlanBadge';
import Button from '@/shared/components/ui/Button';

/** Full-page "Compare & Upgrade Plans" view (dashboard tab=upgrade-plan). */
const MembershipUpgrade: React.FC = () => {
  const dispatch = useAppDispatch();
  const [, setSearchParams] = useSearchParams();
  const profile = useAppSelector(state => state.supplier.profile);
  const [payingTier, setPayingTier] = useState<SupplierTier | null>(null);

  const goBack = () => setSearchParams({ tab: 'settings' });

  if (!profile) return null;

  const currentTier = (profile.subscription?.tier || profile.tier) as SupplierTier;
  const currentPlan = getPlan(currentTier);
  const sub = profile.subscription;
  const isActive =
    sub?.status === SubscriptionStatus.ACTIVE &&
    (!sub?.expiryDate || new Date(sub.expiryDate) > new Date());
  const verificationPending = profile.pendingUpgrade?.status === UpgradeStatus.VERIFICATION_PENDING;
  const upgradeOptions = getUpgradeOptions(currentTier);

  const handleUpgrade = async (target: PlanDefinition) => {
    setPayingTier(target.id);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Payment gateway failed to load. Check your connection.');

      const order = await supplierService.createUpgradeOrder(target.id);

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'AMJSTAR',
          description: `Upgrade to ${target.name}`,
          order_id: order.razorpayOrderId,
          handler: async (response: any) => {
            try {
              const res = await supplierService.verifyUpgrade({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              if (res.supplier) dispatch(setSupplierProfile(res.supplier));
              if (order.upgrade?.requiresVerification) {
                toast.success('Payment successful! Physical verification will be scheduled — your current plan stays active until then.', { duration: 6000 });
              } else {
                toast.success(`Upgraded to ${target.name}! Your new benefits are active.`);
              }
              resolve();
            } catch (err: any) {
              reject(new Error(err?.response?.data?.message || 'Payment verification failed'));
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          theme: { color: '#e65c00' },
        });
        rzp.open();
      });

      goBack();
    } catch (err: any) {
      if (err.message !== 'Payment cancelled') {
        toast.error(err?.response?.data?.message || err.message || 'Upgrade failed');
      }
    } finally {
      setPayingTier(null);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto">
      <button onClick={goBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#475569] bg-transparent border-none cursor-pointer hover:text-[#1e293b] p-0 mb-5">
        <ChevronLeft size={18} /> Back to Settings
      </button>

      <div className="flex items-center gap-3 mb-2">
        <Crown size={22} className="text-primary" />
        <h1 className="text-[1.6rem] font-extrabold text-[#0f172a] m-0">Upgrade Your Plan</h1>
      </div>
      <p className="text-[#64748b] text-sm mb-6">
        You're on <strong>{currentPlan.name}</strong>. Upgrade anytime — you only pay the difference, and your current renewal date stays the same.
      </p>

      {/* Current plan */}
      <div className="bg-white border border-[#eef2f6] rounded-[12px] p-5 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#0f172a] m-0">Current: {currentPlan.name}</h3>
              <PlanBadge supplier={profile as any} />
            </div>
            {isActive && sub?.expiryDate && (
              <p className="text-xs text-[#94a3b8] m-0 mt-1">Renews on {new Date(sub.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold text-[#0f172a]">{formatINR(currentPlan.price)}</div>
            <div className="text-xs text-[#64748b]">/year + GST</div>
          </div>
        </div>
      </div>

      {verificationPending && profile.pendingUpgrade?.targetTier ? (
        <div className="flex items-start gap-3 p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] text-[#1e40af]">
          <ShieldCheck size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm m-0">
            Your upgrade to <strong>{getPlan(profile.pendingUpgrade.targetTier).name}</strong> is paid and awaiting physical verification.
            You keep your current benefits until it's activated.
          </p>
        </div>
      ) : !isActive ? (
        <div className="p-4 bg-[#fff7ed] border border-[#fed7aa] rounded-[10px] text-[#c2410c] text-sm">
          Activate your current plan from the dashboard first, then you can upgrade.
        </div>
      ) : upgradeOptions.length === 0 ? (
        <div className="p-4 bg-[#ecfdf5] border border-[#a7f3d0] rounded-[10px] text-[#047857] text-sm flex items-center gap-2">
          <ShieldCheck size={16} /> You're on our top plan — nothing higher to upgrade to.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {upgradeOptions.map(target => {
            const cost = getUpgradeCost(currentTier, target.id);
            const needsVerification = currentTier === SupplierTier.VERIFIED;
            return (
              <div key={target.id} className="bg-white border-2 border-[#e2e8f0] rounded-[12px] p-5 hover:border-primary transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#0f172a] m-0">{target.name}</h3>
                    <p className="text-sm text-[#64748b] m-0">{target.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold text-[#0f172a]">{formatINR(cost.total)}</div>
                    <div className="text-[10px] text-[#64748b] leading-tight">to pay now<br />(incl. GST)</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {target.features.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] px-2.5 py-1 rounded-full font-semibold">
                      <Check size={12} className="text-emerald-600" /> {f}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-[11px] text-[#64748b] m-0">
                    {formatINR(target.price)} − {formatINR(currentPlan.price)} = {formatINR(cost.priceDifference)} + {formatINR(cost.gstAmount)} GST
                    {needsVerification
                      ? <span className="block text-[#1d4ed8] mt-0.5">Requires physical verification before activation.</span>
                      : <span className="block text-emerald-700 mt-0.5">Activates immediately after payment.</span>}
                  </p>
                  <Button onClick={() => handleUpgrade(target)} disabled={payingTier !== null} className="!py-2.5">
                    {payingTier === target.id ? 'Processing…' : `Pay ${formatINR(cost.total)}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MembershipUpgrade;
