import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, ArrowLeft } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';

const Resellers: React.FC = () => (
  <MainLayout>
    <div className="min-h-full flex items-center justify-center bg-white px-8 py-20">
      <div className="text-center max-w-[600px] mx-auto flex flex-col items-center">
        <div className="w-20 h-20 rounded-full border border-border bg-[#fffcf5] flex items-center justify-center mb-8 shadow-sm">
          <Rocket size={32} className="text-primary" />
        </div>
        <h1 className="text-[46px] font-display font-normal text-heading leading-[1.15] mb-6 max-md:text-[36px]">
          Something Awesome is <br />
          <span className="text-primary italic">Coming Soon</span>
        </h1>
        <p className="text-[15px] text-body leading-relaxed mb-10 max-w-[500px]">
          We're currently building the AMJSTAR Reseller Hub. Get ready for a revolutionary way to start and scale your digital storefront with zero inventory!

        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-3.5 rounded-full border-none cursor-pointer hover:bg-primary-dark transition-all text-sm no-underline shadow-[0_4px_14px_0_var(--color-primary-soft)]"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div className="h-100">

        </div>
      </div>
    </div>
  </MainLayout>
);

export default Resellers;
