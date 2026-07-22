# Reseller Module - Remaining Tasks & Status

Based on an analysis of the current `amj-star-dukandar` frontend repository, here is a detailed breakdown of what is already built and what still needs to be done for the **Reseller Role**.

## ✅ Implemented Features (UI Completed)

*   **Reseller Onboarding:** Full multi-step onboarding flow (`ResellerOnboarding.tsx`).
*   **Dashboard Layout:** Sidebar, top navigation, and routing (`ResellerDashboard.tsx`).
*   **Overview Tab:** High-level statistics and quick links.
*   **My Products:** Interface to view approved/pending products, set selling price margins, and customize descriptions (`ResellerMyProducts.tsx` - *API Connected*).
*   **Browse Products:** UI to search the supplier catalogue and request to sell (`ResellerBrowseProducts.tsx`).
*   **Storefront Settings:** Basic UI for customizing the public storefront (`ResellerStorefront.tsx`).
*   **Leads Management:** UI to track buyer inquiries and contact them via WhatsApp (`ResellerLeads.tsx`).
*   **Supplier Partnerships:** UI to manage relationships with suppliers (`ResellerSupplierPartners.tsx`).
*   **Performance:** Analytics dashboard UI (`ResellerPerformance.tsx`).
*   **History & Action Center:** Tracking activities and pending tasks (`ResellerHistory.tsx`, `ResellerActionCenter.tsx`).
*   **Settings:** Profile and Bank Account update forms (`ResellerSettings.tsx`).

---

## ⏳ Remaining Tasks (To Be Built)

### 1. Missing UI Components
Currently, the following tabs in the Reseller Dashboard use a generic Placeholder screen and need their actual UI components built:

> [!IMPORTANT]
> **Customer Orders (`ResellerOrders.tsx`)**
> *   Needs a table/list to view all orders placed by buyers on the reseller's storefront.
> *   Needs order detail view (Status tracking: Processing, Shipped, Delivered).
> *   Needs ability to download invoices.

> [!IMPORTANT]
> **Earnings & Payouts (`ResellerPayouts.tsx`)**
> *   Needs a Wallet UI showing available commission balance.
> *   Needs a Ledger/History of all commission credits and deductions.
> *   Needs a form to request "Withdrawal" to their registered bank account.

### 2. API Integrations (Connecting Dummy UI to Backend)
Several components have beautiful UI but are currently using hardcoded "Dummy Data". They need to be connected to the `reseller.service.ts` API:

*   **Reseller Leads:** Connect to a backend endpoint to fetch real buyer inquiries.
*   **Reseller Orders:** Connect to the `/orders` endpoint filtered for this reseller.
*   **Storefront Settings:** Ensure the "Save Layout" buttons actually save the banner and color choices to the backend DB.
*   **Supplier Partnerships:** Fetch real partnership status (Pending/Approved) from the backend instead of dummy lists.
*   **Earnings/Payouts:** Connect to the Wallet API to fetch real balances.

### 3. Public Storefront Enhancements
*   **Public Routing:** The `PublicStorefront.tsx` page needs to dynamically load the reseller's profile, theme, and curated products based on the URL slug (e.g., `amjstar.com/store/kr-electronics`).
*   **Lead Generation Form:** Ensure that when a buyer clicks "Contact Reseller" on the public storefront, it sends the data to the backend to generate a "Lead" in the Reseller Dashboard.
