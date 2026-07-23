# AMJSTAR — Remaining & Pending Work (Living Tracker)

> **Keep this doc in sync:** whenever a feature is added, completed, or descoped, update this file in the same change.
> Last synced: 22 July 2026.

## 1. V1 work remaining (spec'd, not built)

| Item | Status | Notes |
|---|---|---|
| Blue Dart / courier integration | ❌ Not started | No code at all. Prep done: packaging dims/weight on products, buyer address visible to supplier. Needs: pickup request workflow, shipping cost calc, tracking sync. |
| E-Way Bill / >₹50k shipment compliance | ❌ Not started | Sequenced after courier integration. |
| Membership tier benefits enforcement | ⛔ Blocked on client | Purchase/expiry flows work. NOT enforced: search-ranking advantage, lead priority, featured/sponsored placement per tier, expiry rules (badge/listings/grace), quarterly billing amounts. Spec doc has unanswered "Clarification Required" blanks — out of scope until client signs off. |
| Product keywords optimization | 🟡 Low priority / ongoing | From 21 May report. |

## 2. Deferred to V2 (explicit client decision — do not build unasked)

Full details and checklists live in **`docs/v2_roadmap.md`**. Headlines:

- **Flow B: on-platform payment / escrow** (+ 1% TCS deduction once platform collects money).
- **Reseller monetization & launch**: storefront checkout with `resellerId`, margin crediting, payout automation, KYC verification, dropshipping/branded packaging. *(Everything else reseller-side is DONE as of 22 July 2026, and public join is open at the owner's request.)*
- Smart search / spelling correction · voice search · smart notifications · discounts & festival offers · supplier ratings/trust scores · GST verification API.
- Hardening: OTP rate limiting, quotation expiry notifications, admin subdomain split — and a **role-switching security bug** (silent buyer↔supplier role flips) that should arguably be fixed in V1; see the roadmap doc.

## 3. Housekeeping / risk

| Item | Status | Notes |
|---|---|---|
| Version control | ⚠️ **None** | `D:\amj_star` is not a git repo. Highest priority: `git init` + private remote. |
| Secret rotation | ⚠️ Open | Live secrets (Mongo, Razorpay, SMTP, Cloudinary secret, Firebase private key, Maps key, admin creds) sit in the shared "AMJ WORKFLOW V1" Google Doc. Rotate + remove. |
| Automated tests | ❌ None | No test suite in either repo. |
| Runtime verification of July 2026 reseller work | 🟡 Pending | New endpoints/UI compile & build clean; not yet exercised against live MongoDB. Manual test steps in `docs/manual_testing_guide.md` §7. |

## 4. Recently completed (context)

- **22 July 2026 — Reseller module completion:** ResellerOrders + ResellerPayouts UIs; Lead model + leads API; storefront settings persistence (banner/theme/announcement); unique `storeSlug` + public storefront API + lead-gen form; `Order.resellerId` attribution + reseller order endpoint; wallet opened to reseller role; dashboard Overview wired to real data; "Join as a Reseller" CTA opened up (was "coming soon").
- Docs refreshed against the AMJ WORKFLOW V1 spec: `claude.md`, `agent.md`, `docs/architecture.md`, `docs/business_logic.md`, `docs/folder_structure.md`, `docs/apis.md`; new `docs/money_hold_logic.md` + `docs/dispute_logic.md`.

## Suggested priority order

1. `git init` + secret rotation (protects everything else)
2. Runtime test pass over the new reseller flows
3. Blue Dart integration (last big V1 feature)
4. Chase client on membership-plan clarifications
5. E-Way Bill after courier lands
