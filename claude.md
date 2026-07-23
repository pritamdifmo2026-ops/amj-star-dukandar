# Claude/AI Instructions for AMJSTAR

If you are reading this file, use this as your ultimate context guide for the **AMJSTAR** platform.

## 📁 Repository Paths
- **Frontend Workspace:** `d:\amj_star\amj-star-dukandar`
- **Backend Workspace:** `d:\amj_star\amjstar-backend`
- **Detailed Docs:** `d:\amj_star\docs\` (architecture, business logic, folder structure, full API reference)

## 🎯 What AMJSTAR Is (V1 Scope)
AMJSTAR is a **supplier-first B2B marketplace** connecting Indian manufacturers/suppliers with bulk buyers. It is NOT a direct retail platform. The core loop:

> Supplier lists products → Buyer discovers & enquires → Negotiation via structured enquiry (Quick Reply Bubbles, not free chat) → Quotation → Deal Confirmed → Order created → PO auto-generated (PDF) → Commission frozen in supplier wallet → Delivery tracked → Buyer confirms → Frozen commission released to AMJ.

**V1 focuses on Admin + Supplier + Buyer only.** The Reseller/Partnership module exists in the codebase (`src/modules/reseller/`, `src/modules/partnership/`) but is **deferred to V2** — do not build new reseller features unless explicitly asked.

Key domain distinction (drives the data model): **enquiry ≠ quotation ≠ order**. They are separate modules/collections with a state progression:
`enquiry_sent → quotation_sent → counter_offer (optional) → deal_confirmed → order_created → po_generated → shipped → delivered → completed` (plus `disputed`/`cancelled` branches).

## 🏗️ Architecture & Coding Standards

### Frontend (React + Vite + Tailwind + Redux)
- **Structure:** Feature-Sliced Design. Look in `src/features/` for domain-specific logic.
- **API Calls:** Handled in `src/features/<feature>/services/*.ts`. We use Axios. Base URL logic is in `src/api/client.ts`.
- **State:** Redux Toolkit is used for global state (e.g., Auth, Cart, User Profile).
- **Styling:** Vanilla TailwindCSS. Do not use generic colors; use hex codes matching the brand (e.g., `#0f172a`, `#64748b`) or the custom `primary` tailwind class.
- **Terminology:** UI says **"Enquiry"** (never "Chat"), **"Deal Confirmed"** (never "Deal Signed"), **"Supplier"** (never "Seller"), **"For Bulk Purchase"** (not "Enquire Now").

### Backend (Node.js + Express + Mongoose)
- **Structure:** Modular structure in `src/modules/` (~27 modules incl. `enquiry`, `quotation`, `order`, `wallet`, `payment`, `ticket`, `requirement`, `meeting-request`).
- **Pattern:** Controller ➡️ Service ➡️ Model.
  - *Controller:* Handles `req` and `res`.
  - *Service:* Handles Mongoose queries and business rules.
- **Authentication:** JWT tokens stored in HTTP-only cookies. Check `src/middlewares/auth.middleware.ts`.
  - Buyers/Suppliers/Resellers: **Phone + OTP** login, role selected on first login.
  - Admin: separate **email + password** login (`/admin-login`), supports sub-admins with custom roles.
- **Cron Jobs:** `src/jobs/` — auto-confirm orders (72h window), listing fees, low stock checks, membership renewal reminders, subscription expiry.

## 🧠 Core Business Logic to Remember

### 1. Commission & Supplier Wallet (the revenue model)
- Commission % is set **per supplier by Admin** (`commissionRate`), agreed at onboarding.
- On Deal Confirmed / PO generation: `dealValue × commissionRate / 100` is **frozen** in the supplier wallet (`frozenBalance`).
- On Delivery Confirmed (or 72h auto-completion): frozen amount is **released** to AMJSTAR.
- Wallet fields: `availableBalance`, `frozenBalance`; transaction types: `credit | debit | freeze | unfreeze | release`. See `src/modules/wallet/`.
- Suppliers must maintain an admin-set **minimum wallet balance**; top-ups via Razorpay. Listing fees (₹10/listing/month, min ₹499) are also deducted from the wallet — insufficient balance marks products `blocked_insufficient_balance`.

### 2. Payment Model (mostly OFF-platform)
- **Default:** Buyer pays Supplier **directly** (NEFT/GPay/bank transfer). AMJSTAR does NOT handle order money — it only collects commission from the supplier wallet. Buyer must acknowledge a disclaimer that payment is outside AMJ responsibility.
- **Razorpay is used for:** supplier subscription/membership fees, wallet top-ups, and (deferred/optional) on-platform buyer payment.
- Razorpay signatures must ALWAYS be verified with `crypto.createHmac` + `RAZORPAY_KEY_SECRET`. See `src/modules/payment/payment.service.ts`.

### 3. Enquiry → Quotation → Order Flow
- Enquiry uses **structured Quick Reply Bubbles** (quantity → target price → delivery timeline → requirements) plus optional notes — not free-text chat.
- Supplier responds with a quotation (unit price, auto-calculated total, MOQ, lead time, payment terms). Buyer can **Accept / Counter / Decline**; counters are on **total amount (excluding GST & shipping)** and shipping time. Supplier can tag **"Best Price" / "Last Price"**.
- On acceptance: order created, **PO PDF auto-generated** (stored on Cloudinary, numbered like `AMJ-PO-2024-0001`, includes deal-confirmation and PO dates), stock auto-decremented, and **phone numbers unlock for both parties** (hidden before PO).

### 4. Tax & Invoicing (GST)
- Taxes are calculated dynamically at checkout (`src/modules/order/order.controller.ts`).
- Never trust client-side tax calculations. Always fetch `gstRate` and `gstIncluded` from the `Product` model in the backend during order creation.
- GST Type: same state → CGST + SGST split; different states → IGST. Compare `supplierProfile.state` vs `buyerProfile.state`.
- 18% GST also applies on platform commission/membership fees.

### 5. Order Lifecycle & Disputes
- Order statuses: `paid/pending → packed (optional) → dispatched → delivered → awaiting confirmation → completed`. Buyer has a **72-hour window** after delivery; no response = auto-complete (see `src/jobs/autoConfirmOrders.ts`).
- Dispute state machine: `OPEN → VALIDATED | REJECTED → SUPPLIER_RESOLVED | EXCHANGE → RESOLVED | REOPENED`. Admin validates first; supplier resolves via Refund (must provide bank UTR), Partial settlement, or Replacement (structured return/replacement tracking). 10-day supplier pickup deadline triggers auto-refund. Endpoints live in `src/modules/order/`.

### 6. Products, Approval & Memberships
- Every supplier product needs **Admin approval** before going live, unless the supplier has the admin-granted **Auto-Live** flag.
- Products carry MOQ (cart enforces it), SKU, stock, packaging dimensions/weight (needed for courier/Blue Dart logistics), certifications (admin-verified before display), and category-specific dynamic attributes (Textiles/Food/Machinery/Chemicals).
- Supplier membership plans (annual + 18% GST): Verified ₹2,100 · TrustSEAL Gamma ₹21,000 · Beta ₹51,000 · Alpha ₹2,50,000 · Partner Alpha ₹9,99,999. Higher tiers = badges, physical verification, listing support, sales support, sponsored placement. Expiry handled by cron jobs.

### 7. Explicitly OUT of V1 scope
Reseller/dropshipping flows, smart/voice search, discounts & festival offers, supplier ratings/trust scores, GST verification API, on-platform buyer payment (Flow B/escrow).

## 📝 Documentation Upkeep (MANDATORY)
Whenever you change code or scope, update the matching doc **in the same change**:
- **Money freeze/hold, wallet, commission, withdrawals, listing fees** → `docs/money_hold_logic.md`
- **Disputes, 72h windows, returns/replacements, refunds** → `docs/dispute_logic.md`
- **Anything completed, newly discovered, or descoped** → `docs/remaining_tasks.md` (living tracker of remaining & pending work)
- **V2 scope changes (items pulled forward, added, or dropped)** → `docs/v2_roadmap.md`
- **New/changed API endpoints** → `docs/apis.md`
Each of these files carries a "Last synced" date — bump it when you touch it.

## 🛠️ Instructions for Modifying Code
1. **Locate the Feature:** If asked to modify something related to "Wallet", go to `src/features/wallet/` (Frontend) and `src/modules/wallet/` (Backend).
2. **Trace the Flow:**
   UI Component ➡️ Axios Service ➡️ Express Route ➡️ Controller ➡️ Mongoose Service.
3. **No Placeholders:** If asked to build a UI, generate a complete, working React component with modern aesthetics. Do not leave "TODO" blocks.
4. **Safe Edits:** When modifying existing files, preserve all unrelated code and imports.
5. **No Secrets:** Never hardcode credentials/keys; use `process.env` (backend) and `import.meta.env` (frontend).
