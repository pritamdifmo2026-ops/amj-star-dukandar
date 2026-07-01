import { SupplierTier } from '@/features/supplier/store/supplier.slice';

/** Sentinel for maxProducts meaning "no cap". Mirrors the backend catalog. */
export const UNLIMITED_PRODUCTS = -1;

export type PlanBadge = 'GST_VERIFIED' | 'TRUSTSEAL' | null;

export interface PlanDefinition {
  id: SupplierTier;
  name: string;
  description: string;
  /** Annual price in ₹, excluding GST. */
  price: number;
  gstPercent: number;
  billingPeriodMonths: number;
  maxProducts: number;
  badge: PlanBadge;
  features: string[];
}

export const PLAN_CATALOG: Record<SupplierTier, PlanDefinition> = {
  [SupplierTier.VERIFIED]: {
    id: SupplierTier.VERIFIED,
    name: 'Verified Supplier',
    description: 'Build trust and verify your business.',
    price: 2100,
    gstPercent: 18,
    billingPeriodMonths: 12,
    maxProducts: UNLIMITED_PRODUCTS,
    badge: 'GST_VERIFIED',
    features: [
      'GST Verified Badge',
      'Unlimited Product Listings',
      'Buyer Direct Contact',
      'Inventory Management',
      'Share Products via WhatsApp & Social Media',
      'Better Search Ranking',
    ],
  },
  [SupplierTier.GAMMA]: {
    id: SupplierTier.GAMMA,
    name: 'SME TrustSEAL Gamma',
    description: 'Everything in Verified, plus stronger trust signals.',
    price: 21000,
    gstPercent: 18,
    billingPeriodMonths: 12,
    maxProducts: UNLIMITED_PRODUCTS,
    badge: 'TRUSTSEAL',
    features: [
      'TrustSEAL Badge',
      'Physical Business Verification',
      'Higher Search Ranking',
      'Featured Placement',
      'Priority Lead Visibility',
      'Technical Product Verification',
    ],
  },
  [SupplierTier.BETA]: {
    id: SupplierTier.BETA,
    name: 'SME TrustSEAL Beta',
    description: 'Everything in Gamma, plus complete listing support.',
    price: 51000,
    gstPercent: 18,
    billingPeriodMonths: 12,
    maxProducts: UNLIMITED_PRODUCTS,
    badge: 'TRUSTSEAL',
    features: [
      'Dedicated Listing Support',
      'Product Catalog Management',
      'SEO Optimization',
      'Product Content Writing',
      'Listing Optimization',
      'Technical Support Throughout the Year',
    ],
  },
};

export const PLAN_LIST: PlanDefinition[] = Object.values(PLAN_CATALOG);

export const getPlan = (tier: SupplierTier): PlanDefinition =>
  PLAN_CATALOG[tier] ?? PLAN_CATALOG[SupplierTier.VERIFIED];

export const TIER_RANK: Record<SupplierTier, number> = {
  [SupplierTier.VERIFIED]: 1,
  [SupplierTier.GAMMA]: 2,
  [SupplierTier.BETA]: 3,
};

/** Plans that are a strict upgrade from the given tier (higher rank). */
export const getUpgradeOptions = (currentTier: SupplierTier): PlanDefinition[] =>
  PLAN_LIST.filter(p => TIER_RANK[p.id] > TIER_RANK[currentTier]);

/** Upgrade cost = difference in base price + GST on that difference. */
export const getUpgradeCost = (currentTier: SupplierTier, targetTier: SupplierTier) => {
  const cur = getPlan(currentTier);
  const tgt = getPlan(targetTier);
  const priceDifference = tgt.price - cur.price;
  const gstAmount = Math.round((priceDifference * tgt.gstPercent) / 100);
  return { priceDifference, gstAmount, total: priceDifference + gstAmount };
};

export const getPlanGstAmount = (plan: PlanDefinition): number =>
  Math.round((plan.price * plan.gstPercent) / 100);

export const getPlanTotal = (plan: PlanDefinition): number =>
  plan.price + getPlanGstAmount(plan);

/** Formats a rupee amount with Indian-style grouping, no decimals. */
export const formatINR = (amount: number): string =>
  `₹${amount.toLocaleString('en-IN')}`;
