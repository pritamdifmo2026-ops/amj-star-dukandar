import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Gift, CheckCircle2 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';
import { useRegister } from '../hooks/useRegister';
import { authApi } from '../services/auth.api';
import type { RegisterPayload } from '../types';
import api from '@/api/client';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector(s => s.auth);
  const [searchParams] = useSearchParams();

  if (isAuthenticated && user) {
    const roleRedirect: Record<string, string> = {
      supplier: '/supplier/dashboard',
      seller: '/supplier/dashboard',
      reseller: '/reseller/dashboard',
      partner: '/partner/dashboard',
      admin: '/admin/dashboard',
      superadmin: '/admin/dashboard',
      subadmin: '/admin/dashboard',
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
  // Map URL mode → internal role: 'seller' → 'supplier', 'partner' → 'partner'
  const initialRole = (modeParam === 'seller' ? 'supplier' : modeParam === 'reseller' ? 'reseller' : modeParam === 'partner' ? 'partner' : 'buyer') as 'buyer' | 'reseller' | 'supplier' | 'partner';

  // Read referral code from URL if present (?ref=..., ?referral=..., ?partner=..., etc.)
  const refFromUrl = (
    searchParams.get('ref') ||
    searchParams.get('referral') ||
    searchParams.get('referralCode') ||
    searchParams.get('partner') ||
    searchParams.get('partnerCode') ||
    ''
  )
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, '')
    .slice(0, 25);

  const [referralCode, setReferralCode] = useState(refFromUrl);
  const [referralStatus, setReferralStatus] = useState<{
    loading: boolean;
    valid?: boolean;
    type?: 'supplier' | 'partner';
    name?: string;
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

  // Only collected on a partner application — context for the approving admin.
  const [partnerApplication, setPartnerApplication] = useState({
    city: '',
    state: '',
    applicationNote: '',
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

  // Validate referral code in real-time (automatically resolves whether it is a Supplier or Partner)
  useEffect(() => {
    const clean = referralCode.trim().toUpperCase();
    if (clean.length >= 3) {
      let cancelled = false;
      setReferralStatus({ loading: true });
      const timer = setTimeout(() => {
        api.get(`/supplier/referral/${encodeURIComponent(clean)}`)
          .then((res) => {
            if (!cancelled) {
              if (res.data?.valid) {
                const isPartner = res.data.type === 'partner';
                const displayName = isPartner
                  ? (res.data.partner?.fullName || res.data.partner?.businessName || res.data.partner?.partnerCode)
                  : res.data.supplier?.businessName;

                setReferralStatus({
                  loading: false,
                  valid: true,
                  type: isPartner ? 'partner' : 'supplier',
                  name: displayName,
                  message: isPartner
                    ? `Referred by Wholesale Partner: ${displayName}`
                    : `Connected to Supplier: ${displayName}`,
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
      }, 300);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
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
    const identifier = (type === 'email' ? form.email : form.phone).trim();

    if (type === 'email' && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(identifier)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email to send OTP' }));
      return;
    }

    if (type === 'phone' && !/^\d{10}$/.test(identifier)) {
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

    const isBuyer = form.role === 'buyer';
    const hasEmail = Boolean(form.email.trim());
    const hasPhone = Boolean(form.phone.trim());

    if (isBuyer) {
      if (!hasEmail && !hasPhone) {
        newErrors.email = 'Please provide either an email or mobile number';
        newErrors.phone = 'Please provide either an email or mobile number';
      }
      if (hasEmail) {
        if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email.trim())) {
          newErrors.email = 'Please enter a valid email address';
        } else if (!emailOtpVerified) {
          newErrors.emailOtp = 'Please verify your email OTP';
        }
      }
      if (hasPhone) {
        if (!/^\d{10}$/.test(form.phone.trim())) {
          newErrors.phone = 'Valid 10-digit phone number is required';
        } else if (!phoneOtpVerified) {
          newErrors.phoneOtp = 'Please verify your phone OTP';
        }
      }
    } else {
      // Supplier & Reseller: BOTH are strictly required
      if (!hasEmail || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      } else if (!emailOtpVerified) {
        newErrors.emailOtp = 'Please verify your email OTP';
      }
      if (!hasPhone || !/^\d{10}$/.test(form.phone.trim())) {
        newErrors.phone = 'Valid 10-digit phone number is required';
      } else if (!phoneOtpVerified) {
        newErrors.phoneOtp = 'Please verify your phone OTP';
      }
    }

    if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (referralCode.trim()) {
      if (!/^[A-Z0-9-_]{3,25}$/.test(referralCode.trim())) {
        newErrors.referralCode = 'Referral code must be 3-25 alphanumeric characters';
      } else if (referralStatus.valid === false && !referralStatus.loading) {
        newErrors.referralCode = referralStatus.message || 'Invalid referral code';
      }
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

    if (field === 'role') {
      setErrors(prev => {
        const u = { ...prev };
        delete u.email;
        delete u.phone;
        delete u.emailOtp;
        delete u.phoneOtp;
        return u;
      });
    }

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
      const emailVal = form.email.trim();
      const phoneVal = form.phone.trim();
      const payload: RegisterPayload = {
        name: form.name.trim(),
        password: form.password,
        role: form.role,
        ...(emailVal ? { email: emailVal, emailOtp: form.emailOtp } : {}),
        ...(phoneVal ? { phone: phoneVal, phoneOtp: form.phoneOtp } : {}),
        // Referral code is auto-resolved internally to either Supplier or Partner
        ...(referralCode.trim()
          ? referralStatus.type === 'partner'
            ? { partnerCode: referralCode.trim().toUpperCase(), referralCode: referralCode.trim().toUpperCase() }
            : { referralCode: referralCode.trim().toUpperCase() }
          : {}),
        ...(form.role === 'partner'
          ? {
              ...(partnerApplication.city.trim() ? { city: partnerApplication.city.trim() } : {}),
              ...(partnerApplication.state.trim() ? { state: partnerApplication.state.trim() } : {}),
              ...(partnerApplication.applicationNote.trim()
                ? { applicationNote: partnerApplication.applicationNote.trim() }
                : {}),
            }
          : {}),
      };
      register(payload);
    }
  };

  const isBuyer = form.role === 'buyer';
  const hasEmail = Boolean(form.email.trim());
  const hasPhone = Boolean(form.phone.trim());

  const isSubmitDisabled = isBuyer
    ? (!hasEmail && !hasPhone) || (hasEmail && !emailOtpSent) || (hasPhone && !phoneOtpSent)
    : (!emailOtpSent || !phoneOtpSent);

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
            label={form.role === 'buyer' ? "Email Address (Optional if phone provided)" : "Email Address"}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            leftIcon={<Mail size={15} />}
            fullWidth
            required={form.role !== 'buyer'}
            error={errors.email}
            disabled={emailOtpSent}
            rightIcon={
              !emailOtpSent ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp('email')}
                  disabled={sendingEmailOtp || !form.email.trim()}
                  className="text-primary font-semibold text-xs whitespace-nowrap bg-transparent border-none cursor-pointer pr-1 hover:underline disabled:opacity-50"
                >
                  {sendingEmailOtp ? 'Sending...' : 'Send OTP'}
                </button>
              ) : null
            }
          />
          {emailOtpSent && (
            <div className="relative">
              <Input
                placeholder="Enter 6-digit Email OTP"
                value={form.emailOtp}
                onChange={set('emailOtp')}
                fullWidth
                required={Boolean(form.email.trim())}
                error={errors.emailOtp}
                maxLength={6}
                disabled={emailOtpVerified || verifyingEmailOtp}
              />
              {verifyingEmailOtp && <span className="absolute right-3 top-[9px] w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
              {emailOtpVerified && <span className="absolute right-3 top-[9px] text-green-600 font-bold text-sm">Verified</span>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            label={form.role === 'buyer' ? "Phone Number (Optional if email provided)" : "Phone Number"}
            type="tel"
            name="tel"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={set('phone')}
            leftIcon={<Phone size={15} />}
            fullWidth
            required={form.role !== 'buyer'}
            error={errors.phone}
            maxLength={10}
            disabled={phoneOtpSent}
            rightIcon={
              !phoneOtpSent ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp('phone')}
                  disabled={sendingPhoneOtp || !form.phone.trim()}
                  className="text-primary font-semibold text-xs whitespace-nowrap bg-transparent border-none cursor-pointer pr-1 hover:underline disabled:opacity-50"
                >
                  {sendingPhoneOtp ? 'Sending...' : 'Send OTP'}
                </button>
              ) : null
            }
          />
          {phoneOtpSent && (
            <div className="relative">
              <Input
                placeholder="Enter 6-digit Phone OTP"
                value={form.phoneOtp}
                onChange={set('phoneOtp')}
                fullWidth
                required={Boolean(form.phone.trim())}
                error={errors.phoneOtp}
                maxLength={6}
                disabled={phoneOtpVerified || verifyingPhoneOtp}
              />
              {verifyingPhoneOtp && <span className="absolute right-3 top-[9px] w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
              {phoneOtpVerified && <span className="absolute right-3 top-[9px] text-green-600 font-bold text-sm">Verified</span>}
            </div>
          )}
        </div>

        <Input label="Password" type="password" name="new-password" autoComplete="new-password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} leftIcon={<Lock size={15} />} fullWidth required error={errors.password} />

        <div className="flex flex-col gap-1">
          <label className="text-[12.5px] font-medium text-body">I am a</label>
          <div className="flex gap-2">
            {(['buyer', 'supplier', 'reseller', 'partner'] as const).map(r => (
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
                {r === 'buyer' ? 'Buyer' : r === 'supplier' ? 'Supplier' : r === 'reseller' ? 'Reseller' : 'Partner'}
              </label>
            ))}
          </div>
        </div>

        {form.role === 'partner' && (
          <div className="flex flex-col gap-2.5">
            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-[8px]">
              <span className="text-[12px] font-bold text-indigo-900 block mb-1">
                Applying as a Wholesale Service Partner
              </span>
              <p className="text-[11.5px] text-indigo-800 m-0 leading-relaxed">
                You will bring manufacturers and bulk buyers onto AMJ Star and earn a share of the
                platform fee on every deal they close — no salary, no targets. Your account needs AMJ
                Star's confirmation before commission starts accruing; you can sign in and set up your
                profile straight away.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[12.5px] font-medium text-body">City</label>
                <input
                  value={partnerApplication.city}
                  onChange={(e) => setPartnerApplication({ ...partnerApplication, city: e.target.value })}
                  placeholder="e.g. Surat"
                  className="w-full px-3 py-2 border border-border rounded-[4px] text-[13px] outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[12.5px] font-medium text-body">State</label>
                <input
                  value={partnerApplication.state}
                  onChange={(e) => setPartnerApplication({ ...partnerApplication, state: e.target.value })}
                  placeholder="e.g. Gujarat"
                  className="w-full px-3 py-2 border border-border rounded-[4px] text-[13px] outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12.5px] font-medium text-body">
                Tell us about your network <span className="text-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={partnerApplication.applicationNote}
                onChange={(e) =>
                  setPartnerApplication({ ...partnerApplication, applicationNote: e.target.value })
                }
                rows={3}
                maxLength={1000}
                placeholder="Which trade or region do you work in, and roughly how many manufacturers or buyers could you introduce? This is what our team reads when approving your account."
                className="w-full px-3 py-2 border border-border rounded-[4px] text-[13px] outline-none focus:border-primary resize-y"
              />
            </div>
          </div>
        )}

        {/* ── REFERRAL CODE (Auto-detected Supplier or Wholesale Partner) ── */}
        {(form.role === 'buyer' || form.role === 'supplier' || form.role === 'reseller') && (
          <div className="pt-0.5">
            <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-[8px]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Gift size={13} className="text-primary" /> Referral Code (Optional)
                </label>
                {referralStatus.valid && referralStatus.type && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      referralStatus.type === 'partner'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {referralStatus.type === 'partner' ? 'Wholesale Partner' : 'Supplier'}
                  </span>
                )}
              </div>

              <div className="relative">
                <Input
                  placeholder="Enter referral code (e.g. K8F2M9 or AMJ-P1234)"
                  value={referralCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, '').slice(0, 25);
                    setReferralCode(val);
                    if (errors.referralCode) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.referralCode;
                        return copy;
                      });
                    }
                  }}
                  error={errors.referralCode}
                  fullWidth
                />
                {referralStatus.loading && (
                  <span className="absolute right-3 top-[9px] w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                {!referralStatus.loading && referralStatus.valid && (
                  <span
                    className={`absolute right-3 top-[9px] font-bold text-xs flex items-center gap-1 ${
                      referralStatus.type === 'partner' ? 'text-indigo-600' : 'text-emerald-600'
                    }`}
                  >
                    <CheckCircle2 size={14} /> Verified
                  </span>
                )}
              </div>

              {referralStatus.valid && (
                <p
                  className={`text-[11px] font-semibold m-0 mt-0.5 flex items-center gap-1 ${
                    referralStatus.type === 'partner' ? 'text-indigo-700' : 'text-emerald-700'
                  }`}
                >
                  <CheckCircle2 size={12} />
                  {referralStatus.message || `Connected to: ${referralStatus.name}`}
                </p>
              )}

              {!referralStatus.loading && referralCode.trim().length >= 3 && referralStatus.valid === false && (
                <p className="text-[11px] text-rose-600 font-medium m-0 mt-0.5">
                  ✕ {referralStatus.message || 'Referral code not found'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-0.5">
        <Button type="submit" fullWidth loading={isPending} disabled={isSubmitDisabled}>
          Create Account
        </Button>
      </div>

      <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-center">
        <p className="text-[12.5px] text-slate-500 m-0">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate(`${ROUTES.LOGIN}?mode=${form.role === 'supplier' ? 'seller' : form.role}${searchParams.get('redirect') ? `&redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`)}
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
