import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

const Buyers: React.FC = () => {
  return (
    <MainLayout>
      <div className="bg-[var(--color-bg)] min-h-screen">
        <section className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] py-20 pb-12 text-center">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <h1 className="text-[42px] max-md:text-[36px] font-extrabold text-[var(--color-secondary)] leading-[1.1] mb-4">Welcome to the <span className="text-[var(--color-primary)]">Buyer</span> Portal</h1>
            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed max-w-[600px] mx-auto mb-8">
              Discover top-quality products from verified manufacturers. Enjoy seamless purchasing, secure transactions, and unparalleled support.
            </p>
            <Link to={`${ROUTES.LOGIN}?mode=buyer`} className="bg-[var(--color-primary)] text-white border-none py-3 px-8 rounded-md font-bold text-base cursor-pointer no-underline inline-block hover:bg-[var(--color-primary)]">Join as a Buyer</Link>
          </div>
        </section>

        <section className="py-[60px] bg-white">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <div className="text-center mb-[60px]">
              <h2 className="text-[28px] font-extrabold text-[var(--color-secondary)] mb-3">How it Works for Buyers</h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-[600px] mx-auto">Simple, transparent, and secure procurement in just four steps.</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 mt-10">
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">1</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">Search & Filter</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Browse through thousands of products or search specifically for what your business needs.</p>
              </div>
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">2</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">Select & Quote</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Compare prices, check Minimum Order Quantities (MOQ), and get instant wholesale quotes.</p>
              </div>
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">3</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">Secure Payment</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Pay securely through our integrated gateway with multiple payment options and escrow protection.</p>
              </div>
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">4</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">Doorstep Delivery</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Receive your goods directly at your warehouse or shop with real-time tracking every step of the way.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-[60px] bg-[var(--color-bg)]">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <div className="text-center mb-[60px]">
              <h2 className="text-[28px] font-extrabold text-[var(--color-secondary)] mb-3">Why Source with AMJStar?</h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-[600px] mx-auto">We provide the tools and trust you need to grow your retail business.</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] max-[600px]:grid-cols-1 gap-6 mt-10">
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <ShieldCheck className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Factory Direct Pricing</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Cut out the middlemen and buy directly from manufacturers at true wholesale rates.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <ShieldCheck className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Quality Guarantee</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Our "Star Verified" program ensures you only deal with manufacturers who meet high quality standards.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <ShieldCheck className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Flexible Credits</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Apply for business credit and pay for your inventory later as you grow your sales.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <ShieldCheck className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">24/7 Support</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Dedicated account managers to help you with sourcing, logistics, and any issues you face.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Buyers;
