import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { ArrowRight } from 'lucide-react';
import heroImage from '@/assets/images/user.png';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/features/auth/store/auth.slice';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';

const ROLE_LABEL: Record<string, string> = {
  buyer: 'Buyer',
  supplier: 'Supplier',
  reseller: 'Reseller',
  admin: 'Admin',
};

type ModalState = {
  title: string;
  body: string;
  sub?: string;
  canSwitch: boolean;
  switchTarget?: string;
} | null;

const Hero: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const [modal, setModal] = useState<ModalState>(null);

  const roleLabel = user ? (ROLE_LABEL[user.role] || user.role) : '';

  const handleBuyerClick = (e: React.MouseEvent) => {
    if (!user) return;
    e.preventDefault();
    if (user.role === 'buyer') {
      setModal({
        title: "You're already a Buyer here 👋",
        body: "You're all set! Continue exploring our products and connect with verified suppliers.",
        sub: "No need to sign up again — your Buyer account is active.",
        canSwitch: false,
      });
    } else {
      setModal({
        title: `Switch to Buyer?`,
        body: `You're currently logged in as a ${roleLabel}. To join as a Buyer, please log out of your ${roleLabel} account first.`,
        canSwitch: true,
        switchTarget: `${ROUTES.LOGIN}?mode=buyer`,
      });
    }
  };

  const handleSupplierClick = (e: React.MouseEvent) => {
    if (!user) return;
    e.preventDefault();
    if (user.role === 'supplier') {
      setModal({
        title: "You're already a Supplier here 👋",
        body: "Your Supplier dashboard is ready. Manage your products and respond to buyer enquiries.",
        sub: "No need to sign up again — your Supplier account is active.",
        canSwitch: false,
      });
    } else {
      setModal({
        title: `Switch to Supplier?`,
        body: `You're currently logged in as a ${roleLabel}. To register as a Supplier, please log out of your ${roleLabel} account first.`,
        canSwitch: true,
        switchTarget: `${ROUTES.LOGIN}?mode=seller`,
      });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = modal?.switchTarget || '/';
  };

  return (
    <section className="bg-cream py-6 sm:py-10 overflow-hidden">
      <div className="max-w-[var(--width-container)] mx-auto px-4 sm:px-8 flex items-center justify-between gap-8 sm:gap-10 max-[1100px]:flex-col max-[1100px]:text-center max-[1100px]:gap-10">
        <div className="flex-1 max-[1100px]:flex max-[1100px]:flex-col max-[1100px]:items-center w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream border border-border rounded-full font-sans text-[10px] sm:text-xs font-medium uppercase tracking-[0.12em] text-primary mb-4 max-w-full text-center whitespace-normal">
            <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
            Join AMJSTAR and grow your wholesale business today.
          </div>

          <h1 className="font-display text-[clamp(1.6rem,5vw,2.8rem)] leading-snug text-heading mb-4 font-normal max-w-full break-words">
            <span className="text-primary italic">AMJSTAR</span>{' '}
            connects wholesalers, suppliers, and resellers with a smarter B2B wholesale platform.
          </h1>

          <p className="font-sans text-sm sm:text-base text-body mb-6 max-w-[600px] leading-relaxed max-[1100px]:mx-auto max-[1100px]:mb-8">
            AMJSTAR connects wholesalers, local retail resellers, and business
            buyers in one trade network. Quote-based ordering and bulk fulfillment.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 mb-8 max-[1100px]:justify-center w-full sm:w-auto items-center">
            <Link
              to={`${ROUTES.LOGIN}?mode=buyer`}
              onClick={handleBuyerClick}
              className="w-full sm:w-auto justify-center bg-primary text-white min-w-0 sm:min-w-[220px] px-6 sm:px-10 py-3.5 sm:py-4 text-base sm:text-[18px] font-bold rounded-full no-underline flex items-center gap-2 transition-all hover:bg-primary-dark shadow-md text-center shrink-0"
            >
              Join as Buyer <ArrowRight size={20} className="w-5 h-5 shrink-0" />
            </Link>
            <Link
              to={`${ROUTES.LOGIN}?mode=seller`}
              onClick={handleSupplierClick}
              className="w-full sm:w-auto justify-center text-center bg-[#1e293b] text-white min-w-0 sm:min-w-[220px] px-6 sm:px-10 py-3.5 sm:py-4 text-base sm:text-[18px] font-bold rounded-full no-underline transition-all hover:bg-[#0f172a] shadow-md shrink-0"
            >
              Become a Supplier
            </Link>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 flex-wrap w-full">
            <div className="flex flex-col items-center sm:items-start">
              <span className="font-display text-xl sm:text-2xl text-heading leading-none">50k+</span>
              <span className="text-xs text-muted">Verified Suppliers</span>
            </div>
            <div className="w-px h-6 bg-border hidden sm:block" />
            <div className="flex flex-col items-center sm:items-start">
              <span className="font-display text-xl sm:text-2xl text-heading leading-none">2M+</span>
              <span className="text-xs text-muted">Bulk Products</span>
            </div>
            <div className="w-px h-6 bg-border hidden sm:block" />
            <div className="flex flex-col items-center sm:items-start">
              <span className="font-display text-xl sm:text-2xl text-heading leading-none">B2B</span>
              <span className="text-xs text-muted">First Platform</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-end max-[1100px]:justify-center w-full max-w-[480px]">
          <div className="relative w-full">
            <img
              src={heroImage}
              alt="B2B Marketplace"
              className="w-full h-auto rounded-[24px] sm:rounded-[32px] block shadow-[0_20px_40px_-20px_rgba(0,0,0,0.2)]"
            />
            <div className="absolute bottom-3 left-3 sm:-left-5 sm:bottom-5 bg-cream p-3 sm:p-4 rounded-[6px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex flex-col z-[2] border border-border">
              <span className="font-display text-xl sm:text-2xl text-heading leading-none mb-1">+38%</span>
              <span className="text-xs sm:text-[13px] text-body whitespace-nowrap">avg. reseller margin uplift</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role-aware login modal */}
      {modal && (
        <Modal
          isOpen
          onClose={() => setModal(null)}
          title={modal.title}
          footer={
            modal.canSwitch ? (
              <>
                <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                <Button variant="danger" onClick={handleLogout}>Log Out</Button>
              </>
            ) : (
              <Button onClick={() => setModal(null)}>Continue Exploring</Button>
            )
          }
        >
          <div className="py-1 flex flex-col gap-2">
            <p className="text-[15px] text-[#374151]">{modal.body}</p>
            {modal.sub && <p className="text-sm text-[#94a3b8]">{modal.sub}</p>}
          </div>
        </Modal>
      )}
    </section>
  );
};

export default Hero;
