import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Check, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSupplierProfile, SubscriptionStatus } from '../store/supplier.slice';
import supplierService from '../services/supplier.service';
import { getPlan, getPlanGstAmount, getPlanTotal, formatINR } from '../constants/plans';
import Button from '@/shared/components/ui/Button';

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Post-approval "Activate your plan" banner. Only rendered when the supplier is
 * verified by admin but has not yet paid for (activated) their selected plan.
 */
const SubscriptionActivation: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector(state => state.supplier);
  const [paying, setPaying] = useState(false);

  if (!profile) return null;

  const isActive =
    profile.subscription?.status === SubscriptionStatus.ACTIVE &&
    (!profile.subscription?.expiryDate || new Date(profile.subscription.expiryDate) > new Date());

  // Show only once the account is verified and the plan is not yet active.
  if (!profile.verifiedByAdmin || isActive) return null;

  const plan = getPlan(profile.tier);
  const gst = getPlanGstAmount(plan);
  const total = getPlanTotal(plan);

  const handleActivate = async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Payment gateway failed to load. Check your connection.');

      const order = await supplierService.createSubscriptionOrder();

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'AMJSTAR',
          description: `${plan.name} — Annual Plan`,
          order_id: order.razorpayOrderId,
          handler: async (response: any) => {
            try {
              const res = await supplierService.verifySubscription({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              if (res.supplier) dispatch(setSupplierProfile(res.supplier));
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

      toast.success(`${plan.name} activated!`);
    } catch (err: any) {
      if (err.message !== 'Payment cancelled') {
        toast.error(err?.response?.data?.message || err.message || 'Activation failed');
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mb-6 rounded-[14px] border border-[#fed7aa] bg-gradient-to-br from-[#fff7ed] to-white p-5 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Activate your plan</span>
          </div>
          <h3 className="text-lg font-extrabold text-[#0f172a] m-0 flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-600" /> {plan.name}
          </h3>
          <p className="text-sm text-[#64748b] mt-1 mb-3">
            Your account is verified. Pay the annual fee to unlock your plan benefits and the badge.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {plan.features.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-[#e2e8f0] text-[#475569] px-2.5 py-1 rounded-full font-semibold">
                <Check size={12} className="text-emerald-600" /> {f}
              </span>
            ))}
          </div>
        </div>

        <div className="md:w-64 shrink-0 bg-white border border-[#e2e8f0] rounded-[12px] p-4">
          <div className="flex justify-between text-sm text-[#475569]">
            <span>Plan (annual)</span>
            <span className="font-semibold">{formatINR(plan.price)}</span>
          </div>
          <div className="flex justify-between text-sm text-[#475569] mt-1">
            <span>GST ({plan.gstPercent}%)</span>
            <span className="font-semibold">{formatINR(gst)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-[#0f172a] mt-2 pt-2 border-t border-[#f1f5f9]">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          <Button onClick={handleActivate} disabled={paying} className="w-full mt-3">
            {paying ? 'Processing…' : `Pay ${formatINR(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionActivation;
