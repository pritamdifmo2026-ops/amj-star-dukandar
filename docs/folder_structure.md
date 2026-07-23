# AMJSTAR Folder Structure

This document outlines the detailed folder structure of the AMJSTAR project workspaces (reflecting the actual code as of July 2026).

## Backend Workspace: `amjstar-backend/`

```text
amjstar-backend/
├── src/
│   ├── app.ts                 # Express Application instance setup (CORS, Parsers, Error Handlers)
│   ├── server.ts              # HTTP Server initialization and Port binding
│   ├── config/                # Environment variables, DB connection, Razorpay config
│   ├── constants/             # Enums, standard status codes, and constants
│   ├── jobs/                  # Node-cron background jobs
│   │   ├── autoConfirmOrders.ts             # Auto-complete orders after 72h buyer window
│   │   ├── listingFeeJob.ts                 # Monthly listing fee deduction from wallets
│   │   ├── lowStockCheck.ts                 # Low-stock alerts for suppliers
│   │   ├── membershipRenewalReminderJob.ts  # Membership plan renewal reminders
│   │   ├── subscriptionExpiryJob.ts         # Downgrade expired memberships, hide products
│   │   └── upgradeVerificationReminderJob.ts
│   ├── middlewares/           # Express middlewares (Auth verification, RBAC)
│   ├── routes/                # Main router combining all module routes (index.ts)
│   ├── socket/                # Socket.io event listeners and emitters
│   ├── utils/                 # Helper functions (Hash, JWT, Error formatters)
│   ├── services/              # Cross-domain services (Email via Nodemailer)
│   └── modules/               # Domain-driven architecture modules
│       ├── auth/              # Phone+OTP login, role selection, admin login, logout
│       ├── user/              # Profile, email verification, FCM tokens
│       ├── supplier/          # Onboarding, KYC, membership plans/upgrades, banks, shipping zones
│       ├── buyer/             # Buyer business profile, requirements
│       ├── reseller/          # Reseller profiles (V2 — deferred)
│       ├── partnership/       # Reseller-Supplier product links (V2 — deferred)
│       ├── product/           # Product CRUD, approval/verify, live toggles, wallet checks
│       ├── enquiry/           # Structured enquiry (Quick Reply Bubbles) threads
│       ├── quotation/         # Quotations, counter offers, accept/reject/cancel
│       ├── order/             # Orders, PO download, delivery confirmation, disputes/exchange
│       ├── payment/           # Razorpay order creation + HMAC signature verification
│       ├── wallet/            # Balances (available/frozen), transactions, top-ups, withdrawals, billing history
│       ├── cart/              # Cart with MOQ enforcement
│       ├── wishlist/
│       ├── address/           # Buyer addresses (state/city, default)
│       ├── category/          # Categories, subcategories, certification mapping
│       ├── certification/     # Certification master list (admin-verified display)
│       ├── requirement/       # "Post a Requirement" leads → admin/sales assignment
│       ├── meeting-request/   # Buyer-supplier meeting scheduling
│       ├── ticket/            # Support tickets (buyer ↔ admin)
│       ├── chat/              # Legacy real-time messaging (UI renamed to Enquiry)
│       ├── notification/      # In-app notifications
│       ├── banner/            # Homepage banners (responsive)
│       ├── page/              # Admin-editable static pages (About, Privacy, T&C)
│       ├── geocode/           # Reverse geocoding
│       ├── settings/          # Platform settings (min wallet balance, etc.)
│       ├── upload/            # Cloudinary image/doc uploads
│       └── admin/             # Admin stats, approvals, disputes, withdrawals, sub-admins
├── package.json
└── tsconfig.json
```

## Frontend Workspace: `amj-star-dukandar/`

```text
amj-star-dukandar/
├── src/
│   ├── App.tsx                # Main Router Provider
│   ├── main.tsx               # React root render
│   ├── api/                   # Axios client configuration and interceptors
│   ├── store/                 # Redux Toolkit store setup
│   ├── shared/                # Global resources
│   │   ├── components/        # Buttons, Inputs, Modals, Tables, Loaders
│   │   ├── contexts/          # React Contexts (SocketContext, ThemeContext)
│   │   └── hooks/             # Custom React Hooks (useAuth, useDebounce)
│   └── features/              # Feature-Sliced modules
│       ├── auth/              # Phone OTP login, role selection, admin login
│       ├── landing/           # Homepage, About, Contact, Post-a-Requirement section
│       ├── product/           # Catalog, search/filters, product detail
│       ├── buyer/             # Buyer profile, cart, checkout, requirements, tickets
│       ├── supplier/          # Supplier dashboard: products, orders, wallet, reports, membership
│       ├── reseller/          # Reseller dashboard (V2 — deferred)
│       ├── order/             # Orders, delivery confirmation, disputes
│       ├── chat/              # Enquiry threads UI (Quick Reply Bubbles)
│       ├── notifications/     # Notification center
│       └── admin/             # Admin panel: approvals, disputes, settings, sub-admins
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```
