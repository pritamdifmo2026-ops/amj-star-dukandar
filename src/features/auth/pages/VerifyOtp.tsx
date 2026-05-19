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

  useEffect(() => {
    if (!phone) {
      navigate('/login');
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setError('');
    try {
      await authService.sendOtp({ phone });
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.verifyOtp({ phone, otp });
      const user = response.user;

      // Update Redux state
      dispatch(setCredentials({ user }));
      
      // Auto-assign role if they chose seller/reseller during login but don't have one
      if (user.role === 'buyer' && (mode === 'seller' || mode === 'reseller')) {
        const assignedRole = mode === 'seller' ? 'supplier' : 'reseller';
        const roleResponse = await authService.selectRole({ role: assignedRole });
        dispatch(setCredentials({ user: roleResponse.user }));
        
        if (assignedRole === 'supplier') {
          navigate('/supplier/onboarding');
        } else {
          navigate(ROUTES.RESELLER_DASHBOARD);
        }
        return;
      }

      // Redirect based on existing role
      if (user.role === 'supplier') {
        navigate('/supplier/onboarding');
      } else if (user.role === 'reseller') {
        navigate(ROUTES.RESELLER_DASHBOARD);
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-[1.75rem] font-extrabold mb-3 text-slate-900 tracking-tight leading-tight">Verify OTP</h1>
      <p className="text-[0.95rem] text-slate-500 mb-10 leading-relaxed">
        Enter the 6-digit code sent to <br/>
        <strong>{phone}</strong>
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="text-left">
          <label className="block text-[0.85rem] font-bold mb-2.5 text-slate-600 tracking-wider">OTP Code</label>
          <input
            type="text"
            className="w-full py-3.5 px-[18px] border-[1.5px] border-slate-200 rounded-md text-base text-slate-900 transition-all duration-200 bg-slate-50 focus:outline-none focus:border-[var(--color-primary)] focus:bg-[oklch(0.99_0.01_80)] focus:shadow-[0_0_0_4px_rgba(230,92,0,0.1)] placeholder:text-slate-400"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            required
          />
        </div>

        {error && <p className="text-red-500 text-[0.85rem] font-semibold mt-2 text-left bg-red-50 p-[12px_16px] rounded-[10px] border border-red-200">{error}</p>}

        <button 
          type="submit" 
          className="bg-gradient-to-br from-[var(--color-primary)] to-[#cc5200] text-white p-4 border-none rounded-md text-base font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_16px_-4px_rgba(230,92,0,0.3)] mt-2 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_12px_24px_-6px_rgba(230,92,0,0.4)] active:not-disabled:translate-y-0" 
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className="flex justify-center items-center mt-4">
          {timer > 0 ? (
            <p className="text-[0.85rem] text-slate-500 m-0">Resend OTP in <strong className="color-[var(--color-primary)]">{timer}s</strong></p>
          ) : (
            <button 
              type="button" 
              className="bg-none border-none text-slate-500 text-[0.85rem] font-bold cursor-pointer transition-colors duration-200 p-2 rounded-lg block w-fit hover:text-[var(--color-primary)] hover:bg-[oklch(0.99_0.01_80)]" 
              onClick={handleResend}
              disabled={loading}
            >
              Resend OTP
            </button>
          )}
        </div>
        
        <button 
          type="button" 
          className="bg-none border-none text-slate-500 text-[0.85rem] font-bold cursor-pointer transition-colors duration-200 p-2 rounded-lg block w-fit mx-auto hover:text-[var(--color-primary)] hover:bg-[oklch(0.99_0.01_80)] mt-2" 
          onClick={() => navigate('/login')}
        >
          Change Details
        </button>
      </form>
    </div>
  );
};

export default VerifyOtp;
