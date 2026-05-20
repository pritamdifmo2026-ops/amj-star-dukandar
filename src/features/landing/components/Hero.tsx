import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { ArrowRight } from 'lucide-react';
import heroImage from '@/assets/images/image.png';

const Hero: React.FC = () => {
  return (
    <section className="bg-cream py-10 overflow-hidden">
      <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 flex items-center justify-between gap-10 max-[1100px]:flex-col max-[1100px]:text-center max-[1100px]:gap-12">
        <div className="flex-1 max-[1100px]:flex max-[1100px]:flex-col max-[1100px]:items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream border border-border rounded-full font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-primary mb-4">
            <span className="w-2 h-2 bg-primary rounded-full" />
            Join AMJSTAR and grow your wholesale business today.
          </div>

          <h1 className="font-display text-[clamp(1.8rem,5vw,2.8rem)] leading-none text-heading mb-4 font-normal">
            <span className="text-primary italic">AMJSTAR</span>{' '}
            connects wholesalers, suppliers, and resellers with a smarter B2B wholesale platform.
          </h1>

          <p className="font-sans text-sm text-body mb-6 max-w-[600px] leading-relaxed max-[1100px]:mx-auto max-[1100px]:mb-12">
            AMJSTAR connects wholesalers, local retail resellers, and business
            buyers in one trade network. Quote-based ordering and bulk fulfillment.
          </p>

          <div className="flex flex-row gap-4 mb-8 max-[1100px]:justify-center max-[640px]:w-full items-center">
            <Link
              to={`${ROUTES.LOGIN}?mode=buyer`}
              className="flex-1 justify-center bg-primary text-white px-6 py-3 max-[640px]:px-3 max-[640px]:py-2 max-[640px]:text-xs text-sm font-semibold rounded-full no-underline flex items-center gap-2 transition-all hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_var(--color-primary)] whitespace-nowrap"
            >
              Join as Buyer <ArrowRight size={18} className="max-[640px]:w-4 max-[640px]:h-4" />
            </Link>
            <Link
              to={`${ROUTES.LOGIN}?mode=seller`}
              className="flex-1 justify-center text-center bg-cream text-heading px-6 py-3 max-[640px]:px-3 max-[640px]:py-2 max-[640px]:text-xs text-sm font-semibold rounded-full no-underline border border-border transition-all hover:border-heading hover:bg-[#f8f8f8] whitespace-nowrap"
            >
              Become a Supplier
            </Link>
          </div>

          <div className="flex items-center gap-6 max-[1100px]:justify-center max-[640px]:gap-5 max-[640px]:flex-wrap">
            <div className="flex flex-col">
              <span className="font-display text-2xl text-heading leading-none">50k+</span>
              <span className="text-xs text-muted">Verified Suppliers</span>
            </div>
            <div className="w-px h-6 bg-border max-[640px]:hidden" />
            <div className="flex flex-col">
              <span className="font-display text-2xl text-heading leading-none">2M+</span>
              <span className="text-xs text-muted">Bulk Products</span>
            </div>
            <div className="w-px h-6 bg-border max-[640px]:hidden" />
            <div className="flex flex-col">
              <span className="font-display text-2xl text-heading leading-none">B2B</span>
              <span className="text-xs text-muted">First Platform</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-end max-[1100px]:justify-center">
          <div className="relative w-full max-w-[480px]">
            <img
              src={heroImage}
              alt="B2B Marketplace"
              className="w-full h-auto rounded-[32px] block shadow-[0_20px_40px_-20px_rgba(0,0,0,0.2)]"
            />
            <div className="absolute bottom-5 -left-5 max-[1100px]:left-5 max-[1100px]:-bottom-5 bg-cream p-4 rounded-[6px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex flex-col z-[2] border border-border">
              <span className="font-display text-2xl text-heading leading-none mb-1">+38%</span>
              <span className="text-[13px] text-body whitespace-nowrap">avg. reseller margin uplift</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
