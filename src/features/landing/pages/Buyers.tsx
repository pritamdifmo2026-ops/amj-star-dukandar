import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

const stepCards = [
  { n: '1', title: 'Search & Filter', desc: 'Browse through thousands of products or search specifically for what your business needs.' },
  { n: '2', title: 'Select & Quote', desc: 'Compare prices, check Minimum Order Quantities (MOQ), and get instant wholesale quotes.' },
  { n: '3', title: 'Secure Payment', desc: 'Pay securely through our integrated gateway with multiple payment options and escrow protection.' },
  { n: '4', title: 'Doorstep Delivery', desc: 'Receive your goods directly at your warehouse or shop with real-time tracking every step of the way.' },
];

const perks = [
  { title: 'Factory Direct Pricing', desc: 'Cut out the middlemen and buy directly from manufacturers at true wholesale rates.' },
  { title: 'Quality Guarantee', desc: 'Our "Star Verified" program ensures you only deal with manufacturers who meet high quality standards.' },
  { title: 'Flexible Credits', desc: 'Apply for business credit and pay for your inventory later as you grow your sales.' },
  { title: '24/7 Support', desc: 'Dedicated account managers to help you with sourcing, logistics, and any issues you face.' },
];

const Buyers: React.FC = () => (
  <MainLayout>
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] py-20 pb-12 text-center">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <h1 className="text-[42px] font-extrabold text-heading leading-[1.1] mb-4 max-md:text-[36px]">
            Welcome to the <span className="text-primary">Buyer</span> Portal
          </h1>
          <p className="text-base text-body leading-relaxed max-w-[600px] mx-auto mb-8">
            Discover top-quality products from verified manufacturers. Enjoy seamless purchasing, secure transactions, and unparalleled support.
          </p>
          <Link to={`${ROUTES.LOGIN}?mode=buyer`} className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-[6px] no-underline hover:opacity-90 transition-opacity">
            Join as a Buyer
          </Link>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-[28px] font-extrabold text-heading mb-3">How it Works for Buyers</h2>
            <p className="text-[18px] text-body max-w-[600px] mx-auto">Simple, transparent, and secure procurement in just four steps.</p>
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
            <h2 className="text-[28px] font-extrabold text-heading mb-3">Why Source with AMJStar?</h2>
            <p className="text-[18px] text-body max-w-[600px] mx-auto">We provide the tools and trust you need to grow your retail business.</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6 max-sm:grid-cols-1">
            {perks.map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-6 bg-white rounded-[8px]">
                <ShieldCheck size={24} className="text-primary shrink-0 mt-0.5" />
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

export default Buyers;
