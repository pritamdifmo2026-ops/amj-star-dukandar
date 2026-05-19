import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
} from 'lucide-react';
import appConfig from '@/config/app.config';
import { ROUTES } from '@/shared/constants/routes';

const Footer: React.FC = () => {

  return (
    <footer className="bg-[oklch(0.98_0.01_80)] text-[oklch(0.25_0.02_240)] font-sans border-t border-[oklch(0.92_0.01_80)]">
      <div className="pt-14 pb-8">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-10 max-lg:grid-cols-[1.5fr_1fr_1fr] max-md:grid-cols-2 max-md:gap-8 max-sm:gap-x-4 max-sm:gap-y-10">
            {/* Brand Section */}
            <div className="flex flex-col gap-5 max-md:col-span-2">
              <Link to={ROUTES.HOME} className="font-serif text-[1.3rem] font-semibold text-[oklch(0.18_0.02_240)] no-underline flex items-center gap-2.5">
                <img src="/favicon.jpeg" alt="AMJStar Logo" className="w-8 h-8 rounded-md object-contain bg-[var(--color-primary)] p-1" />
                <span>{appConfig.appName}</span>
              </Link>
              <p className="text-[oklch(0.40_0.02_240)] leading-relaxed text-[0.9rem]">
                India's leading B2B wholesale marketplace connecting verified buyers with trusted suppliers across the nation. Trade globally, connect locally.
              </p>
              <div className="flex gap-2">
                <a href="#" className="w-8 h-8 rounded bg-[oklch(0.95_0.01_80)] flex items-center justify-center text-[oklch(0.40_0.02_240)] transition-all duration-200 border border-[oklch(0.90_0.01_80)] no-underline hover:bg-[var(--color-primary)] hover:text-[oklch(0.99_0.01_80)] hover:border-[var(--color-primary)]" aria-label="Facebook"><Facebook size={18} /></a>
                <a href="#" className="w-8 h-8 rounded bg-[oklch(0.95_0.01_80)] flex items-center justify-center text-[oklch(0.40_0.02_240)] transition-all duration-200 border border-[oklch(0.90_0.01_80)] no-underline hover:bg-[var(--color-primary)] hover:text-[oklch(0.99_0.01_80)] hover:border-[var(--color-primary)]" aria-label="Twitter"><Twitter size={18} /></a>
                <a href="#" className="w-8 h-8 rounded bg-[oklch(0.95_0.01_80)] flex items-center justify-center text-[oklch(0.40_0.02_240)] transition-all duration-200 border border-[oklch(0.90_0.01_80)] no-underline hover:bg-[var(--color-primary)] hover:text-[oklch(0.99_0.01_80)] hover:border-[var(--color-primary)]" aria-label="LinkedIn"><Linkedin size={18} /></a>
                <a href="#" className="w-8 h-8 rounded bg-[oklch(0.95_0.01_80)] flex items-center justify-center text-[oklch(0.40_0.02_240)] transition-all duration-200 border border-[oklch(0.90_0.01_80)] no-underline hover:bg-[var(--color-primary)] hover:text-[oklch(0.99_0.01_80)] hover:border-[var(--color-primary)]" aria-label="Instagram"><Instagram size={18} /></a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col max-sm:last:col-span-2">
              <h4 className="text-[0.95rem] font-semibold mb-5 text-[oklch(0.18_0.02_240)]">Quick Links</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-3">
                <li><Link to="/about" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">About Us</Link></li>
                <li><Link to={ROUTES.PRODUCT_LIST} className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Categories</Link></li>
                <li><Link to={ROUTES.SUPPLIERS} className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Become Seller</Link></li>
                <li><Link to={ROUTES.RESELLERS} className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Bulk Orders</Link></li>
                <li><Link to="/about" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Contact</Link></li>
              </ul>
            </div>

            {/* Buyer Section */}
            <div className="flex flex-col max-sm:last:col-span-2">
              <h4 className="text-[0.95rem] font-semibold mb-5 text-[oklch(0.18_0.02_240)]">For Buyers</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-3">
                <li><Link to={ROUTES.PRODUCT_LIST} className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Browse Products</Link></li>
                <li><Link to={ROUTES.BUYERS} className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Request Quote</Link></li>
                <li><Link to={ROUTES.BUYERS} className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Buyer Protection</Link></li>
                <li><Link to="/about" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Help Center</Link></li>
              </ul>
            </div>

            {/* Seller Section */}
            <div className="flex flex-col max-sm:last:col-span-2">
              <h4 className="text-[0.95rem] font-semibold mb-5 text-[oklch(0.18_0.02_240)]">For Sellers</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-3">
                <li><Link to={ROUTES.SUPPLIERS} className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Sell on AMJStar</Link></li>
                <li><Link to={ROUTES.SUPPLIERS} className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Supplier Membership</Link></li>
                <li><Link to={ROUTES.SUPPLIER_DASHBOARD} className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Seller Dashboard</Link></li>
                <li><Link to={ROUTES.SUPPLIERS} className="text-[oklch(0.40_0.02_240)] no-underline text-[0.9rem] transition-colors duration-200 inline-block hover:text-[var(--color-primary)] hover:underline">Advertising</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col max-sm:last:col-span-2">
              <h4 className="text-[0.95rem] font-semibold mb-5 text-[oklch(0.18_0.02_240)]">Contact Info</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-3">
                <li className="flex items-start gap-2 text-[oklch(0.40_0.02_240)] text-[0.9rem] leading-tight">
                  <Mail size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <span>support@amjstar.com</span>
                </li>
                <li className="flex items-start gap-2 text-[oklch(0.40_0.02_240)] text-[0.9rem] leading-tight">
                  <Phone size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <span>+91 1800 123 4567</span>
                </li>
                <li className="flex items-start gap-2 text-[oklch(0.40_0.02_240)] text-[0.9rem] leading-tight">
                  <MapPin size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <span>123 Business Hub, MG Road, New Delhi, India</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="py-5 border-t border-[oklch(0.90_0.01_80)] bg-[oklch(0.96_0.01_80)]">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex justify-between items-center gap-8 flex-wrap max-md:flex-col max-md:text-center max-md:gap-4">
            <div className="text-[oklch(0.40_0.02_240)] text-[0.85rem]">
              &copy; {new Date().getFullYear()} {appConfig.appName}. All rights reserved.
            </div>
            <div className="flex gap-6 max-md:justify-center max-md:flex-wrap">
              <Link to="/about" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.85rem] transition-colors duration-200 hover:text-[var(--color-primary)]">Privacy Policy</Link>
              <Link to="/about" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.85rem] transition-colors duration-200 hover:text-[var(--color-primary)]">Terms</Link>
              <Link to="/about" className="text-[oklch(0.40_0.02_240)] no-underline text-[0.85rem] transition-colors duration-200 hover:text-[var(--color-primary)]">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
