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
      <section className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white py-24 px-4">
        <div className="max-w-[1200px] mx-auto text-center">
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold mb-4 m-0">
            Welcome to the <span className="text-primary">Buyer</span> Portal
          </h1>
          <p className="text-lg text-[#94a3b8] max-w-[600px] mx-auto mb-8">
            Discover top-quality products from verified manufacturers. Enjoy seamless purchasing, secure transactions, and unparalleled support.
          </p>
          <Link to={`${ROUTES.LOGIN}?mode=buyer`} className="inline-block bg-primary text-white font-bold px-8 py-3.5 rounded-[10px] no-underline hover:opacity-90 transition-opacity">
            Join as a Buyer
          </Link>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-[#0f172a] mb-2">How it Works for Buyers</h2>
            <p className="text-[#64748b]">Simple, transparent, and secure procurement in just four steps.</p>
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
            <h2 className="text-2xl font-extrabold text-[#0f172a] mb-2">Why Source with AMJStar?</h2>
            <p className="text-[#64748b]">We provide the tools and trust you need to grow your retail business.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
            {perks.map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white border border-[#eef2f6] rounded-[12px] p-5">
                <ShieldCheck size={24} className="text-primary shrink-0 mt-0.5" />
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

export default Buyers;
