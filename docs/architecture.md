# AMJSTAR System Architecture

## Overview
AMJSTAR is a **supplier-first B2B marketplace** connecting Indian manufacturers/suppliers with bulk buyers. It is not a direct retail platform: order payments happen mostly off-platform, and AMJSTAR earns via **per-supplier commission** (frozen in the supplier wallet on deal confirmation, released on delivery) plus **membership plans and listing fees**.

### Personas
1. **Admin / Sub-admins**: AMJSTAR team. Approve suppliers & products, manage commissions, categories, banners, disputes, withdrawals, platform settings. Separate email+password login; sub-admins have assignable role permissions.
2. **Suppliers**: Manufacturers/wholesalers. List products (admin-approved unless Auto-Live), respond to enquiries with quotations, manage orders and dispatch, hold a wallet (available + frozen balance), subscribe to membership tiers.
3. **Buyers**: Retailers/business buyers. Browse, send structured enquiries, negotiate, confirm deals, receive PO/invoices, confirm delivery, raise disputes/tickets, post requirements.
4. **Resellers** *(V2 — code exists but deferred)*: curate storefronts of supplier products with markup via the Partnership model.

### Core Loop
`Enquiry → Quotation (+ counters) → Deal Confirmed → Order + auto PO PDF → commission frozen → shipped → delivered → buyer confirms (72h auto-complete) → commission released to AMJ`

Enquiry, Quotation, and Order are **separate collections/modules** — an enquiry is not an order.

## Tech Stack
*   **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Redux Toolkit, React Query.
*   **Backend**: Node.js, Express.js, TypeScript (modular monolith).
*   **Database**: MongoDB (Mongoose ORM).
*   **Real-time**: Socket.io (enquiry threads and live notifications).
*   **Third-Party Integrations**:
    *   **Razorpay**: membership/subscription fees and supplier wallet top-ups (on-platform buyer payment is deferred). HMAC SHA256 signature verification mandatory.
    *   **Cloudinary**: image hosting + generated PO/invoice PDFs.
    *   **Firebase**: Admin SDK for push notifications (FCM tokens on users).
    *   **Nodemailer**: transactional email via SMTP (info/marketing/support senders).
    *   **PDF generation**: server-side (POs, invoices, supplier reports).
    *   **Logistics (planned)**: Blue Dart as preferred courier; suppliers with own logistics can opt out. Packaging dims/weight captured per product for freight calculation.

## Architectural Patterns

### Frontend: Feature-Sliced Design
The React application (`amj-star-dukandar`) is structured around business features rather than file types.
*   A feature (e.g., `supplier`, `buyer`, `admin`, `order`, `product`) encapsulates its own components, pages, Redux slices, and Axios API services.
*   Global state via Redux Toolkit; server state via Axios (+ React Query in places).
*   UI terminology: "Enquiry" (not Chat), "Deal Confirmed" (not Deal Signed), "Supplier" (not Seller).

### Backend: Module-Driven (Controller-Service-Model)
The Express application (`amjstar-backend`) is organized into ~27 domain modules under `src/modules/`.
*   **Controllers**: HTTP request parsing, response formatting, status codes.
*   **Services**: core business logic, DB queries, third-party API calls.
*   **Models**: Mongoose schemas.
*   **Routes**: mounted centrally in `src/routes/index.ts` under `/api/...`.
*   **Middlewares**: JWT verification (HTTP-only cookies) + role-based access control.
*   **Jobs** (`src/jobs/`): auto-confirm orders after 72h, listing fee billing, low-stock checks, membership renewal reminders, subscription expiry downgrades.

### Auth
*   Buyers/Suppliers/Resellers: **Phone + OTP**, role chosen at first login, progressive onboarding for business roles.
*   Admin: separate email+password login (`/admin-login`), manually created accounts, sub-admin support.
*   RBAC via JWT role claim; ABAC ownership checks in services (supplier can only touch own resources).

## Database Schema Highlights
*   **User**: root auth model (phone, role, FCM token).
*   **Supplier**: business profile (GSTIN, PAN, bank accounts, turnover/capacity, return policy, own-shipping flag), `commissionRate`, membership tier, verification status, Auto-Live flag.
*   **Buyer**: business profile (GST, company details, requirement estimates).
*   **Product**: pricing, MOQ, SKU, stock, GST rate/included flag, packaging dims/weight, certifications (admin-verified), category-specific dynamic attributes, approval status.
*   **Enquiry**: structured negotiation thread (quick-reply steps + notes).
*   **Quotation**: unit/total price, MOQ, lead time, terms; counter-offer chain; best/last price tags.
*   **Order**: snapshot of deal, GST breakdown (CGST/SGST vs IGST), PO PDF link, statuses through delivery, dispute sub-flow (OPEN → VALIDATED → SUPPLIER_RESOLVED/EXCHANGE → RESOLVED/REOPENED).
*   **Wallet + WalletTransaction + WithdrawalRequest**: `availableBalance`, `frozenBalance`; ledger of `credit | debit | freeze | unfreeze | release`; withdrawal processing by admin.
*   **Partnership** *(V2)*: reseller ↔ product authorization with custom pricing.
*   **Requirement / Ticket / MeetingRequest / Notification / Banner / Category / Certification / Page**: supporting admin & buyer-side workflows.
