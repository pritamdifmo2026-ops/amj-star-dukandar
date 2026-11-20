/**
 * Dynamic Partner Earning Benchmark Helper (Approach A - Personalized Dynamic Ranges)
 *
 * Computes realistic, privacy-preserving reference earning ranges for a partner
 * based on their specific contracted rates (sellerCommissionPercent, buyerCommissionPercent)
 * and AMJ Star's standard platform take-rate spectrum (2% for high-volume commodities
 * up to 5% for branded goods).
 *
 * This gives partners a transparent, motivating earning expectation in Rupees (₹)
 * BEFORE any transactions happen, without revealing raw percentages or proprietary fee formulas.
 */

export interface BenchmarkTier {
  dealBracket: string;
  orderRangeLabel: string;
  sellerEarningRange: string;
  buyerEarningRange: string;
  bothEarningRange: string;
}

// Typical AMJ Star platform fee bounds charged to suppliers:
const MIN_PLATFORM_FEE_PCT = 2;
const MAX_PLATFORM_FEE_PCT = 5;

interface BracketDefinition {
  dealBracket: string;
  orderRangeLabel: string;
  minAmount: number;
  maxAmount: number;
  isBulkUpper?: boolean;
}

const BRACKETS: BracketDefinition[] = [
  {
    dealBracket: '< ₹5,000',
    orderRangeLabel: 'Up to ₹5,000',
    minAmount: 1500,
    maxAmount: 5000,
  },
  {
    dealBracket: '₹5,000 – ₹25,000',
    orderRangeLabel: '₹5,000 to ₹25,000',
    minAmount: 5000,
    maxAmount: 25000,
  },
  {
    dealBracket: '₹25,000 – ₹1 Lakh',
    orderRangeLabel: '₹25,000 to ₹1,00,000',
    minAmount: 25000,
    maxAmount: 100000,
  },
  {
    dealBracket: '₹1 Lakh – ₹5 Lakhs',
    orderRangeLabel: '₹1,00,000 to ₹5,00,000',
    minAmount: 100000,
    maxAmount: 500000,
  },
  {
    dealBracket: '> ₹5 Lakhs (Bulk)',
    orderRangeLabel: '₹5,00,000 and above',
    minAmount: 500000,
    maxAmount: 1500000,
    isBulkUpper: true,
  },
];

function formatRupeeRange(minAmount: number, maxAmount: number, partnerCutPct: number, isBulkUpper?: boolean): string {
  if (partnerCutPct <= 0) return '₹0';

  const low = Math.round((minAmount * (MIN_PLATFORM_FEE_PCT / 100) * (partnerCutPct / 100)));
  const high = Math.round((maxAmount * (MAX_PLATFORM_FEE_PCT / 100) * (partnerCutPct / 100)));

  if (minAmount <= 1500) {
    return `Up to ₹${high.toLocaleString('en-IN')}`;
  }

  if (isBulkUpper) {
    return `₹${low.toLocaleString('en-IN')}+`;
  }

  return `₹${low.toLocaleString('en-IN')} – ₹${high.toLocaleString('en-IN')}`;
}

export function getPersonalizedBenchmarks(
  sellerCutPercent: number = 15,
  buyerCutPercent: number = 10
): BenchmarkTier[] {
  const safeSeller = typeof sellerCutPercent === 'number' && !isNaN(sellerCutPercent)
    ? Math.max(0, sellerCutPercent)
    : 15;
  const safeBuyer = typeof buyerCutPercent === 'number' && !isNaN(buyerCutPercent)
    ? Math.max(0, buyerCutPercent)
    : 10;
  const totalCut = safeSeller + safeBuyer;

  return BRACKETS.map((b) => ({
    dealBracket: b.dealBracket,
    orderRangeLabel: b.orderRangeLabel,
    sellerEarningRange: formatRupeeRange(b.minAmount, b.maxAmount, safeSeller, b.isBulkUpper),
    buyerEarningRange: formatRupeeRange(b.minAmount, b.maxAmount, safeBuyer, b.isBulkUpper),
    bothEarningRange: formatRupeeRange(b.minAmount, b.maxAmount, totalCut, b.isBulkUpper),
  }));
}
