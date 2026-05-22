import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import appConfig from '@/config/app.config';
import logo from '@/assets/logoo.png';
import { ROUTES } from '@/shared/constants/routes';

const colTitleCls = "text-[0.95rem] font-semibold text-[oklch(0.18_0.02_240)] mb-5";
const linkCls = "text-[oklch(0.40_0.02_240)] text-[0.9rem] no-underline transition-colors hover:text-primary hover:underline inline-block";

const Footer: React.FC = () => (
  <footer className="bg-[oklch(0.98_0.01_80)] text-[oklch(0.25_0.02_240)] font-sans border-t border-[oklch(0.92_0.01_80)]">
    {/* Main footer */}
    <div className="py-14 pb-8">
      <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-10 max-xl:grid-cols-[2fr_1fr_1fr_1fr] max-lg:grid-cols-2 max-lg:gap-8 max-md:grid-cols-2 max-md:gap-6">

          {/* Brand */}
          <div className="flex flex-col gap-5 max-md:col-span-2">
            <Link to={ROUTES.HOME} className="font-display text-[1.3rem] font-semibold text-[oklch(0.18_0.02_240)] no-underline flex items-center gap-2.5">
              <img src={logo} alt="AMJSTAR Logo" className="w-8 h-8 rounded-full object-contain" />
              <span>{appConfig.appName}</span>
            </Link>
            <p className="text-[oklch(0.40_0.02_240)] leading-[1.6] text-[0.9rem]">
              India's leading B2B wholesale marketplace connecting verified buyers with trusted suppliers across the nation. Trade globally, connect locally.
            </p>
            <div className="flex gap-2">
              {[
                { Icon: Facebook, label: 'Facebook' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' },
                { Icon: Instagram, label: 'Instagram' },
              ].map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-8 h-8 rounded-[4px] bg-[oklch(0.95_0.01_80)] border border-[oklch(0.90_0.01_80)] flex items-center justify-center text-[oklch(0.40_0.02_240)] no-underline transition-all hover:bg-primary hover:text-white hover:border-primary">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col">
            <h4 className={colTitleCls}>Quick Links</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <li><Link to="/about" className={linkCls}>About Us</Link></li>
              <li><Link to={ROUTES.SUPPLIERS} className={linkCls}>Become Supplier</Link></li>
              <li><Link to={ROUTES.RESELLERS} className={linkCls}>Bulk Orders</Link></li>
              <li><Link to="/contact" className={linkCls}>Contact</Link></li>
            </ul>
          </div>

          {/* For Buyers */}
          <div className="flex flex-col">
            <h4 className={colTitleCls}>For Buyers</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <li><Link to={ROUTES.PRODUCT_LIST} className={linkCls}>Browse Products</Link></li>
              <li><Link to={ROUTES.BUYERS} className={linkCls}>Request Quote</Link></li>
              <li><Link to={ROUTES.BUYERS} className={linkCls}>Buyer Protection</Link></li>
            </ul>
          </div>

          {/* For Suppliers */}
          <div className="flex flex-col">
            <h4 className={colTitleCls}>For Suppliers</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              <li><Link to={ROUTES.SUPPLIERS} className={linkCls}>Supply on AMJSTAR</Link></li>
              <li><Link to={ROUTES.SUPPLIERS} className={linkCls}>Supplier Membership</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col max-xl:col-span-2 max-lg:col-span-1">
            <h4 className={colTitleCls}>Contact Info</h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {[
                { Icon: Mail, text: 'support@amjstar.com' },
                { Icon: Phone, text: '+91 9034440673' },
                { Icon: MapPin, text: 'Building No. 2216, Near Bhawana Clinic, New Ramesh Nagar, Panipat, Haryana, India. 132103' },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-start gap-2 text-[oklch(0.40_0.02_240)] text-[0.9rem] leading-[1.4]">
                  <Icon size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="py-5 border-t border-[oklch(0.90_0.01_80)] bg-[oklch(0.96_0.01_80)]">
      <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8">
        <div className="flex justify-between items-center gap-8 flex-wrap max-md:flex-col max-md:text-center max-md:gap-4">
          <div className="text-[oklch(0.40_0.02_240)] text-[0.85rem]">
            &copy; {new Date().getFullYear()} {appConfig.appName}. All rights reserved.
          </div>
          <div className="flex gap-6 max-md:justify-center flex-wrap">
            <Link to="/privacy" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.85rem] transition-colors hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.85rem] transition-colors hover:text-primary">Terms</Link>
            <a href="#" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.85rem] transition-colors hover:text-primary">Refund Policy</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
