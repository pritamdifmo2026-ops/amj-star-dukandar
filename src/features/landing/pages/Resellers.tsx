import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

const Resellers: React.FC = () => {
  return (
    <MainLayout>
      <div className="bg-[var(--color-bg)] min-h-screen">
        <section className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] py-20 pb-12 text-center">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <h1 className="text-[42px] max-md:text-[36px] font-extrabold text-[var(--color-secondary)] leading-[1.1] mb-4">Welcome to the <span className="text-[var(--color-primary)]">Reseller</span> Hub</h1>
            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed max-w-[600px] mx-auto mb-8">
              Start and scale your digital storefront with zero inventory. Connect with top suppliers and sell directly to your audience.
            </p>
            <Link to={`${ROUTES.LOGIN}?mode=reseller`} className="bg-[var(--color-primary)] text-white border-none py-3 px-8 rounded-md font-bold text-base cursor-pointer no-underline inline-block hover:bg-[var(--color-primary)]">Join as a Reseller</Link>
          </div>
        </section>

        <section className="py-[60px] bg-white">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <div className="text-center mb-[60px]">
              <h2 className="text-[28px] font-extrabold text-[var(--color-secondary)] mb-3">Your Path to Success</h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-[600px] mx-auto">Start your online business journey with AMJStar in four simple steps.</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 mt-10">
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">1</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">Curate Catalog</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Choose the best products from our verified manufacturers and add them to your store.</p>
              </div>
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">2</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">Share & Sell</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Share your personalized store link or individual products across social media like WhatsApp and Facebook.</p>
              </div>
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">3</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">Collect Orders</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Receive orders from your customers. You decide your own profit margin on every sale.</p>
              </div>
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">4</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">We Deliver</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Our suppliers ship the products directly to your customer with your branding. You keep the profit!</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-[60px] bg-[var(--color-bg)]">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <div className="text-center mb-[60px]">
              <h2 className="text-[28px] font-extrabold text-[var(--color-secondary)] mb-3">Reseller Perks</h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-[600px] mx-auto">Why thousands of entrepreneurs choose AMJStar to build their businesses.</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] max-[600px]:grid-cols-1 gap-6 mt-10">
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <TrendingUp className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Zero Financial Risk</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">No need to buy inventory upfront. Only pay when you receive an order from your customer.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <TrendingUp className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Branded Packaging</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Send products in packaging that features your brand name, not the supplier's.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <TrendingUp className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Marketing Assets</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Get high-quality images, videos, and descriptions to help you sell more effectively.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <TrendingUp className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Timely Payouts</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Your profits are automatically calculated and transferred to your bank account weekly.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Resellers;
