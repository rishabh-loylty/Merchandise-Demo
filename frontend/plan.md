I need a High-Fidelity Next.js (App Router) prototype for a Reward Redemption Marketplace.
Stack: React, Tailwind CSS, Lucide React Icons, Shadcn UI (Cards, Tables, Dialogs, Forms).

The app relies on a `GlobalContext` to simulate Authentication and Role Switching. 
We will Mock all API calls using `setTimeout`.

### 1. Global State & Navigation
Create a `GlobalContext` that manages:
- `currentRole`: 'CUSTOMER' | 'MERCHANT' | 'ADMIN'
- `selectedBank`: { id: string, name: string, pointRatio: number } (Default: SBI, Ratio: 0.25)
- `merchantSession`: { id: string, name: string, email: string, shopifyConfigured: boolean } | null

**Top Navbar (Conditional based on Role):**
1. **Customer View:** 
   - Logo "Rewardify".
   - **Bank Selector:** A Dropdown to switch banks (SBI, HDFC, Axis). This changes `selectedBank`.
   - **User Menu:** "Login as Merchant" (Redirects to `/merchant`) | "Login as Admin" (Redirects to `/admin`).
2. **Merchant/Admin View:**
   - Shows "Merchant Console: [Name]" or "Admin Console".
   - Button to "Exit to Store" (Reset to Customer).

### 2. The Customer Store Routes (`/store`)
*API Mock:* Fetch products/categories from a dummy JSON.

- **Home (`/store/page.tsx`):**
  - Hero Carousel.
  - "Shop by Category" Grid (Kitchen, Electronics, Fashion).
  - Featured Products Row.
  - **Price Logic:** All prices must be calculated dynamically: `(BasePrice / selectedBank.pointRatio)`. Display as "Points".

- **Search & Listing (`/store/search` and `/store/[category]/search`):**
  - **Sidebar:** Professional filters like Amazon.
    - Price Range (Slider).
    - Point Range (Slider).
    - Brand (Checkbox List).
    - Rating (Stars).
  - **Main Content:** Product Grid.
  - **URL Params:** The page must read `?q=` and `?filters=` from the URL.

- **Product Detail (`/store/[productId]/page.tsx`):**
  - High-quality layout. Large image gallery on left, Details on right.
  - "Redeem Now" button showing the Point Cost based on the selected Bank.

### 3. The Merchant Portal (`/merchant`)
*API Mock:* `fetchMerchants`, `createMerchant`, `saveShopifyConfig`, `fetchMerchantProducts`.

- **The Gatekeeper (`/merchant/page.tsx`):**
  - If `merchantSession` is NULL: Show a card with two tabs:
    1. **Login:** A dropdown of existing merchants (Seller A, Seller B). Selecting one sets `merchantSession`.
    2. **Register:** Form (Business Name, Email). "Create" adds to the list and sets session.
  - If `merchantSession` is SET: Redirect to Dashboard.

- **Onboarding (`/merchant/onboarding/page.tsx`):**
  - Check: If `merchantSession.shopifyConfigured` is TRUE, redirect to Dashboard.
  - Form: "Shopify Store URL", "Access Token".
  - Action: "Connect Store". Simulates API call, updates state to configured, redirects to Dashboard.

- **Dashboard & Products (`/merchant/dashboard`, `/merchant/products`):**
  - **Sync Action:** A "Sync Products" button. Simulates fetching data from Shopify.
  - **Product Table:** Columns for Image, Title, SKU, Price.
  - **Status Badge:** Crucial. Products can be `LIVE` (Green) or `PENDING_REVIEW` (Yellow).
  - New products synced from Shopify default to `PENDING_REVIEW`.

### 4. The Admin Operations (`/admin/review`)
*Purpose:* Clean "Dirty" data before it goes Live.

- **Review Dashboard:**
  - A table of items with status `PENDING_REVIEW`.
  - Action: "Review" button opens a **Sidebar Sheet** or **Modal**.
  - **The Diff Interface (The Review Modal):**
    - **Top:** "Original Data from Shopify" (ReadOnly: "Prestige  Cooker", Vendor: "Prestiege Inc").
    - **Bottom:** "Master Catalog Data" (Editable Forms).
      - Title Input (Pre-filled).
      - **Brand Selector:** A Searchable Dropdown (Combobox) to map "Prestiege Inc" to the Master Brand "Prestige".
      - **Category Selector:** Tree select for Master Categories.
    - **Footer Actions:** "Reject" (Red), "Approve & Publish" (Green).

### Visual Style
- Use a clean, trustworthy color palette (Slate/Blue).
- Use `shadcn/ui` components: `Select` for banks, `Command` for brand mapping, `Table` for catalogs, `Sheet` for admin reviews.
- Ensure the "Points" calculation is prominent in the Store view.