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
      <section className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white py-24 px-4">
        <div className="max-w-[1200px] mx-auto text-center">
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold mb-4 m-0">
            Welcome to the <span className="text-primary">Supplier</span> Network
          </h1>
          <p className="text-lg text-[#94a3b8] max-w-[600px] mx-auto mb-8">
            Expand your reach, streamline your wholesale operations, and connect directly with thousands of verified B2B buyers across India.
          </p>
          <Link to={`${ROUTES.LOGIN}?mode=seller`} className="inline-block bg-primary text-white font-bold px-8 py-3.5 rounded-[10px] no-underline hover:opacity-90 transition-opacity">
            Join as a Supplier
          </Link>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-[#0f172a] mb-2">How to Sell on AMJStar</h2>
            <p className="text-[#64748b]">List your products and start receiving wholesale orders in minutes.</p>
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
            <h2 className="text-2xl font-extrabold text-[#0f172a] mb-2">Supplier Advantages</h2>
            <p className="text-[#64748b]">Scale your manufacturing business with our digital distribution tools.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
            {advantages.map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white border border-[#eef2f6] rounded-[12px] p-5">
                <CheckCircle size={24} className="text-primary shrink-0 mt-0.5" />
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

export default Suppliers;
