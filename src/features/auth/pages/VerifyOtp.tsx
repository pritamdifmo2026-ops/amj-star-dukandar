import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import { ROUTES } from '@/shared/constants/routes';

const VerifyOtp: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const mode = searchParams.get('mode') || 'buyer';

  useEffect(() => { if (!phone) navigate('/login'); }, [phone, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else { setCanResend(true); }
  }, [timer]);

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true); setError('');
    try { await authService.sendOtp({ phone }); setTimer(60); setCanResend(false); }
    catch { setError('Failed to resend OTP'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter a 6-digit OTP'); return; }
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

  const inputCls = "w-full px-[18px] py-3.5 border-[1.5px] border-slate-200 rounded-[6px] text-base text-slate-900 bg-slate-50 transition-all outline-none focus:border-primary focus:bg-cream focus:shadow-[0_0_0_4px_rgba(230,92,0,0.1)] placeholder:text-slate-400";
  const primaryBtn = "bg-gradient-to-br from-[#e65c00] to-[#cc5200] text-white py-4 border-none rounded-[6px] text-base font-bold cursor-pointer shadow-[0_8px_16px_-4px_rgba(230,92,0,0.3)] mt-2 transition-all hover:enabled:-translate-y-0.5 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none";

  return (
    <div>
      <h1 className="text-[1.75rem] font-extrabold mb-3 text-slate-900 tracking-tight leading-tight">Verify OTP</h1>
      <p className="text-[0.95rem] text-slate-500 mb-10 leading-relaxed">
        Enter the 6-digit code sent to <br /><strong>{phone}</strong>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="text-left">
          <label className="block text-[0.85rem] font-bold mb-2 text-slate-600 tracking-wide">OTP Code</label>
          <input
            type="text" className={inputCls} placeholder="123456"
            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={6} required
          />
        </div>

        {error && (
          <p className="text-[#ef4444] text-[0.85rem] font-semibold bg-red-50 px-4 py-3 rounded-[10px] border border-red-200 m-0">{error}</p>
        )}

        <button type="submit" className={primaryBtn} disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className="flex justify-center items-center mt-1">
          {timer > 0 ? (
            <p className="text-[0.85rem] text-slate-500 m-0">
              Resend OTP in <strong className="text-primary">{timer}s</strong>
            </p>
          ) : (
            <button type="button" onClick={handleResend} disabled={loading}
              className="bg-transparent border-none text-slate-500 text-[0.85rem] font-bold cursor-pointer px-4 py-2 rounded-[8px] hover:text-primary hover:bg-orange-50 transition-all">
              Resend OTP
            </button>
          )}
        </div>

        <button type="button" onClick={() => navigate('/login')}
          className="bg-transparent border-none text-slate-500 text-[0.85rem] font-bold cursor-pointer mx-auto px-4 py-2 rounded-[8px] hover:text-primary hover:bg-orange-50 transition-all block w-fit">
          Change Details
        </button>
      </form>
    </div>
  );
};

export default VerifyOtp;
