Bugs Confirmed in Code
Supplier Onboarding (Onboarding.tsx)
BUG 1 — Phone change with zero verification (Security)
Onboarding.tsx:83:


const [isPhoneVerified] = useState(true);  // no setter
The "Change" button at line 293 sets isPhoneEditable(true), letting the supplier type any new number. isPhoneVerified is permanently true so there is no OTP gate. A supplier can change their registered phone to anything with zero verification.


BUG 3 — GSTIN still Optional
Onboarding.tsx:364: Label reads "GSTIN (Optional)". For a B2B platform where every transaction requires GST compliance, this is a compliance gap. Also, the GSTIN validation regex at line 169 only fires if GSTIN is entered, meaning the format check is correct but the field itself is never enforced.

BUG 4 — Supplier bank details never collected
The onboarding is 4 steps (Basic Info → Business Details → Profile → Plan). There is no bank account / IFSC / account holder name field anywhere. But the wallet & commission system requires payout bank details for withdrawal requests. A supplier can complete onboarding and receive orders with no settlement details on file.

BUG 5 — Step resume logic uses fragile OR condition
Onboarding.tsx:129:


else if (data.supplier.businessDetails?.address || data.supplier.businessDetails?.gstin) setCurrentStep(3);
If the user submits step 2 (which saves both address and GSTIN), the condition works. But if somehow only GSTIN is saved and address is not (edge case in partial save), the user is erroneously pushed to step 3 and the address state will be empty.

Reseller Onboarding (ResellerOnboarding.tsx)
BUG 6 — Step 3/4 validation mismatch (documented but under-explained)

Step 3 UI renders primarySellingMethod, monthlyVolume, reach (lines 434–476)
validateStep(3) (line 161–163) only checks primarySellingMethod
validateStep(4) (line 164–168) checks monthlyVolume, reach, experience
Step 4 UI only renders experience and soldBefore (lines 489–522)
Practical consequence: monthlyVolume and reach have default values ('0–50 orders', 'Local') so they'll never be empty — the step 4 validation always passes for them regardless. This means those two required-looking fields in step 3 have no actual enforcement. A user who never touches them gets through with defaults silently. This is a logic correctness issue even if it doesn't visibly break today.

BUG 7 — profileImageUrl setter never exposed
ResellerOnboarding.tsx:80:


const [profileImageUrl] = useState('');  // no setter destructured
Even if an image upload UI were added, the URL could never be stored in this component's state. The model has profileImage field, the doc says the upload UI is missing — but the root cause is that even adding the UI wouldn't work without fixing this.

BUG 8 — Social platform URLs never collected
ResellerOnboarding.tsx:82–83: socialLinks is initialized as {} and is sent to the backend, but in step 3 only platform names are toggled (WhatsApp, Instagram, etc.) via handlePlatformToggle. There's no URL input field. The model has socialLinks: Record<string, string> (expecting { WhatsApp: "https://..." }), but the UI only stores ["WhatsApp", "Instagram"] in platforms[] and sends an empty socialLinks: {}. Data contract mismatch.

BUG 9 — ID proof upload on wrong transition
ResellerOnboarding.tsx:198:


if (idProofFile && nextStep === 7) {
  const uploadRes = await resellerService.uploadDoc(idProofFile);
The upload only happens when transitioning from step 6 → 7. The "Choose Plan" button in step 6 is disabled until a file is selected (line 656). If the upload call fails (network error, file too large, Cloudinary down), the user gets an error but stays on step 6 in a broken state — they can't proceed because the upload failed, but the file is still selected. There's no retry mechanism.

Product Form
BUG 11 — No minimum image validation
A product can be submitted with zero images. B2B buyers routinely reject unphoto'd listings. This needs a submit-time check.

BUG 12 — No HSN code format validation
HSN must be 4–8 digits (/^\d{4,8}$/). Any string passes currently. Invalid HSN codes cause problems in GST filing.

BUG 13 — Product specifications field missing from form
product.model.ts has a specifications field (key-value pairs like color, size, material) but AddProductForm has no corresponding UI. Data is never collected.

Business Logic / Platform
BUG 14 — Commission system completely absent
The walletdoc.md describes a full wallet system (Wallet model, WalletTransaction, WithdrawalRequest, freeze/release logic). None of this exists in the current codebase. The frontend has a SupplierWallet.tsx component and wallet.api.ts, but the backend module doesn't exist. The critical flow — "commission frozen on deal confirmation, released on delivery" — has no implementation. Every PO generated currently has zero commission impact.

BUG 15 — Commission rate gate-keeps PO but admin has no UI to set it
Per walletdoc.md, acceptQuotation() should check supplierProfile.commissionRate before allowing a PO. If it's null, it blocks the PO. But there's no admin UI to set a commission rate per supplier yet. This means any supplier who gets approved can receive enquiries and confirm deals, but no PO can be generated for any of them until admin sets rates — and there's no way for admin to do that.

BUG 16 — Supplier KYC revocation doesn't cascade
If admin rejects/deactivates a supplier who already has approved products, those products remain live in the marketplace. Buyers can still enquire on them. Documented but worth emphasizing.

BUG 17 — Platform fee always 0
Order.platformFee field exists but defaults to 0 with no calculation. AMJStar never charges a platform fee on any order.

BUG 18 — Razorpay webhook failure = order stuck forever
No retry or reconciliation logic for Razorpay webhook failures. Payment can succeed client-side but the order stays pending.

BUG 19 — Multi-buyer stock race condition
Two buyers can accept quotations for the same product simultaneously with no stock reservation locking.

Admin Panel
BUG 20 — No notification on new submission
When a supplier or reseller submits, admin gets no alert, badge count, or email. Admin has to manually poll the panel.


Design/Conceptual Mistakes in the Docs
MISTAKE 1 — Cart/checkout exists in code but documented as V2
structure.md line 7 explicitly says add-to-cart / buy-now is a "version 2 feature, no working on this right now." But the code has Cart.tsx, Checkout.tsx, Payment.tsx, cart.api.ts, cart.slice.ts. This creates confusion — either the V2 boundary is wrong in the docs, or the code has orphaned V2 work in the V1 branch.

MISTAKE 3 — "Nature of business" field is missing from onboarding but critical
The supplier onboarding has no "Nature of Business" field (Manufacturer / Trader / Exporter / Importer). This is displayed prominently on every IndiaMart/Udaan listing and is how buyers evaluate trust. It's mentioned in doc1.md as missing but has no plan to be added.

MISTAKE 4 — Phone unlock timing is ambiguous
structure.md says phone numbers unlock after po_generated state. But if payment is off-platform, the PO is generated first, then the buyer and supplier need to contact each other to arrange payment. This is correct. However, if the order is cancelled before shipment, the phone numbers are already visible — there's no re-hiding mechanism. Someone could generate a PO and immediately cancel just to get contact details.
