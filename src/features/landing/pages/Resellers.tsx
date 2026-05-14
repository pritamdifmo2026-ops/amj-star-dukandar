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
      <section className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white py-24 px-4">
        <div className="max-w-[1200px] mx-auto text-center">
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold mb-4 m-0">
            Welcome to the <span className="text-primary">Reseller</span> Hub
          </h1>
          <p className="text-lg text-[#94a3b8] max-w-[600px] mx-auto mb-8">
            Start and scale your digital storefront with zero inventory. Connect with top suppliers and sell directly to your audience.
          </p>
          <Link to={`${ROUTES.LOGIN}?mode=reseller`} className="inline-block bg-primary text-white font-bold px-8 py-3.5 rounded-[10px] no-underline hover:opacity-90 transition-opacity">
            Join as a Reseller
          </Link>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-[#0f172a] mb-2">Your Path to Success</h2>
            <p className="text-[#64748b]">Start your online business journey with AMJStar in four simple steps.</p>
          </div>
          <div className="grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {stepCards.map(({ n, title, desc }) => (
              <div key={n} className="bg-[#f8fafc] border border-[#eef2f6] rounded-[12px] p-6 text-center">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-lg font-extrabold mx-auto mb-3">{n}</div>
                <h4 className="font-bold text-[#0f172a] mb-2">{title}</h4>
                <p className="text-sm text-[#64748b] m-0">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#f8fafc]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-[#0f172a] mb-2">Reseller Perks</h2>
            <p className="text-[#64748b]">Why thousands of entrepreneurs choose AMJStar to build their businesses.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
            {perks.map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white border border-[#eef2f6] rounded-[12px] p-5">
                <TrendingUp size={24} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#0f172a] mb-1">{title}</h4>
                  <p className="text-sm text-[#64748b] m-0">{desc}</p>
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
