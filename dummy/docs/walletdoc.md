Full Plan: Commission & Wallet System
What currently exists (relevant)
PO generated in quotation.service.ts → acceptQuotation() — this is the hook point
Order model has subtotal, shippingCost, totalAmount — commission base is here
Delivery status exists in enum but no endpoint to trigger it — we build it
No commissionRate on supplier, no Wallet model, no settings for minimums
Razorpay test keys present in .env
Database — New Models
Wallet (one per supplier)


supplierId (ref Supplier, unique)
availableBalance: number
frozenBalance: number
totalEarned: number        ← lifetime earnings after commission deducted
totalCommissionPaid: number ← lifetime amount released to AMJStar ledger
WalletTransaction


supplierId, walletId
type: 'topup' | 'freeze' | 'release_to_amj' | 'withdrawal_request' | 'withdrawal_complete'
amount: number
status: 'pending' | 'completed' | 'failed'
relatedOrderId (optional)
razorpayPaymentId (optional, for top-ups)
description: string
WithdrawalRequest


supplierId, walletId
amount: number
status: 'pending' | 'approved' | 'rejected' | 'completed'
bankDetails: { accountName, accountNumber, ifscCode, bankName }
adminNote (optional)
requestedAt, processedAt, processedBy (admin userId)
Models to update:

Supplier → add commissionRate: number (null = not set yet)
PlatformSettings (extend existing settings module) → add minimumWalletBalance, minimumWithdrawalAmount
Backend — New Module: wallet

src/modules/wallet/
  wallet.model.ts
  walletTransaction.model.ts
  withdrawalRequest.model.ts
  wallet.service.ts
  wallet.controller.ts
  wallet.routes.ts
Endpoints:


GET    /wallet/me              → supplier's wallet balance + stats
GET    /wallet/transactions    → paginated transaction history
POST   /wallet/topup/order     → create Razorpay order for top-up
POST   /wallet/topup/verify    → verify payment, credit availableBalance
POST   /wallet/withdraw        → submit withdrawal request
GET    /wallet/withdrawals     → supplier's withdrawal history
Backend — Changes to existing modules
quotation.service.ts → acceptQuotation() (PO trigger)

Check supplier has commissionRate set → else block PO
Calculate commission = (subtotal + gstAmount + shippingCost) × commissionRate / 100
Check wallet.availableBalance >= commission + platformSettings.minimumWalletBalance → else throw "Insufficient wallet balance"
availableBalance -= commission, frozenBalance += commission
Create WalletTransaction (type: freeze)
order.routes.ts + new order.service.ts — New endpoints:


PATCH  /orders/:id/status            → supplier marks as shipped/processing
POST   /orders/:id/confirm-delivery  → buyer confirms delivery
On delivery confirmed:

frozenBalance -= commission, totalCommissionPaid += commission (ledger only)
totalEarned += (orderValue - commission)
Create WalletTransaction (type: release_to_amj)
admin module — New endpoints:


PATCH  /admin/suppliers/:id/commission    → set commissionRate
GET    /admin/wallet/withdrawals          → list all withdrawal requests
PATCH  /admin/wallet/withdrawals/:id      → approve/reject/complete
GET    /admin/platform-settings           → get minimumWalletBalance, minimumWithdrawalAmount
PATCH  /admin/platform-settings           → update both
Frontend — New Pages & Changes
Supplier Dashboard:

Persistent toast (cannot dismiss) if commissionRate is null → "Commission not set. Contact AMJStar." → click → Settings page
New: Supplier Wallet page (/supplier/wallet) — sidebar item

Balance cards: Available | Frozen | Total Earned
Top-up button → Razorpay checkout
Withdraw button → modal with bank details + amount
Transaction history table with filters
Supplier Settings page — add "Commission Setup" card

Shows current rate (or "Not set")
If not set: "Call AMJStar to agree on commission: +91-XXXX" CTA
Admin Panel:

Manage Suppliers → add Commission Rate field + "Set Rate" button per supplier
New: Platform Settings page (new sidebar item) → set minimumWalletBalance, minimumWithdrawalAmount
New: Withdrawal Requests page (new sidebar item) → list pending/all requests, approve/reject/mark complete
What I will NOT build (to avoid scope creep)
Automatic Razorpay payouts (confirmed: manual only)
Per-product commission rates (confirmed: one rate per supplier)
Admin wallet (AMJStar side is just a DB ledger)