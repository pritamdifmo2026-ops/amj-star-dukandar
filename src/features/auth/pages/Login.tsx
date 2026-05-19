import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import authService from '../services/auth.service';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'buyer';

  const validateForm = () => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setLoading(true);
      await authService.sendOtp({ phone });
      navigate(`/verify-otp?phone=${phone}&mode=${mode}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <button className="flex items-center gap-2 border-none bg-transparent text-slate-500 text-sm font-bold cursor-pointer transition-all duration-200 hover:text-[var(--color-primary)] hover:-translate-x-1 mb-8 self-start" onClick={() => navigate('/')}>
        <ArrowLeft size={20} />
        Back to Home
      </button>

      <h1 className="text-[1.75rem] font-extrabold mb-3 text-slate-900 tracking-tight leading-tight">
        {mode === 'seller' ? 'Join AMJStar as Partner' : 'Welcome to AMJStar'}
      </h1>
      <p className="text-[0.95rem] text-slate-500 mb-10 leading-relaxed">Enter your phone number to receive an OTP</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="text-left">
          <label className="block text-[0.85rem] font-bold mb-2.5 text-slate-600 tracking-wider">Phone Number</label>
          <input
            type="tel"
            className="w-full py-3.5 px-[18px] border-[1.5px] border-slate-200 rounded-md text-base text-slate-900 transition-all duration-200 bg-slate-50 focus:outline-none focus:border-[var(--color-primary)] focus:bg-[oklch(0.99_0.01_80)] focus:shadow-[0_0_0_4px_rgba(230,92,0,0.1)] placeholder:text-slate-400"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
              setError('');
            }}
            placeholder="Enter 10-digit mobile number"
            required
            disabled={loading}
          />
        </div>

        {error && <p className="text-red-500 text-[0.85rem] font-semibold mt-2 text-left bg-red-50 p-[12px_16px] rounded-[10px] border border-red-200">{error}</p>}

        <button 
          type="submit" 
          className="bg-gradient-to-br from-[var(--color-primary)] to-[#cc5200] text-white p-4 border-none rounded-md text-base font-bold cursor-pointer transition-all duration-300 shadow-[0_8px_16px_-4px_rgba(230,92,0,0.3)] mt-2 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-[0_12px_24px_-6px_rgba(230,92,0,0.4)] active:not-disabled:translate-y-0" 
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </form>
    </div>
  );
};

export default Login;
