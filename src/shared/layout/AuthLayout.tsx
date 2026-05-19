import React from 'react';
import { Outlet } from 'react-router-dom';

import loginBanner from '@/assets/login_banner.png';
import { ShieldCheck, ShoppingBag, Tag, Headphones } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="grid grid-cols-[1.1fr_1fr] max-lg:grid-cols-1 h-screen max-lg:h-auto max-lg:min-h-screen w-full bg-white overflow-hidden">
      {/* Left image panel */}
      <div className="relative h-screen overflow-hidden max-lg:hidden">
        <img src={loginBanner} alt="Auth Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-900/45 flex flex-col justify-center px-10 py-10 overflow-y-auto scrollbar-none">
          <div className="text-white w-full flex flex-col gap-0">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-9">
              <div className="bg-[var(--color-primary)] w-10 h-10 rounded-md flex items-center justify-center text-white">
                <ShoppingBag size={24} />
              </div>
              <h2 className="text-lg font-extrabold leading-none text-white m-0">
                AMJSTAR <br/>
                <span className="text-xs font-normal tracking-[0.1em] opacity-80">WHOLESALE</span>
              </h2>
            </div>

            <h1 className="font-[var(--font-display)] text-[clamp(36px,4vw,54px)] leading-[1.1] font-extrabold mb-4 text-white tracking-[-0.04em]">
              Smart Wholesale <br/>Better Business
            </h1>
            <p className="text-base opacity-80 max-w-[400px] mb-9 leading-relaxed">
              Your trusted partner for quality products at wholesale prices.
            </p>

            <div className="flex flex-col gap-5">
              {[
                { icon: ShieldCheck, title: 'Secure & Safe', desc: 'Your data is protected with enterprise-grade security.' },
                { icon: ShoppingBag, title: 'Huge Product Range', desc: 'Thousands of products across multiple categories.' },
                { icon: Tag, title: 'Best Wholesale Prices', desc: 'Competitive pricing for your growing business.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-0.5 text-white">{title}</h4>
                    <p className="text-[13px] opacity-70 leading-tight m-0">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 px-6 py-4 bg-black/30 rounded-lg backdrop-blur-[10px] w-fit mt-9">
              <Headphones size={24} />
              <div>
                <span className="text-[11px] font-bold opacity-60 uppercase block">Need Help?</span>
                <p className="text-[13px] font-medium m-0">support@amjstar.com | +91 123 456 7890</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center relative px-10 max-lg:px-6 bg-white h-screen max-lg:h-auto max-lg:min-h-screen overflow-y-auto">
        <div className="absolute top-8 left-10 max-lg:top-6 max-lg:left-6">
          <img src="/favicon.jpeg" alt="Logo" className="w-11 h-11 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.1)]" />
        </div>

        <div className="w-full max-w-[420px] p-8 max-lg:p-0 max-lg:mt-16">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
