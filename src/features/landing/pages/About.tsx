import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, TrendingUp, Handshake, ImageIcon } from 'lucide-react';
import MainLayout from '@/shared/layout/MainLayout';
import api from '@/api/client';

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

  const hero  = data?.sections.find(s => s.type === 'about-hero');
  const story = data?.sections.find(s => s.type === 'about-story');
  const vals  = data?.sections.find(s => s.type === 'about-values');

  const hm = hero?.meta  ?? {};
  const sm = story?.meta ?? {};
  const vm = vals?.meta  ?? {};

  const values = [
    { title: vm.v1Title ?? 'Absolute Trust',     desc: vm.v1Desc ?? '' },
    { title: vm.v2Title ?? 'Growth First',        desc: vm.v2Desc ?? '' },
    { title: vm.v3Title ?? 'Solid Partnerships',  desc: vm.v3Desc ?? '' },
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
            {hero?.url ? (
              <img
                src={hero.url}
                alt={hm.heroAlt ?? 'About AMJSTAR'}
                className="w-full h-full object-cover max-h-[420px]"
              />
            ) : (
              <div className="min-h-[280px] bg-[#f1f5f9] border-2 border-dashed border-[#e2e8f0] rounded-[18px] flex flex-col items-center justify-center gap-3 text-[#94a3b8]">
                <ImageIcon size={36} className="opacity-40" />
                <span className="text-sm">No image set</span>
              </div>
            )}
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
              <p className="text-[#475569] text-sm leading-[1.9] mb-5">
                "As a teacher, my life has been dedicated to guiding individuals and helping them unlock their true potential. AMJSTAR was built on this very foundation of education and empowerment. We noticed that small-scale manufacturers and resellers had the ambition but lacked a trustworthy platform to connect and scale."
              </p>
              <p className="text-[#475569] text-sm leading-[1.9]">
                "Our vision is to build a transparent, secure, and thriving B2B ecosystem. We want every business, no matter how small, to have access to a national market, just as every student deserves access to quality education. AMJSTAR is that platform—your partner in growth."
              </p>
            </div>

            {/* Our Story Section */}
            <div>
              <h3 className="text-2xl font-extrabold text-[#0f172a] mb-5">{story?.heading ?? 'Our Story'}</h3>
              <p className="text-[#475569] text-sm leading-[1.9] mb-5">
                {story?.text ?? 'Founded in 2024, AMJSTAR started with a simple observation: the wholesale market was fragmented and difficult to navigate for small-scale resellers and growing manufacturers.'}
              </p>
              <p className="text-[#475569] text-sm leading-[1.9]">
                {story?.body ?? "Today, we are proud to be one of India's fastest-growing B2B platforms, serving thousands of partners across the country with a focus on quality, speed, and reliability."}
              </p>
            </div>
          </div>

          {/* Right Side: Large Photo & Details */}
          <div className="relative mt-8 lg:mt-0 flex flex-col items-center lg:items-end">
            <div className="w-full max-w-[460px]">
              <div className="bg-white rounded-[24px] p-4 border border-gray-100 w-full shadow-none">
                <div className="w-full h-[540px] rounded-[18px] overflow-hidden bg-gray-50">
                  <img 
                    src="/images/kuldeep-redhu.jpg" 
                    alt="Kuldeep Redhu" 
                    className="w-full h-full object-cover object-center scale-[1.03] hover:scale-[1.08] transition-transform duration-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-primary/50"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg><span class="mt-4 font-bold text-lg">Image Not Found</span></div>';
                    }}
                  />
                </div>
                
                {/* Info Card Below Image */}
                <div className="text-center mt-8 mb-5">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">Mr. Kuldeep Redhu</h3>
                  <div className="inline-flex items-center justify-center mt-4 space-x-3">
                    <span className="h-px w-8 bg-primary/30"></span>
                    <p className="text-sm text-primary font-bold tracking-widest uppercase">Director & Founder</p>
                    <span className="h-px w-8 bg-primary/30"></span>
                  </div>
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
