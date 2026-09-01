import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, TrendingUp, Handshake, Quote } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import api from '@/api/client';
import logo from '@/assets/logoo.png';
import aboutImage from '@/assets/images/about-image.png';

interface Section {
  id: string;
  type: string;
  heading?: string;
  subheading?: string;
  body?: string;
  text?: string;
  url?: string;
  meta?: Record<string, string>;
}

interface PageData {
  slug: string;
  title: string;
  sections: Section[];
}

const VALUE_ICONS = [
  <ShieldCheck size={22} className="text-primary" />,
  <TrendingUp size={22} className="text-primary" />,
  <Handshake size={22} className="text-primary" />,
];

const About: React.FC = () => {
  const { data } = useQuery<PageData>({
    queryKey: ['page', 'about'],
    queryFn: async () => {
      const res = await api.get('/pages/about');
      return res.data.page;
    },
    staleTime: 5 * 60 * 1000,
  });

  const hero = data?.sections.find(s => s.type === 'about-hero');
  const story = data?.sections.find(s => s.type === 'about-story');
  const vals = data?.sections.find(s => s.type === 'about-values');

  const hm = hero?.meta ?? {};
  const vm = vals?.meta ?? {};

  const values = [
    { title: vm.v1Title ?? 'Absolute Trust', desc: vm.v1Desc ?? '' },
    { title: vm.v2Title ?? 'Growth First', desc: vm.v2Desc ?? '' },
    { title: vm.v3Title ?? 'Solid Partnerships', desc: vm.v3Desc ?? '' },
  ];

  return (
    <MainLayout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#faf8f5] py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-4 py-1.5 bg-orange-50 text-primary rounded-full text-sm font-bold mb-6">
              {hero?.subheading ?? 'Our Journey'}
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] leading-tight mb-6">
              {hero?.heading ?? 'Redefining'}{' '}
              <span className="text-primary">{hm.headingHighlight ?? 'B2B Commerce'}</span>{' '}
              {hm.headingSuffix ?? 'for the Digital Age'}
            </h1>
            <p className="text-[#475569] text-base leading-relaxed mb-8 max-w-lg">
              {hero?.body ?? "AMJSTAR is not just a marketplace; it's a movement to empower millions of businesses by bridging the gap between quality manufacturing and retail accessibility."}
            </p>
            <div className="flex items-center gap-5">
              <button className="px-6 py-3 bg-primary text-white font-bold rounded-[8px] text-sm hover:bg-primary/90 transition-colors cursor-pointer">
                {hm.primaryCta ?? 'Our Mission'}
              </button>
            </div>
          </div>

          <div className="rounded-[18px] overflow-hidden shadow-xl">

            <img
              src={aboutImage}
              alt={hm.heroAlt ?? 'About AMJSTAR'}
              className="w-full h-full object-cover max-h-[420px]"
            />

          </div>
        </div>
      </section>

      {/* ── Director's Vision & Our Story ──────────────────────────────────────────────────────── */}
      {/* ── Director's Vision & Our Story ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Side: All Text */}
          <div className="space-y-12">
            {/* Director's Vision Section */}
            <div>
              <span className="inline-block px-4 py-1.5 bg-orange-50 text-primary rounded-full text-sm font-bold mb-6">
                Director's Vision
              </span>
              <h2 className="text-3xl font-extrabold text-[#0f172a] mb-6">
                Empowering Businesses to Learn and Grow
              </h2>
              <p className="text-[#475569] text-sm leading-[1.9] mb-10">
                "AMJSTAR is built on the foundation of education and empowerment. Our vision is to create a transparent, secure, and thriving B2B ecosystem where every small business can access a national market and unlock its true potential."
              </p>
            </div>

            {/* Our Story Section */}
            <div>
              <h3 className="text-2xl font-extrabold text-[#0f172a] mb-4">{story?.heading ?? 'Our Story'}</h3>
              <p className="text-[#475569] text-sm leading-[1.9]">
                {story?.text ?? "Founded to bridge the gap in a fragmented wholesale market, AMJSTAR is a digital ecosystem where trust is the primary currency. Today, we empower thousands of partners across India with quality, speed, and reliability."}
              </p>
            </div>
          </div>

          {/* Right Side: Large Photo & Details */}
          <div className="relative mt-8 lg:mt-0 flex flex-col items-center lg:items-end">
            <div className="w-full max-w-[460px] flex flex-col items-center">
              <div className="relative mb-8">
                <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full overflow-hidden bg-white border border-gray-200 mx-auto shadow-sm">
                  <img
                    src="/images/kuldeep-redhu.jpg"
                    alt="Kuldeep Redhu"
                    className="w-full h-full object-cover object-left translate-x-8 sm:translate-x-12 hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-primary/50"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg><span class="mt-4 font-bold text-lg">Not Found</span></div>';
                    }}
                  />
                </div>
              </div>

              {/* Info Text Below Image */}
              <div className="text-center mt-2 mb-5">
                <h3 className="text-3xl font-display font-normal text-gray-900 tracking-tight m-0">Mr. Kuldeep Redhu</h3>
                <div className="inline-flex items-center justify-center mt-4 space-x-3">
                  <span className="h-px w-8 bg-primary/30"></span>
                  <p className="text-xs text-primary font-bold tracking-widest uppercase m-0">Director</p>
                  <span className="h-px w-8 bg-primary/30"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Leadership Vision ────────────────────────────────────────── */}
      <section className="bg-white pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">

            {/* Founder Quote */}
            <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 order-2 md:order-1">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100 bg-white flex items-center justify-center">
                  <img src={logo} alt="AMJSTAR Logo" className="w-full h-full object-cover scale-[2]" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex gap-2 mb-4">
                  <Quote className="w-5 h-5 text-orange-400/40 fill-current flex-shrink-0 mt-0.5" />
                  <p className="text-[#334155] text-sm md:text-base italic font-medium leading-relaxed">
                    We believe that every business, no matter how small, deserves a global platform to shine. AMJSTAR is that <span className="whitespace-nowrap">stage.<Quote className="w-5 h-5 text-orange-400/40 fill-current rotate-180 inline-block ml-1 -mt-1" /></span>
                  </p>
                </div>
                <div>
                  <h4 className="text-[#0f172a] font-bold text-sm m-0">Mr. Manish Jangra</h4>
                  <p className="text-primary text-xs font-semibold mt-0.5 m-0">Founder, AMJSTAR</p>
                </div>
              </div>
            </div>

            {/* CFO Quote */}
            <div className="bg-white border border-[#eef2f6] rounded-[14px] p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 order-1 md:order-2">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-orange-400 text-white flex items-center justify-center font-bold text-xl">
                  U
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex gap-2 mb-4">
                  <Quote className="w-5 h-5 text-orange-400/40 fill-current flex-shrink-0 mt-0.5" />
                  <p className="text-[#334155] text-sm md:text-base italic font-medium leading-relaxed">
                    Restructuring India's B2B ecosystem with a transparent, tech-driven supply chain to empower every <span className="whitespace-nowrap">stakeholder.<Quote className="w-5 h-5 text-orange-400/40 fill-current rotate-180 inline-block ml-1 -mt-1" /></span>
                  </p>
                </div>
                <div>
                  <h4 className="text-[#0f172a] font-bold text-sm m-0">Mrs. Umesh Jangra</h4>
                  <p className="text-primary text-xs font-semibold mt-0.5 m-0">CFO & Director, AMJSTAR</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Core Values ────────────────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#0f172a] text-center mb-12">
            {vals?.heading ?? 'Our Core Values'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-[14px] border border-[#eef2f6] p-8 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-[10px] bg-orange-50 flex items-center justify-center mb-5">
                  {VALUE_ICONS[i]}
                </div>
                <h3 className="font-extrabold text-[#0f172a] text-base mb-2">{v.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default About;
