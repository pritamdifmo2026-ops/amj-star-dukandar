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

      {/* Simple Listing Pricing Section */}
      <section className="py-16 bg-white border-b border-[#e2e8f0]">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-[28px] font-extrabold text-heading mb-3">Simple Listing Pricing</h2>
            <p className="text-[18px] text-body max-w-[600px] mx-auto">Grow your catalog without expensive listing fees.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-[900px] mx-auto">
            <div className="text-left flex-1">
              <h3 className="text-[24px] font-extrabold text-heading mb-2">List Products Starting at Just ₹10 Each</h3>
              <p className="text-[16px] text-body mb-6">Grow your online wholesale catalog without high upfront costs.</p>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="text-[48px] font-extrabold text-primary leading-none">₹10</div>
                <div className="text-[18px] font-bold text-body mt-2">per product / month</div>
              </div>
              
              <div className="inline-block bg-cream text-heading font-medium px-4 py-1.5 rounded-full text-[14px]">
                Minimum monthly charge ₹499
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-5">
              {[
                'Zero hidden setup or onboarding fees',
                'Reach thousands of verified buyers',
                'Add or remove products anytime',
                'Pay only for what you list'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={22} className="text-primary shrink-0" />
                  <span className="text-[16px] font-medium text-body">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <div className="text-center mb-14">
            <h2 className="text-[28px] font-extrabold text-heading mb-3">Subscription Plans</h2>
            <p className="text-[18px] text-body max-w-[600px] mx-auto">Choose a plan that fits your business needs and scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: 'VERIFIED',
                label: 'Verified Supplier',
                desc: 'Build trust and verify your business.',
                price: '₹2,100',
                period: '/year + GST',
                features: ['GST Verified Badge', 'Unlimited Product Listings', 'Buyer Direct Contact', 'Inventory Management', 'Share Products via WhatsApp & Social Media', 'Better Search Ranking'],
                buttonText: 'Get Verified'
              },
              {
                id: 'GAMMA',
                label: 'SME TrustSEAL Gamma',
                desc: 'Everything in Verified',
                price: '₹21,000',
                period: '/year + GST',
                features: ['TrustSEAL Badge', 'Physical Business Verification', 'Higher Search Ranking', 'Featured Placement', 'Priority Lead Visibility', 'Technical Product Verification'],
                buttonText: 'Upgrade to Gamma'
              },
              {
                id: 'BETA',
                label: 'SME TrustSEAL Beta',
                desc: 'Everything in Gamma, plus complete listing support.',
                price: '₹51,000',
                period: '/year + GST',
                features: ['Dedicated Listing Support', 'Product Catalog Management', 'SEO Optimization', 'Product Content Writing', 'Listing Optimization', 'Technical Support Throughout the Year'],
                buttonText: 'Upgrade to Beta'
              },
            ].map(tier => (
              <div
                key={tier.id}
                className="flex flex-col gap-4 p-6 border-2 border-[#e2e8f0] rounded-[12px] bg-white hover:border-primary transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] relative"
              >
                {tier.id !== 'VERIFIED' && (
                  <div className="absolute top-0 right-0 bg-[#fff7ed] text-[#ea580c] text-xs font-bold px-3 py-1 rounded-bl-[10px] rounded-tr-[10px]">
                    PREMIUM
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-extrabold text-[#0f172a] m-0 mb-1">{tier.label}</h3>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-2xl font-extrabold text-primary">{tier.price}</span>
                    <span className="text-sm font-semibold text-[#64748b] mb-1">{tier.period}</span>
                  </div>
                  <p className="text-sm text-[#64748b] m-0 min-h-[40px]">{tier.desc}</p>
                </div>

                <div className="h-[1px] w-full bg-[#f1f5f9] my-2" />

                <div className="flex flex-col gap-2 flex-1">
                  {tier.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-[#059669] shrink-0 mt-0.5" />
                      <span className="text-sm text-[#475569] font-medium leading-tight">{f}</span>
                    </div>
                  ))}
                </div>

                <Link to={`${ROUTES.LOGIN}?mode=seller`} className="mt-4 w-full block text-center py-2.5 rounded-[8px] font-bold text-sm bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] hover:bg-primary hover:text-white hover:border-primary transition-colors">
                  {tier.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  </MainLayout>
);

export default Suppliers;
