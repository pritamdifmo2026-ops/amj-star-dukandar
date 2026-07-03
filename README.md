# AMJSTAR Dukandar — Frontend

> **B2B E-Commerce Platform** connecting Suppliers, Resellers, and Buyers through a unified, role-based digital marketplace.

---

##  Overview

AMJSTAR Dukandar is a full-featured B2B wholesale platform built for the Indian market. It enables Suppliers to list bulk products, Resellers to curate and resell them, and Buyers to place bulk orders — all managed by a powerful Admin panel.

---

##  Platform Roles

###  Supplier
Suppliers are verified manufacturers or wholesalers who list products and fulfil bulk orders.

**Key Features:**
- Multi-step onboarding with KYC document upload (GSTIN, FSSAI, MSME, etc.)
- Suggested commission rate during onboarding (with competitive visibility messaging)
- Flexible subscription plans (Free, Gold, Diamond, Platinum)
- Product catalog management — add, edit, unpublish, and track approval status
- Quotation management — respond to buyer enquiries with custom pricing
- Purchase Order (PO) generation with commission auto-deduction from AMJSTAR Wallet
- Real-time AMJSTAR Wallet — top-up, freeze/release on PO lifecycle, full ledger
- Logistics tab — toggle "I have my own shipping services" (excludes shipping from commission)
- Supplier Storefront — publicly shareable SEO-optimized product page
- Supplier Partnerships — manage reseller partner relationships
- Reports & analytics — sales, revenue, and order tracking
- Settings — update business info, change email/phone (with OTP/email verification), manage bank accounts

---

###  Admin
Admins have full platform oversight and control across all roles and modules.

**Key Features:**
- Dashboard overview — platform-wide stats on suppliers, resellers, products, and revenue
- **Supplier Verification** — review full KYC details, view supplier-suggested commission rate, adjust commission, approve/reject with reason
- **Reseller Verification** — review reseller applications, approve/reject
- **Product Queue** — review pending supplier products, approve or reject with feedback
- **Category Management** — manage the product category hierarchy
- **Banner Management** — control homepage/promotional banners
- **Enquiry Management** — monitor buyer-supplier enquiries across the platform
- **User Management** — view and manage all platform users
- **Admin Earnings** — track platform commission revenue and deduction logs
- **Admin Withdrawals** — manage supplier/reseller withdrawal requests
- **Platform Settings** — configure global platform settings

---

###  Reseller
Resellers are sales agents who curate supplier products and sell them to end buyers through their own channels.

**Key Features:**
- Multi-step onboarding (contact info, store name, selling channels, experience, bank/GST, ID verification, plan selection)
- Browse & curate supplier product catalogue
- Build a personalised public storefront
- Track orders and commissions via the performance dashboard
- Manage supplier partner relationships
- History of all orders and transactions
- Settings — update profile, bank account, and notification preferences

---

###  Buyer
Buyers are businesses or individuals placing bulk product orders through the platform.

**Key Features:**
- Browse verified supplier products
- Send product enquiries to suppliers
- View and accept quotations from suppliers
- Real-time order tracking
- Order history and invoice management

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite (Lightning-fast HMR) |
| State Management | Redux Toolkit + React Query |
| Styling | Tailwind CSS + Vanilla CSS (Custom Design System) |
| Routing | React Router v6 |
| Icons | Lucide React |
| HTTP Client | Axios with auth interceptors |
| Real-time | Socket.IO |

---

##  Getting Started

### Prerequisites
- Node.js v18+
- npm / yarn / pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

##  Project Structure

```
src/
├── api/              # Axios client & interceptors
├── app/              # App routing, providers, core layouts
├── features/
│   ├── admin/        # Admin dashboard & verification panels
│   ├── auth/         # Login, registration, guards
│   ├── buyer/        # Buyer order management
│   ├── chat/         # Real-time chat (buyer ↔ supplier)
│   ├── landing/      # Public landing page & navbar
│   ├── order/        # Order lifecycle components
│   ├── product/      # Product browsing & detail views
│   ├── reseller/     # Reseller dashboard, storefront & onboarding
│   └── supplier/     # Supplier dashboard, onboarding, wallet & logistics
├── pages/            # Standalone public pages (storefronts, landing)
├── shared/           # Reusable UI components, hooks, utils, constants
└── store/            # Redux Toolkit global store
```

---

##  Commission & Wallet System

- Suppliers suggest a commission % during onboarding
- Admin has final authority to set/adjust the commission rate
- On PO generation, commission is automatically frozen from supplier's AMJSTAR Wallet
- **18% GST** is applied on top of the commission amount (e-commerce platform fee rule)
- If supplier uses **own shipping**, shipping cost is excluded from the commission base
- On order delivery, frozen commission is released to AMJSTAR as platform revenue
- Full transparent ledger visible to supplier in the Wallet tab

---

##  Supplier Onboarding Flow

1. **Basic Info** — Business name, owner name, phone, email
2. **Business Details** — Address, GSTIN, FSSAI, MSME, etc.
3. **Document Upload** — GSTIN certificate, FSSAI licence, MSME/Udyam
4. **Bank Account** — Account details for payment settlement
5. **Plan Selection** — Free, Gold, Diamond, or Platinum tier
6. **Commission Rate** — Suggest platform commission % (>0% required; higher = better visibility)

##  Reseller Onboarding Flow

1. **Basic Setup** — Contact info & location
2. **Profile** — Store name & identity
3. **Selling Channels** — WhatsApp, Instagram, Offline, etc.
4. **Experience** — Past selling history
5. **Payment Setup** — Bank account & optional GST
6. **Verification** — Agreements & ID Proof
7. **Plan Selection** — Free starter tier or premium upgrades

---

##  Backend

The backend is a separate Node.js/Express + MongoDB repository at `amj-backend`. Key modules:

`auth` · `supplier` · `reseller` · `buyer` · `admin` · `product` · `quotation` · `order` · `wallet` · `chat` · `enquiry` · `payment` · `category` · `banner` · `partnership` · `certification` · `settings`

---

*Built by Anushka*
