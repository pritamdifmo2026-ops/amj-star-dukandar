# AMJSTAR Money Freeze / Hold Logic

> **Keep this doc in sync:** any code change touching wallet balances, commission freeze/release, withdrawals, or held quotations MUST be reflected here.
> Source of truth in code: `amjstar-backend/src/modules/wallet/wallet.service.ts` (+ `order/`, `quotation/` modules).
> Last synced: 22 July 2026.

## Overview

AMJSTAR holds money in four places. Importantly, **order money between buyer and supplier is never held** in V1 — buyers pay suppliers directly off-platform. What the platform holds is its own commission and reserved payout funds, all inside the **supplier wallet** (`Wallet` model, keyed by `User._id`, also usable by resellers since July 2026).

Wallet fields: `availableBalance`, `frozenBalance`, `totalEarned`, `totalCommissionPaid`, `totalListingFeesPaid`.
Ledger: `WalletTransaction` — types include `topup`, `freeze`, `unfreeze`, `release_to_amj`, `withdrawal_request`, `listing_fee`, `listing_renewal`.

## 1. Commission freeze on PO generation — `freezeCommission()`

Trigger: buyer accepts a quotation / counter → order created → PO generated.

```
commission     = taxableAmount × supplier.commissionRate %   (taxable = product subtotal ONLY — no GST, no shipping)
serviceGst     = commission × 18%                            (AMJ's GST on its own service fee)
totalDeduction = commission + serviceGst
```

- `availableBalance -= totalDeduction`, `frozenBalance += totalDeduction`; a `freeze` transaction is recorded with `relatedOrderId`.
- If `availableBalance < totalDeduction` → PO generation **fails** with a top-up message.
- If `supplier.commissionRate` is not set → PO generation fails (admin must configure it).
- If the supplier uses **own shipping**, shipping is excluded from the commission base by design.
- Socket event `wallet_updated` notifies the supplier dashboard live.

## 2. Commission release on completion — `releaseCommission()`

Trigger: buyer confirms delivery, OR the 72-hour auto-complete cron (`src/jobs/autoConfirmOrders.ts`) fires.

- The order's `freeze` transaction amount moves out of `frozenBalance` into `totalCommissionPaid` (AMJ revenue); `totalEarned += orderTotal − totalDeduction`.
- Records a `release_to_amj` transaction. **Idempotent**: a second call detects the existing `release_to_amj` tx and skips (protects against double-click/re-run).

## 3. Admin unfreeze — `unfreezeCommission()` (dispute/collapse path)

Trigger: admin action `POST /api/admin/orders/:orderId/unfreeze` (deal collapsed, dispute resolved in supplier's favour, technical fault).

- Refuses if order is already `completed`/`cancelled` or if commission was already released.
- Moves the frozen amount back to `availableBalance` (`unfreeze` tx) and **cancels the order** so it can never trigger a release later.
- Admin can list a supplier's frozen orders via `GET /api/admin/suppliers/:userId/frozen-orders`.

## 4. Dispute hold

While an order is `disputed`: the 72h auto-complete timer is paused and the commission **stays frozen** until the dispute reaches a terminal state (see `docs/dispute_logic.md`). Resolution → release to AMJ; supplier-favour/admin decision → unfreeze.

## 5. Withdrawal reservation — `requestWithdrawal()`

- Amount is deducted from `availableBalance` **immediately** on request ("funds reserved") — prevents double-spending while admin processes the payout (`WithdrawalRequest` model; admin endpoint `PATCH /api/admin/withdrawals/:id/process`).
- Constraints: `amount ≥ minimumWithdrawalAmount` (platform setting); `amount ≤ availableBalance − minimumWalletBalance` (admin-set floor that is effectively always held); only one open request at a time.
- Bank details: explicit `bankDetails` in the request, else supplier's primary bank, else the reseller profile's registered bank (added July 2026).

## 6. Held quotations — `releaseHeldQuotations()`

If a supplier's wallet cannot cover the projected `totalDeduction` for a quotation, the quotation is created with status `HELD` and **not delivered to the buyer**. After every top-up, held quotations are re-checked oldest-logic and auto-sent once the balance covers them (status → `PENDING`, chat + socket notifications fire).

## 7. Listing fees (deducted, not held)

- ₹10 per product on approval (`chargeProductApproval`); insufficient balance → product `listingStatus: BLOCKED` (approved but hidden).
- Monthly renewal `chargeMonthlyRenewal`: `max(₹499, liveProducts × ₹10)`; partial balance keeps oldest products live and blocks the rest; below ₹499 blocks all. `BillingHistory` records every run.
- Top-ups auto-unblock blocked products oldest-first (`unblockProductsAfterTopup`).

## 8. NOT implemented (V2): Flow B escrow

Buyer pays AMJSTAR → funds held by platform → released to supplier wallet after delivery confirmation; supplier missing the 10-day refund-pickup deadline triggers auto-refund to buyer. Fully specified in the AMJ WORKFLOW V1 doc, visible as a disabled "AMJSTAR Escrow — COMING SOON" option in Checkout/enquiry UIs, **no backend implementation yet**.

## Pending / open items (money-hold related)

- [ ] Flow B escrow implementation (V2, needs client go-ahead).
- [ ] Reseller margin crediting: when reseller storefront checkout lands (V2), define how the reseller's margin is credited to their wallet (mirror freeze/release? instant credit on completion?).
- [ ] Razorpay payout automation for withdrawals (currently manual admin processing with UTR).
