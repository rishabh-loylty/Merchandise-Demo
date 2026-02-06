-- ==================================================================================
-- FINAL DATABASE SCHEMA: MULTI-MERCHANT REWARDS PORTAL
-- Includes: Staging Workflow, Master Catalog, Optimization for Pricing, and Finance
-- ==================================================================================

-- ==========================================
-- 0. ENUMS & TYPES
-- ==========================================
CREATE TYPE ECOMMERCE_SOURCE AS ENUM ('SHOPIFY', 'WOOCOMMERCE', 'MAGENTO', 'MANUAL');
CREATE TYPE SYNC_STATUS AS ENUM ('SUCCESS', 'FAILED', 'IN_PROGRESS', 'PARTIAL_SUCCESS');
CREATE TYPE PRODUCT_STATUS AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED'); 
CREATE TYPE STAGING_STATUS AS ENUM ('PENDING', 'AUTO_MATCHED', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED');

-- ==========================================
-- 1. CORE FINANCE & LOYALTY (The Banks)
-- ==========================================
CREATE TABLE currencies (
    code VARCHAR(3) PRIMARY KEY, -- 'INR', 'USD'
    name VARCHAR(255) NOT NULL,
    minor_units INT NOT NULL,   -- e.g., 2 for INR (100 paise = 1 Rupee)
    symbol VARCHAR(5) NOT NULL
);

CREATE TABLE loyalty_partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE, -- 'HDFC Bank', 'SBI'
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    configuration JSONB, -- Branding, API endpoints
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE point_conversion_rules (
    id SERIAL PRIMARY KEY,
    partner_id INT NOT NULL REFERENCES loyalty_partners(id) ON DELETE CASCADE,
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code) ON DELETE RESTRICT,
    points_to_currency_rate DECIMAL(10, 4) NOT NULL, -- e.g. 0.25
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);
CREATE UNIQUE INDEX idx_unique_active_rule ON point_conversion_rules (partner_id, currency_code) WHERE is_active = TRUE;

-- ==========================================
-- 2. MERCHANTS & MARGINS (The Sellers)
-- ==========================================
CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_type ECOMMERCE_SOURCE NOT NULL,
    source_config JSONB NOT NULL, -- {api_key, store_url, access_token}
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Categories (Hierarchical)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    path TEXT, -- 'Electronics > Phones' (Optimization)
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Master Brands
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE, -- Cleaned name 'Prestige'
    slug VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Margin Rules (How we make money)
CREATE TABLE margin_rules (
    id SERIAL PRIMARY KEY,
    merchant_id INT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    brand_id INT REFERENCES brands(id) ON DELETE CASCADE, -- Optional
    category_id INT REFERENCES categories(id) ON DELETE CASCADE, -- Optional
    margin_percentage DECIMAL(5, 2) NOT NULL, -- e.g. 5.00 for 5%
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(merchant_id, brand_id, category_id, is_active)
);

-- ==========================================
-- 3. STAGING AREA (The "Dirty" Data Layer)
-- Raw data from Shopify lands here first.
-- ==========================================
CREATE TABLE staging_products (
    id BIGSERIAL PRIMARY KEY,
    merchant_id INT NOT NULL REFERENCES merchants(id),
    
    -- Raw Data from Source
    external_product_id VARCHAR(100), -- Shopify Product ID
    raw_title TEXT,
    raw_body_html TEXT,
    raw_vendor VARCHAR(255), -- e.g. "NiKe Inc" (Dirty)
    raw_product_type VARCHAR(255),
    raw_tags TEXT,
    raw_json_dump JSONB, -- Full original JSON for debugging
    
    -- Workflow Status
    status STAGING_STATUS DEFAULT 'PENDING',
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_staging_prod_merchant ON staging_products(merchant_id);
CREATE INDEX idx_staging_prod_ext_id ON staging_products(merchant_id, external_product_id);

CREATE TABLE staging_variants (
    id BIGSERIAL PRIMARY KEY,
    staging_product_id BIGINT REFERENCES staging_products(id) ON DELETE CASCADE,
    
    -- Raw Data
    external_variant_id VARCHAR(100),
    raw_sku VARCHAR(100),
    raw_barcode VARCHAR(100), -- GTIN/EAN (Critical for matching)
    raw_price DECIMAL(10,2), -- Float is okay in staging only
    raw_options JSONB, -- {"Color": "Red"}
    
    -- Workflow Status
    status STAGING_STATUS DEFAULT 'PENDING',
    
    -- Auto-Matching Suggestion
    matched_master_variant_id BIGINT, 
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. MASTER CATALOG (The "Clean" Data Layer)
-- Only Approved/Clean data exists here.
-- ==========================================
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(id),
    title VARCHAR(255) NOT NULL, -- Clean Title
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    specifications JSONB, -- {"Material": "Steel"}
    status PRODUCT_STATUS DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_specs ON products USING GIN(specifications);

-- Linking Table: Many-to-Many Categories
CREATE TABLE product_categories (
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    internal_sku VARCHAR(100) NOT NULL UNIQUE, -- Our System SKU
    gtin VARCHAR(50), -- Global Barcode
    mpn VARCHAR(100),
    weight_grams INT,
    attributes JSONB, -- {"Color": "Red"}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_variants_gtin ON variants(gtin);
CREATE INDEX idx_variants_attrs ON variants USING GIN(attributes);

-- Media (Images)
CREATE TABLE media (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    src_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    position INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE variant_media (
    variant_id BIGINT NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    media_id BIGINT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, media_id)
);

-- ==========================================
-- 5. MARKETPLACE & PRICING (The "Live" Layer)
-- ==========================================
CREATE TABLE merchant_offers (
    id BIGSERIAL PRIMARY KEY,
    merchant_id INT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    
    -- Link back to source
    external_product_id VARCHAR(100),
    external_variant_id VARCHAR(100),
    merchant_sku VARCHAR(100),
    
    -- Sync Optimization
    metadata_hash VARCHAR(64),
    last_synced_at TIMESTAMPTZ,
    
    -- PRICING CACHE (Per CTO feedback: Store current price here for speed)
    currency_code VARCHAR(3) NOT NULL,
    cached_price_minor BIGINT NOT NULL, -- Selling Price
    cached_settlement_price_minor BIGINT NOT NULL, -- What we owe merchant
    
    current_stock INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (merchant_id, variant_id)
);
CREATE UNIQUE INDEX idx_offers_external ON merchant_offers(merchant_id, external_variant_id);

-- The Audit Log (For Finance/History - Not for storefront display)
CREATE TABLE offer_price_log (
    id BIGSERIAL PRIMARY KEY,
    offer_id BIGINT REFERENCES merchant_offers(id) ON DELETE CASCADE,
    currency_code VARCHAR(3) NOT NULL,
    price_minor BIGINT NOT NULL,
    settlement_price_minor BIGINT NOT NULL,
    applied_margin_percentage DECIMAL(5, 2) NOT NULL,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_to TIMESTAMPTZ -- Null means current
);

-- ==========================================
-- 6. OPERATIONS
-- ==========================================
CREATE TABLE sync_logs (
    id BIGSERIAL PRIMARY KEY,
    merchant_id INT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    status SYNC_STATUS NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    records_processed INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    notes TEXT
);