# AMJSTAR V2 Roadmap

> **Keep this doc in sync:** when a V2 item is pulled forward, completed, or descoped, update it here (and in `docs/remaining_tasks.md`).
> Sources: AMJ WORKFLOW V1 spec (client MoMs 21/23/26 May 2026), `amj-star-dukandar/dummy/docs/v2AMJ.md` (older notes, consolidated here), code audit of 22 July 2026.
> Last synced: 22 July 2026.

## 1. Reseller Launch & Monetization (biggest V2 theme)

The reseller module is feature-complete UI/API-wise (as of 22 July 2026: onboarding, dashboard, storefront + public page, leads, orders view, payouts UI, wallet access) and public join is open. What remains to make it a business:

- [ ] **Storefront checkout** — buying from `/store/:slug` creates a real Order with `resellerId` attribution (field + endpoint already exist).
- [ ] **Reseller margin crediting** — define & build how the reseller's margin (sellingPrice − basePrice) is credited to their wallet on order completion (mirror the supplier freeze/release model or instant credit — needs business decision).
- [ ] **Reseller payouts automation** — spec mentions weekly automatic payouts.
- [ ] **Reseller KYC verification** — admin-side KYC document review before a reseller can sell (admin reseller-KYC document view is currently missing).
- [ ] **Dropshipping / branded packaging** — supplier ships directly to the reseller's customer with the reseller's branding.
- [ ] **End-to-end testing + launch** of the whole reseller flow.

## 2. On-Platform Payments (Flow B — Escrow)

- [ ] Buyer pays AMJSTAR via Razorpay at deal confirmation (UI toggle already exists, disabled: "AMJSTAR Escrow — COMING SOON" in Checkout/enquiry).
- [ ] Funds held by platform until delivery confirmation; then released to supplier wallet minus commission.
- [ ] Auto-refund rails: supplier missing the 10-day refund-pickup deadline ⇒ automatic buyer refund; replacement deadline enforcement via cron.
- [ ] Bill/receipt generation posted into the enquiry thread (both parties see it).
- [ ] **TCS deduction (1% e-commerce operator law)** — once AMJSTAR collects payments, GST law requires 1% TCS on net taxable supplies; build deduction + reporting. *(Only relevant with Flow B.)*

## 3. Trust & Verification

- [ ] Supplier ratings / trust scores (incl. repeat-purchase trust logic from 23 May MoM).
- [ ] GST verification API integration (auto-verify GSTIN instead of manual admin checks).
- [ ] Buyer-supplier repeat-purchase confidence indicators.

## 4. Search & Discovery

- [ ] Smart search with spelling correction.
- [ ] Voice-to-text search.

## 5. Marketing & Engagement

- [ ] Discounts & festival offers system (supplier-created promotions/campaigns).
- [ ] Smart notifications (beyond V1's basic set).

## 6. Platform Hardening & Tech Debt (from v2AMJ notes)

- [ ] **🔴 Role-switching security bug** — one phone number can silently switch roles (buyer ↔ supplier/reseller): `VerifyOtp.tsx:105` auto-flips an existing buyer's role when logging in via `?mode=seller`, because `auth.service.ts selectRole()` has no guard. Confirmed real-user impact (order `ORD-1783488586951-815`: buyer became "Test Supplier" and lost `/profile` access while still being `buyerId` on the order). **Fix: allow `selectRole` only when `isNewUser`; block role changes for existing accounts.** *Recommend pulling this into V1 — it's a live account-integrity bug, not a feature.*
- [ ] Rate limiting on OTP endpoints (brute-force/abuse protection).
- [ ] Quotation expiry + auto-notification (stale quotations currently linger silently).
- [ ] Razorpay payout automation for wallet withdrawals (currently manual admin processing with UTR).

## 7. Architecture Scaling (Phase 2/3 of auth plan)

- [ ] Move admin to `admin.amjstar.com` subdomain with separate deployment.
- [ ] Optional `supplier.` / `reseller.` subdomains.
- [ ] Expand ABAC rules on top of RBAC.
- [ ] Advanced analytics; deeper logistics integration (post-Blue Dart V1 work).

---

### Not V2 (tracked elsewhere)
- Blue Dart courier integration, E-Way Bill compliance, membership-tier benefit enforcement → **V1 remaining work**, see `docs/remaining_tasks.md`.
- Git repo setup, secret rotation, automated tests → housekeeping, same file.
