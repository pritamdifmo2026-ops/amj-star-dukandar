# Tasks Done

## Product Details — COMPLETED ✅
*Completed: 16 May 2026*

### Backend (amj-backend)
- Added `DRAFT` to `ProductStatus` enum
- Added new fields to product model: `leadTime`, `packagingType`, `countryOfOrigin`, `certifications[]`
- Made `description`, `hsnCode`, `category` conditionally required (not required for DRAFT status)
- `createProduct`: skips tier limit check and auto-approval for DRAFT products
- `updateProduct`: allows DRAFT → PENDING transition with auto-approval logic
- `getProductById`: populates supplier `businessDetails` for company info on product page

### Frontend — Add/Edit Product Form (AddProductForm.tsx)
- Draft/Publish flow: "Save as Draft", "Publish Product", "Discard" buttons
- `validateForPublish()`: enforces all required fields + stock > 0 + at least 1 image
- Free-form key-value spec rows (no hardcoded category attributes)
- Category suggestions: pre-fills spec rows on category select; refreshes when category changes (if no values typed yet)
- Fixed: suggestion rows now update correctly when switching between categories
- Fixed: number input spinner arrows visible (removed overflow-hidden on price wrapper)
- `returnTab` prop: Discard navigates back to where user came from (inventory vs overview)

### Frontend — Supplier Dashboard & Inventory
- Smart discard navigation: editing from inventory → discard → inventory; adding new → discard → overview
- `previousTab` state tracks navigation origin
- Draft status badge added (`bg-yellow` style) with FileText icon
- Inventory filter pills: All / Draft / Published / Rejected (Rejected only shown if any exist)
- Pagination: 10 products per page with smart ellipsis page numbers
- `+ Add Product` button in inventory header

### Frontend — Product Detail Page (ProductDetail.tsx)
- 2-tab layout: Product Details + Company Details
- Product Details tab: description, specs table (alternating rows), certifications badges
- Company Details tab: GST Verified badge, Verified Supplier badge, location, year est., about, Chat button
- Supplier mini-card in right column with "Company Info" tab link

### Category Seeding (amj-backend)
- Seeded subcategories for: Textiles (31), Machinery (24), Agriculture, Electronics, Food & Beverages, Furniture, Home Furnishing
- Seed script: `src/seed/seedSubcategories.ts` (idempotent — safe to re-run)

### GST on Products
- Added `gstRate` (0/5/12/18/28 slabs) + `gstIncluded` (bool) to product model — both required for publish
- Approach: supplier declares rate + whether their stated price already includes GST or not
- Product detail page respects the flag — shows "GST inclusive" or "+ GST extra" accordingly
- PO generation (not built yet) should use `gstIncluded` to avoid double-charging; IGST vs CGST+SGST split to be handled at PO time based on buyer/seller state
