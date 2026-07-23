# AMJSTAR Business Logic Workflows

> Source of truth: the "AMJ WORKFLOW V1" planning document + implemented code. V1 scope = **Admin + Supplier + Buyer**. Reseller/dropshipping is deferred to V2.

## 1. Core Business Flow (Supplier-First B2B)
AMJSTAR is a supplier-first B2B marketplace, not a retail platform. The revenue model is **commission on deals**, not payment processing.

```
1. Supplier onboards → submits business docs (GSTIN, PAN, bank, turnover, capacity, tax details) → Admin approves
2. Supplier adds products (pricing, MOQ, SKU, packaging dims/weight, category-specific attributes)
3. Product enters approval queue → Admin approves (or supplier has admin-granted "Auto-Live" bypass)
4. Buyer browses → clicks "For Bulk Purchase" → structured Enquiry starts
5. Supplier responds with Quotation (unit price, auto-total, MOQ, lead time, payment terms)
6. Negotiation: buyer counters on total amount (excl. GST/shipping) and shipping time;
   supplier can tag "Best Price" / "Last Price"
7. Buyer accepts → Deal Confirmed → Order created → PO PDF auto-generated
8. Commission frozen in supplier wallet; stock auto-decremented; phone numbers unlocked
9. Supplier ships (own logistics or platform courier / Blue Dart) → buyer confirms delivery
10. Frozen commission released to AMJSTAR
```

Key modeling rule: **enquiry ≠ quotation ≠ order** — separate modules with state progression:
`enquiry_sent → quotation_sent → counter_offer → deal_confirmed → order_created → po_generated → shipped → delivered → completed` (branches: `disputed`, `cancelled`).

## 2. Commission & Supplier Wallet
- `commissionRate` (%) is agreed at onboarding and controlled by Admin (supplier may suggest; admin approves).
- On Deal Confirmed / PO generation: `dealValue × commissionRate / 100` is **frozen** (`frozenBalance`).
- On Delivery Confirmed (or 72h auto-completion): frozen amount is **released** to AMJSTAR.
- Wallet: `availableBalance` + `frozenBalance`; ledger transaction types `credit | debit | freeze | unfreeze | release`.
- Suppliers must maintain an admin-configured **minimum wallet balance**; recharge via Razorpay.
- **Listing fees**: ₹10 per listing per month (min ₹499). Insufficient balance → product marked `blocked_insufficient_balance` (hidden) until topped up.
- If supplier uses own shipping, shipping charges are excluded from commission calculation.

## 3. Payment Model
- **Default (Flow A — off-platform):** buyer pays supplier directly (NEFT/GPay/bank). AMJSTAR never touches order money; it only deducts commission from the supplier wallet. Buyer must confirm an explicit disclaimer: payment is outside AMJ responsibility.
- **Flow B (on-platform via Razorpay, deferred):** AMJSTAR collects payment as escrow, releases to supplier after completion.
- Razorpay is actively used for: membership/subscription fees, wallet top-ups. All signatures verified with `crypto.createHmac` + `RAZORPAY_KEY_SECRET`.

## 4. Enquiry System ("Quick Reply Bubbles")
Chat is renamed **Enquiry** platform-wide. Not free-text: structured steps with optional notes.
- Buyer steps: quantity → target price → delivery timeline → special requirements → sent.
- Supplier quotes: price/unit (system auto-computes total), MOQ, lead time, payment terms (Advance/Credit/50-50), notes.
- Buyer options: **Accept Deal / Counter Offer / Decline**. Cancellation allowed for both sides before PO (supplier must give a reason; buyer notified).
- **Phone visibility:** both parties' phone numbers hidden until `po_generated`, then shown as `tel:` links.
- Buyer's delivery address is visible to supplier during enquiry (for shipping estimation). Address forms use State → City dependent dropdowns.

## 5. Purchase Order (PO)
- Auto-generated PDF on deal confirmation: PO number (`AMJ-PO-2024-0001` style), buyer/supplier details (name, GST, address), line items (name, SKU, qty, unit price, total), deal-confirmation date + PO date, payment & delivery terms, AMJSTAR branding.
- Stored on Cloudinary; downloadable by both parties. Default payment note: "Payment directly to supplier per agreed terms."

## 6. Order Lifecycle, Auto-Completion & Disputes
Statuses: `pending/paid → packed (optional) → dispatched (courier + tracking ID) → delivered → awaiting confirmation → completed`.

- After delivery, buyer has a **72-hour window**: "Received, all good" (optional review) or "I have an issue". No response → **auto-completed** (cron: `autoConfirmOrders.ts`) and commission released.
- **Dispute flow** (order must be in the 72h window; evidence photos/videos required):
  1. `OPEN` — buyer raises; auto-complete timer paused; commission stays frozen.
  2. Admin review → `VALIDATED` (supplier must act; notified via dashboard + email) or `REJECTED` (back to awaiting confirmation).
  3. Supplier resolution → **Refund** (must provide bank UTR), **Partial/Other settlement**, or **Replacement** → `SUPPLIER_RESOLVED` or `EXCHANGE`.
  4. Buyer confirms (→ `RESOLVED`, order `COMPLETED`) or rejects with reason (→ `REOPENED`, back to supplier). Buyer silence for 72h = assumed resolved.
- **Exchange flow** (`EXCHANGE`): optional return of defective item (buyer enters return courier/tracking) → supplier marks return received → ships replacement (courier/tracking) → buyer confirms or reopens.
- Safety rails: replacement deadline required; if supplier fails refund pickup within **10 days**, buyer is auto-refunded (Flow B). Admin can manually unfreeze/release commission on disputes.

## 7. Supplier Membership Plans (annual, + 18% GST)
| Plan | Fee | Highlights |
|---|---|---|
| Verified Supplier | ₹2,100 | GST verification + Verified badge |
| SME TrustSEAL Gamma | ₹21,000 | + TrustSEAL badge, physical verification |
| SME TrustSEAL Beta | ₹51,000 | + backend listing/technical support |
| SME TrustSEAL Alpha | ₹2,50,000 | + ground sales support, dedicated sales manager, reports (quarterly billing allowed) |
| Partner Alpha | ₹9,99,999 | + sponsored promotions, category/homepage placement (quarterly billing allowed) |

- Expiry: cron (`subscriptionExpiryJob.ts`) downgrades expired suppliers and hides products; renewal reminders via `membershipRenewalReminderJob.ts`.
- Several plan details (listing limits, visibility matrix, grace periods, quarterly amounts) are **pending client confirmation** — treat unconfirmed items as out of scope.

## 8. Products, Stock & Logistics
- **SKU + stock management is high priority**: stock shown on product page, auto-reduced on order/PO generation; low-stock cron alerts.
- MOQ is enforced in cart (buyer can't go below supplier's MOQ).
- Packaging dimensions/weight/type are required product fields (courier calculations; Blue Dart is the preferred logistics partner; suppliers with own logistics can opt out).
- Certifications (FSSAI/ISO/BIS/etc.) shown only after admin verifies uploaded certificates.
- High-value shipments (> ₹50,000) need GST invoice / E-Way Bill compliance support.
- Category-specific dynamic attributes: Textiles (fabric, GSM, pattern…), Food & Agri (expiry, FSSAI no…), Machinery (power, capacity, warranty…), Chemicals (purity, CAS, HS code…).

## 9. Buyer-Side Features
- Buyer business profile: GST number, company name/address, requirement estimates (B2B bulk buying context).
- **Post a Requirement**: landing-page + profile form (product, category/subcategory, qty, details) routed to Admin/Sales team, who assign suppliers and can email recommendations.
- Product-not-found search → "Our team will contact you soon" + helpline + WhatsApp button.
- Support **tickets** from buyer profile, connected to Admin panel.
- Basic notifications only in V1: new enquiry, quotation, counter offer, order status updates.

## 10. Auth & Roles
- Buyer/Supplier/Reseller: **Phone + OTP** login; first-time users pick a role; suppliers/resellers get progressive onboarding (business details, docs, bank verification for payouts).
- Admin: separate **email + password** login (`/admin-login`); accounts created manually. Super Admin can create **sub-admins** with custom roles (Sales/Marketing/Product/Operations Manager) and assignable permissions.
- RBAC primary (`buyer | supplier | reseller | admin` in JWT), ABAC ownership checks secondary (e.g., supplier edits only own products).

## 11. Taxation (GST) at Checkout
- Server-side only (`order.controller.ts`); never trust client tax math.
- `gstRate` and `gstIncluded` come from the Product model. If included, base price is reverse-calculated (`total / (1 + rate)`); otherwise GST is added on top.
- Same state (supplier vs buyer) → CGST + SGST split; different → IGST.
- PDF invoices break down taxable amount, GST type, rate, amount. Suppliers can export monthly sales/GST reports (PDF/Excel/CSV) for return filing.

## 12. Deferred to V2 / Not in V1
Reseller & partnership storefront flow (code exists but inactive), dropshipping, on-platform buyer payments (escrow), smart search / spelling correction, voice search, smart notifications, discounts & festival offers, supplier ratings & trust scores, GST verification API integration.
