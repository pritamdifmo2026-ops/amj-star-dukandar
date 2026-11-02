import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, Receipt, CircleDollarSign, Wallet, Share2,
  ShieldAlert, LifeBuoy, HandCoins, Bell, Settings as SettingsIcon,
  Menu, LogOut, AlertCircle,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/features/auth/store/auth.slice';
import logo from '@/assets/logoo.png';
import Sidebar, { type MenuItem } from '@/shared/components/layout/Sidebar';
import Modal from '@/shared/components/ui/Modal';
import Loader from '@/shared/components/feedback/Loader';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import NotificationsView from '@/features/notifications/components/NotificationsView';

import partnerService from '../services/partner.service';
import PartnerApprovalNotice from '../components/PartnerApprovalNotice';
import PartnerOverview from '../components/PartnerOverview';
import PartnerCustomers from '../components/PartnerCustomers';
import PartnerOrders from '../components/PartnerOrders';
import PartnerCommissions from '../components/PartnerCommissions';
import PartnerWalletView from '../components/PartnerWalletView';
import PartnerShareLinks from '../components/PartnerShareLinks';
import PartnerDisputes from '../components/PartnerDisputes';
import PartnerSupport from '../components/PartnerSupport';
import PartnerConcessions from '../components/PartnerConcessions';
import PartnerSettings from '../components/PartnerSettings';
import RaiseIssueModal, { type RaiseIssueTarget } from '../components/RaiseIssueModal';

const DASHBOARD_PATH = '/partner/dashboard';
const BRAND = '#e65c00';

/**
 * The Wholesale Service Partner hub.
 *
 * Deliberately mirrors the Supplier Hub shell — same collapsible sidebar, same mobile
 * header with an avatar dropdown, same `?tab=` deep links — so a partner who has also
 * used a seller account is immediately at home.
 */
const PartnerDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('tab') || 'overview';

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [issueTarget, setIssueTarget] = useState<RaiseIssueTarget | null>(null);
  const mobileDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Partner Hub - AMJSTAR';
  }, []);

  const { data: dashboard, isLoading, isError, refetch } = useQuery({
    queryKey: ['partner', 'dashboard'],
    queryFn: () => partnerService.getDashboard(),
    refetchInterval: 60_000,
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ['partner', 'referrals'],
    queryFn: () => partnerService.getReferrals(),
  });

  const partner = dashboard?.partner;
  const counts = dashboard?.counts;

  const displayName = partner?.fullName || user?.name || 'Partner';
  const displayEmail = partner?.email || user?.email || 'partner@amjstar.com';
  const initial = displayName[0]?.toUpperCase() || 'P';

  const setActiveView = (tab: string) => {
    setSearchParams({ tab });
    if (window.innerWidth <= 1024) setIsSidebarOpen(false);
  };

  // Close the mobile avatar menu on any outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!mobileDropdownRef.current || !mobileDropdownRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lock body scroll behind the mobile drawer and modals.
  useEffect(() => {
    const shouldLock = (window.innerWidth <= 1024 && isSidebarOpen) || showLogoutModal;
    if (shouldLock) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, showLogoutModal]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menu: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'customers', label: 'My Customers', icon: Users },
    { id: 'orders', label: 'Deals', icon: Receipt },
    { id: 'commissions', label: 'Commissions', icon: CircleDollarSign },
    { id: 'wallet', label: 'Wallet & Payouts', icon: Wallet },
    { id: 'share', label: 'Share Links', icon: Share2 },
    {
      id: 'disputes',
      label: 'Disputes',
      icon: ShieldAlert,
      ...(counts?.openDisputes ? { badge: counts.openDisputes } : {}),
    },
    {
      id: 'support',
      label: 'Customer Support',
      icon: LifeBuoy,
      ...(counts?.openIssues ? { badge: counts.openIssues } : {}),
    },
    {
      id: 'concessions',
      label: 'Concessions',
      icon: HandCoins,
      ...(counts?.pendingConcessions ? { badge: counts.pendingConcessions } : {}),
    },
  ];

  const footerMenu: MenuItem[] = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Account', icon: SettingsIcon },
  ];

  const confirmLogout = () => {
    dispatch(logout());
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
        <Loader size="lg" />
        <p className="text-sm text-[#64748b] font-medium">Loading your Partner Hub…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] overflow-x-hidden w-full relative max-lg:flex-col">
      <Sidebar
        title="Partner Hub"
        logoSrc={logo}
        logoHref={DASHBOARD_PATH}
        onLogoClick={() => setActiveView('overview')}
        menu={menu}
        footerMenu={footerMenu}
        activeTab={activeView}
        onTabChange={setActiveView}
        onLogout={() => setShowLogoutModal(true)}
        isSidebarOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        brandColor={BRAND}
        user={user || undefined}
        profile={{
          ...(partner?.fullName ? { fullName: partner.fullName } : {}),
          ...(partner?.businessName ? { businessName: partner.businessName } : {}),
        }}
        hideFooterOnMobile
      />

      {/* ── Mobile header ── */}
      <header
        className="hidden max-lg:flex fixed top-0 left-0 right-0 z-[100] bg-white px-4 h-14 border-b border-[#f1f5f9] items-center justify-between w-full shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
          className="bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] w-10 h-10 rounded-[10px] flex items-center justify-center cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={() => setActiveView('overview')}
          title="Partner Hub Overview"
        >
          <img src={logo} alt="AMJ Logo" className="h-7 w-7 rounded-full object-contain" />
          <span className="font-extrabold text-[#0f172a] text-xs sm:text-sm tracking-tight">Partner Hub</span>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell viewAllPath={`${DASHBOARD_PATH}?tab=notifications`} />
          <div className="relative flex items-center" ref={mobileDropdownRef}>
            <button
              onClick={() => setAvatarMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-[#e65c00]/10 text-[#e65c00] border border-[#e65c00]/20 flex items-center justify-center font-bold text-xs cursor-pointer focus:outline-none transition-all hover:bg-[#e65c00]/20 hover:scale-105 active:scale-95"
            >
              {initial}
            </button>

            {avatarMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e2e8f0] rounded-[8px] shadow-[0_10px_25px_rgba(0,0,0,0.08)] py-1.5 z-[1001] animate-fade-in">
                <div className="px-4 py-2 border-b border-[#f1f5f9]">
                  <p className="font-bold text-[#0f172a] text-xs truncate m-0">{displayName}</p>
                  <p className="text-[10px] text-[#64748b] truncate m-0 mt-0.5">{displayEmail}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveView('settings');
                    setAvatarMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left border-none bg-transparent hover:bg-[#f8fafc] text-xs text-[#475569] font-medium cursor-pointer transition-colors"
                >
                  <SettingsIcon size={14} className="text-[#64748b]" />
                  <span>Account</span>
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(true);
                    setAvatarMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left border-none bg-transparent hover:bg-[#fef2f2] hover:text-[#dc2626] text-xs text-[#475569] font-medium cursor-pointer transition-colors"
                >
                  <LogOut size={14} className="text-[#64748b]" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isSidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-transparent z-[999]" onClick={() => setIsSidebarOpen(false)} />
      )}

      <main
        className={`flex-1 transition-all duration-300 max-w-full overflow-x-hidden max-lg:ml-0 max-lg:pt-[calc(72px+env(safe-area-inset-top,0px))] max-lg:px-4 max-lg:pb-4 max-lg:w-full ${
          isSidebarOpen ? 'ml-[280px]' : 'ml-24'
        } p-10`}
      >
        {/* Desktop top-right notification bell */}
        <div className="hidden lg:flex justify-end items-center gap-3 mb-4">
          <NotificationBell viewAllPath={`${DASHBOARD_PATH}?tab=notifications`} />
        </div>

        {isError && (
          <div className="bg-[#fef2f2] border border-[#fecaca] p-4 rounded-[10px] flex items-center gap-3 text-[#b91c1c] text-sm mb-6">
            <AlertCircle size={18} />
            <span>We could not load your Partner Hub.</span>
            <button
              onClick={() => refetch()}
              className="ml-auto bg-[#fecaca] border-none px-3 py-1.5 rounded-[6px] text-[#991b1b] font-bold cursor-pointer text-xs"
            >
              Retry
            </button>
          </div>
        )}

        <PartnerApprovalNotice partner={partner} />

        {activeView === 'overview' && <PartnerOverview data={dashboard} onNavigate={setActiveView} />}

        {activeView === 'customers' && (
          <PartnerCustomers
            referrals={referrals}
            isLoading={referralsLoading}
            onRaiseIssue={(customer) => setIssueTarget(customer)}
          />
        )}

        {activeView === 'orders' && <PartnerOrders />}

        {activeView === 'commissions' && (
          <PartnerCommissions
            commissionSharePercent={partner?.commissionSharePercent}
            sellerCommissionPercent={partner?.sellerCommissionPercent}
            buyerCommissionPercent={partner?.buyerCommissionPercent}
          />
        )}

        {activeView === 'wallet' && (
          <PartnerWalletView
            key={partner?._id || 'loading'}
            partner={partner}
            wallet={dashboard?.wallet}
          />
        )}

        {activeView === 'share' && (
          <PartnerShareLinks partner={partner} referralLinks={dashboard?.referralLinks} />
        )}

        {activeView === 'disputes' && <PartnerDisputes />}

        {activeView === 'support' && <PartnerSupport onRaiseIssue={() => setIssueTarget({})} />}

        {activeView === 'concessions' && <PartnerConcessions partner={partner} />}

        {activeView === 'notifications' && <NotificationsView />}

        {activeView === 'settings' && (
          <PartnerSettings key={partner?._id || 'loading'} partner={partner} />
        )}
      </main>

      {issueTarget && (
        <RaiseIssueModal
          key={issueTarget.userId || 'self'}
          onClose={() => setIssueTarget(null)}
          target={issueTarget}
        />
      )}

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign out"
        widthClass="w-[90%] max-w-[380px]"
        footer={
          <>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2.5 rounded-[8px] border border-[#e2e8f0] bg-white text-[#334155] text-xs font-bold cursor-pointer hover:border-[#cbd5e1]"
            >
              Stay signed in
            </button>
            <button
              onClick={confirmLogout}
              className="px-5 py-2.5 rounded-[8px] bg-[#b91c1c] text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer border-none hover:bg-[#991b1b]"
            >
              Sign out
            </button>
          </>
        }
      >
        <p className="text-sm text-[#475569] m-0">
          You will be returned to the AMJ Star homepage. Your referral links keep working while you
          are signed out.
        </p>
      </Modal>
    </div>
  );
};

export { PartnerDashboard };
export default PartnerDashboard;
