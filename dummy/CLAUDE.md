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
 (`Onboarding.tsx:18`)
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

---

## Supplier Wallet Withdrawal Flow — Bank Details Management

**Status:** ⏳ Pending

### Overview
Suppliers must register bank account details during onboarding and can manage multiple bank accounts in settings. Withdrawals use the **primary bank** by default or allow selection from saved accounts.

### Requirements

#### 1. Supplier Onboarding — Bank Details Step
- **Where:** Onboarding.tsx → Add as **Step 5** (before final submission)
- **Fields:**
  - Account Holder Name (required)
  - Account Number (required, 9-18 digits)
  - IFSC Code (required, 11 chars, format: XXXX0XXXXXX)
  - Bank Name (required)
- **Behavior:**
  - This bank becomes the **primary bank** after onboarding completes
  - Validation before step submission
  - Cannot proceed to next step without valid bank details

#### 2. Supplier Settings — Bank Account Management
- **Location:** `/supplier/dashboard?tab=settings`
- **New Section:** "Bank Accounts" card (after "Basic Information" and "Contact Details")
- **Features:**

  **Display Primary Bank:**
  - Show current primary bank with ✓ badge
  - Bank name, masked account number (show last 4: ••••1234), IFSC

  **Add New Bank:**
  - Button: "+ Add Bank Account"
  - Modal/Inline form with same fields as onboarding
  - After submit → appears in list
  - Success toast

  **Bank List:**
  - Card per bank showing:
    - Bank name, account holder name
    - Masked account number (last 4 digits)
    - IFSC code
    - **Primary** badge on current primary
    - Edit & Delete buttons
  - Editable fields: account holder name, account number, IFSC, bank name

  **Set as Primary:**
  - Radio button or "Set as Primary" button per bank
  - Update on click
  - Success toast: "Primary bank updated"

  **Delete Bank:**
  - Delete button per bank
  - **Cannot delete primary bank** → show warning tooltip
  - Confirm dialog before deletion
  - Success/error toast

  **Edit Bank:**
  - Edit button → open modal with current details
  - Update on submit
  - Success toast

#### 3. Withdrawal Modal Update
- **Current behavior:** Suppliers enter bank details inline during withdrawal request
- **New behavior:**
  - Primary bank auto-filled and selected by default
  - Dropdown to select from saved banks
  - If no saved banks → fall back to inline entry (for backward compatibility)
  - Show message: "Using saved primary bank"

#### 4. Validation Rules
- IFSC code: 11 characters, format `XXXX0XXXXXX` (4 alpha, 0, 6 alphanumeric)
- Account number: 9-18 digits
- Account holder name: 3-50 characters, alphanumeric + spaces
- Bank name: 3-50 characters
- Cannot have duplicate account numbers

### Database Schema — Supplier Model

```typescript
// Add to Supplier model
banks: [{
  _id: ObjectId,                  // unique per bank
  accountHolderName: string,      // 3-50 chars
  accountNumber: string,          // 9-18 digits
  ifscCode: string,              // 11 chars: XXXX0XXXXXX
  bankName: string,              // 3-50 chars
  isPrimary: boolean,
  createdAt: Date,
  updatedAt: Date,
}],
primaryBankId: ObjectId | null   // ref to banks[i]._id
```

### Backend API Endpoints

**Bank Management (Supplier only, auth required):**
```
GET    /supplier/banks              # List all banks for supplier
POST   /supplier/banks              # Add new bank
       Body: { accountHolderName, accountNumber, ifscCode, bankName }
PUT    /supplier/banks/:id          # Edit bank details
       Body: { accountHolderName, accountNumber, ifscCode, bankName }
DELETE /supplier/banks/:id          # Delete bank (cannot delete primary)
PATCH  /supplier/banks/:id/set-primary  # Set as primary
```

**Wallet Withdrawal Update:**
```
POST   /wallet/withdraw             # Updated
       Body: { amount, bankId?, bankDetails? }
       # If bankId provided → validate it's primary or owned by supplier
       # If bankDetails provided → use inline (backward compat)
       # If neither → use primary bank
```

### Frontend Files to Modify

1. **Onboarding.tsx**
   - Add Step 5 for bank details
   - Include form with validation
   - Store in Redux or local state

2. **SupplierSettings.tsx**
   - Add "Bank Accounts" section
   - Implement add/edit/delete/set-primary flows
   - Use React Query for mutations

3. **SupplierWallet.tsx**
   - Update withdrawal modal
   - Auto-populate primary bank
   - Show dropdown of saved banks

4. **wallet.api.ts**
   - Add methods:
     - `getBanks()` → GET /supplier/banks
     - `addBank(details)` → POST /supplier/banks
     - `editBank(id, details)` → PUT /supplier/banks/:id
     - `deleteBank(id)` → DELETE /supplier/banks/:id
     - `setPrimaryBank(id)` → PATCH /supplier/banks/:id/set-primary

### Frontend Components Structure

**SupplierSettings.tsx:**
```
<SupplierSettings>
  <!-- Existing sections -->
  <div className={cardCls}>
    <h3>Bank Accounts</h3>
    <PrimaryBankDisplay />
    <BanksList />
    <AddBankButton />
  </div>
</SupplierSettings>
```

**Sub-components:**
- `BanksList.tsx` → List with edit/delete/set-primary actions
- `AddBankForm.tsx` → Modal form for add/edit
- `BankDetailsFields.tsx` → Reusable form fields

### Implementation Checklist

**Backend:**
- [ ] Update Supplier model → add `banks[]` array, `primaryBankId`
- [ ] Create bank validation utilities (IFSC format, account length)
- [ ] Add endpoints in `supplier.routes.ts`
- [ ] Implement bank service methods
- [ ] Update `wallet.service.ts` → use primary bank on withdrawal
- [ ] Add error handling for primary bank deletion attempt

**Frontend:**
- [ ] Add bank step to Onboarding.tsx (Step 5)
- [ ] Create bank management components
- [ ] Add bank API service methods to wallet.api.ts
- [ ] Update SupplierSettings.tsx with bank section
- [ ] Update SupplierWallet.tsx withdrawal modal
- [ ] Add IFSC/account validation helpers

**Testing:**
- [ ] Onboarding completes with bank details
- [ ] Can add multiple banks in settings
- [ ] Cannot delete primary bank
- [ ] Set as primary updates correctly
- [ ] Withdrawal uses primary bank by default
- [ ] Withdrawal modal shows saved banks

### Notes
- Ensure mobile responsive design for bank list
- Add loading states for all mutations
- Clear form after successful add/edit
- Confirm dialogs for destructive actions (delete)
- Toast notifications for all operations
- Consider bank data encryption at rest for security

---

## Environment

`.env` files must be configured in both `amj-star-dukandar/` and `amjstar-backend/` for local development. Never commit `.env` files.
