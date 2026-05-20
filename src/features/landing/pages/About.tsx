import React from 'react';
import { ShieldCheck, TrendingUp, Handshake } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';

const containerCls = "max-w-[var(--width-container)] mx-auto px-8";

const About: React.FC = () => {
  return (
    <MainLayout>
      <div className="bg-surface min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] pt-[120px] pb-20">
          <div className={containerCls}>
            <div className="grid grid-cols-[1.2fr_1fr] gap-[60px] items-center max-md:grid-cols-1 max-md:gap-10">
              <div>
                <span className="inline-block px-4 py-1.5 bg-primary-soft text-primary rounded-full text-sm font-bold mb-6">
                  Our Journey
                </span>
                <h1 className="text-[64px] font-extrabold text-heading leading-[1.1] mb-8 max-md:text-[36px]">
                  Redefining <span className="text-primary">B2B Commerce</span> for the Digital Age
                </h1>
                <p className="text-xl text-body leading-[1.6] mb-10 max-md:text-base">
                  AMJSTAR is not just a marketplace; it's a movement to empower millions of businesses
                  by bridging the gap between quality manufacturing and retail accessibility.
                </p>
                <div className="flex gap-5">
                  <button className="bg-primary text-white border-none px-8 py-3.5 rounded-[6px] font-bold text-base cursor-pointer">Our Mission</button>
                  <button className="bg-transparent border-none text-heading font-bold text-base cursor-pointer underline">View Story</button>
                </div>
              </div>
              <div>
                <img
                  src="/about image.png"
                  alt="Professional Workspace"
                  className="w-full rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.12)]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-[100px] bg-white">
          <div className={containerCls}>
            <div className="grid grid-cols-[1fr_400px] gap-[100px] items-start max-lg:grid-cols-1 max-lg:gap-12">
              <div>
                <h2 className="text-[40px] font-extrabold text-heading mb-8">Our Story</h2>
                <p className="text-lg text-body leading-[1.8] mb-6">
                  Founded in 2024, AMJSTAR started with a simple observation: the wholesale market was
                  fragmented and difficult to navigate for small-scale resellers and growing manufacturers.
                  We saw an opportunity to build a bridge—a digital ecosystem where trust is the primary currency.
                </p>
                <p className="text-lg text-body leading-[1.8]">
                  Today, we are proud to be one of India's fastest-growing B2B platforms, serving thousands
                  of partners across the country with a focus on quality, speed, and reliability.
                </p>
              </div>
              <div className="bg-white p-10 rounded-[6px] border border-border">
                <div className="italic text-lg text-heading leading-[1.6] mb-8 relative before:content-['\\201C'] before:text-[80px] before:absolute before:-top-10 before:-left-5 before:opacity-10">
                  <p>"We believe that every business, no matter how small, deserves a global platform to shine. AMJSTAR is that stage."</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">AV</div>
                  <div>
                    <h4 className="text-base font-bold text-heading">Founder's Vision</h4>
                    <span className="text-sm text-muted">CEO, AMJSTAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-surface py-20">
          <div className={containerCls}>
            <h2 className="text-[36px] font-bold text-heading text-center mb-[60px]">Our Core Values</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
              {[
                { Icon: ShieldCheck, title: 'Absolute Trust', desc: 'We implement multi-level verification for every partner to ensure a safe trading environment.' },
                { Icon: TrendingUp, title: 'Growth First', desc: 'Our tools are designed specifically to help you scale your business volume and reach.' },
                { Icon: Handshake, title: 'Solid Partnerships', desc: 'We treat our users as partners, ensuring your success is fundamentally linked to ours.' },
              ].map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-cream p-10 rounded-[10px] border border-border transition-all hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                >
                  <div className="w-16 h-16 bg-primary-soft text-primary rounded-[8px] flex items-center justify-center mb-6">
                    <Icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-heading mb-4">{title}</h3>
                  <p className="text-[15px] text-body leading-[1.6]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default About;
