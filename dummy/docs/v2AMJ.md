V2 AMJ
Feature	Status
TCS deduction (1% ECO law)	Not built — leave for now
Rate limiting on OTP	Not built — will not build in v1
Quotation expiry auto-notification	Not built — will not build in v1
Reseller Role (partial built) testing and launching + KYC verification needed.

One phone number can silently switch roles (buyer <-> supplier/reseller) — VerifyOtp.tsx:105 auto-flips an existing buyer's role to supplier/reseller with zero check for prior activity, whenever they log in via "Sell on AMJSTAR" (?mode=seller) with an existing buyer phone. No confirmation, no block. Root cause: auth.service.ts's selectRole() has no guard against re-switching. Real user risk, not just test data — confirmed via a real order (ORD-1783488586951-815) where a buyer's account later became "Test Supplier" and lost UI access to /profile (buyer-only route) even though they're still buyerId on that order. Fix later: lock role permanently after first assignment (only allow selectRole on isNewUser, block for existing accounts).