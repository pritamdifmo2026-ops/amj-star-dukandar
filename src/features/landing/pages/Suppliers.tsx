import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

const stepCards = [
  { n: '1', title: 'Register & Verify', desc: 'Complete your business profile and upload KYC documents to become a verified supplier.' },
  { n: '2', title: 'List Products', desc: 'Use our bulk upload tools to list your entire catalog with wholesale pricing and MOQs.' },
  { n: '3', title: 'Receive Orders', desc: 'Get notified instantly when buyers or resellers place orders for your products.' },
  { n: '4', title: 'Get Paid Fast', desc: 'Payments are settled directly to your bank account as soon as delivery is confirmed.' },
];

const advantages = [
  { title: 'Zero Marketing Cost', desc: 'Get your products in front of thousands of active B2B buyers without spending on ads.' },
  { title: 'Analytics & Insights', desc: 'Understand demand trends and optimize your production based on real-time market data.' },
  { title: 'Logistics Support', desc: 'Leverage our network of 20,000+ pin codes coverage for seamless nationwide distribution.' },
  { title: 'Payment Security', desc: 'Eliminate payment defaults with our secure escrow and verified buyer network.' },
];

const Suppliers: React.FC = () => (
  <MainLayout>
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] py-20 pb-12 text-center">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <h1 className="text-[42px] font-extrabold text-heading leading-[1.1] mb-4 max-md:text-[36px]">
            Welcome to the <span className="text-primary">Supplier</span> Network
          </h1>
          <p className="text-base text-body leading-relaxed max-w-[600px] mx-auto mb-8">
            Expand your reach, streamline your wholesale operations, and connect directly with thousands of verified B2B buyers across India.
          </p>
          <Link to={`${ROUTES.LOGIN}?mode=seller`} className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-[6px] no-underline hover:opacity-90 transition-opacity">
            Join as a Supplier
          </Link>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-[28px] font-extrabold text-heading mb-3">How to Sell on AMJSTAR</h2>
            <p className="text-[18px] text-body max-w-[600px] mx-auto">List your products and start receiving wholesale orders in minutes.</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 max-md:grid-cols-1">
            {stepCards.map(({ n, title, desc }) => (
              <div key={n} className="relative p-10 bg-white rounded-[10px] border border-border hover:border-primary transition-colors">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">{n}</div>
                <h4 className="text-heading font-bold text-base mb-2">{title}</h4>
                <p className="text-body text-sm leading-relaxed m-0">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-cream">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-[28px] font-extrabold text-heading mb-3">Supplier Advantages</h2>
            <p className="text-[18px] text-body max-w-[600px] mx-auto">Scale your manufacturing business with our digital distribution tools.</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6 max-sm:grid-cols-1">
            {advantages.map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-6 bg-white rounded-[8px]">
                <CheckCircle size={24} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-heading font-bold text-[18px] mb-1">{title}</h4>
                  <p className="text-body text-[15px] m-0">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  </MainLayout>
);

export default Suppliers;
