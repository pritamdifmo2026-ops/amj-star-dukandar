import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone } from 'lucide-react';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants/routes';
import { useRegister } from '../hooks/useRegister';
import { authApi } from '../services/auth.api';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'buyer' as 'buyer' | 'reseller' | 'supplier',
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
    if (validate()) register(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center">
        <h2 className="text-[26px] font-bold text-heading m-0 leading-tight">Create Account</h2>
        <p className="text-[14px] text-muted mt-1 m-0">Join AMJSTAR as a buyer, reseller or supplier</p>
      </div>

      <div className="flex flex-col gap-3">
        <Input label="Full Name" type="text" name="name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={set('name')} leftIcon={<User size={16} />} fullWidth required error={errors.name} />

        <div className="flex flex-col gap-2">
          <Input
            label="Email Address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            leftIcon={<Mail size={16} />}
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
              {verifyingEmailOtp && <span className="absolute right-3 top-[10px] w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
              {emailOtpVerified && <span className="absolute right-3 top-[10px] text-green-600 font-bold text-sm">✅ Verified</span>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Input
            label="Phone Number"
            type="tel"
            name="tel"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={set('phone')}
            leftIcon={<Phone size={16} />}
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
              {verifyingPhoneOtp && <span className="absolute right-3 top-[10px] w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
              {phoneOtpVerified && <span className="absolute right-3 top-[10px] text-green-600 font-bold text-sm">✅ Verified</span>}
            </div>
          )}
        </div>

        <Input label="Password" type="password" name="new-password" autoComplete="new-password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} leftIcon={<Lock size={16} />} fullWidth required error={errors.password} />

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-body">I am a</label>
          <div className="flex gap-2">
            {(['buyer', 'reseller', 'supplier'] as const).map(r => (
              <label
                key={r}
                className={[
                  'flex-1 py-1.5 px-2 border text-center text-[13px] cursor-pointer rounded-[4px] transition-[border-color,color] duration-150',
                  form.role === r
                    ? 'border-primary text-primary font-medium'
                    : 'border-border text-body hover:border-primary',
                ].join(' ')}
              >
                <input type="radio" name="role" value={r} checked={form.role === r} onChange={set('role')} hidden />
                {r === 'buyer' ? 'Buyer' : r === 'reseller' ? 'Reseller' : 'Supplier'}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-1">
        <Button type="submit" fullWidth loading={isPending} disabled={!emailOtpSent || !phoneOtpSent}>
          Create Account
        </Button>
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 text-center">
        <p className="text-[13px] text-slate-500 m-0">
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
