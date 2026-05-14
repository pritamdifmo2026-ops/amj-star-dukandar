import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Store, ShoppingBag } from 'lucide-react';
import authService from '../services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import type { UserRole } from '../types';

const SelectRole: React.FC = () => {
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const dispatch = useAppDispatch();

  const handleRoleSelect = async (role: UserRole) => {
    setLoading(role); setError('');
    try {
      const response = await authService.selectRole({ role });
      localStorage.removeItem('temp_phone');
      dispatch(setCredentials({ user: response.user }));
      if (role === 'supplier') navigate('/supplier/onboarding');
      else if (role === 'reseller') navigate('/reseller/onboarding');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set role. Please try again.');
      setLoading(null);
    }
  };

  const roles = [
    ...(mode !== 'seller' ? [{
      role: 'buyer' as UserRole,
      badge: 'For Retailers', badgeCls: 'bg-emerald-50 text-[#0B7F5A]',
      Icon: ShoppingBag, iconColor: '#0B7F5A',
      title: 'Buyer',
      desc: 'Source high-quality products in bulk at wholesale prices directly from verified manufacturers.',
      btnCls: 'bg-[#0B7F5A] hover:bg-emerald-500',
      label: 'Join as Buyer',
    }] : []),
    {
      role: 'supplier' as UserRole,
      badge: 'For Manufacturers', badgeCls: 'bg-blue-50 text-[#1A3C5E]',
      Icon: Store, iconColor: '#1A3C5E',
      title: 'Supplier',
      desc: 'List your catalog, reach thousands of retailers across India, and grow your B2B sales effortlessly.',
      btnCls: 'bg-[#1A3C5E] hover:bg-blue-600',
      label: 'Join as Supplier',
    },
    {
      role: 'reseller' as UserRole,
      badge: 'For Entrepreneurs', badgeCls: 'bg-fuchsia-50 text-[#D94F00]',
      Icon: User, iconColor: '#D94F00',
      title: 'Reseller',
      desc: 'Start your own business with zero investment. Share products with your network and earn margins.',
      btnCls: 'bg-[#D94F00] hover:bg-[#FF7A1A]',
      label: 'Join as Reseller',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="text-center px-4 pt-8 pb-2 md:pt-10">
        <h1 className="text-[1.8rem] md:text-[2.2rem] font-bold text-heading mb-2 tracking-tight">Choose Your Path</h1>
        <p className="text-[0.9rem] md:text-base text-body max-w-[600px] mx-auto mb-5">
          Join thousands of businesses on AMJStar Dukandar. Select the role that best describes how you'll use our platform.
        </p>
        {error && (
          <div className="text-center text-red-600 bg-red-50 px-3 py-3 mx-auto max-w-[400px] rounded-[8px] border border-red-300 mb-4">
            {error}
          </div>
        )}
      </header>

      <div className="flex flex-row gap-2 md:gap-4 w-full max-w-[1200px] mx-auto px-2.5 md:px-5 py-2.5 md:py-5 mb-auto">
        {roles.map(({ role, badge, badgeCls, Icon, iconColor, title, desc, btnCls, label }) => (
          <div
            key={role}
            className="flex-1 flex flex-col justify-start items-center px-1.5 md:px-5 py-5 md:py-6 text-center transition-all duration-200 border border-border rounded-[10px] md:rounded-[6px] bg-surface hover:border-primary hover:-translate-y-1"
          >
            <span className={`inline-block px-1.5 py-1 md:px-3 md:py-1.5 rounded-full text-[0.5rem] md:text-[0.75rem] font-bold uppercase tracking-wide mb-3 md:mb-4 ${badgeCls}`}>
              {badge}
            </span>
            <div className="mb-2.5 md:mb-4 p-2 md:p-4 rounded-full border border-border flex items-center justify-center">
              <Icon size={24} color={iconColor} className="md:!w-9 md:!h-9" />
            </div>
            <h2 className="text-base md:text-2xl font-bold text-heading mb-3">{title}</h2>
            <p className="hidden md:block text-[0.95rem] text-body leading-relaxed mb-6 max-w-[320px]">{desc}</p>
            <button
              className={[
                'mt-auto w-full max-w-full md:max-w-[220px] py-1.5 md:py-3 px-0.5 md:px-4',
                'text-[0.6rem] md:text-[0.95rem] font-semibold rounded-[6px] md:rounded-[8px]',
                'border-none text-white cursor-pointer transition-opacity min-h-[40px] md:min-h-[48px]',
                'flex items-center justify-center leading-tight whitespace-nowrap',
                btnCls,
                loading ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
              onClick={() => handleRoleSelect(role)}
              disabled={!!loading}
            >
              {loading === role ? 'Setting up...' : label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectRole;
