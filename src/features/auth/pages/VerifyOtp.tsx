import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import authService from '../services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/features/auth/store/auth.slice';
import { ROUTES } from '@/shared/constants/routes';

const OTP_LENGTH = 6;

const VerifyOtp: React.FC = () => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const mode = searchParams.get('mode') || 'buyer';

  const otp = digits.join('');
  const filled = digits.filter(Boolean).length;

  useEffect(() => { if (!phone) navigate('/login'); }, [phone, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, '');
    if (!v) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }
    // Handle paste of full OTP
    if (v.length === OTP_LENGTH) {
      const arr = v.slice(0, OTP_LENGTH).split('');
      setDigits(arr);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = v[v.length - 1];
    setDigits(next);
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true); setError('');
    try {
      await authService.sendOtp({ phone });
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimer(60); setCanResend(false);
      inputRefs.current[0]?.focus();
    } catch { setError('Failed to resend OTP'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== OTP_LENGTH) { setError('Please enter the complete 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const response = await authService.verifyOtp({ phone, otp });
      const user = response.user;
      dispatch(setCredentials({ user }));

      if (user.role === 'buyer' && (mode === 'seller' || mode === 'reseller')) {
        const assignedRole = mode === 'seller' ? 'supplier' : 'reseller';
        const roleResponse = await authService.selectRole({ role: assignedRole });
        dispatch(setCredentials({ user: roleResponse.user }));
        navigate(assignedRole === 'supplier' ? '/supplier/onboarding' : ROUTES.RESELLER_DASHBOARD);
        return;
      }

      if (user.role === 'supplier') navigate('/supplier/onboarding');
      else if (user.role === 'reseller') navigate(ROUTES.RESELLER_DASHBOARD);
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // Auto-submit when all digits filled
  useEffect(() => {
    if (filled === OTP_LENGTH && !loading) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="flex flex-col gap-0">
      {/* Accent bar */}
      <div className="h-1 w-14 rounded-full mb-6 bg-primary" />

      {/* Badge */}
      <span className="inline-flex items-center self-start gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border mb-4 bg-orange-50 text-primary border-orange-200">
        <ShieldCheck size={11} />
        OTP Verification
      </span>

      {/* Back */}
      <button
        className="flex items-center gap-1.5 text-slate-400 text-[13px] font-semibold bg-transparent border-none cursor-pointer mb-5 transition-all hover:text-primary hover:-translate-x-0.5 self-start p-0"
        onClick={() => navigate('/login')}
      >
        <ArrowLeft size={16} />
        Change Number
      </button>

      {/* Heading */}
      <h1 className="text-[1.65rem] sm:text-[1.85rem] font-extrabold mb-2 text-slate-900 tracking-tight leading-tight m-0">
        Verify OTP
      </h1>
      <p className="text-[0.9rem] text-slate-500 mb-7 leading-relaxed m-0">
        Enter the 6-digit code sent to{' '}
        <span className="font-bold text-slate-700 whitespace-nowrap">+91 {phone}</span>
      </p>

      {/* OTP Box Inputs */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
            One-Time Password
          </label>
          <div className="flex gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                value={d}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onFocus={e => e.target.select()}
                disabled={loading}
                className={[
                  'flex-1 min-w-0 text-center text-[1.35rem] font-extrabold h-14 sm:h-16 rounded-[10px] border-[2px] outline-none transition-all',
                  'text-slate-900 bg-slate-50 placeholder:text-slate-300',
                  d
                    ? 'border-primary bg-orange-50/40 text-primary shadow-[0_0_0_3px_rgba(230,92,0,0.08)]'
                    : 'border-slate-200 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(230,92,0,0.08)]',
                  loading ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full bg-slate-100 mt-1 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(filled / OTP_LENGTH) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-[13px] font-semibold bg-red-50 text-red-600 px-4 py-3 rounded-[10px] border border-red-200">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="bg-gradient-to-br from-primary to-primary-dark text-white py-4 border-none rounded-[10px] text-[15px] font-bold cursor-pointer shadow-[0_8px_16px_-4px_rgba(230,92,0,0.25)] transition-all flex items-center justify-center gap-2 hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_12px_24px_-6px_rgba(230,92,0,0.35)] active:enabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          disabled={loading || filled < OTP_LENGTH}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              Verify &amp; Continue
            </>
          )}
        </button>

        {/* Resend */}
        <div className="flex items-center justify-center gap-3 -mt-2">
          {timer > 0 ? (
            <p className="text-[13px] text-slate-400 m-0">
              Resend OTP in{' '}
              <span className="font-bold text-primary tabular-nums">{timer}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="flex items-center gap-1.5 bg-transparent border-none text-slate-500 text-[13px] font-bold cursor-pointer px-4 py-2 rounded-[8px] hover:text-primary hover:bg-orange-50 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} />
              Resend OTP
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VerifyOtp;
