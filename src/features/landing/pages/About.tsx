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

      {/* ── Our Story ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0f172a] mb-6">
              {story?.heading ?? 'Our Story'}
            </h2>
            <p className="text-[#475569] text-sm leading-[1.9] mb-5">
              {story?.text ?? 'Founded in 2024, AMJSTAR started with a simple observation: the wholesale market was fragmented and difficult to navigate for small-scale resellers and growing manufacturers. We saw an opportunity to build a bridge—a digital ecosystem where trust is the primary currency.'}
            </p>
            <p className="text-[#475569] text-sm leading-[1.9]">
              {story?.body ?? "Today, we are proud to be one of India's fastest-growing B2B platforms, serving thousands of partners across the country with a focus on quality, speed, and reliability."}
            </p>
          </div>

          <div className="bg-[#fafafa] border border-[#eef2f6] rounded-[16px] p-8">
            <p className="text-[#1e293b] text-base font-medium leading-relaxed italic mb-8">
              "{sm.quoteText ?? 'We believe that every business, no matter how small, deserves a global platform to shine. AMJSTAR is that stage.'}"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-extrabold shrink-0">
                {sm.quoteInitials ?? 'AV'}
              </div>
              <div>
                <p className="font-bold text-[#0f172a] text-sm">{sm.quoteAuthor ?? "Founder's Vision"}</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">{sm.quoteRole ?? 'CEO, AMJSTAR'}</p>
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
