--
-- PostgreSQL database dump
--

\restrict MetYKwvPjJoyawbx33eAo7p5TaD9aLYRFzbltHPkaMgwaGrcqWEgtTwUmaAmId9

-- Dumped from database version 17.7 (bdd1736)
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.brands OWNER TO neondb_owner;

--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.brands_id_seq OWNER TO neondb_owner;

--
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    parent_id integer,
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    path text,
    is_active boolean DEFAULT true
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO neondb_owner;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.currencies (
    code text NOT NULL,
    name text NOT NULL,
    minor_units integer NOT NULL,
    symbol text NOT NULL
);


ALTER TABLE public.currencies OWNER TO neondb_owner;

--
-- Name: loyalty_partners; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.loyalty_partners (
    id integer NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    configuration jsonb,
    created_at timestamp with time zone DEFAULT now(),
    store_config jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.loyalty_partners OWNER TO neondb_owner;

--
-- Name: loyalty_partners_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.loyalty_partners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loyalty_partners_id_seq OWNER TO neondb_owner;

--
-- Name: loyalty_partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.loyalty_partners_id_seq OWNED BY public.loyalty_partners.id;


--
-- Name: margin_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.margin_rules (
    id integer NOT NULL,
    merchant_id integer NOT NULL,
    brand_id integer,
    category_id integer,
    margin_percentage numeric(5,2) NOT NULL,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_to timestamp with time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.margin_rules OWNER TO neondb_owner;

--
-- Name: margin_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.margin_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.margin_rules_id_seq OWNER TO neondb_owner;

--
-- Name: margin_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.margin_rules_id_seq OWNED BY public.margin_rules.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.media (
    id integer NOT NULL,
    product_id integer NOT NULL,
    src_url text NOT NULL,
    alt_text text,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.media OWNER TO neondb_owner;

--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_id_seq OWNER TO neondb_owner;

--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: merchant_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.merchant_offers (
    id integer NOT NULL,
    merchant_id integer NOT NULL,
    variant_id integer NOT NULL,
    external_product_id text,
    external_variant_id text,
    merchant_sku text,
    metadata_hash text,
    last_synced_at timestamp with time zone,
    currency_code text DEFAULT 'INR'::text NOT NULL,
    cached_price_minor bigint NOT NULL,
    cached_settlement_price_minor bigint NOT NULL,
    current_stock integer DEFAULT 0,
    is_active boolean DEFAULT true,
    offer_status text DEFAULT 'LIVE'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT merchant_offers_offer_status_check CHECK ((offer_status = ANY (ARRAY['LIVE'::text, 'PENDING_REVIEW'::text])))
);


ALTER TABLE public.merchant_offers OWNER TO neondb_owner;

--
-- Name: merchant_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.merchant_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.merchant_offers_id_seq OWNER TO neondb_owner;

--
-- Name: merchant_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.merchant_offers_id_seq OWNED BY public.merchant_offers.id;


--
-- Name: merchants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.merchants (
    id integer NOT NULL,
    name text NOT NULL,
    email text,
    source_type text DEFAULT 'SHOPIFY'::text NOT NULL,
    source_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    shopify_configured boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.merchants OWNER TO neondb_owner;

--
-- Name: merchants_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.merchants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.merchants_id_seq OWNER TO neondb_owner;

--
-- Name: merchants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.merchants_id_seq OWNED BY public.merchants.id;


--
-- Name: offer_price_log; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.offer_price_log (
    id integer NOT NULL,
    offer_id integer,
    currency_code text NOT NULL,
    price_minor bigint NOT NULL,
    settlement_price_minor bigint NOT NULL,
    applied_margin_percentage numeric(5,2) NOT NULL,
    valid_from timestamp with time zone DEFAULT now(),
    valid_to timestamp with time zone
);


ALTER TABLE public.offer_price_log OWNER TO neondb_owner;

--
-- Name: offer_price_log_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.offer_price_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.offer_price_log_id_seq OWNER TO neondb_owner;

--
-- Name: offer_price_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.offer_price_log_id_seq OWNED BY public.offer_price_log.id;


--
-- Name: point_conversion_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.point_conversion_rules (
    id integer NOT NULL,
    partner_id integer NOT NULL,
    currency_code text NOT NULL,
    points_to_currency_rate numeric(10,4) NOT NULL,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_to timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.point_conversion_rules OWNER TO neondb_owner;

--
-- Name: point_conversion_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.point_conversion_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.point_conversion_rules_id_seq OWNER TO neondb_owner;

--
-- Name: point_conversion_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.point_conversion_rules_id_seq OWNED BY public.point_conversion_rules.id;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_categories (
    product_id integer NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.product_categories OWNER TO neondb_owner;

--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    brand_id integer,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    specifications jsonb,
    base_price numeric(12,2) DEFAULT 0 NOT NULL,
    rating numeric(3,1) DEFAULT 0,
    review_count integer DEFAULT 0,
    status text DEFAULT 'ACTIVE'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['DRAFT'::text, 'ACTIVE'::text, 'ARCHIVED'::text])))
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: staging_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.staging_products (
    id integer NOT NULL,
    merchant_id integer NOT NULL,
    external_product_id text,
    raw_title text,
    raw_body_html text,
    raw_vendor text,
    raw_product_type text,
    raw_tags text,
    raw_json_dump jsonb,
    status text DEFAULT 'PENDING'::text,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    suggested_product_id integer,
    match_confidence_score integer DEFAULT 0,
    admin_notes text,
    matched_brand_id integer,
    CONSTRAINT staging_products_status_check CHECK ((status = ANY (ARRAY['PENDING_SYNC'::text, 'PENDING'::text, 'PROCESSING'::text, 'AUTO_MATCHED'::text, 'NEEDS_REVIEW'::text, 'APPROVED'::text, 'REJECTED'::text, 'ARCHIVED'::text])))
);


ALTER TABLE public.staging_products OWNER TO neondb_owner;

--
-- Name: staging_products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.staging_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staging_products_id_seq OWNER TO neondb_owner;

--
-- Name: staging_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.staging_products_id_seq OWNED BY public.staging_products.id;


--
-- Name: staging_variants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.staging_variants (
    id integer NOT NULL,
    staging_product_id integer,
    external_variant_id text,
    raw_sku text,
    raw_barcode text,
    raw_price numeric(10,2),
    raw_options jsonb,
    status text DEFAULT 'PENDING'::text,
    matched_master_variant_id integer,
    created_at timestamp with time zone DEFAULT now(),
    suggested_variant_id integer,
    matched_variant_id integer,
    raw_mpn text,
    CONSTRAINT staging_variants_status_check CHECK ((status = ANY (ARRAY['PENDING_SYNC'::text, 'PENDING'::text, 'AUTO_MATCHED'::text, 'NEEDS_REVIEW'::text, 'APPROVED'::text, 'REJECTED'::text])))
);


ALTER TABLE public.staging_variants OWNER TO neondb_owner;

--
-- Name: staging_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.staging_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staging_variants_id_seq OWNER TO neondb_owner;

--
-- Name: staging_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.staging_variants_id_seq OWNED BY public.staging_variants.id;


--
-- Name: sync_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sync_logs (
    id integer NOT NULL,
    merchant_id integer NOT NULL,
    status text NOT NULL,
    started_at timestamp with time zone NOT NULL,
    finished_at timestamp with time zone,
    records_processed integer DEFAULT 0,
    records_failed integer DEFAULT 0,
    notes text,
    CONSTRAINT sync_logs_status_check CHECK ((status = ANY (ARRAY['SUCCESS'::text, 'FAILED'::text, 'IN_PROGRESS'::text, 'PARTIAL_SUCCESS'::text])))
);


ALTER TABLE public.sync_logs OWNER TO neondb_owner;

--
-- Name: sync_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sync_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_logs_id_seq OWNER TO neondb_owner;

--
-- Name: sync_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sync_logs_id_seq OWNED BY public.sync_logs.id;


--
-- Name: variant_media; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.variant_media (
    variant_id integer NOT NULL,
    media_id integer NOT NULL
);


ALTER TABLE public.variant_media OWNER TO neondb_owner;

--
-- Name: variants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.variants (
    id integer NOT NULL,
    product_id integer NOT NULL,
    internal_sku text NOT NULL,
    gtin text,
    mpn text,
    weight_grams integer,
    attributes jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    normalized_attributes jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.variants OWNER TO neondb_owner;

--
-- Name: variants_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.variants_id_seq OWNER TO neondb_owner;

--
-- Name: variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.variants_id_seq OWNED BY public.variants.id;


--
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: loyalty_partners id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_partners ALTER COLUMN id SET DEFAULT nextval('public.loyalty_partners_id_seq'::regclass);


--
-- Name: margin_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.margin_rules ALTER COLUMN id SET DEFAULT nextval('public.margin_rules_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: merchant_offers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.merchant_offers ALTER COLUMN id SET DEFAULT nextval('public.merchant_offers_id_seq'::regclass);


--
-- Name: merchants id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.merchants ALTER COLUMN id SET DEFAULT nextval('public.merchants_id_seq'::regclass);


--
-- Name: offer_price_log id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_price_log ALTER COLUMN id SET DEFAULT nextval('public.offer_price_log_id_seq'::regclass);


--
-- Name: point_conversion_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.point_conversion_rules ALTER COLUMN id SET DEFAULT nextval('public.point_conversion_rules_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: staging_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staging_products ALTER COLUMN id SET DEFAULT nextval('public.staging_products_id_seq'::regclass);


--
-- Name: staging_variants id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staging_variants ALTER COLUMN id SET DEFAULT nextval('public.staging_variants_id_seq'::regclass);


--
-- Name: sync_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sync_logs ALTER COLUMN id SET DEFAULT nextval('public.sync_logs_id_seq'::regclass);


--
-- Name: variants id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.variants ALTER COLUMN id SET DEFAULT nextval('public.variants_id_seq'::regclass);


--
-- Name: brands brands_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_name_key UNIQUE (name);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: brands brands_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_slug_key UNIQUE (slug);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (code);


--
-- Name: loyalty_partners loyalty_partners_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_partners
    ADD CONSTRAINT loyalty_partners_name_key UNIQUE (name);


--
-- Name: loyalty_partners loyalty_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loyalty_partners
    ADD CONSTRAINT loyalty_partners_pkey PRIMARY KEY (id);


--
-- Name: margin_rules margin_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.margin_rules
    ADD CONSTRAINT margin_rules_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: merchant_offers merchant_offers_merchant_id_variant_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.merchant_offers
    ADD CONSTRAINT merchant_offers_merchant_id_variant_id_key UNIQUE (merchant_id, variant_id);


--
-- Name: merchant_offers merchant_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.merchant_offers
    ADD CONSTRAINT merchant_offers_pkey PRIMARY KEY (id);


--
-- Name: merchants merchants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_pkey PRIMARY KEY (id);


--
-- Name: offer_price_log offer_price_log_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_price_log
    ADD CONSTRAINT offer_price_log_pkey PRIMARY KEY (id);


--
-- Name: point_conversion_rules point_conversion_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.point_conversion_rules
    ADD CONSTRAINT point_conversion_rules_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: staging_products staging_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staging_products
    ADD CONSTRAINT staging_products_pkey PRIMARY KEY (id);


--
-- Name: staging_variants staging_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staging_variants
    ADD CONSTRAINT staging_variants_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- Name: variant_media variant_media_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.variant_media
    ADD CONSTRAINT variant_media_pkey PRIMARY KEY (variant_id, media_id);


--
-- Name: variants variants_internal_sku_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.variants
    ADD CONSTRAINT variants_internal_sku_key UNIQUE (internal_sku);


--
-- Name: variants variants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.variants
    ADD CONSTRAINT variants_pkey PRIMARY KEY (id);


--
-- Name: idx_categories_parent_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_id);


--
-- Name: idx_offers_merchant; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_offers_merchant ON public.merchant_offers USING btree (merchant_id);


--
-- Name: idx_offers_variant; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_offers_variant ON public.merchant_offers USING btree (variant_id);


--
-- Name: idx_product_categories_cat; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_product_categories_cat ON public.product_categories USING btree (category_id);


--
-- Name: idx_products_brand; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_brand ON public.products USING btree (brand_id) WHERE (brand_id IS NOT NULL);


--
-- Name: idx_staging_prod_merchant; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_staging_prod_merchant ON public.staging_products USING btree (merchant_id);


--
-- Name: idx_variants_gtin; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_variants_gtin ON public.variants USING btree (gtin);


--
-- Name: idx_variants_gtin_global; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_variants_gtin_global ON public.variants USING btree (gtin) WHERE ((gtin IS NOT NULL) AND (is_active = true));


--
-- Name: idx_variants_mpn; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_variants_mpn ON public.variants USING btree (mpn) WHERE (mpn IS NOT NULL);


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: margin_rules margin_rules_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.margin_rules
    ADD CONSTRAINT margin_rules_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: margin_rules margin_rules_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.margin_rules
    ADD CONSTRAINT margin_rules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: margin_rules margin_rules_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.margin_rules
    ADD CONSTRAINT margin_rules_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: media media_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: merchant_offers merchant_offers_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.merchant_offers
    ADD CONSTRAINT merchant_offers_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: merchant_offers merchant_offers_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.merchant_offers
    ADD CONSTRAINT merchant_offers_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id) ON DELETE CASCADE;


--
-- Name: offer_price_log offer_price_log_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.offer_price_log
    ADD CONSTRAINT offer_price_log_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.merchant_offers(id) ON DELETE CASCADE;


--
-- Name: point_conversion_rules point_conversion_rules_currency_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.point_conversion_rules
    ADD CONSTRAINT point_conversion_rules_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES public.currencies(code) ON DELETE RESTRICT;


--
-- Name: point_conversion_rules point_conversion_rules_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.point_conversion_rules
    ADD CONSTRAINT point_conversion_rules_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.loyalty_partners(id) ON DELETE CASCADE;


--
-- Name: product_categories product_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: product_categories product_categories_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: staging_products staging_products_matched_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staging_products
    ADD CONSTRAINT staging_products_matched_brand_id_fkey FOREIGN KEY (matched_brand_id) REFERENCES public.brands(id);


--
-- Name: staging_products staging_products_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staging_products
    ADD CONSTRAINT staging_products_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id);


--
-- Name: staging_products staging_products_suggested_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staging_products
    ADD CONSTRAINT staging_products_suggested_product_id_fkey FOREIGN KEY (suggested_product_id) REFERENCES public.products(id);


--
-- Name: staging_variants staging_variants_matched_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staging_variants
    ADD CONSTRAINT staging_variants_matched_variant_id_fkey FOREIGN KEY (matched_variant_id) REFERENCES public.variants(id);


--
-- Name: staging_variants staging_variants_staging_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staging_variants
    ADD CONSTRAINT staging_variants_staging_product_id_fkey FOREIGN KEY (staging_product_id) REFERENCES public.staging_products(id) ON DELETE CASCADE;


--
-- Name: staging_variants staging_variants_suggested_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staging_variants
    ADD CONSTRAINT staging_variants_suggested_variant_id_fkey FOREIGN KEY (suggested_variant_id) REFERENCES public.variants(id);


--
-- Name: sync_logs sync_logs_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- Name: variant_media variant_media_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.variant_media
    ADD CONSTRAINT variant_media_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: variant_media variant_media_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.variant_media
    ADD CONSTRAINT variant_media_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id) ON DELETE CASCADE;


--
-- Name: variants variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.variants
    ADD CONSTRAINT variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict MetYKwvPjJoyawbx33eAo7p5TaD9aLYRFzbltHPkaMgwaGrcqWEgtTwUmaAmId9

