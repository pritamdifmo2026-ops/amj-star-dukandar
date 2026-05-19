import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

const Suppliers: React.FC = () => {
  return (
    <MainLayout>
      <div className="bg-[var(--color-bg)] min-h-screen">
        <section className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] py-20 pb-12 text-center">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <h1 className="text-[42px] max-md:text-[36px] font-extrabold text-[var(--color-secondary)] leading-[1.1] mb-4">Welcome to the <span className="text-[var(--color-primary)]">Supplier</span> Network</h1>
            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed max-w-[600px] mx-auto mb-8">
              Expand your reach, streamline your wholesale operations, and connect directly with thousands of verified B2B buyers across India.
            </p>
            <Link to={`${ROUTES.LOGIN}?mode=seller`} className="bg-[var(--color-primary)] text-white border-none py-3 px-8 rounded-md font-bold text-base cursor-pointer no-underline inline-block hover:bg-[var(--color-primary)]">Join as a Supplier</Link>
          </div>
        </section>

        <section className="py-[60px] bg-white">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <div className="text-center mb-[60px]">
              <h2 className="text-[28px] font-extrabold text-[var(--color-secondary)] mb-3">How to Sell on AMJStar</h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-[600px] mx-auto">List your products and start receiving wholesale orders in minutes.</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 mt-10">
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">1</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">Register & Verify</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Complete your business profile and upload KYC documents to become a verified supplier.</p>
              </div>
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">2</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">List Products</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Use our bulk upload tools to list your catalog with wholesale pricing and MOQs.</p>
              </div>
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">3</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">Receive Orders</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Get notified instantly when buyers or resellers place orders for your products.</p>
              </div>
              <div className="relative p-10 bg-white rounded-[10px] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">4</div>
                <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-2">Get Paid Fast</h4>
                <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">Payments are settled directly to your bank account as soon as delivery is confirmed.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-[60px] bg-[var(--color-bg)]">
          <div className="w-full max-w-[var(--container-max)] mx-auto px-8">
            <div className="text-center mb-[60px]">
              <h2 className="text-[28px] font-extrabold text-[var(--color-secondary)] mb-3">Supplier Advantages</h2>
              <p className="text-lg text-[var(--color-text-secondary)] max-w-[600px] mx-auto">Scale your manufacturing business with our digital distribution tools.</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] max-[600px]:grid-cols-1 gap-6 mt-10">
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <CheckCircle className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Zero Marketing Cost</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Get your products in front of thousands of active B2B buyers without spending on ads.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <CheckCircle className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Analytics & Insights</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Understand demand trends and optimize your production based on real-time market data.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <CheckCircle className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Logistics Support</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Leverage our network of 20,000+ pin codes coverage for seamless nationwide distribution.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <CheckCircle className="text-[var(--color-primary)] shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="text-lg font-bold text-[var(--color-secondary)] mb-1">Payment Security</h4>
                  <p className="text-[15px] text-[var(--color-text-secondary)] m-0">Eliminate payment defaults with our secure escrow and verified buyer network.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Suppliers;
