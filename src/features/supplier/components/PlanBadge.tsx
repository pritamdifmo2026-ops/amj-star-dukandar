import React from 'react';
import { ShieldCheck, BadgeCheck } from 'lucide-react';

/**
 * Minimal supplier shape needed to decide which plan badge to show.
 * Works with both the private profile and the trimmed public/verified payloads.
 */
export interface BadgeableSupplier {
  tier?: string;
  subscription?: { status?: string; tier?: string };
  businessDetails?: { gstin?: string };
}

const isPlanActive = (s: BadgeableSupplier) => s.subscription?.status === 'ACTIVE';

/** True when the supplier has an active Verified plan and a GSTIN on file. */
export const hasGstVerifiedBadge = (s: BadgeableSupplier): boolean =>
  isPlanActive(s) && !!s.businessDetails?.gstin;

/** True when the supplier has an active TrustSEAL (Gamma/Beta) plan. */
export const hasTrustSealBadge = (s: BadgeableSupplier): boolean =>
  isPlanActive(s) && (s.subscription?.tier === 'GAMMA' || s.subscription?.tier === 'BETA');

interface PlanBadgeProps {
  supplier: BadgeableSupplier;
  size?: number;
  className?: string;
}

/** Renders the highest badge the supplier's active plan entitles them to (if any). */
const PlanBadge: React.FC<PlanBadgeProps> = ({ supplier, size = 12, className = '' }) => {
  if (hasTrustSealBadge(supplier)) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-[#1e40af] bg-[#dbeafe] border border-[#bfdbfe] px-2 py-0.5 rounded-full ${className}`}>
        <BadgeCheck size={size} /> TrustSEAL
      </span>
    );
  }
  if (hasGstVerifiedBadge(supplier)) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full ${className}`}>
        <ShieldCheck size={size} /> GST Verified
      </span>
    );
  }
  return null;
};

export default PlanBadge;
