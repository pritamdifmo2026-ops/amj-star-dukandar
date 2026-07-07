# Future Points to Cover

This file tracks planned improvements and compliance requirements not yet implemented.
Remove a point when it is fully shipped.

---

## Compliance / GST / Legal

- [ ] **Buyer GSTIN on PO/Invoice** — B2B buyers need their GSTIN printed on the purchase order and invoice so they can claim Input Tax Credit (ITC). Add a GSTIN field to the buyer profile and capture it at checkout; pass it to the order/PO generation logic.
- [ ] **TCS Collection (Section 52 CGST)** — AMJ operates as an Electronic Commerce Operator (ECO). Must deduct TCS at 1% on the net taxable value of every order and deposit it with the government. Implement TCS calculation at checkout, show it as a line item on the invoice, and track it in the admin financials.
- [ ] **Supplier GST Invoice Upload/Generation** — After each order, the supplier should generate and upload their own GST invoice (with their GSTIN, HSN codes, applicable GST slab). This invoice needs to reach the buyer for ITC. Either auto-generate from order data or let suppliers upload a PDF.
- [ ] **Buyer GSTIN Verification at Checkout** — Validate the GSTIN format (15-character alphanumeric) and optionally call the GST verification API before allowing B2B checkout.

---

## Buy Now / Direct Purchase Flow

- [ ] **Buy Now implementation** — Implement a Direct Order at Listed Price flow (similar to Flipkart marketplace model): buyer clicks Buy Now → order created at listed price → payment via Razorpay → supplier fulfills. This is separate from the Enquiry/Quotation flow and applies to standard catalog products.
- [ ] **Settlement & Payout** — After successful delivery, AMJ settles the supplier's amount (order total minus platform commission) via bank transfer. Build the payout trigger and ledger entry when an order is marked delivered.
- [ ] **Returns & Refund Policy** — Define and implement a return window and refund flow for Buy Now orders. Needed before going live with direct purchases.

---

## Admin / Analytics

- [ ] **Revenue analytics** — Add total GMV, platform commission earned, and monthly revenue trend to the admin dashboard.
- [ ] **Order analytics** — Order volume by status, by supplier, by category.

---

## Supplier Features

- [ ] **Supplier bank account management** — Full bank details flow: add/edit/delete accounts, set primary, use primary bank for wallet withdrawals (see CLAUDE.md for detailed spec).
- [ ] **Automated listing fee billing** — Wallet deduction of ₹10/product on approval, ₹499 minimum monthly; block supplier if wallet is insufficient; reactivate on top-up.

---

## Buyer Features

- [ ] **Wishlist → Cart conversion** — Buyer can move a saved-for-later item back into the cart from the wishlist page.
- [ ] **Order tracking page** — Real-time status updates per order item with a visual stepper.

---

## Infrastructure / Security

- [ ] **Set `FRONTEND_URL=https://amjstar.com`** on production server (currently may be pointing to localhost for email links).
- [ ] **Rate limiting on OTP endpoints** — Prevent OTP spam/brute-force.
- [ ] **Image CDN / compression** — Cloudinary transformations for product images to reduce load times.
