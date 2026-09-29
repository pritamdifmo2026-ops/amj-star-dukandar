import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Gift, CheckCircle2 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';
import { useRegister } from '../hooks/useRegister';
import { authApi } from '../services/auth.api';
import api from '@/api/client';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector(s => s.auth);
  const [searchParams] = useSearchParams();

  if (isAuthenticated && user) {
    const roleRedirect: Record<string, string> = {
      supplier: '/supplier/dashboard',
      reseller: '/reseller/dashboard',
      admin: '/admin/dashboard',
      superadmin: '/admin/dashboard',
      buyer: '/',
    };
    const redirectParam = searchParams.get('redirect');
    let targetUrl = roleRedirect[user.role] ?? '/';
    if (redirectParam) {
      targetUrl = redirectParam;
    } else if (user.role === 'buyer' && (user.referredSupplierStoreUrl || user.referredBySupplier)) {
      targetUrl = user.referredSupplierStoreUrl || `/store/${user.referredBySupplier}`;
    }
    return <Navigate to={targetUrl} replace />;
  }
  const modeParam = searchParams.get('mode') ?? 'buyer';
  // Map URL mode → internal role: 'seller' → 'supplier'
  const initialRole = (modeParam === 'seller' ? 'supplier' : modeParam === 'reseller' ? 'reseller' : 'buyer') as 'buyer' | 'reseller' | 'supplier';

  // Read referral code from URL if present (?ref=... or ?referral=...)
  const refFromUrl = (searchParams.get('ref') || searchParams.get('referral') || searchParams.get('referralCode') || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

  const [referralCode, setReferralCode] = useState(refFromUrl);
  const [isAutoFilled, setIsAutoFilled] = useState(Boolean(refFromUrl));
  const [showManualReferralInput, setShowManualReferralInput] = useState(Boolean(refFromUrl));
  const [referralStatus, setReferralStatus] = useState<{
    loading: boolean;
    valid?: boolean;
    supplierName?: string;
    message?: string;
  }>({ loading: false });

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: initialRole,
    emailOtp: '',
    phoneOtp: ''
  });

  const navigate = useNavigate();
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);

  // Validate referral code in real-time when it reaches 6 alphanumeric characters
  useEffect(() => {
    if (referralCode && referralCode.length === 6) {
      let cancelled = false;
      setReferralStatus({ loading: true });
      api.get(`/supplier/referral/${referralCode}`)
        .then((res) => {
          if (!cancelled) {
            if (res.data?.valid) {
              setReferralStatus({
                loading: false,
                valid: true,
                supplierName: res.data.supplier?.businessName,
                message: `Connected to ${res.data.supplier?.businessName}`,
              });
            } else {
              setReferralStatus({
                loading: false,
                valid: false,
                message: 'Invalid referral code',
              });
            }
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setReferralStatus({
              loading: false,
              valid: false,
              message: err.response?.data?.message || 'Referral code not found',
            });
          }
        });
      return () => { cancelled = true; };
    } else {
      setReferralStatus({ loading: false });
    }
  }, [referralCode]);



  const [errors, setErrors] = useState<Record<string, string>>({});
  const { mutate: register, isPending } = useRegister();

  const verifyOtpInline = async (type: 'email' | 'phone', otpVal: string) => {
    const identifier = type === 'email' ? form.email : form.phone;
    try {
      if (type === 'email') setVerifyingEmailOtp(true);
      else setVerifyingPhoneOtp(true);

      await authApi.verifyRegisterOtp(type, identifier, otpVal);
      toast.success(`${type === 'email' ? 'Email' : 'Phone'} verified!`);

      if (type === 'email') {
        setEmailOtpVerified(true);
        setErrors(prev => { const u = { ...prev }; delete u.emailOtp; return u; });
      } else {
        setPhoneOtpVerified(true);
        setErrors(prev => { const u = { ...prev }; delete u.phoneOtp; return u; });
      }
    } catch (error: any) {
      if (type === 'email') setErrors(prev => ({ ...prev, emailOtp: 'Invalid or expired OTP' }));
      else setErrors(prev => ({ ...prev, phoneOtp: 'Invalid or expired OTP' }));
    } finally {
      if (type === 'email') setVerifyingEmailOtp(false);
      else setVerifyingPhoneOtp(false);
    }
  };

  const handleSendOtp = async (type: 'email' | 'phone') => {
    const identifier = type === 'email' ? form.email : form.phone;

    if (type === 'email' && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email to send OTP' }));
      return;
    }

    if (type === 'phone' && !/^\d{10}$/.test(form.phone)) {
      setErrors(prev => ({ ...prev, phone: 'Please enter a valid 10-digit phone to send OTP' }));
      return;
    }

    try {
      if (type === 'email') setSendingEmailOtp(true);
      else setSendingPhoneOtp(true);

      await authApi.sendRegisterOtp(type, identifier);
      toast.success(`OTP sent to your ${type}!`);

      if (type === 'email') setEmailOtpSent(true);
      else setPhoneOtpSent(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      if (type === 'email') setSendingEmailOtp(false);
      else setSendingPhoneOtp(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)) newErrors.email = 'Please enter a valid email address';
    if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'Valid 10-digit phone number is required';
    if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!emailOtpVerified) newErrors.emailOtp = 'Please verify your email OTP';
    if (!phoneOtpVerified) newErrors.phoneOtp = 'Please verify your phone OTP';
    if (referralCode && !/^[A-Z0-9]{6}$/.test(referralCode)) {
      newErrors.referralCode = 'Referral code must be exactly 6 alphanumeric characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (field === 'email') {
      val = val.toLowerCase().replace(/[^a-z0-9@.-]/g, '');
      val = val.replace(/[@.]{2,}/g, match => match[0]);
      if (val.startsWith('.') || val.startsWith('@')) val = val.slice(1);
    }
    if (field === 'emailOtp' || field === 'phoneOtp') {
      val = val.replace(/\D/g, '').slice(0, 6);
    }
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => { const u = { ...prev }; delete u[field]; return u; });

    if (field === 'emailOtp' && val.length === 6 && !emailOtpVerified) {
      verifyOtpInline('email', val);
    }
    if (field === 'phoneOtp' && val.length === 6 && !phoneOtpVerified) {
      verifyOtpInline('phone', val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      register({
        ...form,
        ...(referralCode ? { referralCode: referralCode.trim().toUpperCase() } : {}),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 w-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center">
        <h2 className="text-[22px] font-bold text-heading m-0 leading-tight">Create Account</h2>
        <p className="text-[13px] text-muted mt-0.5 m-0">Join AMJSTAR as a buyer, reseller or supplier</p>
      </div>

      <div className="flex flex-col gap-2">
        <Input label="Full Name" type="text" name="name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={set('name')} leftIcon={<User size={15} />} fullWidth required error={errors.name} />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Email Address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            leftIcon={<Mail size={15} />}
            fullWidth
            required
            error={errors.email}
            disabled={emailOtpSent}
            rightIcon={
              !emailOtpSent ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp('email')}
                  disabled={sendingEmailOtp}
                  className="text-primary font-semibold text-xs whitespace-nowrap bg-transparent border-none cursor-pointer pr-1 hover:underline disabled:opacity-50"
                >
                  {sendingEmailOtp ? 'Sending...' : 'Send OTP'}
                </button>
              ) : null
            }
          />
          {emailOtpSent && (
            <div className="relative">
              <Input placeholder="Enter 6-digit Email OTP" value={form.emailOtp} onChange={set('emailOtp')} fullWidth required error={errors.emailOtp} maxLength={6} disabled={emailOtpVerified || verifyingEmailOtp} />
              {verifyingEmailOtp && <span className="absolute right-3 top-[9px] w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
              {emailOtpVerified && <span className="absolute right-3 top-[9px] text-green-600 font-bold text-sm">✅ Verified</span>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            label="Phone Number"
            type="tel"
            name="tel"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={set('phone')}
            leftIcon={<Phone size={15} />}
            fullWidth
            required
            error={errors.phone}
            maxLength={10}
            disabled={phoneOtpSent}
            rightIcon={
              !phoneOtpSent ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp('phone')}
                  disabled={sendingPhoneOtp}
                  className="text-primary font-semibold text-xs whitespace-nowrap bg-transparent border-none cursor-pointer pr-1 hover:underline disabled:opacity-50"
                >
                  {sendingPhoneOtp ? 'Sending...' : 'Send OTP'}
                </button>
              ) : null
            }
          />
          {phoneOtpSent && (
            <div className="relative">
              <Input placeholder="Enter 6-digit Phone OTP" value={form.phoneOtp} onChange={set('phoneOtp')} fullWidth required error={errors.phoneOtp} maxLength={6} disabled={phoneOtpVerified || verifyingPhoneOtp} />
              {verifyingPhoneOtp && <span className="absolute right-3 top-[9px] w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
              {phoneOtpVerified && <span className="absolute right-3 top-[9px] text-green-600 font-bold text-sm">✅ Verified</span>}
            </div>
          )}
        </div>

        <Input label="Password" type="password" name="new-password" autoComplete="new-password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} leftIcon={<Lock size={15} />} fullWidth required error={errors.password} />

        <div className="flex flex-col gap-1">
          <label className="text-[12.5px] font-medium text-body">I am a</label>
          <div className="flex gap-2">
            {(['buyer', 'reseller', 'supplier'] as const).map(r => (
              <label
                key={r}
                className={[
                  'flex-1 py-1 px-2 border text-center text-[12.5px] cursor-pointer rounded-[4px] transition-[border-color,color] duration-150',
                  form.role === r
                    ? 'border-primary text-primary font-semibold bg-primary/5'
                    : 'border-border text-body hover:border-primary',
                ].join(' ')}
              >
                <input type="radio" name="role" value={r} checked={form.role === r} onChange={set('role')} hidden />
                {r === 'buyer' ? 'Buyer' : r === 'reseller' ? 'Reseller' : 'Supplier'}
              </label>
            ))}
          </div>
        </div>

        {/* ── Supplier Referral Code Section (especially for Buyers) ── */}
        {form.role === 'buyer' && (
          <div className="pt-0.5">
            {isAutoFilled && referralCode ? (
              <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-[8px] flex items-center justify-between gap-2.5 shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Gift size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11.5px] font-bold text-emerald-900">Referral Code Auto-Applied</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-200 font-mono font-extrabold text-[11px] text-emerald-950 tracking-wider">
                        {referralCode}
                      </span>
                    </div>
                    {referralStatus.loading ? (
                      <span className="text-[10.5px] text-emerald-700 block mt-0.5">Verifying supplier...</span>
                    ) : referralStatus.valid && referralStatus.supplierName ? (
                      <span className="text-[10.5px] text-emerald-800 font-semibold block truncate mt-0.5">
                        Connected to supplier: <strong>{referralStatus.supplierName}</strong>
                      </span>
                    ) : (
                      <span className="text-[10.5px] text-emerald-700 block mt-0.5">Linked from supplier invite</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReferralCode('');
                    setIsAutoFilled(false);
                    setShowManualReferralInput(true);
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline bg-transparent border-none cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>
            ) : showManualReferralInput ? (
              <div className="flex flex-col gap-1 p-2.5 bg-slate-50 border border-slate-200 rounded-[8px]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Gift size={12} className="text-primary" /> Supplier Referral Code (Optional)
                  </label>
                  {!refFromUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setReferralCode('');
                        setShowManualReferralInput(false);
                      }}
                      className="text-[10.5px] text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0"
                    >
                      Hide
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    placeholder="Enter 6-character code (e.g. K8F2M9)"
                    value={referralCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                      setReferralCode(val);
                      if (errors.referralCode) {
                        setErrors(prev => { const copy = { ...prev }; delete copy.referralCode; return copy; });
                      }
                    }}
                    maxLength={6}
                    error={errors.referralCode}
                    fullWidth
                  />
                  {referralStatus.loading && (
                    <span className="absolute right-3 top-[9px] w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {!referralStatus.loading && referralStatus.valid && (
                    <span className="absolute right-3 top-[9px] text-emerald-600 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 size={14} /> Verified
                    </span>
                  )}
                </div>
                {referralStatus.valid && referralStatus.supplierName && (
                  <p className="text-[10.5px] text-emerald-700 font-semibold m-0">
                    ✓ Connected to store: <strong>{referralStatus.supplierName}</strong>
                  </p>
                )}
                {!referralStatus.loading && referralCode.length === 6 && referralStatus.valid === false && (
                  <p className="text-[10.5px] text-rose-600 font-medium m-0">
                    ✕ {referralStatus.message || 'Referral code not found'}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowManualReferralInput(true)}
                className="text-left text-xs font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer p-0 flex items-center gap-1.5"
              >
                <Gift size={12} /> Have a Supplier Referral Code? Click here to enter
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-0.5">
        <Button type="submit" fullWidth loading={isPending} disabled={!emailOtpSent || !phoneOtpSent}>
          Create Account
        </Button>
      </div>

      <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-center">
        <p className="text-[12.5px] text-slate-500 m-0">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate(`${ROUTES.LOGIN}?mode=${form.role === 'supplier' ? 'seller' : form.role}`)}
            className="text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
};

export default Register;
