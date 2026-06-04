import React from 'react';
import { Outlet } from 'react-router-dom';
import loginBanner from '@/assets/login_banner.png';
import logo from '@/assets/logoo.png';
import { ShieldCheck, ShoppingBag, Tag, Headphones, Zap } from 'lucide-react';

const FEATURES = [
  { Icon: ShieldCheck, label: 'Secure & Safe' },
  { Icon: Tag, label: 'Wholesale Prices' },
  { Icon: Zap, label: 'Instant OTP Login' },
];

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-[1.1fr_1fr] bg-white">

      {/* ── LEFT PANEL (desktop only) ─────────────────────────── */}
      <div className="hidden lg:flex relative h-screen overflow-hidden">
        <img
          src={loginBanner}
          alt="Auth Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-primary/40 flex flex-col justify-between px-12 py-10 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-primary flex items-center justify-center shadow-lg">
              <ShoppingBag size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-[17px] font-extrabold leading-none text-white m-0 tracking-wider">AMJSTAR</h2>
              <span className="text-[10px] font-medium tracking-[0.25em] opacity-60 text-white">WHOLESALE</span>
            </div>
          </div>

          {/* Hero Copy */}
          <div className="text-white flex flex-col gap-0">
            <h1 className="font-display text-[clamp(34px,3.8vw,52px)] leading-[1.08] font-extrabold mb-4 text-white tracking-[-0.04em]">
              Smart Wholesale<br />Better Business
            </h1>
            <p className="text-[15px] opacity-75 max-w-[390px] mb-9 leading-relaxed">
              Your trusted partner for quality products at wholesale prices. Join thousands of verified businesses on AMJSTAR.
            </p>

            <div className="flex flex-col gap-5">
              {[
                { Icon: ShieldCheck, title: 'Secure & Safe', desc: 'Your data is protected with enterprise-grade security.' },
                { Icon: ShoppingBag, title: 'Huge Product Range', desc: 'Thousands of products across multiple categories.' },
                { Icon: Tag, title: 'Best Wholesale Prices', desc: 'Competitive pricing for your growing business.' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0 border border-white/10">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold mb-0.5 text-white m-0">{title}</h4>
                    <p className="text-[12px] opacity-65 leading-snug m-0">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="flex items-center gap-4 px-5 py-3.5 bg-black/30 rounded-[10px] backdrop-blur-md border border-white/10 w-fit">
            <Headphones size={22} className="text-white/80 shrink-0" />
            <div>
              <span className="text-[10px] font-bold opacity-55 uppercase tracking-widest text-white block">Need Help?</span>
              <p className="text-[12px] font-medium m-0 text-white">support@amjstar.com · +91 9034440682</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE TOP BRAND HEADER ───────────────────────────── */}
      <div className="lg:hidden w-full relative overflow-hidden" style={{ minHeight: '160px' }}>
        {/* Background image */}
        <img
          src={loginBanner}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/90" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center py-8 px-5 text-white text-center gap-3">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Logo" className="w-9 h-9 rounded-full shadow-lg border-2 border-white/30" />
            <div className="text-left">
              <span className="text-[16px] font-extrabold tracking-wider block leading-none">AMJSTAR</span>
              <span className="text-[9px] font-medium tracking-[0.22em] opacity-60 uppercase">Wholesale</span>
            </div>
          </div>

          <h1 className="text-[20px] font-extrabold text-white tracking-tight leading-snug m-0">
            Smart Wholesale, Better Business
          </h1>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {FEATURES.map(({ Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 bg-white/10 border border-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] font-semibold text-white"
              >
                <Icon size={11} className="shrink-0" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL / FORM AREA ───────────────────────────── */}
      <div className="flex flex-col items-center justify-start lg:justify-center relative bg-white lg:h-screen lg:overflow-y-auto flex-1">
        {/* Desktop logo (top-left) */}
        <div className="hidden lg:block absolute top-8 left-10">
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-full shadow-md" />
        </div>

        {/* Form card */}
        <div className="w-full max-w-[440px] px-5 sm:px-8 py-8 sm:py-10 lg:mt-0 mx-auto">
          {/* Premium card wrapper on mobile */}
          <div className="bg-white rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8 lg:shadow-none lg:border-none lg:p-0">
            <Outlet />
          </div>

          {/* Support footer – mobile only */}
          <div className="lg:hidden mt-6 flex items-center justify-center gap-2 text-center">
            <Headphones size={14} className="text-slate-400 shrink-0" />
            <p className="text-[11px] text-slate-400 m-0">
              Need help?{' '}
              <a href="mailto:support@amjstar.com" className="text-primary font-semibold hover:underline">
                support@amjstar.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
