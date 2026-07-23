# Reseller Module - Remaining Tasks & Status

Based on an analysis of the current `amj-star-dukandar` frontend repository, here is a detailed breakdown of what is already built and what still needs to be done for the **Reseller Role**.

> **Status update (22 July 2026):** All tasks below are now implemented. Details of what was built are noted inline. The public "Join as a Reseller" CTA on the Reseller Hub landing page is now live (links to `/login?mode=reseller`); the previous "coming soon" toast gate was removed at the owner's request. Note the V1 spec still lists reseller monetization (storefront checkout + commission crediting) as V2 scope.

## ✅ Implemented Features (UI Completed)

*   **Reseller Onboarding:** Full multi-step onboarding flow (`ResellerOnboarding.tsx`).
*   **Dashboard Layout:** Sidebar, top navigation, and routing (`ResellerDashboard.tsx`).
*   **Overview Tab:** High-level statistics and quick links.
*   **My Products:** Interface to view approved/pending products, set selling price margins, and customize descriptions (`ResellerMyProducts.tsx` - *API Connected*).
*   **Browse Products:** UI to search the supplier catalogue and request to sell (`ResellerBrowseProducts.tsx`).
*   **Storefront Settings:** Storefront customization UI (`ResellerStorefront.tsx`) — now includes banner upload, theme colour, and announcement, persisted via `PUT /api/reseller/storefront`.
*   **Leads Management:** UI to track buyer inquiries and contact them via WhatsApp (`ResellerLeads.tsx` - *API Connected*).
*   **Supplier Partnerships:** UI to manage relationships with suppliers (`ResellerSupplierPartners.tsx` - *API Connected via `/partnership/my-requests`*).
*   **Performance:** Analytics dashboard UI (`ResellerPerformance.tsx`).
*   **History & Action Center:** Tracking activities and pending tasks (`ResellerHistory.tsx`, `ResellerActionCenter.tsx`).
*   **Settings:** Profile and Bank Account update forms (`ResellerSettings.tsx`).

---

## ✅ Previously Remaining Tasks (Now Built — 22 July 2026)

### 1. Missing UI Components — DONE

> **Customer Orders (`ResellerOrders.tsx`)** ✅
> *   Orders table with search + status filter, fed by `GET /api/reseller/orders` (orders carry a new optional `resellerId` on the Order model).
> *   Order detail modal with status timeline (Processing → Packed → Shipped → Delivered → Completed), customer/supplier info, item breakdown, tracking info.
> *   Invoice/PO download via `GET /api/order/:id/po-download` (order controller now also authorizes the attributed reseller).

> **Earnings & Payouts (`ResellerPayouts.tsx`)** ✅
> *   Wallet UI: available balance, pending/frozen, lifetime earnings (`GET /api/wallet` — wallet routes now allow the `reseller` role; wallets are keyed by `User._id`).
> *   Ledger of wallet transactions (`GET /api/wallet/transactions`).
> *   Withdrawal request form using the reseller's registered bank details (`POST /api/wallet/withdraw`), plus withdrawal history tab. The wallet service's bank fallback is also reseller-aware.

### 2. API Integrations — DONE

*   **Reseller Leads:** `Lead` model added (`amjstar-backend/src/modules/reseller/lead.model.ts`); dashboard fetches real leads (`GET /api/reseller/leads`) and persists status changes (`PATCH /api/reseller/leads/:id`).
*   **Reseller Orders:** connected to `GET /api/reseller/orders` filtered by `Order.resellerId`.
*   **Storefront Settings:** "Save Layout" persists banner image, theme colour, and announcement to the Reseller document (`storefront` subdocument) via `PUT /api/reseller/storefront`.
*   **Supplier Partnerships:** fetches real partnership status from `/partnership/my-requests` (was already connected).
*   **Earnings/Payouts:** connected to the shared Wallet API.

### 3. Public Storefront Enhancements — DONE

*   **Public Routing:** `Reseller` model now has a unique auto-generated `storeSlug` (from store name; lazily backfilled for existing profiles). `PublicStorefront.tsx` loads profile, theme, and curated products from the public endpoint `GET /api/reseller/public/:slug`. Slugs never collide with 24-hex supplier IDs, so `/store/:idOrSlug` dispatching keeps working.
*   **Lead Generation Form:** "Contact Reseller" (store-level and per-product) opens a form that posts to `POST /api/reseller/public/:slug/lead`, creating a Lead in the dashboard and notifying the reseller.

---

## ⏳ Genuinely Remaining (Future / V2)

*   **Checkout from the public storefront:** buying directly from a reseller store (creating an Order with `resellerId` attribution and reseller commission crediting) is not yet implemented — orders currently only reach resellers if created with `resellerId` set by a future checkout flow.
*   **Reseller commission crediting rules:** when/how a reseller's margin is credited to their wallet on order completion needs business sign-off (V2 scope per the AMJ WORKFLOW V1 spec).
