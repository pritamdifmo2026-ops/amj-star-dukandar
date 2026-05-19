import React from 'react';
import { Outlet } from 'react-router-dom';
import loginBanner from '@/assets/login_banner.png';
import { ShieldCheck, ShoppingBag, Tag, Headphones } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] h-screen w-full bg-white overflow-hidden">
      {/* Left: image + overlay */}
      <div className="hidden lg:block relative h-screen overflow-hidden">
        <img src={loginBanner} alt="Auth Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-900/45 flex flex-col justify-center px-12 py-10 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="text-white flex flex-col gap-0 w-full">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-9">
              <div className="bg-primary w-10 h-10 rounded-[6px] flex items-center justify-center text-white">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold leading-none text-white m-0">AMJSTAR</h2>
                <span className="text-xs font-normal tracking-widest opacity-80">WHOLESALE</span>
              </div>
            </div>

            <h1 className="font-display text-[clamp(36px,4vw,54px)] leading-[1.1] font-extrabold mb-4 text-white tracking-[-0.04em]">
              Smart Wholesale <br />Better Business
            </h1>
            <p className="text-base opacity-80 max-w-[400px] mb-9 leading-relaxed">
              Your trusted partner for quality products at wholesale prices.
            </p>

            <div className="flex flex-col gap-5">
              {[
                { Icon: ShieldCheck, title: 'Secure & Safe', desc: 'Your data is protected with enterprise-grade security.' },
                { Icon: ShoppingBag, title: 'Huge Product Range', desc: 'Thousands of products across multiple categories.' },
                { Icon: Tag, title: 'Best Wholesale Prices', desc: 'Competitive pricing for your growing business.' },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-0.5 text-white m-0">{title}</h4>
                    <p className="text-[13px] opacity-70 leading-snug m-0">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 px-6 py-4 bg-black/30 rounded-[8px] backdrop-blur-[10px] w-fit mt-9">
              <Headphones size={24} />
              <div>
                <span className="text-[11px] font-bold opacity-60 uppercase">Need Help?</span>
                <p className="text-[13px] font-medium m-0">support@amjstar.com | +91 123 456 7890</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-col items-center justify-center relative px-6 py-10 lg:px-10 bg-white h-screen overflow-y-auto">
        <div className="absolute top-8 left-10">
          <img src="/favicon.jpeg" alt="Logo" className="w-11 h-11 rounded-[6px] shadow-md" />
        </div>
        <div className="w-full max-w-[420px] mt-14 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
