# AMJStar — Project Structure & Business Logic

## What is AMJStar?

AMJStar is a **supplier-first B2B marketplace** connecting Indian manufacturers/suppliers with domestic buyers and resellers. It is NOT a direct retail platform. The core loop is:

> Supplier lists products → Buyer discovers & enquires (enquires if they want to negotiate- if they dont want to negotiate and satisfied with price already mentioned on product details they can simply add to cart or buy now straight away (version 2 feature, no working on this right now)) → Negotiation via structured chat (not free end. chat only for work related) → Deal confirmed → PO auto-generated on supplier side→ Commission cut from supplier wallet and that amount is frozen→ Delivery tracked → Commission (frozen amount) released to AMJ

---

## Roles

| Role | Description |
|---|---|
| **Admin** | AMJStar team. Controls platform, approves suppliers, manages commissions, banners, categories. Cannot buy or chat as buyer. |
| **Supplier** | Manufacturer or wholesaler. Lists products. Receives enquiries. Manages orders. Has a wallet (AMJStar credits/balance). |
| **Buyer** | Retailer or business buyer. Browses products. Sends enquiries. Confirms deals. Ask to generate POs. Recives invoice of order|
| **Reseller** | Middleman. Can list products on behalf of suppliers (future). Currently similar wallet like supplier but not working on it right now Update in next version. |

---

## Core Business Flow (AMJSTAR FLOW)

```
1. Supplier onboards → submits business docs → Admin approves
2. Supplier adds products (with pricing, MOQ, category-specific attributes)
3. Buyer browses product catalog → finds product → clicks "Enquire"
4. Enquiry starts a structured conversation (Quick Reply Bubbles, not free-text but optional notes always available)
5. Supplier responds with quotation (quantity, price, lead time, terms)
6. Buyer reviews quotation → accepts (Deal Confirmed) -> order created
7. PO (Purchase Order) auto-generated as PDF — visible to both supplier and buyer
8. Commission calculated from supplier's agreed % → amount FROZEN in supplier wallet
9. Supplier's phone number becomes visible to buyer (and vice versa)
10. Supplier ships goods (self-logistics for now)
11. Buyer confirms delivery
12. Frozen commission RELEASED to AMJStar (admin wallet)
13. Supplier can view earnings, GST summary, transaction history
```

---
(also side note : Enquiry
↓
Quotation
↓
Deal Confirmed
↓
Order Created
↓
PO Generated

This will help backend architecture massively later.

Because:

enquiry ≠ order
quotation ≠ order)
## Commission System

- Commission % is agreed between AMJStar and supplier **at onboarding**
- Stored per supplier profile (`commissionRate: number` as percentage)
- On Deal Confirmed:
  - Commission amount = `dealValue × commissionRate / 100`
  - Amount **frozen** in supplier wallet (cannot be withdrawn)
- On Delivery Confirmed:
  - Frozen amount **released** to AMJStar
  - Commission amount is reserved from supplier wallet at deal confirmation and released to AMJStar after successful delivery confirmation.
- Wallet states:
  - `availableBalance` — supplier can top-up or withdraw
  - `frozenBalance` — locked until delivery confirmed
  - `totalEarned` — lifetime earnings minus commission
- Supplier must maintain minimum wallet balance to remain active on platform (this minimum wallet balance will be set by admin in supplier settings section on admin panel)

---

## Supplier Wallet

```ts
// Wallet schema concept
{
  supplier: ObjectId,
  availableBalance: Number,   // freely usable
  frozenBalance: Number,      // locked for pending deal commissions
  commissionRate: Number,     // e.g. 5 (%)
  transactions: [{
    type: 'credit' | 'debit' | 'freeze' | 'unfreeze' | 'release',
    amount: Number,
    reference: ObjectId,      // order/deal ID
    note: String,
    createdAt: Date
  }]
}
```

---

## Purchase Order (PO) Generation

- Triggered: When buyer clicks "Confirm Deal" on quotation
- Auto-generated as PDF containing:
  - PO number (auto-incremented, e.g. AMJ-PO-2024-0001)
  - Buyer details (name, GST, address)
  - Supplier details (name, GST, address)
  - Product line items (name, SKU, qty, unit price, total)
  - Payment terms (agreed in chat)
  - Delivery terms
  - AMJStar branding & signature line
- PDF stored on Cloudinary, link attached to order record
- Both buyer and supplier can download from their dashboards

---

## Enquiry / Chat Flow (Quick Reply Bubbles)

Chat is renamed **"Enquiry"** throughout the platform. It is NOT a free-text WhatsApp-style chat. It uses **Quick Reply Bubbles** — structured conversation steps.
Structured quick actions first
+
Optional free-text note field (when requoting so option for buyer to mention their prefered amount for their prefered quantity of items)
### Buyer-side flow:
```
[Enquire Now] clicked on product
→ Step 1: "How much quantity do you need?" [50 units] [100 units] [500 units] [Custom...]
→ Step 2: "What's your target price per unit?" [As quoted] [Negotiate] [Enter price...]
→ Step 3: "When do you need delivery?" [Within 7 days] [Within 30 days] [Flexible]
→ Step 4: "Any special requirements?" [Standard] [Custom packaging] [Certificate needed] [Write...]
→ Enquiry sent to supplier
```

### Supplier-side flow:
```
Receives enquiry notification
→ Views enquiry details (qty, price target, timeline)
→ Responds with Quotation:
  - Quoted price per unit
  - Minimum order qty
  - Lead time
  - Payment terms (Advance / Credit / 50-50)
  - Notes
→ Buyer receives quotation
→ Buyer options: [Accept Deal] [Counter Offer] [Decline]
→ If Accept: Deal Confirmed → Order Created → PO generated
→ If Counter: Supplier sees counter, can Accept/Reject
```

### Deal States:
```
enquiry_sent → quotation_sent → counter_offer (optional) → deal_confirmed → order_created → po_generated → shipped → disputed (optional) → delivered → completed → cancelled (if any party cancelled the deal before shipped)
```

"Deal Signed" is renamed to **"Deal Confirmed"** everywhere.

---
## Supplier Reports & Sales Summary

Suppliers can download monthly sales summaries and invoice records from dashboard for accounting and GST return filing purposes.

### Available Reports:
- Monthly sales summary
- Order-wise transaction history
- Invoice downloads
- Commission deduction history

### Export Formats:
- PDF
- Excel (.xlsx)
- CSV

### Report Data Includes:
- Invoice number
- Buyer name
- Product/order details
- Amount
- GST amount
- Invoice date
- Order value

Useful for:
- GST return filing for supplier
- accountant reconciliation
- monthly bookkeeping
- sales tracking

## Product Fields

### Standard Fields (all categories):
- `name` — product title
- `description` — rich text
- `category` — from category tree
- `subcategory`
- `images[]` — multiple, compressed before upload
- `moq` — minimum order quantity
- `unit` — kg / piece / box / litre / metre / set
- `priceRange` — `{ min, max }` (displayed as "₹50–₹80/kg")
- `stock` — available quantity
- `leadTime` — e.g. "7–10 days"
- `packagingType` — bulk / retail / custom
- `countryOfOrigin` — default: India
- `certifications[]` — FSSAI / ISO / BIS / Organic / Halal etc.
- `keywords[]` — tags for search (e.g. ["basmati", "rice", "long grain"])
- `status` — active / inactive / pending_review

### Category-Specific Dynamic Attributes:

**Textiles:**
- `fabric` — Cotton / Polyester / Silk / Linen / Blended
- `gsm` — grams per square metre (e.g. 180)
- `pattern` — Solid / Printed / Woven / Embroidered
- `width` — in cm
- `dyeType` — Reactive / Pigment / Vat

**Food & Agri:**
- `expiryMonths` — shelf life in months
- `ingredients` — comma-separated
- `nutritionPer100g` — `{ calories, protein, carbs, fat }`
- `harvestSeason` — Kharif / Rabi / Year-round
- `organic` — boolean
- `fssaiNo` — license number

**Machinery & Equipment:**
- `power` — voltage/wattage (e.g. "415V 3-phase")
- `capacity` — production capacity (e.g. "500 kg/hr")
- `weight` — in kg
- `dimensions` — L×W×H in cm
- `warranty` — months
- `automationLevel` — Manual / Semi-auto / Fully automatic

**Chemicals & Raw Materials:**
- `purity` — percentage (e.g. 99.5%)
- `casNumber` — chemical registry number
- `hsCode` — for export/import
- `storageConditions` — e.g. "Cool, dry place"
- `dangerousGoods` — boolean

---

## Phone Number Visibility Rules

- Phone numbers are **hidden** on both sides until PO is generated
- After `po_generated` state:
  - Buyer can see supplier's phone number (from supplier profile)
  - Supplier can see buyer's phone number (from buyer profile)
- Shown as clickable `tel:` links in the enquiry thread

---

## Supplier Onboarding Flow

```
1. Register as supplier (email + password)
2. Onboarding form:
   - Business name, GSTIN, PAN
   - Business type (Manufacturer / Trader / Exporter)
   - Business address
   - Bank details (for payouts)
   - Commission rate agreed (shown, not editable by supplier)
   - Upload: GST certificate, business proof, identity proof
3. Status: pending_review
4. Admin reviews → Approves or Rejects (with reason)
5. On approval: supplier can list products
6. Supplier wallet initialized with ₹0 balance
```

---

## Payment Model

- Primary: **Off-platform** (supplier and buyer settle via GPay / NEFT / bank transfer directly)
- AMJStar does NOT handle the transaction money
- AMJStar only handles **commission** separately (deducted from supplier wallet)
- Optional: If Buyer requests they can also pay via **Razorpay** (on-platform payment **NOT UNTIL I TELL YOU OR CHANGE IN THIS FILE**)
  - In this case AMJStar collects full payment, disburses to supplier minus commission
- Default shown in PO: "Payment directly to supplier per agreed terms"

---

## Search & Discovery

- Keyword/tag search on product name, description, keywords[]
- Filter by: category, subcategory, price range, MOQ, certifications, lead time
- Verified supplier badge (admin-approved)
- Sort by: newest, price low-high, high-low, most enquired

---

## Admin Controls

- Approve/reject supplier onboarding
- Set commission rate per supplier (at onboarding or edit later)
- Manage categories and subcategories
- Manage banners (desktop/tablet/mobile responsive images)
- View all orders, deals, complaints
- Release frozen commission manually if dispute
- View platform-wide revenue (total commission earned)

---

## UI Naming Conventions

| Old Name | New Name |
|---|---|
| Chat | Enquiry |
| Deal Signed | Deal Confirmed |
| Chat Inbox | Enquiry Inbox |
| Send Message | Send Enquiry |
| Chat Bubble | Enquiry Bubble |

---

## Tech Stack

**Frontend:** React + Vite + TypeScript + TailwindCSS + Redux Toolkit + React Query  
**Backend:** Node.js + Express + TypeScript (modular monolith)  
**Database:** MongoDB + Mongoose  
**Auth:** JWT (access + refresh tokens)  
**Images:** Cloudinary (via backend, compressed on frontend before upload)  
**Payments:** Razorpay (optional for buyer, on-platform for supplier to add wallet balance)  
**PDF:** pdfkit or puppeteer (server-side PO generation)  
**Email:** Nodemailer  

**Folder structure:** feature-first on frontend, module-first on backend  
`routes → controller → service → model` per module  

---

## Supplier Wallet Recharge

* Suppliers can recharge/add wallet balance through Razorpay
* Wallet balance is used for commission reservation and settlement on successful deals
* On Deal Confirmed:

  * Commission amount is frozen from supplier wallet balance
  * Frozen amount cannot be withdrawn or reused until order completion
* On Delivery Confirmed:

  * Frozen commission amount is released to AMJStar revenue/account
* Suppliers can view:

  * Available balance
  * Frozen balance
  * Wallet transaction history
  * Commission deductions
  * Recharge history

---Note: For now this optional: If Buyer requests they can also pay via Razorpay will not be worked on in V1 ---

## Immediate Build Priority

1. **Product fields expansion** — keywords, certifications, leadTime, packagingType, countryOfOrigin + dynamic category attributes
2. **Rename Chat → Enquiry** across all UI
3. **Quick Reply Bubble UX** in enquiry flow
4. **Deal Confirmed** rename from Deal Signed
5. **Supplier Wallet** — model, balance display, transaction log
6. **PO PDF generation** — auto on deal confirmation
7. **Phone unlock** — after PO generated
8. **Commission cut** — freeze on deal, release on delivery
9. **Supplier earnings / GST summary** page
10. **Buyer lead board** (future)

---

*Last updated: 2026-05-14*
