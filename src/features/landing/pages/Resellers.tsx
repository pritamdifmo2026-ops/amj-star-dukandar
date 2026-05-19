import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

const stepCards = [
  { n: '1', title: 'Curate Catalog', desc: 'Choose the best products from our verified manufacturers and add them to your store.' },
  { n: '2', title: 'Share & Sell', desc: 'Share your personalized store link or individual products across social media like WhatsApp and Facebook.' },
  { n: '3', title: 'Collect Orders', desc: 'Receive orders from your customers. You decide your own profit margin on every sale.' },
  { n: '4', title: 'We Deliver', desc: 'Our suppliers ship the products directly to your customer with your branding. You keep the profit!' },
];

const perks = [
  { title: 'Zero Financial Risk', desc: 'No need to buy inventory upfront. Only pay when you receive an order from your customer.' },
  { title: 'Branded Packaging', desc: 'Send products in packaging that features your brand name, not the supplier\'s.' },
  { title: 'Marketing Assets', desc: 'Get high-quality images, videos, and descriptions to help you sell more effectively.' },
  { title: 'Timely Payouts', desc: 'Your profits are automatically calculated and transferred to your bank account weekly.' },
];

const Resellers: React.FC = () => (
  <MainLayout>
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] py-20 pb-12 text-center">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <h1 className="text-[42px] font-extrabold text-heading leading-[1.1] mb-4 max-md:text-[36px]">
            Welcome to the <span className="text-primary">Reseller</span> Hub
          </h1>
          <p className="text-base text-body leading-relaxed max-w-[600px] mx-auto mb-8">
            Start and scale your digital storefront with zero inventory. Connect with top suppliers and sell directly to your audience.
          </p>
          <Link to={`${ROUTES.LOGIN}?mode=reseller`} className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-[6px] no-underline hover:opacity-90 transition-opacity">
            Join as a Reseller
          </Link>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-[28px] font-extrabold text-heading mb-3">Your Path to Success</h2>
            <p className="text-[18px] text-body max-w-[600px] mx-auto">Start your online business journey with AMJStar in four simple steps.</p>
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
            <h2 className="text-[28px] font-extrabold text-heading mb-3">Reseller Perks</h2>
            <p className="text-[18px] text-body max-w-[600px] mx-auto">Why thousands of entrepreneurs choose AMJStar to build their businesses.</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6 max-sm:grid-cols-1">
            {perks.map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-6 bg-white rounded-[8px]">
                <TrendingUp size={24} className="text-primary shrink-0 mt-0.5" />
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

export default Resellers;
