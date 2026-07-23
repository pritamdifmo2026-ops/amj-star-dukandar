# AMJSTAR — Manual Testing Guide

> Step-by-step checklist to test the platform by hand. Tick each `[ ]` as you go.
> Cross-references: money behaviour → `docs/money_hold_logic.md`, disputes → `docs/dispute_logic.md`, what's not built → `docs/remaining_tasks.md`.
> Last synced: 22 July 2026.

---

## 0. Setup

### Start both servers
```bash
# Terminal 1 — backend (http://localhost:5000)
npm run dev --prefix amjstar-backend

# Terminal 2 — frontend (http://localhost:5173)
npm run dev --prefix amj-star-dukandar
```
- [ ] Backend console shows DB connected + `PORT=5000`, no crash.
- [ ] Frontend opens at `http://localhost:5173`.
- [ ] `.env` present in **both** folders (see `amjstar-backend/.env`, `amj-star-dukandar/.env`).

### Test credentials (dummy OTP environment)
| Role | Login | Value |
|---|---|---|
| Buyer | Phone | `1234567890` |
| Supplier | Phone | `0987654321` |
| Reseller | Phone | `7894561231` |
| OTP (all phone logins) | Code | `123456` |
| Admin | Email / Password | `admin@gmail.com` / `123456` |
| Sub-admin | Email / Password | `ieee.webmaster.01@gmail.com` / `12345678` |

> If a phone isn't registered yet, logging in creates a new user and lets you pick a role (first-time only). Use fresh phone numbers to test onboarding from scratch.

### Key URLs
- Buyer site / home: `/`
- Phone login: `/login` (add `?mode=supplier` or `?mode=reseller` to pre-tag the role)
- Admin login: `/admin/login`
- Admin dashboard: `/admin/dashboard`
- Supplier dashboard: `/supplier/dashboard` (tabs via `?tab=`)
- Reseller dashboard: `/reseller/dashboard?tab=overview`
- Public reseller store: `/store/<storeSlug>`

---

## 1. Authentication & Roles

### 1.1 Buyer login
- [ ] Go to `/login`, enter a buyer phone, submit.
- [ ] Enter OTP `123456` → lands on buyer home, no dashboard sidebar.
- [ ] Refresh page → still logged in (JWT cookie persists).
- [ ] Logout → returns to public site.

### 1.2 First-time role selection
- [ ] Log in with a brand-new phone number → OTP → role selection screen appears.
- [ ] Choosing **Buyer** enters the site directly.
- [ ] Choosing **Supplier** / **Reseller** routes into onboarding.

### 1.3 Admin login (separate system)
- [ ] `/admin/login` with `admin@gmail.com` / `123456` → admin dashboard.
- [ ] Admin **cannot** browse/buy as a buyer (isolated UI).
- [ ] Sub-admin login works and shows only its permitted sections.

### 1.4 ⚠️ Role-switch guard (known bug — see v2_roadmap.md)
- [ ] Log in as an existing **buyer**, then log in again via `/login?mode=supplier`.
- [ ] **Expected (after fix):** existing buyer is NOT silently converted to supplier.
- [ ] **Current (bug):** role may flip with no confirmation. Note the behaviour — this is a tracked defect.

---

## 2. Supplier Onboarding & Approval

### 2.1 Onboard
- [ ] Log in as supplier (new phone) → onboarding form.
- [ ] Fill business name, GSTIN, PAN, business type, address.
- [ ] Add **bank details** (account holder, account no., IFSC `XXXX0XXXXXX`, bank name).
- [ ] Fill turnover / production capacity / tax details.
- [ ] Set return policy (Return Available / No Return / Custom).
- [ ] Submit → status becomes `pending_review`; onboarding resumes if you refresh mid-way.

### 2.2 Admin approval
- [ ] As admin → Suppliers → Pending → see the new supplier.
- [ ] Set a **commission rate** (e.g. 5%) — required before POs can be generated.
- [ ] Approve → supplier can now list products.
- [ ] (Optional) Toggle **Auto-Live** on the supplier and observe products skip the approval queue later.

---

## 3. Products, Approval & Wallet Gating

### 3.1 Add product
- [ ] Supplier → Products → Add. Fill name, description, category/subcategory, MOQ, SKU, stock, price, GST rate + `gstIncluded`, lead time.
- [ ] Add **packaging dimensions/weight** and images.
- [ ] Add category-specific attributes (e.g. Textiles GSM, Food FSSAI no.).
- [ ] Submit → product status `pending_review` (unless Auto-Live).

### 3.2 Approval + listing fee (money check)
- [ ] Admin approves the product.
- [ ] If supplier wallet ≥ ₹10 → product goes **live**, ₹10 listing fee deducted (check wallet ledger).
- [ ] If wallet < ₹10 → product approved but `blocked_insufficient_balance` (hidden from buyers).
- [ ] Top up wallet (see §4) → blocked product auto-activates (oldest first).

### 3.3 Wallet top-up (Razorpay test)
- [ ] Supplier → Wallet → Top Up → enter amount → Razorpay test checkout.
- [ ] Use Razorpay **test card** to complete → wallet `availableBalance` increases, `topup` ledger entry appears.
- [ ] Refresh: balance persists.

---

## 4. Enquiry → Quotation → Deal → PO (core loop)

> Watch the money: commission freezes at PO generation. See `docs/money_hold_logic.md`.

### 4.1 Buyer enquiry
- [ ] As buyer, open a live product → **"For Bulk Purchase"**.
- [ ] Step through Quick Reply Bubbles: quantity → target price → delivery timeline → requirements.
- [ ] Address step shows **State → City** dependent dropdowns.
- [ ] Enquiry appears in supplier's Enquiry inbox.

### 4.2 Supplier quotation
- [ ] Supplier opens enquiry, sends a quotation: unit price (total auto-calculates), MOQ, lead time, payment terms.
- [ ] Buyer sees Unit Price, Total, Quantity, Final Amount.

### 4.3 Counter-offer
- [ ] Buyer clicks **Counter** → counters on **total amount** (excl. GST & shipping) and **shipping time**.
- [ ] Supplier sees the counter; can **Accept/Reject** and tag **"Best Price" / "Last Price"** (badge shows in thread).

### 4.4 Accept → order + PO + commission freeze
- [ ] Buyer **Accept Deal**. If direct payment, buyer must tick the disclaimer *"I understand payment is outside AMJ responsibility."*
- [ ] Order is created; **PO PDF auto-generates** (download it — check PO number `AMJ-PO-...`, deal + PO dates, GST split, line items).
- [ ] **Phone numbers unlock** for both parties in the thread (`tel:` links).
- [ ] Product **stock decrements** by the ordered quantity.
- [ ] Supplier wallet: commission + 18% service GST moves `availableBalance → frozenBalance` (`freeze` ledger entry tied to the order).
- [ ] Edge: if wallet can't cover commission, PO generation fails with a top-up prompt (test by draining wallet first). Quotation may show as `HELD` until top-up.

---

## 5. Order Lifecycle & Delivery

- [ ] Supplier → Orders → mark **Packed** (optional) → **Dispatched** (enter courier name + tracking ID).
- [ ] Buyer sees status updates + notifications (in-app, and email if configured).
- [ ] Supplier marks **Delivered** → order enters `awaiting_confirmation` (72h window).
- [ ] Buyer → Orders → **"Received, all good"** (optionally leave review) → order **Completed**.
- [ ] Money check: frozen commission is **released to AMJ** (`frozenBalance` drops, `release_to_amj` entry; `totalEarned` updates).
- [ ] Auto-complete: leave a delivered order untouched → after 72h the cron completes it. *(To test fast, temporarily shorten the window in `autoConfirmOrders.ts` or verify the cron logic separately.)*

---

## 6. Disputes & Exchange

> Full state machine in `docs/dispute_logic.md`.

### 6.1 Raise
- [ ] Within the 72h window, buyer → **"I have an issue"** → pick type (Quantity/Quality/Damaged/Missing/Other) → write description → **upload photo/video** (required).
- [ ] Order status → `disputed`; auto-complete timer pauses; commission stays frozen. Ticket status `OPEN`.

### 6.2 Admin review
- [ ] Admin → Disputes → **Validate** → status `VALIDATED`, supplier notified. (Or **Reject** → order returns to awaiting confirmation.)

### 6.3 Supplier resolution
- [ ] Supplier picks **Refund** → must enter bank **UTR** → status `SUPPLIER_RESOLVED`.
- [ ] Buyer **confirms resolved** → `RESOLVED` + order `COMPLETED`; or **rejects with reason** → `REOPENED` back to supplier.

### 6.4 Replacement (exchange) path
- [ ] Supplier picks **Replacement** → set `requiresReturn`.
- [ ] (If return required) Buyer enters return courier + tracking → supplier **Mark Return Received**.
- [ ] Supplier **dispatches replacement** (courier + tracking).
- [ ] Buyer **Confirm Exchange Done** → RESOLVED/COMPLETED; or **Issue with Replacement** → REOPENED.

### 6.5 Admin unfreeze
- [ ] Admin → supplier frozen orders → **Unfreeze** an order → frozen commission returns to supplier `availableBalance`, order `cancelled` (verify it can't later release).

---

## 7. Reseller Flows (recently completed — test thoroughly)

### 7.1 Join & onboard
- [ ] Home → **For Resellers** page → **"Join as a Reseller"** now routes to `/login?mode=reseller` (no "coming soon").
- [ ] Phone → OTP → role **Reseller** → 7-step onboarding (store identity, selling channels, experience, bank/payment, verification, plan). Auto-save/resume works.
- [ ] Admin approves reseller (Admin → Resellers → Pending).

### 7.2 Storefront setup
- [ ] Reseller dashboard → **My Storefront** → upload banner, pick theme colour, write announcement → **Save Layout**.
- [ ] Reload → settings persist. Copy the store link (`/store/<slug>`).

### 7.3 Browse & request products
- [ ] **Browse Products** → request a supplier product → status `PENDING`.
- [ ] Supplier → Partnerships → **Approve** → appears in reseller's **My Products**; set selling price / custom title; toggle visibility.

### 7.4 Public storefront + lead
- [ ] Open `/store/<slug>` in a logged-out/incognito window → store loads with banner, theme, announcement, visible products (custom titles/prices), MOQ.
- [ ] Click **Contact Reseller** (store-level and per-product) → fill name + phone → submit → success message.
- [ ] Invalid slug → clean "Store not found" page.

### 7.5 Leads, orders, payouts
- [ ] Reseller → **Leads** → the submitted lead appears (real data). Change status New→Contacted→Converted; reload → persists. Reseller also gets a notification.
- [ ] Reseller → **Customer Orders** → table + detail modal (timeline, items, invoice download). *(Empty until reseller checkout exists — V2. Verify it loads without error.)*
- [ ] Reseller → **Earnings & Payouts** → balance cards, ledger, withdrawal request using registered bank; withdrawal history tab. *(Balances real but likely ₹0 until V2 monetization.)*
- [ ] Overview tab → stats (earnings, orders, shared products) and Recent Orders reflect real data.

---

## 8. Buyer-Side Features

- [ ] **Post a Requirement** (landing section + buyer profile): submit product/category/qty/details → appears in Admin/Sales requirements list; admin can assign supplier / email recommendation.
- [ ] **Cart MOQ**: add a product with MOQ 10 → cart won't allow quantity below 10.
- [ ] **Product not found**: search a nonsense term → "Our team will contact you soon" + helpline + WhatsApp button.
- [ ] **Buyer profile**: fill GST, company name/address, requirement estimates.
- [ ] **Raise a ticket** from buyer profile → appears in Admin ticket list; admin can reply / change status.
- [ ] **Notifications**: new enquiry, quotation, counter offer, order status → bell updates.

---

## 9. Admin Panel

- [ ] Approve/reject suppliers & resellers; set commission rate; toggle Auto-Live.
- [ ] Approve/reject products; verify certifications before they display.
- [ ] Manage categories/subcategories, banners, static pages (About/Privacy/T&C editable).
- [ ] View orders, disputes, earnings, supplier performance.
- [ ] Process withdrawals (`withdrawals` tab) → mark processed.
- [ ] Platform settings: set **minimum wallet balance** & **minimum withdrawal amount** → confirm they enforce in supplier wallet/withdrawal.
- [ ] Create a **sub-admin** with a custom role → log in as them → only permitted sections visible.

---

## 10. Tax (GST) Spot-Checks

- [ ] Same-state buyer & supplier → order/PO shows **CGST + SGST** split.
- [ ] Different-state → **IGST**.
- [ ] `gstIncluded=true` product → base price reverse-calculated (`total / (1+rate)`); `false` → GST added on top.
- [ ] Commission deduction carries 18% service GST (visible in wallet freeze description).

---

## What you can't test yet (not built — see remaining_tasks.md / v2_roadmap.md)
- On-platform buyer payment / escrow (Flow B) — checkout shows a disabled "AMJSTAR Escrow — COMING SOON".
- Reseller storefront **checkout** and margin crediting (reseller order/payout screens will be empty).
- Blue Dart courier pickup / shipping-cost calculation / E-Way Bill.
- Membership tier *benefit* enforcement (ranking, featured/sponsored placement).

## Reporting a bug
Note: **URL**, **role/account**, **steps**, **expected vs actual**, screenshot, and anything in the **browser console / backend terminal**. Add money/dispute bugs against the relevant logic doc so behaviour can be compared to spec.
