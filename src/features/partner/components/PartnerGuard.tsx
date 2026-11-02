import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldX } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import Loader from '@/shared/components/feedback/Loader';
import partnerService from '../services/partner.service';

/**
 * Gate for the Partner Hub.
 *
 * Role is the authority here — the backend already rejects every `/partner/*` call from a
 * non-partner — so this guard's only job is to make sure a partner profile exists before
 * the hub renders (the profile endpoint creates one on first visit) and to show a clear
 * message if that fails. A declined application still gets in: the hub itself explains
 * the rejection rather than bouncing the user to a login page with no explanation.
 *
 * Admins are deliberately excluded. Opening the hub creates a Partner profile for whoever
 * is signed in, so an admin browsing here would mint themselves a partner account; they
 * manage partners from the admin panel instead.
 */
const PartnerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAppSelector((state) => state.auth.user);
  const allowed = user?.role === 'partner';

  const { isLoading, isError, refetch } = useQuery({
    queryKey: ['partner', 'profile'],
    queryFn: () => partnerService.getProfile(),
    enabled: allowed,
    retry: 1,
  });

  if (!allowed) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    return <Navigate to={`/login?mode=partner&redirect=${redirect}`} replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
        <Loader size="lg" />
        <p className="text-sm text-[#64748b] font-medium">Verifying your partner account…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc] px-6 text-center">
        <span className="w-14 h-14 rounded-full bg-[#fef2f2] text-[#b91c1c] flex items-center justify-center">
          <ShieldX size={26} />
        </span>
        <h1 className="text-lg font-extrabold text-[#0f172a] m-0">Partner account unavailable</h1>
        <p className="text-sm text-[#64748b] max-w-[420px] m-0">
          We could not load your Wholesale Service Partner profile. This is usually a temporary
          connection problem — try again, or contact the AMJ Star team if it keeps happening.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-1 px-5 py-2.5 rounded-[8px] bg-[#0f172a] text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer border-none hover:bg-[#1e293b]"
        >
          Try again
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default PartnerGuard;
