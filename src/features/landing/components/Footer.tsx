import React from 'react';
import { Link } from 'react-router-dom';
import {
  Globe, Mail, Phone, MapPin,
  Facebook, Twitter, Linkedin, Instagram, ArrowRight
} from 'lucide-react';
import appConfig from '@/config/app.config';
import { ROUTES } from '@/shared/constants/routes';

const linkCls = "text-body text-[15px] no-underline transition-all hover:text-primary hover:translate-x-1 inline-block";
const colTitleCls = "text-[0.8rem] font-bold uppercase tracking-[0.1em] text-heading mb-6 relative after:content-[''] after:absolute after:left-0 after:bottom-[-0.5rem] after:w-6 after:h-[2px] after:bg-primary";

const Footer: React.FC = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-[oklch(0.96_0.02_75)] text-heading font-sans border-t border-[oklch(0.90_0.02_70)]">
      {/* Newsletter */}
      <div className="bg-[oklch(0.93_0.03_60)] py-14 border-b border-[oklch(0.88_0.02_70)]">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <div className="flex justify-between items-center gap-8 flex-wrap max-md:flex-col max-md:text-center">
            <div>
              <h3 className="font-display text-[1.75rem] font-normal mb-1 text-heading">Subscribe to our Newsletter</h3>
              <p className="text-body text-[0.95rem]">Get the latest updates on wholesale trends and bulk deals.</p>
            </div>
            <div className="flex gap-3 w-full max-w-[450px] max-md:max-w-full">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-cream border border-[oklch(0.88_0.02_70)] px-5 py-3 rounded-[8px] text-heading text-sm outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_oklch(0.55_0.16_38/0.15)] placeholder:text-muted"
              />
              <button className="bg-primary text-cream border-none px-6 py-3 rounded-[8px] font-semibold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap hover:bg-primary-dark hover:-translate-y-px">
                Subscribe <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer — 5 columns */}
      <div className="py-20 pb-16">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-12 max-xl:grid-cols-[2fr_1fr_1fr_1fr] max-lg:grid-cols-2 max-lg:gap-10 max-md:grid-cols-1 max-md:gap-8">

            {/* Brand */}
            <div className="flex flex-col gap-6 max-md:items-center max-md:text-center">
              <Link to={ROUTES.HOME} className="font-display text-[1.4rem] font-normal text-heading no-underline flex items-center gap-2.5">
                <img src="/favicon.jpeg" alt="AMJStar Logo" className="w-9 h-9 rounded-[8px] object-contain bg-primary p-1" />
                <span>{appConfig.appName}</span>
              </Link>
              <p className="text-body leading-[1.7] text-[0.9375rem] max-w-[280px] max-md:max-w-full">
                India's leading B2B marketplace connecting verified buyers with trusted suppliers across the nation. Grow your business with AMJStar.
              </p>
              <div className="flex gap-3">
                {[
                  { Icon: Facebook, label: 'Facebook' },
                  { Icon: Twitter, label: 'Twitter' },
                  { Icon: Linkedin, label: 'LinkedIn' },
                  { Icon: Instagram, label: 'Instagram' },
                ].map(({ Icon, label }) => (
                  <a key={label} href="#" aria-label={label}
                    className="w-[38px] h-[38px] rounded-full bg-border flex items-center justify-center text-body border border-[oklch(0.88_0.02_70)] no-underline transition-all hover:bg-primary hover:text-cream hover:border-primary hover:-translate-y-0.5">
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col max-md:items-center">
              <h4 className={colTitleCls}>Quick Links</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.85rem] max-md:items-center">
                <li><Link to="/about" className={linkCls}>About Us</Link></li>
                <li><Link to={ROUTES.PRODUCT_LIST} className={linkCls}>Browse Products</Link></li>
                <li><Link to={ROUTES.SUPPLIERS} className={linkCls}>Become a Seller</Link></li>
                <li><Link to={ROUTES.RESELLERS} className={linkCls}>Bulk Orders</Link></li>
                <li><a href="#" className={linkCls}>Help Center</a></li>
              </ul>
            </div>

            {/* For Buyers */}
            <div className="flex flex-col max-md:items-center">
              <h4 className={colTitleCls}>For Buyers</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.85rem] max-md:items-center">
                <li><Link to={ROUTES.PRODUCT_LIST} className={linkCls}>Browse Products</Link></li>
                <li><Link to={ROUTES.BUYERS} className={linkCls}>Request a Quote</Link></li>
                <li><a href="#" className={linkCls}>Buyer Protection</a></li>
                <li><a href="#" className={linkCls}>Industry Reports</a></li>
                <li><a href="#" className={linkCls}>Bulk Discounts</a></li>
              </ul>
            </div>

            {/* For Sellers */}
            <div className="flex flex-col max-md:items-center">
              <h4 className={colTitleCls}>For Sellers</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.85rem] max-md:items-center">
                <li><Link to={ROUTES.SUPPLIERS} className={linkCls}>Sell on AMJStar</Link></li>
                <li><Link to={ROUTES.SUPPLIERS} className={linkCls}>Supplier Membership</Link></li>
                <li><Link to={ROUTES.SUPPLIER_DASHBOARD} className={linkCls}>Seller Dashboard</Link></li>
                <li><a href="#" className={linkCls}>Advertising</a></li>
                <li><a href="#" className={linkCls}>Supplier FAQ</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="flex flex-col max-md:items-center max-xl:col-span-2 max-lg:col-span-1">
              <h4 className={`${colTitleCls} max-md:after:left-1/2 max-md:after:-translate-x-1/2`}>Get in Touch</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.85rem]">
                {[
                  { Icon: MapPin, text: '2216, New Ramesh Nagar, Panipat, Haryana, India' },
                  { Icon: Phone, text: '+91 1800 xxx xxxx' },
                  { Icon: Mail, text: 'support@amjstar.com' },
                  { Icon: Globe, text: 'www.amjstar.com' },
                ].map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-body text-[0.9375rem] max-md:justify-center max-md:text-center">
                    <Icon size={18} className="text-primary shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="py-6 border-t border-[oklch(0.88_0.02_70)] bg-[oklch(0.93_0.03_60)]">
        <div className="max-w-[var(--width-container)] mx-auto px-8">
          <div className="flex justify-between items-center gap-8 flex-wrap max-md:flex-col max-md:text-center max-md:gap-4">
            <div className="flex gap-8 max-md:justify-center max-md:gap-4">
              {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Refund Policy'].map(label => (
                <a key={label} href="#" className="text-[oklch(0.50_0.02_60)] no-underline text-sm transition-colors hover:text-primary">{label}</a>
              ))}
            </div>
            <div className="text-[oklch(0.50_0.02_60)] text-sm">
              &copy; {new Date().getFullYear()} {appConfig.appName}. All rights reserved.
            </div>
            <div
              onClick={scrollToTop}
              className="flex items-center gap-2 text-[oklch(0.50_0.02_60)] text-sm cursor-pointer font-semibold transition-colors hover:text-primary group"
            >
              <span>Back to top</span>
              <ArrowRight size={16} className="-rotate-90 transition-transform group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
