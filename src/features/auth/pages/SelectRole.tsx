import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Store, ShoppingBag, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import authService from '../services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/features/auth/store/auth.slice';
import type { UserRole } from '../types';

const ROLE_CONFIG = [
  {
    role: 'buyer' as UserRole,
    badge: 'For Retailers',
    badgeCls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    iconBg: 'bg-emerald-50 border-emerald-100',
    iconColor: '#0B7F5A',
    cardActive: 'border-emerald-400 shadow-[0_0_0_3px_rgba(11,127,90,0.12)]',
    accent: 'bg-emerald-500',
    Icon: ShoppingBag,
    title: 'Buyer',
    tagline: 'Source bulk products',
    desc: 'Source high-quality products in bulk at wholesale prices directly from verified manufacturers across India.',
    perks: ['Bulk wholesale pricing', 'Verified manufacturers', 'Secure payments'],
    btnCls: 'bg-emerald-600 hover:bg-emerald-500',
    label: 'Join as Buyer',
    sellerOnly: false,
  },
  {
    role: 'supplier' as UserRole,
    badge: 'For Manufacturers',
    badgeCls: 'bg-blue-50 text-blue-700 border border-blue-200',
    iconBg: 'bg-blue-50 border-blue-100',
    iconColor: '#1A3C5E',
    cardActive: 'border-blue-400 shadow-[0_0_0_3px_rgba(26,60,94,0.12)]',
    accent: 'bg-blue-600',
    Icon: Store,
    title: 'Supplier',
    tagline: 'List & sell products',
    desc: 'List your catalog, reach thousands of retailers across India, and grow your B2B sales effortlessly.',
    perks: ['Pan-India reach', 'GST-ready invoicing', 'Instant payouts'],
    btnCls: 'bg-[#1A3C5E] hover:bg-blue-600',
    label: 'Join as Supplier',
    sellerOnly: true,
  },
  {
    role: 'reseller' as UserRole,
    badge: 'For Entrepreneurs',
    badgeCls: 'bg-orange-50 text-orange-700 border border-orange-200',
    iconBg: 'bg-orange-50 border-orange-100',
    iconColor: '#D94F00',
    cardActive: 'border-orange-400 shadow-[0_0_0_3px_rgba(217,79,0,0.12)]',
    accent: 'bg-[#D94F00]',
    Icon: User,
    title: 'Reseller',
    tagline: 'Earn by sharing',
    desc: 'Start your own business with zero investment. Share products with your network and earn attractive margins.',
    perks: ['Zero investment', 'Custom storefront', 'Earn referral margins'],
    btnCls: 'bg-[#D94F00] hover:bg-[#FF7A1A]',
    label: 'Join as Reseller',
    sellerOnly: true,
  },
];

const SelectRole: React.FC = () => {
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const [hovered, setHovered] = useState<UserRole | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const dispatch = useAppDispatch();

  const roles = mode === 'seller'
    ? ROLE_CONFIG.filter(r => r.sellerOnly)
    : ROLE_CONFIG;

  const handleRoleSelect = async (role: UserRole) => {
    setLoadingRole(role); setError('');
    try {
      const response = await authService.selectRole({ role });
      localStorage.removeItem('temp_phone');
      dispatch(setCredentials({ user: response.user }));
      if (role === 'supplier') navigate('/supplier/onboarding');
      else if (role === 'reseller') navigate('/reseller/onboarding');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set role. Please try again.');
      setLoadingRole(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="text-center px-4 pt-6 pb-4 md:pt-8">
        {/* Accent pill */}
        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider mb-4">
          <CheckCircle2 size={13} />
          One last step
        </div>
        <h1 className="text-[1.6rem] sm:text-[2rem] md:text-[2.2rem] font-extrabold text-slate-900 mb-2 tracking-tight leading-tight">
          Choose Your Path
        </h1>
        <p className="text-[13px] sm:text-[15px] text-slate-500 max-w-[520px] mx-auto leading-relaxed">
          Join thousands of businesses on AMJSTAR. Select the role that best describes how you'll use our platform.
        </p>
        {error && (
          <div className="text-center text-red-600 bg-red-50 px-4 py-3 mx-auto max-w-[420px] rounded-[10px] border border-red-200 mt-4 text-[13px] font-semibold">
            {error}
          </div>
        )}
      </header>

      {/* Cards */}
      <div className={`flex-1 grid gap-3 sm:gap-4 w-full max-w-[1100px] mx-auto px-3 sm:px-5 py-4 pb-8 ${
        roles.length === 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {roles.map(({ role, badge, badgeCls, iconBg, iconColor, cardActive, accent, Icon, title, tagline, desc, perks, btnCls, label }) => {
          const isLoading = loadingRole === role;
          const isHov = hovered === role;
          return (
            <div
              key={role}
              onMouseEnter={() => setHovered(role)}
              onMouseLeave={() => setHovered(null)}
              className={[
                'group flex flex-col bg-white border-2 rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-default select-none',
                isHov ? cardActive : 'border-slate-200 hover:border-slate-300',
              ].join(' ')}
            >
              {/* Card top: badge + icon */}
              <div className="flex items-start justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${badgeCls}`}>
                  {badge}
                </span>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 ${iconBg} ${isHov ? 'scale-110' : ''}`}>
                  <Icon size={22} color={iconColor} />
                </div>
              </div>

              {/* Title + tagline */}
              <h2 className="text-[1.2rem] sm:text-[1.35rem] font-extrabold text-slate-900 mb-0.5 leading-tight m-0">
                {title}
              </h2>
              <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-3 m-0">
                {tagline}
              </p>

              {/* Description – hidden on mobile */}
              <p className="hidden sm:block text-[13px] sm:text-[14px] text-slate-500 leading-relaxed mb-4 flex-1">
                {desc}
              </p>

              {/* Perks */}
              <ul className="flex flex-col gap-1.5 mb-5">
                {perks.map(p => (
                  <li key={p} className="flex items-center gap-2 text-[12px] sm:text-[13px] text-slate-600 font-medium">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${accent}`}>
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {p}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={[
                  'w-full py-3 sm:py-3.5 px-4 text-white text-[13px] sm:text-[14px] font-bold border-none rounded-[10px] cursor-pointer transition-all duration-200',
                  'flex items-center justify-center gap-2',
                  btnCls,
                  'hover:translate-y-[-1px] hover:shadow-lg',
                  loadingRole && !isLoading ? 'opacity-50 cursor-not-allowed' : '',
                  isLoading ? 'opacity-80 cursor-not-allowed' : '',
                ].join(' ')}
                onClick={() => handleRoleSelect(role)}
                disabled={!!loadingRole}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    {label}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectRole;
