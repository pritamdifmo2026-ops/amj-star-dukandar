import React, { useState } from 'react';
import { Phone, Mail, Store, Zap, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/features/auth/store/auth.slice';
import Button from '@/shared/components/ui/Button';
import toast from 'react-hot-toast';
import authService from '@/features/auth/services/auth.service';
import resellerService from '@/features/reseller/services/reseller.service';

const sectionCls = "bg-white rounded-[10px] border border-[#eef2f6] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]";
const inputCls = "flex-1 border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-sm text-[#1e293b] bg-[#f8fafc] outline-none focus:border-primary";

const ResellerSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { profile } = useAppSelector(state => state.reseller);

  const [storeName, setStoreName] = useState(profile?.storeName || 'My Store');
  const [email, setEmail] = useState(user?.email || profile?.email || '');
  const [phone, setPhone] = useState(user?.phone || profile?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [updatingField, setUpdatingField] = useState<'phone' | 'email' | null>(null);

  React.useEffect(() => {
    if (profile?.storeName) setStoreName(profile.storeName);
    if (profile?.email || user?.email) setEmail(user?.email || profile?.email || '');
    if (profile?.phone || user?.phone) setPhone(user?.phone || profile?.phone || '');
  }, [profile, user]);

  const plans = [
    { name: 'Starter', price: 'Free', adds: '200 product adds', id: 'STARTER' },
    { name: 'Basic', price: '₹999', adds: '999 product adds', id: 'BASIC' },
    { name: 'Standard', price: '₹1,000', adds: '1,000 product adds', id: 'STANDARD' },
    { name: 'Premium', price: '₹5,000', adds: '5,000 product adds + SIC benefits', id: 'PREMIUM' }
  ];

  const currentPlanId = profile?.subscriptionPlan?.toUpperCase() || 'STARTER';
  const currentPlan = plans.find(p => p.id === currentPlanId) || plans[0];
  const nextPlan = plans[plans.indexOf(currentPlan) + 1] || null;

  const handleUpdateStoreName = async () => {
    try {
      setIsUpdating(true);
      await resellerService.updateProfile({ storeName });
      toast.success('Store name updated!');
    } catch (err) {
      toast.error('Failed to update store name');
    } finally {
      setIsUpdating(false);
    }
  };

  const startPhoneUpdate = async () => {
    if (phone === user?.phone) { toast.error('Please enter a different phone number'); return; }
    try {
      await authService.sendOtp({ phone });
      setUpdatingField('phone');
      setShowOtpField(true);
      toast.success('OTP sent to your new phone number');
    } catch (err) { toast.error('Failed to send OTP'); }
  };

  const startEmailUpdate = async () => {
    if (email !== (user?.email || profile?.email)) {
      try {
        await resellerService.updateProfile({ email });
        toast.success('Email updated, sending verification link...');
      } catch (err) { toast.error('Failed to update email'); return; }
    }
    try {
      await authService.sendVerificationEmail();
      toast.success(`Verification link sent to ${email}`);
    } catch (err) { toast.error('Failed to send verification link'); }
  };

  const verifyOtp = async () => {
    if (otp.length === 6) {
      try {
        const response = await authService.verifyPhoneUpdate({ phone, otp });
        dispatch(setCredentials({ user: response.user }));
        await resellerService.updateProfile({ phone });
        toast.success('Phone number verified and updated!');
        setShowOtpField(false);
        setUpdatingField(null);
        setOtp('');
      } catch (err) { toast.error('Invalid OTP. Please try again.'); }
    } else {
      toast.error('Please enter a 6-digit OTP');
    }
  };

  return (
    <div className="max-w-[860px]">
      <header className="mb-8">
        <h2 className="text-[1.75rem] text-[#0f172a] font-extrabold m-0 mb-1">Account Settings</h2>
        <p className="text-[#64748b] m-0 text-[0.95rem]">Manage your reseller profile, contact information, and subscription plan.</p>
      </header>

      <div className="flex flex-col gap-5">
        {/* Storefront */}
        <section className={sectionCls}>
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[#f1f5f9]">
            <Store size={20} className="text-primary" />
            <h3 className="text-base font-bold text-[#1e293b] m-0">Storefront Information</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider">Store Name</label>
            <div className="flex gap-3 items-center">
              <input className={inputCls} type="text" value={storeName} onChange={e => setStoreName(e.target.value)} />
              <Button onClick={handleUpdateStoreName} loading={isUpdating}>Update</Button>
            </div>
          </div>
        </section>

        {/* Contact & Security */}
        <section className={sectionCls}>
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[#f1f5f9]">
            <ShieldCheck size={20} className="text-primary" />
            <h3 className="text-base font-bold text-[#1e293b] m-0">Contact &amp; Security</h3>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider">Phone Number</label>
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 bg-[#f8fafc] flex-1 focus-within:border-primary">
                  <Phone size={16} className="text-[#94a3b8] shrink-0" />
                  <input className="border-none outline-none bg-transparent text-sm text-[#1e293b] flex-1" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <Button variant="outline" onClick={startPhoneUpdate}>Change Phone</Button>
              </div>
              {user?.isPhoneVerified && phone === user?.phone && (
                <span className="inline-flex items-center gap-1 text-xs text-[#059669] font-semibold"><CheckCircle size={12} /> Verified</span>
              )}
              {showOtpField && updatingField === 'phone' && (
                <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-[8px] p-4 mt-2 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#92400e]">
                    <AlertTriangle size={16} className="text-[#f59e0b]" />
                    Enter Verification Code
                  </div>
                  <div className="flex gap-2">
                    <input className={inputCls} type="text" maxLength={6} placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} />
                    <Button onClick={verifyOtp}>Verify &amp; Save</Button>
                    <Button variant="ghost" onClick={() => { setShowOtpField(false); setPhone(user?.phone || ''); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider">Email Address</label>
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 bg-[#f8fafc] flex-1 focus-within:border-primary">
                  <Mail size={16} className="text-[#94a3b8] shrink-0" />
                  <input className="border-none outline-none bg-transparent text-sm text-[#1e293b] flex-1" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <Button variant="outline" onClick={startEmailUpdate}>Verify Mail</Button>
              </div>
              {(user?.isEmailVerified || profile?.isEmailVerified) && email === (user?.email || profile?.email) && (
                <span className="inline-flex items-center gap-1 text-xs text-[#059669] font-semibold"><CheckCircle size={12} /> Verified</span>
              )}
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className={sectionCls}>
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[#f1f5f9]">
            <Zap size={20} className="text-primary" />
            <h3 className="text-base font-bold text-[#1e293b] m-0">Subscription Plan</h3>
          </div>

          <div className="flex items-center justify-between bg-[#fff7ed] border border-[#fed7aa] rounded-[10px] p-5 mb-5 max-sm:flex-col max-sm:gap-4">
            <div>
              <h4 className="text-base font-bold text-[#0f172a] m-0 mb-1">Current Plan: <span className="text-primary">{currentPlan.name}</span></h4>
              <p className="text-sm text-[#64748b] m-0">You are on the {currentPlan.name} plan ({currentPlan.adds}).</p>
            </div>
            {nextPlan && (
              <Button className="flex items-center gap-2">
                Upgrade to {nextPlan.name} <Zap size={16} />
              </Button>
            )}
          </div>

          <p className="text-xs font-bold uppercase text-[#94a3b8] tracking-wider mb-3">Available Plans:</p>
          <div className="grid grid-cols-4 gap-3 max-sm:grid-cols-2">
            {plans.map(p => (
              <div key={p.id} className={`flex flex-col gap-1 p-4 rounded-[10px] border-2 text-center ${p.id === currentPlanId ? 'border-primary bg-[#fff7ed]' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
                <strong className="text-sm text-[#0f172a]">{p.name}</strong>
                <span className="text-base font-extrabold text-primary">{p.price}</span>
                <small className="text-xs text-[#64748b]">{p.adds}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResellerSettings;
