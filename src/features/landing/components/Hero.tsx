import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

import { ArrowRight } from 'lucide-react';
import heroImage from '@/assets/images/image.png';

const Hero: React.FC = () => {
  return (
    <section className="bg-[var(--color-bg)] py-10 overflow-hidden">
      <div className="w-full max-w-[var(--container-max)] mx-auto px-8 flex max-[1100px]:flex-col items-center justify-between gap-10 max-[1100px]:text-center max-[1100px]:gap-12">
        <div className="flex-1 max-[1100px]:flex max-[1100px]:flex-col max-[1100px]:items-center">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-white border border-[var(--color-border)] rounded-full font-sans text-[10px] font-medium uppercase tracking-widest text-[var(--color-primary)] mb-4">
            <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full" />
            Join AMJstar and grow your wholesale business today.
          </div>
          <h1 className="font-[var(--font-display)] text-[clamp(1.8rem,5vw,2.8rem)] max-[640px]:text-[3rem] leading-none text-[var(--color-secondary)] mb-4 font-normal">
            <span className="text-[var(--color-primary)] italic">AMJstar</span> connects wholesalers, suppliers, and resellers with a smarter B2B wholesale platform.
          </h1>

          <p className="font-sans text-sm text-[var(--color-text-secondary)] mb-6 max-w-[600px] max-[1100px]:mx-auto max-[1100px]:mb-12 leading-relaxed">
            AMJStar connects wholesalers, local retail resellers, and business
            buyers in one trade network. Quote-based ordering and bulk fulfillment.
          </p>

          <div className="flex gap-4 mb-8 max-[1100px]:justify-center max-[640px]:flex-col max-[640px]:w-full">
            <Link to={`${ROUTES.LOGIN}?mode=buyer`} className="bg-[var(--color-primary)] text-white py-3 px-6 text-sm font-semibold rounded-full no-underline flex items-center justify-center gap-3 transition-all duration-200 hover:bg-[var(--color-primary-dark)] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(217,79,0,1)]">
              Join as Buyer <ArrowRight size={20} />
            </Link>
            <Link to={`${ROUTES.LOGIN}?mode=seller`} className="bg-white text-[var(--color-secondary)] py-3 px-6 text-sm font-semibold rounded-full no-underline border border-[var(--color-border)] transition-all duration-200 hover:border-[var(--color-secondary)] hover:bg-[#f8f8f8]">
              Become a Supplier
            </Link>
          </div>

          <div className="flex items-center gap-6 max-[1100px]:justify-center max-[640px]:gap-5 max-[640px]:flex-wrap">
            <div className="flex flex-col">
              <span className="font-[var(--font-display)] text-2xl text-[var(--color-secondary)] leading-none">50k+</span>
              <span className="text-xs text-[var(--color-text-muted)]">Verified Suppliers</span>
            </div>
            <div className="w-px h-6 bg-[var(--color-border)] max-[640px]:hidden" />
            <div className="flex flex-col">
              <span className="font-[var(--font-display)] text-2xl text-[var(--color-secondary)] leading-none">2M+</span>
              <span className="text-xs text-[var(--color-text-muted)]">Bulk Products</span>
            </div>
            <div className="w-px h-6 bg-[var(--color-border)] max-[640px]:hidden" />
            <div className="flex flex-col">
              <span className="font-[var(--font-display)] text-2xl text-[var(--color-secondary)] leading-none">B2B</span>
              <span className="text-xs text-[var(--color-text-muted)]">First Platform</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-end max-[1100px]:justify-center">
          <div className="relative w-full max-w-[480px]">
            <img src={heroImage} alt="B2B Marketplace" className="w-full h-auto rounded-[32px] block shadow-[0_20px_40px_-20px_rgba(0,0,0,0.2)]" />
            <div className="absolute bottom-5 -left-5 max-[1100px]:left-5 max-[1100px]:-bottom-5 bg-white p-4 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex flex-col z-[2] border border-[var(--color-border)]">
              <span className="font-[var(--font-display)] text-2xl text-[var(--color-secondary)] leading-none mb-1">+38%</span>
              <span className="text-[13px] text-[var(--color-text-secondary)] whitespace-nowrap">avg. reseller margin uplift</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
