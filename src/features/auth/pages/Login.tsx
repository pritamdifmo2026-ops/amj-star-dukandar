import React, { useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Phone, Loader2 } from 'lucide-react';
import authService from '../services/auth.service';
import { useAppSelector } from '@/store/hooks';

const modeConfig = {
  buyer: {
    badge: 'For Buyers',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    heading: 'Welcome to AMJSTAR',
    sub: 'Enter your phone number to receive a one-time password.',
    btnCls: 'from-primary to-primary-dark',
    accentBar: 'bg-emerald-500',
  },
  seller: {
    badge: 'For Suppliers',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    heading: 'Grow with AMJSTAR',
    sub: 'Join thousands of manufacturers selling wholesale online.',
    btnCls: 'from-[#1A3C5E] to-[#0f2740]',
    accentBar: 'bg-blue-600',
  },
  reseller: {
    badge: 'For Resellers',
    badgeCls: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    heading: 'Start Earning Today',
    sub: 'Build your business with zero investment on AMJSTAR.',
    btnCls: 'from-[#D94F00] to-[#b33e00]',
    accentBar: 'bg-[#D94F00]',
  },
};

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'buyer') as keyof typeof modeConfig;

  const { isAuthenticated, user } = useAppSelector(s => s.auth);
  if (isAuthenticated && user) {
    const roleRedirect: Record<string, string> = {
      supplier: '/supplier/dashboard',
      reseller: '/reseller/dashboard',
      admin: '/admin/dashboard',
      superadmin: '/admin/dashboard',
      buyer: '/profile',
    };
    return <Navigate to={roleRedirect[user.role] ?? '/'} replace />;
  }

  const cfg = modeConfig[mode] ?? modeConfig.buyer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
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
    <div className="flex flex-col gap-0">
      {/* Accent bar */}
      <div className={`h-1 w-14 rounded-full mb-6 ${cfg.accentBar}`} />

      {/* Badge */}
      <span className={`inline-flex items-center self-start px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border mb-4 ${cfg.badgeCls}`}>
        {cfg.badge}
      </span>

      {/* Back button */}
      <button
        className="flex items-center gap-1.5 text-slate-400 text-[13px] font-semibold bg-transparent border-none cursor-pointer mb-5 transition-all hover:text-primary hover:-translate-x-0.5 self-start p-0"
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      {/* Heading */}
      <h1 className="text-[1.65rem] sm:text-[1.85rem] font-extrabold mb-2 text-slate-900 tracking-tight leading-tight m-0">
        {cfg.heading}
      </h1>
      <p className="text-[0.9rem] text-slate-500 mb-7 leading-relaxed m-0">
        {cfg.sub}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
            Phone Number
          </label>
          <div className="flex items-center border-[1.5px] border-slate-200 rounded-[10px] bg-slate-50 overflow-hidden transition-all focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(230,92,0,0.08)]">
            <div className="flex items-center justify-center pl-4 pr-2 shrink-0">
              <Phone size={16} className="text-slate-400" />
            </div>
            <span className="text-slate-500 text-sm font-semibold pr-2 border-r border-slate-200 py-3.5 leading-none">+91</span>
            <input
              type="tel"
              className="flex-1 px-3 py-3.5 border-none text-base text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
              placeholder="10-digit mobile number"
              required
              disabled={loading}
              autoComplete="tel"
              inputMode="numeric"
            />
            {phone.length > 0 && (
              <span className={`pr-4 text-[11px] font-bold ${phone.length === 10 ? 'text-emerald-500' : 'text-slate-300'}`}>
                {phone.length}/10
              </span>
            )}
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
          className={`bg-gradient-to-br ${cfg.btnCls} text-white py-4 border-none rounded-[10px] text-[15px] font-bold cursor-pointer shadow-[0_8px_16px_-4px_rgba(230,92,0,0.25)] mt-1 transition-all flex items-center justify-center gap-2 hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_12px_24px_-6px_rgba(230,92,0,0.35)] active:enabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending OTP...
            </>
          ) : (
            'Send OTP →'
          )}
        </button>
      </form>

      {/* Footer note */}
      <p className="text-[12px] text-slate-400 text-center mt-5 m-0 leading-relaxed">
        By continuing, you agree to our <span className="text-primary font-semibold cursor-pointer hover:underline">Terms</span> & <span className="text-primary font-semibold cursor-pointer hover:underline">Privacy Policy</span>.
      </p>
    </div>
  );
};

export default Login;
