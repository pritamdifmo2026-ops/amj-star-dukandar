# Tax Calculation in AMJ Star Dukandar

This document explains how GST and tax works end-to-end — from a supplier listing a product to the final PO. For any new developer or AI reading this.

---

## 1. Product Level — Supplier Sets the Tax

When a supplier adds a product (`AddProductForm.tsx`), they set two tax fields:

| Field | Values | Default |
|---|---|---|
| `gstRate` | 0, 5, 12, 18, 28 (%) | 18 |
| `gstIncluded` | true / false | false |

**What these mean:**

- `gstIncluded = false` → The listed price is **before tax**. Buyers see `₹price + X% GST` on top.
- `gstIncluded = true` → The listed price **already includes GST**. Buyers see this as the all-inclusive price.

**Example:**
- Price = ₹1,000, gstRate = 18%, gstIncluded = false → Buyer pays ₹1,000 + ₹180 = ₹1,180
- Price = ₹1,180, gstRate = 18%, gstIncluded = true → Buyer pays ₹1,180 (base = ₹1,000, GST = ₹180)

These are stored on the `Product` model in MongoDB (`product.model.ts`).

---

## 2. Frontend Utility Functions (`src/shared/utils/calculateGST.ts`)

Three helper functions used across Cart, Checkout, and Product Detail:

```ts
// GST amount on a base price
calculateGST(basePrice, rate) = basePrice * rate / 100

// Total price including GST
priceWithGST(basePrice, rate) = basePrice + calculateGST(basePrice, rate)

// Extract base price from a GST-inclusive total
priceWithoutGST(totalPrice, rate) = totalPrice / (1 + rate / 100)
```

---

## 3. Product Detail Page (`ProductDetail.tsx`)

Shows the buyer what they'll actually pay:

```
If gstIncluded = false:
  displayed price = product.price  +  calculateGST(price, gstRate)

If gstIncluded = true:
  displayed price = product.price  (shows "Inclusive of GST")
```

---

## 4. Cart & Checkout — Per-Item Tax Breakdown

**Both Cart.tsx and Checkout.tsx use the same logic.**

For each item in the cart:

```
If gstIncluded = true:
  basePerUnit = priceWithoutGST(item.price, gstRate)    // reverse-extract base
  gstPerUnit  = item.price - basePerUnit

If gstIncluded = false:
  basePerUnit = item.price
  gstPerUnit  = calculateGST(item.price, gstRate)
```

Then:
```
subtotal = sum of (basePerUnit × quantity)   ← always tax-exclusive
gstAmount = sum of (gstPerUnit × quantity)
```

### IGST vs CGST/SGST

Determined by comparing buyer's state vs supplier's state:

- **Same state (intra-state)** → **CGST + SGST** (each at half the rate)
  - e.g. 18% GST → CGST 9% + SGST 9%
- **Different states (inter-state)** → **IGST** (full rate)
  - e.g. 18% GST → IGST 18%
- **States unknown** → defaults to IGST

Multiple GST rates are tracked separately (e.g. some items at 12%, others at 18%).

Buyer state is derived from their pincode (`pincodeToState()`).
Supplier state is stored on the cart item as `supplierState`.

---

## 5. Quotation Flow (Chat / Enquiry)

When a supplier creates a quotation manually, they set:

| Field | Description |
|---|---|
| `taxableAmount` | Product subtotal (no GST) |
| `gstRate` | e.g. 18 |
| `gstAmount` | Calculated: taxableAmount × gstRate% |
| `gstType` | `'IGST'` or `'CGST_SGST'` or `'exempt'` |
| `shippingCost` | Freight charge |

```
grandTotal = taxableAmount + gstAmount + shippingCost
```

When the buyer accepts the quotation, these values flow into the Order's `snapshot` field, and then into the PO PDF.

---

## 6. Direct Order (Cart Checkout — `createDirectOrder` in `order.controller.ts`)

The backend uses a **flat 18% GST** for simplicity, regardless of per-product gstRate:

```ts
const GST_RATE = 0.18;
taxableAmount = sum of (item.price × item.quantity)
gstAmount     = taxableAmount × 0.18
totalAmount   = taxableAmount + gstAmount
```

> ⚠️ **Known simplification**: The backend ignores per-item `gstRate` and `gstIncluded`. The frontend shows the correct breakdown, but the backend stores a flat 18%. This is acceptable for now but should be improved later to read per-product gstRate from the Product document.

Stored in order `snapshot`:
```json
{
  "taxableAmount": ...,
  "gstRate": 18,
  "gstAmount": ...,
  "gstType": "IGST"
}
```

---

## 7. Commission — Platform Fee on Supplier Wallet

Commission is calculated **on taxableAmount only** (never on GST or shipping).

```
commission    = taxableAmount × commissionRate%
serviceGst    = commission × 18%        ← GST on the commission service charge
totalDeduction = commission + serviceGst
```

`commissionRate` is set per-supplier by the admin (e.g. 2%, 3%).

**Example:**
- Order = ₹40,000 taxable, commissionRate = 2%
- commission = ₹40,000 × 2% = **₹800**
- serviceGst = ₹800 × 18% = **₹144**
- totalDeduction = **₹944** deducted from supplier wallet

This deduction happens at `WalletService.freezeCommission()` — called after order creation in both the quotation flow and direct order flow.

If the supplier doesn't have ≥ `totalDeduction` in their wallet, the order is **blocked** (402 error), and the supplier gets a real-time socket notification.

---

## 8. PO PDF (`po.service.ts`)

The PO shows:

```
Price (subtotal / taxableAmount)         ₹XX,XXX
IGST @ 18%                               ₹X,XXX
  -- OR --
CGST @ 9%                                ₹X,XXX
SGST @ 9%                                ₹X,XXX
  -- OR --
GST                                 Exempt / Nil
Shipping                                 ₹XXX
────────────────────────────────────────────────
GRAND TOTAL                              ₹XX,XXX
```

- `gstType === 'IGST'` → shows single IGST line
- `gstType === 'CGST_SGST'` → shows two lines, each at half the rate
- `gstType === 'exempt'` or gstRate = 0 → shows "Exempt / Nil"

---

## 9. Subscription Plans

Suppliers pay for plans (Verified/Gamma/Beta). Plans also have GST:

```
planPrice  (base)
gstAmount  = planPrice × gstPercent%    (18% typically)
amountPaid = planPrice + gstAmount
```

This is separate from product GST — it's a service fee GST. Stored in `SubscriptionPayment` model.

---

## Summary Table

| Context | Base | GST Rate | GST Type |
|---|---|---|---|
| Product listing | supplier-entered price | 0/5/12/18/28% (per product) | determined by buyer/supplier states |
| Cart / Checkout display | extracted from `gstIncluded` price | per product | IGST or CGST+SGST by state |
| Direct order (backend) | item.price × qty | flat 18% | stored as IGST |
| Quotation order | supplier-entered taxableAmount | supplier-set | supplier-set (IGST/CGST_SGST/exempt) |
| Commission deduction | taxableAmount only | 18% on commission | N/A (service charge) |
| Subscription payment | plan base price | 18% | service GST |
