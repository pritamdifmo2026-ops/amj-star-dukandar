import appConfig from '@/config/app.config';

export function calculateGST(basePrice: number, rate: number = appConfig.gstRate): number {
  return parseFloat(((basePrice * rate) / 100).toFixed(2));
}

export function priceWithGST(basePrice: number, rate: number = appConfig.gstRate): number {
  return parseFloat((basePrice + calculateGST(basePrice, rate)).toFixed(2));
}

export function priceWithoutGST(totalPrice: number, rate: number = appConfig.gstRate): number {
  return parseFloat((totalPrice / (1 + rate / 100)).toFixed(2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-rate GST breakdown — the single source of truth shared by Cart, Checkout,
// the quotation form and the sent-quote display. Groups line items by their GST
// rate and rounds GST *per rate then sums* (the same convention the backend uses
// when it builds an order snapshot), so every screen and the PO agree to the paisa.
//
// For a single-rate cart (the only kind that existed before multi-GST), per-rate
// rounding is identical to rounding the grand sum, so existing behaviour is unchanged.
// ─────────────────────────────────────────────────────────────────────────────

export interface GstItemInput {
  price: number;          // per-unit price the buyer pays for this line
  quantity: number;
  gstRate?: number;       // 0 | 5 | 12 | 18 | 28 — defaults to config rate
  gstIncluded?: boolean;  // true => price already contains GST
}

export interface GstRateLine {
  rate: number;    // GST slab, e.g. 5, 12, 18
  taxable: number; // taxable value at this slab, rounded to 2dp
  gst: number;     // GST amount at this slab, rounded to 2dp
}

export interface GstBreakdown {
  subtotal: number;      // sum of taxable across all slabs (rounded)
  lines: GstRateLine[];  // one entry per distinct rate present, ascending by rate
  totalGst: number;      // sum of per-line GST (rounded)
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildGstBreakdown(items: GstItemInput[]): GstBreakdown {
  const byRate = new Map<number, { taxable: number; gst: number }>();

  for (const item of items) {
    const rate = item.gstRate ?? appConfig.gstRate;
    const qty = Number(item.quantity) || 0;
    // Compute on the line total (price × qty), matching the backend order/PO helper so
    // the quote preview, the saved quote and the invoice never differ by a paisa.
    const lineTotal = item.price * qty;
    let base: number;
    let gst: number;
    if (item.gstIncluded && rate > 0) {
      base = lineTotal / (1 + rate / 100);
      gst = lineTotal - base;
    } else {
      base = lineTotal;
      gst = rate > 0 ? lineTotal * (rate / 100) : 0;
    }
    const cur = byRate.get(rate) || { taxable: 0, gst: 0 };
    cur.taxable += base;
    cur.gst += gst;
    byRate.set(rate, cur);
  }

  const lines: GstRateLine[] = [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, v]) => ({ rate, taxable: round2(v.taxable), gst: round2(v.gst) }));

  const subtotal = round2(lines.reduce((s, l) => s + l.taxable, 0));
  const totalGst = round2(lines.reduce((s, l) => s + l.gst, 0));

  return { subtotal, lines, totalGst };
}
