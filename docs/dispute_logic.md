# AMJSTAR Dispute & Order-Issue Logic

> **Keep this doc in sync:** any code change touching disputes, the 72-hour window, returns/replacements, or refund flows MUST be reflected here.
> Source of truth in code: `amjstar-backend/src/modules/order/dispute.controller.ts` + `order.controller.ts` + `src/jobs/autoConfirmOrders.ts`.
> Last synced: 22 July 2026.

## The happy path (no dispute)

```
pending/paid → packed (optional) → dispatched (courier + tracking ID) → delivered
→ awaiting confirmation (72h window) → completed
```

- On `completed`: frozen commission is released to AMJ (see `docs/money_hold_logic.md`).
- **72-hour rule:** after delivery, the buyer either clicks "Received, all good" (optional review) or raises an issue. No response in 72h → cron auto-completes the order.

## Raising a dispute

- Only within the 72h awaiting-confirmation window, via `POST /api/order/:id/dispute`.
- Issue types: Quantity / Quality / Damaged / Missing / Other. Written description + photo/video evidence **required**.
- Effects: order status → `disputed`; auto-complete timer **paused**; commission **stays frozen**; dispute ticket created with status `OPEN`.

## Dispute state machine

```
OPEN ──(admin validates)──▶ VALIDATED ──(supplier resolves)──▶ SUPPLIER_RESOLVED ──(buyer accepts)──▶ RESOLVED
  │                             │                                      │
  └─(admin rejects)▶ REJECTED   └──(replacement chosen)▶ EXCHANGE      └─(buyer rejects)▶ REOPENED ─▶ back to supplier
```

| Status | Meaning |
|---|---|
| `OPEN` | Buyer raised; awaiting admin validation (anti-fraud gate). |
| `VALIDATED` | Admin confirmed evidence; supplier must act (notified via dashboard + email). `PATCH /api/admin/disputes/:id/validate` |
| `REJECTED` | Admin rejected (weak evidence); order reverts to `awaiting_confirmation`. `PATCH /api/admin/disputes/:id/reject` |
| `SUPPLIER_RESOLVED` | Supplier submitted Refund / Partial / Other settlement; buyer has 72h to confirm. |
| `EXCHANGE` | Structured replacement flow in progress (below). |
| `REOPENED` | Buyer rejected the fix or the replacement was also faulty; back to supplier. |
| `RESOLVED` | Terminal. Order → `COMPLETED`, commission settles. |

## Supplier resolution options (after VALIDATED)

Negotiation happens peer-to-peer (call/email — phones are unlocked post-PO), then the supplier formally submits in-app (`PATCH /api/order/disputes/:id/supplier-resolve`):

1. **Refund** — must input the bank **UTR** (transaction ID) as proof.
2. **Partial / Other settlement** — custom negotiated outcome.
3. **Replacement** — enters the Exchange flow.

Buyer then confirms (`.../buyer-confirm` → RESOLVED) or rejects with a reason (`.../reopen` → REOPENED). Buyer silence for 72h ⇒ resolution assumed accepted, ticket closes.

## Exchange (replacement) flow — status `EXCHANGE`

Endpoints: `return-shipment`, `pickup-tracking`, `confirm-handover`, `return-received`, `dispatch-replacement`, `confirm-exchange`, `report-replacement`.

1. Supplier decides `requiresReturn` (must buyer send the defective item back first?).
2. *(If required)* Buyer ships it back, entering return courier + tracking; supplier marks **Return Received** after inspection.
3. Supplier dispatches the replacement with courier + tracking.
4. Buyer: **Confirm Exchange Done** → `RESOLVED`, order `COMPLETED` — or **Issue with Replacement** → `REOPENED`.

## Safety rails / deadlines

- **72h** buyer confirmation windows throughout (initial delivery, resolution confirmation, replacement confirmation) — silence favours completion/resolution.
- **10-day supplier pickup deadline** (refund-with-return path): supplier failing to complete pickup in 10 days triggers auto-refund to the buyer *(Flow B design — full enforcement lands with escrow in V2)*.
- Replacement deadline required so a supplier can't stall forever (spec note).
- Commission stays frozen for the entire dispute; admin can manually unfreeze (returns money to supplier, cancels order).

## Admin responsibilities

Validate authenticity → notify supplier → review escalations → trigger manual actions (unfreeze, etc.). Endpoints: `GET /api/admin/disputes`, `validate`, `reject`, `POST /api/admin/orders/:orderId/unfreeze`.

## Pending / open items (dispute-related)

- [ ] Flow B (escrow) dispute variant: platform-held funds auto-refund on pickup-deadline breach — pending escrow implementation (V2).
- [ ] Replacement hard-deadline enforcement (cron) — spec'd ("no scam by supplier... stuck forever"), currently procedural rather than automated.
- [ ] Dispute flow for reseller-attributed orders (V2, with reseller checkout).
