# Admin Review Flow – Plan & Schema Alignment

## 1. What We’re Reviewing: Product vs Variants

- **Staging product** = one merchant’s product (e.g. “Nike Air Max 90”) with:
  - **Staging media** = product-level images from Shopify.
  - **Staging variants** = sellable SKUs (e.g. “Red / S”, “Blue / M”) with SKU, barcode, price.
- **Master product** = canonical catalog entry (e.g. “Nike Air Max 90”) with:
  - **Media** (table `media`) = product-level images (src_url, position).
  - **Variants** (table `variants`) = canonical SKUs (internal_sku, options, gtin).
- **merchant_offers** = links merchant to a **master variant** (variant_id) with price/stock.

**Conclusion:** Admin effectively reviews **variants**. Each **staging variant** must be either:
- linked to an **existing master variant**, or
- turned into a **new master variant** (when creating a new product or when “add new variant” on an existing product).

Product-level review is: title, description, brand, categories, and **which staging images** become the master product images.

---

## 2. Schema We Use (Existing Tables)

| Table | Purpose |
|-------|--------|
| `brands` | Brand name, slug, logo – **use for dropdown** when creating/linking product. |
| `categories` | Category tree – **use for product_categories** when creating product. |
| `products` | Master product: title, slug, description, brand_id, image_url (primary), status, options_definition. |
| `media` | Product-level images: product_id, src_url, alt_text, position. |
| `product_categories` | product_id, category_id (many-to-many). |
| `variants` | Master variant: product_id, internal_sku, gtin, mpn, options (jsonb), normalized_attributes. |
| `merchant_offers` | merchant_id, variant_id (master), external_*, cached_price_minor, offer_status. |
| `staging_products` | Raw merchant product (raw_title, raw_body_html, raw_vendor, etc.). |
| `staging_media` | Merchant product images (source_url, position). |
| `staging_variants` | Merchant variants (raw_sku, raw_barcode, raw_price_minor, raw_options). |

---

## 3. Create New Product Flow (Full Product Page, Amazon/Flipkart-Style)

**Goal:** Admin builds a full catalog product: basic info, brand, categories, images (chosen from staging), and variants (one per staging variant).

**Backend (CREATE_NEW payload):**

- `clean_data`:
  - `title` (required), `description`, `brand_id` (FK brands), `category_ids` (list, for product_categories).
  - `selected_media_ids` (list of staging_media.id in display order) → create rows in `media` and set `products.image_url` to first image’s src_url.
  - `options_definition` (optional, from staging raw_options_definition) for product-level option names (e.g. Color, Size).

**Backend logic:**

1. Create `products` (title, slug, description, brand_id, status, options_definition).
2. For each id in `selected_media_ids` (order = position), load staging_media, insert into `media` (product_id, src_url, alt_text, position). Set product.image_url = first media src_url.
3. Insert into `product_categories` for each category_id.
4. For each staging_variant: create `variants` (product_id, internal_sku, gtin, options, etc.), then create `merchant_offers` (merchant_id, variant_id, price from staging, etc.).
5. Mark staging_product APPROVED.

**Frontend:**

- Section “Basic info”: Title, Description, **Brand** (dropdown from GET /api/admin/brands), **Categories** (multi-select from GET /api/admin/categories).
- Section “Images”: Show all staging_media as thumbnails; admin **selects** which to use and **reorders** (drag or up/down). Submit as `selected_media_ids` (ordered).
- Section “Variants”: Table of staging variants (SKU, options, price) – read-only; backend creates them all.
- Submit single CREATE_NEW with full clean_data.

---

## 4. Link to Existing Product Flow (Variant-Centric)

**Goal:** Every staging **variant** is either linked to an existing master variant or added as a new master variant on the chosen product.

**Backend (LINK_EXISTING payload):**

- `master_product_id` (required).
- `variant_mapping`: **one entry per staging_variant**:
  - `staging_variant_id` (required).
  - **Either** `master_variant_id` (link to existing master variant) **or** `new_variant_attributes` (e.g. {"Color":"Red","Size":"S"}) to create a new master variant and then create merchant_offer.

**Backend logic:**

- For each entry in variant_mapping:
  - If `master_variant_id` present: validate it belongs to master_product_id, then create merchant_offer(merchant_id, master_variant_id, …).
  - Else: create new variant on master product (internal_sku, options from new_variant_attributes), then create merchant_offer(merchant_id, new_variant_id, …).
- All staging_variants must be covered. Then set staging_product APPROVED.

**Frontend:**

- After admin selects a master product:
  - Fetch **variant match suggestions** (existing API) and **master product variants** (new API: GET /api/admin/products/{id}/variants).
- Table: one row **per staging variant**.
  - Columns: Staging SKU, Options, Price | **Action**: [Link to existing ▼] or [Add new variant].
  - “Link to existing”: dropdown of master product’s variants (id, internal_sku, options display).
  - “Add new variant”: inline fields for option names/values (e.g. Color, Size) → sent as new_variant_attributes.
- Submit variant_mapping with one row per staging variant.

---

## 5. APIs to Add or Extend

| API | Purpose |
|-----|--------|
| GET /api/admin/brands | List brands (id, name, slug) for dropdown. |
| GET /api/admin/categories | List categories (id, name, slug, parent_id) for multi-select. |
| GET /api/admin/review/{stagingId} | Already exists; ensure response includes **media** array (id, source_url, alt_text, position) for image picker. |
| GET /api/admin/products/{productId}/variants | List variants of a master product (id, internal_sku, gtin, options) for link dropdown. |
| POST .../decision CREATE_NEW | Extend clean_data: category_ids, selected_media_ids, options_definition. |
| POST .../decision LINK_EXISTING | No change; ensure frontend sends one mapping per staging variant. |

---

## 6. Implementation Order

1. **Backend:** Media entity, MediaRepository; BrandRepository/CategoryRepository already exist. Add GET /admin/brands, GET /admin/categories.
2. **Backend:** Extend CleanDataDto (category_ids, selected_media_ids, options_definition). Implement createNewMasterAndApprove with media + product_categories.
3. **Backend:** GET /api/admin/products/{id}/variants. StagingDetailDto already can include media; ensure StagingDetail includes media list.
4. **Frontend:** Create-new: brand dropdown, categories multi-select, image picker (select + order from staging media), then submit.
5. **Frontend:** Link flow: per-staging-variant table with “Link to existing” (variant dropdown) or “Add new variant” (attributes form); submit full variant_mapping.

---

## 7. Reject Flow

- Unchanged: rejection_reason, admin_notes; set status REJECTED.
