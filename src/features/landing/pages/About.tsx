import React from 'react';
import { ShieldCheck, TrendingUp, Handshake } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';

const About: React.FC = () => {
  return (
    <MainLayout>
      <div className="bg-[var(--color-bg)] min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] py-[120px] max-md:py-[60px] pb-20 max-md:pb-10">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <div className="grid grid-cols-[1.2fr_1fr] max-lg:grid-cols-1 gap-[60px] max-lg:gap-10 items-center max-lg:text-center">
              <div className="max-lg:flex max-lg:flex-col max-lg:items-center">
                <span className="inline-block py-1.5 px-4 bg-orange-100 text-[var(--color-primary)] rounded-full text-sm font-bold mb-6">Our Journey</span>
                <h1 className="text-[50px] max-md:text-[40px] max-sm:text-[32px] font-extrabold text-[var(--color-secondary)] leading-[1.1] mb-8">Redefining <span className="text-[var(--color-primary)] relative">B2B Commerce</span> for the Digital Age</h1>
                <p className="text-xl max-sm:text-base text-[var(--color-text-secondary)] leading-relaxed mb-10 max-w-[600px]">
                  AMJStar is not just a marketplace; it's a movement to empower millions of businesses
                  by bridging the gap between quality manufacturing and retail accessibility.
                </p>
                <div className="flex gap-5 max-sm:flex-col max-sm:w-full">
                  <button className="bg-[var(--color-primary)] color-white border-none py-3.5 px-8 rounded-md font-bold text-base cursor-pointer hover:bg-[var(--color-primary-dark)] max-sm:w-full">Our Mission</button>
                  <button className="bg-none border-none text-[var(--color-secondary)] font-bold text-base cursor-pointer underline max-sm:w-full max-sm:justify-center">View Story</button>
                </div>
              </div>
              <div className="w-full">
                <img src="/about image.png" alt="Professional Workspace" className="w-full rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.12)]" />
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-[100px] max-lg:py-[60px] bg-white">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <div className="grid grid-cols-[1fr_400px] max-lg:grid-cols-1 gap-[100px] max-lg:gap-10 items-start">
              <div className="storyText">
                <h2 className="text-[40px] max-md:text-[28px] font-extrabold text-[var(--color-secondary)] mb-8">Our Story</h2>
                <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] mb-6">
                  Founded in 2024, AMJStar started with a simple observation: the wholesale market was
                  fragmented and difficult to navigate for small-scale resellers and growing manufacturers.
                  We saw an opportunity to build a bridge—a digital ecosystem where trust is the primary currency.
                </p>
                <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] mb-6">
                  Today, we are proud to be one of India's fastest-growing B2B platforms, serving thousands
                  of partners across the country with a focus on quality, speed, and reliability.
                </p>
              </div>
              <div className="bg-white p-10 max-md:p-6 rounded-md border border-[var(--color-border)] w-full">
                <div className="italic text-lg max-md:text-base text-[var(--color-secondary)] leading-relaxed mb-8 relative before:content-['“'] before:text-[80px] max-md:before:text-[60px] before:absolute before:-top-10 max-md:before:-top-5 before:-left-5 max-md:before:-left-2.5 before:opacity-10">
                  <p>"We believe that every business, no matter how small, deserves a global platform to shine. AMJStar is that stage."</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold">AV</div>
                  <div>
                    <h4 className="text-base font-bold text-[var(--color-secondary)]">Founder's Vision</h4>
                    <span className="text-sm text-[var(--color-text-muted)]">CEO, AMJStar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-[var(--color-surface)] py-20 max-md:py-10">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <h2 className="text-4xl max-md:text-[28px] font-bold text-[var(--color-secondary)] text-center mb-[60px]">Our Core Values</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
              <div className="bg-[var(--color-bg)] p-10 rounded-[10px] border border-[var(--color-border)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                <div className="w-16 h-16 bg-orange-50 text-[var(--color-primary)] rounded-lg flex items-center justify-center mb-6"><ShieldCheck size={32} /></div>
                <h3 className="text-xl font-bold text-[var(--color-secondary)] mb-4">Absolute Trust</h3>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">We implement multi-level verification for every partner to ensure a safe trading environment.</p>
              </div>
              <div className="bg-[var(--color-bg)] p-10 rounded-[10px] border border-[var(--color-border)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                <div className="w-16 h-16 bg-orange-50 text-[var(--color-primary)] rounded-lg flex items-center justify-center mb-6"><TrendingUp size={32} /></div>
                <h3 className="text-xl font-bold text-[var(--color-secondary)] mb-4">Growth First</h3>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Our tools are designed specifically to help you scale your business volume and reach.</p>
              </div>
              <div className="bg-[var(--color-bg)] p-10 rounded-[10px] border border-[var(--color-border)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
                <div className="w-16 h-16 bg-orange-50 text-[var(--color-primary)] rounded-lg flex items-center justify-center mb-6"><Handshake size={32} /></div>
                <h3 className="text-xl font-bold text-[var(--color-secondary)] mb-4">Solid Partnerships</h3>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">We treat our users as partners, ensuring your success is fundamentally linked to ours.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default About;
