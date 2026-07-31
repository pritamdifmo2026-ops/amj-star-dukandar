import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, ShoppingBag, Factory, RefreshCw } from 'lucide-react';
import appConfig from '@/config/app.config';
import logo from '@/assets/logoo.png';
import { ROUTES } from '@/shared/constants/routes';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import Modal from '@/shared/components/ui/Modal';

const fetchSettings = async () => {
  const res = await api.get('/settings/platform');
  return res.data.settings;
};

const colTitleCls = "text-[0.78rem] sm:text-[0.82rem] font-bold uppercase tracking-wider text-[oklch(0.18_0.02_240)] mb-4 sm:mb-5";
const linkCls = "text-[oklch(0.40_0.02_240)] text-[0.78rem] sm:text-[0.82rem] no-underline transition-colors hover:text-primary hover:underline inline-block";


const Footer: React.FC = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['public', 'platformSettings'],
    queryFn: fetchSettings,
  });

  const socialLinks = [
    { Icon: Facebook, label: 'Facebook', url: settings?.socialMedia?.facebook },
    { Icon: Twitter, label: 'Twitter', url: settings?.socialMedia?.twitter },
    { Icon: Linkedin, label: 'LinkedIn', url: settings?.socialMedia?.linkedin },
    { Icon: Instagram, label: 'Instagram', url: settings?.socialMedia?.instagram },
  ].filter(s => !!s.url);

  return (
    <footer className="bg-[oklch(0.98_0.01_80)] text-[oklch(0.25_0.02_240)] font-sans border-t border-[oklch(0.92_0.01_80)]">
      {/* Main footer */}
      <div className="py-10 sm:py-14 pb-6 sm:pb-8">
        <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-8 md:gap-10">

            {/* Brand */}
            <div className="flex flex-col gap-4 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-1">
              <Link to={ROUTES.HOME} className="font-display text-[1.15rem] sm:text-[1.25rem] font-semibold text-[oklch(0.18_0.02_240)] no-underline flex items-center gap-2">
                <img src={logo} alt="AMJSTAR Logo" className="w-7 h-7 rounded-full object-contain" />
                <span>{appConfig.appName}</span>
              </Link>
              <p className="text-[oklch(0.40_0.02_240)] leading-[1.6] text-[0.78rem] sm:text-[0.82rem] max-w-md">
                India's leading B2B wholesale marketplace connecting verified buyers with trusted suppliers across the nation. Trade globally, connect locally.
              </p>
              <div className="flex gap-2 mt-1">
                {socialLinks.map(({ Icon, label, url }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] bg-[oklch(0.95_0.01_80)] border border-[oklch(0.90_0.01_80)] flex items-center justify-center text-[oklch(0.40_0.02_240)] no-underline transition-all hover:bg-primary hover:text-white hover:border-primary">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col">
              <h4 className={colTitleCls}>Quick Links</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                <li><Link to="/about" className={linkCls}>About Us</Link></li>
                <li><Link to="/careers" className={linkCls}>Careers</Link></li>
                <li><Link to={ROUTES.SUPPLIERS} className={linkCls}>Become Supplier</Link></li>
                <li><Link to={ROUTES.RESELLERS} className={linkCls}>Become Reseller</Link></li>
                <li><Link to={ROUTES.BUYERS} className={linkCls}>Bulk Orders</Link></li>
                <li><button onClick={() => setIsHelpOpen(true)} className={`${linkCls} bg-transparent border-none p-0 cursor-pointer font-sans`}>Help</button></li>
                <li><Link to="/contact" className={linkCls}>Contact</Link></li>
              </ul>
            </div>

            {/* For Buyers */}
            <div className="flex flex-col">
              <h4 className={colTitleCls}>For Buyers</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                <li><Link to={ROUTES.PRODUCT_LIST} className={linkCls}>Browse Products</Link></li>
                <li><Link to={ROUTES.BUYERS} className={linkCls}>Request Quote</Link></li>
              </ul>
            </div>

            {/* For Suppliers */}
            <div className="flex flex-col">
              <h4 className={colTitleCls}>For Suppliers</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                <li><Link to={ROUTES.SUPPLIERS} className={linkCls}>Sell on AMJSTAR</Link></li>

              </ul>
            </div>

            {/* Contact */}
            <div className="flex flex-col sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-1">
              <h4 className={colTitleCls}>Contact Info</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                <li className="flex items-start gap-2 text-[oklch(0.40_0.02_240)] text-[0.78rem] sm:text-[0.82rem] leading-[1.4]">
                  <Mail size={14} className="text-primary shrink-0 mt-0.5" />
                  <a href="mailto:info@amjstar.com" className="text-inherit no-underline hover:text-primary transition-colors">info@amjstar.com</a>
                </li>
                <li className="flex items-start gap-2 text-[oklch(0.40_0.02_240)] text-[0.78rem] sm:text-[0.82rem] leading-[1.4]">
                  <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                  <span>Building No. 2216, Near Bhawana Clinic, New Ramesh Nagar, Panipat, Haryana, India. 132103</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="py-4 border-t border-[oklch(0.90_0.01_80)] bg-[oklch(0.96_0.01_80)]">
        <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center gap-6 flex-wrap max-md:flex-col max-md:text-center max-md:gap-3">
            <div className="text-[oklch(0.40_0.02_240)] text-[0.74rem] sm:text-[0.78rem]">
              &copy; {new Date().getFullYear()} {appConfig.appName}. All rights reserved
              <span className="relative group cursor-default">
                .
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-[#f1f5f9] text-[#94a3b8] text-[10px] rounded-[4px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-[#e2e8f0]">
                  {String.fromCharCode(68, 101, 118, 101, 108, 111, 112, 101, 100, 32, 98, 121, 32, 45, 32, 65, 110, 117, 115, 104, 107, 97, 32, 80, 97, 110, 100, 105, 116)}
                </span>
              </span>
            </div>
            <div className="flex gap-4 sm:gap-6 max-md:justify-center flex-wrap">
              <Link to="/privacy" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.74rem] sm:text-[0.78rem] transition-colors hover:text-primary">Privacy Policy</Link>
              <Link to="/terms" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.74rem] sm:text-[0.78rem] transition-colors hover:text-primary">Terms</Link>
              <Link to="/refund" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.74rem] sm:text-[0.78rem] transition-colors hover:text-primary">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="How can we help you?" widthClass="max-w-[440px] max-sm:w-[92vw]">
        <div className="flex flex-col gap-2 sm:gap-2.5 py-1">
          <Link
            to="/help/buyers"
            onClick={() => setIsHelpOpen(false)}
            className="flex items-center gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border border-gray-100 bg-white hover:border-primary/40 hover:bg-primary/5 transition-all group no-underline shadow-xs"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingBag size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-heading m-0 mb-0.5 group-hover:text-primary transition-colors">Help for Buyers</p>
              <p className="text-[11px] sm:text-xs text-body m-0 leading-normal line-clamp-2">Order tracking, sourcing requests, MOQ, and buyer FAQs.</p>
            </div>
          </Link>

          <Link
            to="/help/suppliers"
            onClick={() => setIsHelpOpen(false)}
            className="flex items-center gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border border-gray-100 bg-white hover:border-[#8b5cf6]/40 hover:bg-[#8b5cf6]/5 transition-all group no-underline shadow-xs"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#f5f3ff] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Factory size={18} className="text-[#8b5cf6]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-heading m-0 mb-0.5 group-hover:text-[#8b5cf6] transition-colors">Help for Suppliers</p>
              <p className="text-[11px] sm:text-xs text-body m-0 leading-normal line-clamp-2">Account verifications, catalog, commissions, and payments.</p>
            </div>
          </Link>

          <Link
            to="/help/resellers"
            onClick={() => setIsHelpOpen(false)}
            className="flex items-center gap-3 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border border-gray-100 bg-white hover:border-[#06b6d4]/40 hover:bg-[#06b6d4]/5 transition-all group no-underline shadow-xs"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ecfeff] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <RefreshCw size={18} className="text-[#06b6d4]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-heading m-0 mb-0.5 group-hover:text-[#06b6d4] transition-colors">Help for Resellers</p>
              <p className="text-[11px] sm:text-xs text-body m-0 leading-normal line-clamp-2">Storefront setup, supplier partners, and lead handling.</p>
            </div>
          </Link>
        </div>
      </Modal>
    </footer>
  );
};

export default Footer;

