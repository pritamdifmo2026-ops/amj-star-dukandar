# CLAUDE.md - Project Guidelines

## Project Overview

AMJ Star is a B2B wholesale marketplace with three user roles: **Supplier**, **Reseller**, and **Buyer**, managed by an **Admin**. Core flow: Supplier lists → Admin approves → Reseller/Buyer discovers → Chat + Quotation → Order + Razorpay payment.

- Frontend: `amj-star-dukandar/` (React 19 + TypeScript + Vite)
- Backend: `amjstar-backend/` (Node.js + Express + TypeScript + MongoDB)
- Docs: `docs/` — see `docs/doc1.md` for all known bugs, missing fields, and priority fixes with completion status.

---

## Build & Development Commands

### Frontend (`amj-star-dukandar`)
```bash
npm run dev --prefix amj-star-dukandar
npm run build --prefix amj-star-dukandar
npm run lint --prefix amj-star-dukandar
```

### Backend (`amjstar-backend`)
```bash
npm run dev --prefix amjstar-backend
npm run build --prefix amjstar-backend
npm run start --prefix amjstar-backend
```

### Install All
```bash
npm install --prefix amj-star-dukandar && npm install --prefix amjstar-backend
```

---

## Architecture

### Backend — Modular Monolith

```
amjstar-backend/src/
  modules/
    {module}/
      {module}.controller.ts   # thin — only req/res handling
      {module}.service.ts      # all business logic lives here
      {module}.model.ts        # Mongoose schema + types
      {module}.routes.ts       # Express router
      {module}.validation.ts   # Zod schemas
      {module}.types.ts        # TypeScript interfaces
  middlewares/                 # auth, role, validate, upload
  services/                    # cross-module services (otp, email, token)
  utils/                       # pure helpers (cloudinary, etc.)
  config/                      # env, db
  shared/                      # shared types and utilities
```

### Frontend — Feature-based

```
amj-star-dukandar/src/
  app/
    providers/                 # ReactQueryProvider, ReduxProvider, AppProvider
    routes/                    # public.routes.tsx, protected.routes.tsx
  features/
    {feature}/
      components/              # UI components for this feature only
      hooks/                   # custom hooks (useProductForm.ts, etc.)
      pages/                   # routed page components
      services/                # API call functions (React Query keys + fetchers)
      store/                   # feature-specific Redux slice (see State Management)
      types/                   # TypeScript types/interfaces for this feature
  shared/
    components/                # reusable UI across features (Button, Modal, Input)
    hooks/                     # reusable logic (useDebounce, useChat, etc.)
    services/                  # cross-feature API calls (order, quotation, chat)
    utils/                     # pure helpers (formatCurrency, validators, etc.)
    constants/                 # routes, roles, app config
    layout/                    # MainLayout, AuthLayout
  store/
    slices/                    # GLOBAL state only (auth.slice.ts, ui.slice.ts)
    rootReducer.ts
    index.ts
    hooks.ts
```

---

## State Management Rules

**Rule: Global state stays in `src/store/slices/`. Feature state lives in `src/features/{feature}/store/`.**

| Slice | Location | Reason |
|-------|----------|--------|
| `auth.slice.ts` | `src/store/slices/` | Used across the entire app |
| `ui.slice.ts` | `src/store/slices/` | Global UI state (theme, modals) |
| `supplier.slice.ts` | `src/features/supplier/store/` | Only used in supplier feature |
| `reseller.slice.ts` | `src/features/reseller/store/` | Only used in reseller feature |
| `cart.slice.ts` | `src/features/order/store/` | Only used in order/cart feature |
| `wishlist.slice.ts` | `src/features/product/store/` | Only used in product browsing |

> **Current state:** `supplier.slice.ts`, `reseller.slice.ts`, `cart.slice.ts`, `wishlist.slice.ts` still live in `src/store/slices/` and need to be migrated. Do not add new feature slices to `src/store/slices/`.

**Server state** (API data): always use **React Query or RTK Query** (`useQuery`, `useMutation`). Never put API response data in Redux.

**Client/UI state** (form inputs, modal open/close, selected tab): use `useState` inside the component or a custom hook. Only lift to Redux if state is shared across multiple unrelated components.

---

## Coding Rules

### General
- TypeScript strict mode — no `any`. Use specific interfaces or `unknown` with type guards.
- Follow DRY and Single Responsibility — one reason to change per function/component.
- No magic numbers or strings — extract to named constants.
- No commented-out code — delete it; git history preserves it.
- No `console.log` in committed code — use structured logging on backend.

### Backend
- `async/await` everywhere — no raw Promise chains.
- Controllers are thin: parse request → call service → send response. No business logic.
- All business logic in Services. Services must not import `Request`/`Response`.
- Validate every incoming request with Zod before it reaches the controller.
- Centralized error handling via the error middleware — never `try/catch` into `res.status(500)` inline.
- Return consistent response shapes: `{ success, data, message }`.
- Never trust client-provided IDs for ownership checks — always verify against `req.user`.

### Frontend
- Functional components only — no class components.
- Extract all complex state, effects, and event handlers into **custom hooks** (e.g., `useProductForm.ts`). Components should only render.
- Move reusable logic (image upload, file crop, debounce) into `src/shared/hooks/` or `src/shared/components/`.
- Use React Query for all server state. Never fetch inside `useEffect` manually.
- Prefer CSS Modules over inline styles. Use CSS variables for theme values.
- Keep component files under ~200 lines. If longer, split into sub-components or hooks.
- Props interfaces must be named `{ComponentName}Props`.

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files — Backend | `kebab-case.type.ts` | `supplier.service.ts` |
| Files — Frontend Component | `PascalCase.tsx` | `ProductCard.tsx` |
| Files — Frontend Hook | `camelCase.ts` prefixed `use` | `useProductForm.ts` |
| Files — Redux Slice | `camelCase.slice.ts` | `supplier.slice.ts` |
| Files — API service | `camelCase.api.ts` | `product.api.ts` |
| Variables & Functions | `camelCase` | `fetchProducts` |
| Classes, Interfaces, Types | `PascalCase` | `SupplierProfile` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_SIZE` |
| Folders | `kebab-case` | `add-product/` |

---

## Open Priority Fixes

See [docs/doc1.md](docs/doc1.md) for full details with ✅/❌ completion status.

**P0 (breaks core business):**
- ❌ All Indian states missing from supplier onboarding dropdown (`Onboarding.tsx:18`)
- ❌ Reseller step 3/4 validation mismatch — `monthlyVolume`/`reach` rendered step 3, validated step 4

**P1 (compliance/trust):**
- ❌ HSN code format validation missing (`AddProductForm.tsx:260`)
- ❌ Product image minimum not enforced at submit time
- ❌ GSTIN still marked Optional — should be required for non-micro businesses
- ❌ Product `specifications` key-value field missing from form

**P2 (business completeness):**
- ❌ Commission calculation and disbursement ledger
- ❌ Supplier bank details for settlement
- ❌ Quotation expiry notifications
- ❌ Admin reseller KYC document view

---

## Environment

`.env` files must be configured in both `amj-star-dukandar/` and `amjstar-backend/` for local development. Never commit `.env` files.
