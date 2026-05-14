AMJ Star — Full Business Analysis, Gaps & Edge Cases
What the Business Is
AMJ Star is a B2B wholesale marketplace (think IndiaMart but with a built-in reseller network). It has three distinct user roles:

Role	What they do
Supplier	Manufacturer/wholesaler — lists bulk products with MOQ + pricing, goes through KYC
Reseller	Middleman/dropshipper — picks supplier products, adds margin, sells via their own channels
Buyer	Retailer/end-buyer — browses, chats, requests quotations, pays via Razorpay
Admin	Verifies KYC, approves/rejects products, manages platform
Core flow: Supplier lists → Admin approves → Reseller/Buyer discovers → Chat + Quotation → Order + Razorpay payment

Critical Missing Fields in Forms
Supplier Onboarding — Missing from UI (but needed for business)
Missing Field	Why it matters
isWomenEntrepreneur flag	✅ DONE — Collected in Onboarding.tsx, included in form submission
Business logo / profile image	Buyers see no brand identity — IndiaMart, Udaan all show logos
Nature of business	Manufacturer / Trader / Exporter / Importer — critical for buyer trust
Product category during onboarding	Supplier should declare what sector they operate in (textile, food, electronics)
Annual turnover range	Required for B2B credibility display
Banking details	Supplier never submits bank account for payment settlement
Upload: PAN card document	Only string entered, no document proof
Upload: GST certificate	Only string entered, no verification document
Website URL	Standard on all B2B platforms
Product Form — Missing from UI (but in database model)
Missing Field	Location
stock (inventory count)	✅ DONE — product.model.ts:91 — captured in AddProductForm.tsx
brand name	✅ DONE — product.model.ts:97 — captured in AddProductForm.tsx
keywords for search	✅ DONE — product.model.ts:99 — captured in AddProductForm.tsx
specifications (key-value: color, size, material)	❌ OPEN — product.model.ts:101 — not in form
Lead/delivery time	Buyers need to know how long dispatch takes
Sample availability	Very common requirement in B2B
Packaging details	Required for logistics/shipping
Reseller Onboarding — Missing from UI
Missing Field	Why
PIN code	Address has city/state but no pincode — reseller.model.ts has no pinCode field at all
Profile image upload	profileImage field exists in model (reseller.model.ts:14), Step 2 mentions it, but upload UI is never shown
Social link URLs	Platforms are toggled (WhatsApp, Instagram, etc.) but actual profile URLs are never collected even though socialLinks: Record<string, string> exists in model
Bugs in Forms and Logic
Supplier Onboarding
isPhoneVerified is hardcoded true at Onboarding.tsx:72 — the "Change" phone button shows, but OTP re-verification flow is never implemented. A supplier can change to any phone number with zero verification.

Step resume logic is fragile — only checks if address or businessName exists to determine which step to resume from. If a supplier fills Step 1 + 2, refreshes, and then businessName exists but address doesn't, they're dropped back to Step 2 and could overwrite nothing.

isActive never set on verification — ✅ DONE — admin.service.ts:82 now sets `isActive = true` on VERIFIED and `isActive = false` on REJECTED.

State/City dropdown is severely limited — ❌ OPEN — only 10 states out of 28. Bihar, Odisha, Andhra Pradesh, Himachal Pradesh, Assam, etc. are missing. Real-world suppliers from these states cannot register.

GSTIN is optional — ❌ OPEN — for a B2B platform where GST compliance is legally required for business-to-business transactions in India, this should be mandatory for non-micro businesses.

Reseller Onboarding
Step 3 vs Step 4 validation mismatch — ❌ OPEN — monthlyVolume and reach are rendered in Step 3's UI (ResellerOnboarding.tsx:549-578) but validated only in validateStep(4) (ResellerOnboarding.tsx:185-189). A user can skip through Step 3 without selecting them.

ID Proof uploaded at wrong step — file is uploaded only when moving from Step 6 → Step 7 (nextStep === 7), but the button disables at Step 6 if no file. If upload fails at that transition, they're stuck.

Product Form
No minimum images validation — ❌ OPEN — a product can be submitted with zero images. B2B buyers reject listings without photos immediately.

HSN code no format validation — ❌ OPEN — any string passes. HSN codes are 4-8 digit numbers. Invalid HSN causes GST filing issues for the supplier.

No stock management UI — once a product is live, there's no way for the supplier to update stock count from the dashboard.

Admin Panel
Supplier rejection has no reason prompt — ✅ DONE — AdminDashboard.tsx now shows a modal to enter rejection reason before calling verifySupplier with REJECTED + reason.

Product approval only — no rejection — ✅ DONE — SupplierVerification.tsx now has a reject button that opens a confirm modal with REJECTED action.

Admin cannot see reseller bank/ID details — ❌ OPEN — ResellerVerification component only shows basic info. Admin has no view of bank account, PAN, or ID proof document to make an informed approval decision.

No admin notification on new submissions — when a supplier or reseller submits, admin has no alert/email/badge count notification.

Business Logic Edge Cases
Order / Payment
Razorpay webhook failure: payment succeeds on Razorpay side but the webhook call back fails → order stays pending forever. No retry/reconciliation logic exists.
Quotation expiry: quotation has a 7-day validity in the model, but no cron job or UI warning triggers when it expires. A buyer can try to place an order on an expired quotation.
Multi-buyer race on low stock: Two buyers accept quotations for the same product simultaneously. No stock reservation/locking mechanism.
Platform fee is stored but never computed: platformFee field exists in Order model but is default 0 — no actual fee calculation is applied.
Supplier
Tier gating not enforced: ✅ DONE — product.service.ts:15 checks `supplierProfile.maxProducts` against current product count before allowing creation.
Supplier KYC rejected after products approved: If admin reverts a supplier's KYC, their previously APPROVED products stay live on the marketplace.
Reseller-purchased product stock depletion: No connection between reseller orders and supplier inventory.
Reseller
Negative margin: Reseller can set a selling price lower than supplier's base price. No floor price enforcement.
Commission tracking: commissionPolicyAccepted is captured but there's no actual commission calculation, disbursement, or ledger anywhere in the backend.
Storefront when supplier is deactivated: If supplier gets deactivated, their products should be removed from all reseller storefronts — no cascade logic exists.
UI/UX Improvements (IndiaMart-style reference)
Feature	Current State	What's needed
Product listing page	Basic grid	Price range filter, MOQ filter, verified-supplier filter, location filter
Supplier profile page	No public page	Trust score, years in business, response rate, product count, reviews
Quotation flow	Chat-based	Structured RFQ form with quantity, target price, delivery date
Buyer dashboard	Basic	Order tracking with status timeline, reorder button
Reseller storefront	Exists but minimal	Custom domain support, branded banner, featured products section
Search	Text-only	Category browse tree, trending keywords, related products
Admin dashboard	Functional	Revenue analytics, registration trends, dispute management
Summary of Priority Fixes
P0 — Breaks core business:

✅ 1. Add rejection reason modal for admin (supplier + product) — DONE
✅ 2. Fix isActive being set on supplier verification — DONE
✅ 3. Add stock field to product form — DONE
❌ 4. Fix Step 3/4 validation mismatch in reseller onboarding — OPEN (monthlyVolume/reach validated at step 4, rendered at step 3)
❌ 5. Add all Indian states to dropdown — OPEN (only 10/28 states in INDIA_STATES constant, Onboarding.tsx:18)

P1 — Required for compliance/trust:
✅ 6. Collect isWomenEntrepreneur in supplier form — DONE
❌ 7. Validate HSN code format — OPEN (no /^\d{4,8}$/ regex on AddProductForm.tsx:260)
❌ 8. Enforce product image minimum (at least 1) — OPEN (no submit-time image count check)
❌ 9. Implement GSTIN as mandatory for non-micro businesses — OPEN (still "GSTIN (Optional)" label)
✅ 10. Add brand, keywords to product form — DONE
❌ 10b. Add specifications (key-value pairs) to product form — OPEN (model has field, form does not)

P2 — Business completeness:
❌ 11. Commission calculation and disbursement ledger — OPEN
❌ 12. Supplier bank details for settlement — OPEN
❌ 13. Quotation expiry notifications — OPEN
✅ 14. Tier-based product count enforcement — DONE (product.service.ts:15)
❌ 15. Admin reseller KYC document view — OPEN
