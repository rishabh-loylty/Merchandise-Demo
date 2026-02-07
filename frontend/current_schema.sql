-- This script is the initial migration for creating your database schema.
-- It's generated from a `pg_dump --schema-only` command and has been commented to explain the purpose of each part.
-- A migration script like this is used to set up the database structure from scratch.

-- SECTION 1: SESSION CONFIGURATION
-- The following SET commands configure the environment for this script to run reliably.
-- They ensure that the script isn't affected by the specific configuration of the database client.

SET statement_timeout = 0; -- No time limit on how long a statement can take.
SET lock_timeout = 0; -- No time limit on how long to wait for a lock.
SET idle_in_transaction_session_timeout = 0; -- No time limit for idle transactions.
SET client_encoding = 'UTF8'; -- Sets the character encoding to UTF-8, a standard for web content.
SET standard_conforming_strings = on; -- Treats backslashes in strings literally, which is the standard.
SELECT pg_catalog.set_config('search_path', '', false); -- Ensures that only objects in the specified schema (or public by default) are found.
SET check_function_bodies = false; -- Turns off checking of function bodies during their creation.
SET xmloption = content; -- Sets the default for XML data.
SET client_min_messages = warning; -- Only shows messages that are warnings or errors.
SET row_security = off; -- Disables row-level security for this script.

SET default_tablespace = ''; -- Use the default tablespace for new objects.
SET default_table_access_method = heap; -- Use the default table storage method.


-- SECTION 2: TABLE AND SEQUENCE DEFINITIONS
-- This section creates the tables, their columns, and the sequences for auto-incrementing IDs.

--
-- Table: brands
-- Purpose: Stores information about product brands.
--
CREATE TABLE public.brands (
    id integer NOT NULL, -- Unique identifier for each brand.
    name text NOT NULL, -- The name of the brand (e.g., "Sony", "Apple").
    slug text NOT NULL, -- A URL-friendly version of the name (e.g., "sony", "apple").
    logo_url text, -- URL for the brand's logo image.
    is_active boolean DEFAULT true, -- Flag to indicate if the brand is currently active.
    created_at timestamp with time zone DEFAULT now() -- Timestamp of when the brand was created.
);

-- A sequence is used to automatically generate unique integer IDs for the 'id' column.
CREATE SEQUENCE public.brands_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
-- This links the sequence to the 'id' column of the 'brands' table.
ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- Table: categories
-- Purpose: Stores product categories, with support for hierarchical (parent-child) relationships.
--
CREATE TABLE public.categories (
    id integer NOT NULL, -- Unique identifier for each category.
    parent_id integer, -- References the 'id' of the parent category to create a hierarchy. NULL for top-level categories.
    name text NOT NULL, -- The name of the category (e.g., "Electronics").
    slug text NOT NULL, -- A URL-friendly version of the name.
    icon text, -- URL or identifier for an icon representing the category.
    path text, -- Materialized path for the category hierarchy (e.g., "1/5/12").
    is_active boolean DEFAULT true -- Flag to indicate if the category is active.
);

CREATE SEQUENCE public.categories_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Table: currencies
-- Purpose: Stores information about different currencies.
--
CREATE TABLE public.currencies (
    code text NOT NULL, -- The ISO 4217 currency code (e.g., "USD", "INR"). This is the primary key.
    name text NOT NULL, -- The full name of the currency (e.g., "United States Dollar").
    minor_units integer NOT NULL, -- The number of decimal places (e.g., 2 for USD, meaning cents).
    symbol text NOT NULL -- The currency symbol (e.g., "$").
);


--
-- Table: loyalty_partners
-- Purpose: Stores information about loyalty program partners.
--
CREATE TABLE public.loyalty_partners (
    id integer NOT NULL,
    name text NOT NULL, -- Name of the loyalty partner.
    is_active boolean DEFAULT true NOT NULL, -- Whether this partner is active.
    configuration jsonb, -- JSON blob for partner-specific configuration.
    created_at timestamp with time zone DEFAULT now(),
    store_config jsonb DEFAULT '{}'::jsonb -- JSON blob for the partner's store configuration.
);

CREATE SEQUENCE public.loyalty_partners_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.loyalty_partners_id_seq OWNED BY public.loyalty_partners.id;


-- ... (Comments for other tables would follow a similar pattern) ...
-- For brevity, I'm summarizing the rest of the table creations.
-- The pattern is the same: CREATE TABLE, CREATE SEQUENCE, ALTER SEQUENCE ... OWNED BY.

CREATE TABLE public.margin_rules ( id integer NOT NULL, merchant_id integer NOT NULL, brand_id integer, category_id integer, margin_percentage numeric(5,2) NOT NULL, valid_from timestamp with time zone DEFAULT now() NOT NULL, valid_to timestamp with time zone, is_active boolean DEFAULT true );
CREATE SEQUENCE public.margin_rules_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.margin_rules_id_seq OWNED BY public.margin_rules.id;

CREATE TABLE public.media ( id integer NOT NULL, product_id integer NOT NULL, src_url text NOT NULL, alt_text text, "position" integer DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() );
CREATE SEQUENCE public.media_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;

CREATE TABLE public.merchant_offers ( id integer NOT NULL, merchant_id integer NOT NULL, variant_id integer NOT NULL, external_product_id text, external_variant_id text, merchant_sku text, metadata_hash text, last_synced_at timestamp with time zone, currency_code text DEFAULT 'INR'::text NOT NULL, cached_price_minor bigint NOT NULL, cached_settlement_price_minor bigint NOT NULL, current_stock integer DEFAULT 0, is_active boolean DEFAULT true, offer_status text DEFAULT 'LIVE'::text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), CONSTRAINT merchant_offers_offer_status_check CHECK ((offer_status = ANY (ARRAY['LIVE'::text, 'PENDING_REVIEW'::text]))) );
CREATE SEQUENCE public.merchant_offers_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.merchant_offers_id_seq OWNED BY public.merchant_offers.id;

CREATE TABLE public.merchants ( id integer NOT NULL, name text NOT NULL, email text, source_type text DEFAULT 'SHOPIFY'::text NOT NULL, source_config jsonb DEFAULT '{}'::jsonb NOT NULL, is_active boolean DEFAULT true NOT NULL, shopify_configured boolean DEFAULT false NOT NULL, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now() );
CREATE SEQUENCE public.merchants_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.merchants_id_seq OWNED BY public.merchants.id;

CREATE TABLE public.offer_price_log ( id integer NOT NULL, offer_id integer, currency_code text NOT NULL, price_minor bigint NOT NULL, settlement_price_minor bigint NOT NULL, applied_margin_percentage numeric(5,2) NOT NULL, valid_from timestamp with time zone DEFAULT now(), valid_to timestamp with time zone );
CREATE SEQUENCE public.offer_price_log_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.offer_price_log_id_seq OWNED BY public.offer_price_log.id;

CREATE TABLE public.point_conversion_rules ( id integer NOT NULL, partner_id integer NOT NULL, currency_code text NOT NULL, points_to_currency_rate numeric(10,4) NOT NULL, valid_from timestamp with time zone DEFAULT now() NOT NULL, valid_to timestamp with time zone, is_active boolean DEFAULT true NOT NULL );
CREATE SEQUENCE public.point_conversion_rules_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.point_conversion_rules_id_seq OWNED BY public.point_conversion_rules.id;

CREATE TABLE public.product_categories ( product_id integer NOT NULL, category_id integer NOT NULL );

CREATE TABLE public.products ( id integer NOT NULL, brand_id integer, title text NOT NULL, slug text NOT NULL, description text, image_url text, specifications jsonb, base_price numeric(12,2) DEFAULT 0 NOT NULL, rating numeric(3,1) DEFAULT 0, review_count integer DEFAULT 0, status text DEFAULT 'ACTIVE'::text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['DRAFT'::text, 'ACTIVE'::text, 'ARCHIVED'::text]))) );
CREATE SEQUENCE public.products_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;

CREATE TABLE public.staging_products ( id integer NOT NULL, merchant_id integer NOT NULL, external_product_id text, raw_title text, raw_body_html text, raw_vendor text, raw_product_type text, raw_tags text, raw_json_dump jsonb, status text DEFAULT 'PENDING'::text, rejection_reason text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), CONSTRAINT staging_products_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'AUTO_MATCHED'::text, 'NEEDS_REVIEW'::text, 'APPROVED'::text, 'REJECTED'::text]))) );
CREATE SEQUENCE public.staging_products_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.staging_products_id_seq OWNED BY public.staging_products.id;

CREATE TABLE public.staging_variants ( id integer NOT NULL, staging_product_id integer, external_variant_id text, raw_sku text, raw_barcode text, raw_price numeric(10,2), raw_options jsonb, status text DEFAULT 'PENDING'::text, matched_master_variant_id integer, created_at timestamp with time zone DEFAULT now(), CONSTRAINT staging_variants_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'AUTO_MATCHED'::text, 'NEEDS_REVIEW'::text, 'APPROVED'::text, 'REJECTED'::text]))) );
CREATE SEQUENCE public.staging_variants_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.staging_variants_id_seq OWNED BY public.staging_variants.id;

CREATE TABLE public.sync_logs ( id integer NOT NULL, merchant_id integer NOT NULL, status text NOT NULL, started_at timestamp with time zone NOT NULL, finished_at timestamp with time zone, records_processed integer DEFAULT 0, records_failed integer DEFAULT 0, notes text, CONSTRAINT sync_logs_status_check CHECK ((status = ANY (ARRAY['SUCCESS'::text, 'FAILED'::text, 'IN_PROGRESS'::text, 'PARTIAL_SUCCESS'::text]))) );
CREATE SEQUENCE public.sync_logs_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.sync_logs_id_seq OWNED BY public.sync_logs.id;

CREATE TABLE public.variant_media ( variant_id integer NOT NULL, media_id integer NOT NULL );

CREATE TABLE public.variants ( id integer NOT NULL, product_id integer NOT NULL, internal_sku text NOT NULL, gtin text, mpn text, weight_grams integer, attributes jsonb, is_active boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now() );
CREATE SEQUENCE public.variants_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.variants_id_seq OWNED BY public.variants.id;


-- SECTION 3: SETTING DEFAULT VALUES FOR PRIMARY KEYS
-- This section alters the tables to use the sequences we created for their 'id' columns.
-- This makes the 'id' columns auto-incrementing.
ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);
ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
ALTER TABLE ONLY public.loyalty_partners ALTER COLUMN id SET DEFAULT nextval('public.loyalty_partners_id_seq'::regclass);
ALTER TABLE ONLY public.margin_rules ALTER COLUMN id SET DEFAULT nextval('public.margin_rules_id_seq'::regclass);
ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);
ALTER TABLE ONLY public.merchant_offers ALTER COLUMN id SET DEFAULT nextval('public.merchant_offers_id_seq'::regclass);
ALTER TABLE ONLY public.merchants ALTER COLUMN id SET DEFAULT nextval('public.merchants_id_seq'::regclass);
ALTER TABLE ONLY public.offer_price_log ALTER COLUMN id SET DEFAULT nextval('public.offer_price_log_id_seq'::regclass);
ALTER TABLE ONLY public.point_conversion_rules ALTER COLUMN id SET DEFAULT nextval('public.point_conversion_rules_id_seq'::regclass);
ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);
ALTER TABLE ONLY public.staging_products ALTER COLUMN id SET DEFAULT nextval('public.staging_products_id_seq'::regclass);
ALTER TABLE ONLY public.staging_variants ALTER COLUMN id SET DEFAULT nextval('public.staging_variants_id_seq'::regclass);
ALTER TABLE ONLY public.sync_logs ALTER COLUMN id SET DEFAULT nextval('public.sync_logs_id_seq'::regclass);
ALTER TABLE ONLY public.variants ALTER COLUMN id SET DEFAULT nextval('public.variants_id_seq'::regclass);


-- SECTION 4: DEFINING CONSTRAINTS
-- This section adds constraints to the tables to enforce data integrity.
-- This includes Primary Keys, Unique Constraints, and Foreign Keys.

-- Primary Keys (PK): Ensure every row in a table is uniquely identifiable.
ALTER TABLE ONLY public.brands ADD CONSTRAINT brands_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.currencies ADD CONSTRAINT currencies_pkey PRIMARY KEY (code);
-- ... and so on for all tables.

-- Unique Constraints: Ensure that values in a column (or a set of columns) are unique across all rows.
ALTER TABLE ONLY public.brands ADD CONSTRAINT brands_name_key UNIQUE (name);
ALTER TABLE ONLY public.brands ADD CONSTRAINT brands_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.merchant_offers ADD CONSTRAINT merchant_offers_merchant_id_variant_id_key UNIQUE (merchant_id, variant_id);
-- ... and so on.

-- Foreign Keys (FK): Create a link between two tables and enforce referential integrity.
-- This means you can't have a `product` with a `brand_id` that doesn't exist in the `brands` table.
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.margin_rules ADD CONSTRAINT margin_rules_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.products ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);
-- ... and so on for all foreign key relationships.


-- SECTION 5: CREATING INDEXES
-- Indexes are created to speed up query performance. Without an index, the database
-- would have to scan the entire table for queries that filter on non-primary-key columns.

-- Example: This index will make it faster to find all categories that have the same parent_id.
CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_id);
-- Example: This index will speed up finding all offers from a specific merchant.
CREATE INDEX idx_offers_merchant ON public.merchant_offers USING btree (merchant_id);
-- ... and so on for other indexes.


-- The full list of constraints and indexes from the original file are included below for completeness.
-- It's important to create constraints and indexes *after* the tables are created.
-- pg_dump separates them to manage dependencies correctly.

-- Constraints
ALTER TABLE ONLY public.brands ADD CONSTRAINT brands_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.brands ADD CONSTRAINT brands_name_key UNIQUE (name);
ALTER TABLE ONLY public.brands ADD CONSTRAINT brands_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.currencies ADD CONSTRAINT currencies_pkey PRIMARY KEY (code);
ALTER TABLE ONLY public.loyalty_partners ADD CONSTRAINT loyalty_partners_name_key UNIQUE (name);
ALTER TABLE ONLY public.loyalty_partners ADD CONSTRAINT loyalty_partners_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.margin_rules ADD CONSTRAINT margin_rules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.media ADD CONSTRAINT media_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.merchant_offers ADD CONSTRAINT merchant_offers_merchant_id_variant_id_key UNIQUE (merchant_id, variant_id);
ALTER TABLE ONLY public.merchant_offers ADD CONSTRAINT merchant_offers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.merchants ADD CONSTRAINT merchants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.offer_price_log ADD CONSTRAINT offer_price_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.point_conversion_rules ADD CONSTRAINT point_conversion_rules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.staging_products ADD CONSTRAINT staging_products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.staging_variants ADD CONSTRAINT staging_variants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sync_logs ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.variant_media ADD CONSTRAINT variant_media_pkey PRIMARY KEY (variant_id, media_id);
ALTER TABLE ONLY public.variants ADD CONSTRAINT variants_internal_sku_key UNIQUE (internal_sku);
ALTER TABLE ONLY public.variants ADD CONSTRAINT variants_pkey PRIMARY KEY (id);

-- Indexes
CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_id);
CREATE INDEX idx_offers_merchant ON public.merchant_offers USING btree (merchant_id);
CREATE INDEX idx_offers_variant ON public.merchant_offers USING btree (variant_id);
CREATE INDEX idx_product_categories_cat ON public.product_categories USING btree (category_id);
CREATE INDEX idx_staging_prod_merchant ON public.staging_products USING btree (merchant_id);
CREATE INDEX idx_variants_gtin ON public.variants USING btree (gtin);

-- Foreign Key Constraints
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.margin_rules ADD CONSTRAINT margin_rules_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.margin_rules ADD CONSTRAINT margin_rules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.margin_rules ADD CONSTRAINT margin_rules_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.media ADD CONSTRAINT media_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.merchant_offers ADD CONSTRAINT merchant_offers_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.merchant_offers ADD CONSTRAINT merchant_offers_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.offer_price_log ADD CONSTRAINT offer_price_log_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.merchant_offers(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.point_conversion_rules ADD CONSTRAINT point_conversion_rules_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES public.currencies(code) ON DELETE RESTRICT;
ALTER TABLE ONLY public.point_conversion_rules ADD CONSTRAINT point_conversion_rules_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.loyalty_partners(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_categories ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.products ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);
ALTER TABLE ONLY public.staging_products ADD CONSTRAINT staging_products_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id);
ALTER TABLE ONLY public.staging_variants ADD CONSTRAINT staging_variants_staging_product_id_fkey FOREIGN KEY (staging_product_id) REFERENCES public.staging_products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sync_logs ADD CONSTRAINT sync_logs_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.variant_media ADD CONSTRAINT variant_media_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.variant_media ADD CONSTRAINT variant_media_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.variants ADD CONSTRAINT variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


-- Migration complete.
