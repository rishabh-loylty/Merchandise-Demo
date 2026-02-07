import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error("Missing DATABASE_URL. Set it in .env or the shell.");
	process.exit(1);
}

const sql = neon(databaseUrl);

const schemaStatements = [
	`CREATE TABLE IF NOT EXISTS currencies (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    minor_units INTEGER NOT NULL,
    symbol TEXT NOT NULL
  )`,
	`CREATE TABLE IF NOT EXISTS loyalty_partners (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    configuration JSONB,
    store_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
	`CREATE TABLE IF NOT EXISTS point_conversion_rules (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES loyalty_partners(id) ON DELETE CASCADE,
    currency_code TEXT NOT NULL REFERENCES currencies(code) ON DELETE RESTRICT,
    points_to_currency_rate NUMERIC(10, 4) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
  )`,
	`CREATE TABLE IF NOT EXISTS merchants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    source_type TEXT NOT NULL DEFAULT 'SHOPIFY',
    source_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    shopify_configured BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
	`CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    path TEXT,
    is_active BOOLEAN DEFAULT TRUE
  )`,
	`CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
	`CREATE TABLE IF NOT EXISTS margin_rules (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    margin_percentage NUMERIC(5, 2) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
  )`,
	`CREATE TABLE IF NOT EXISTS staging_products (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id),
    external_product_id TEXT,
    raw_title TEXT,
    raw_body_html TEXT,
    raw_vendor TEXT,
    raw_product_type TEXT,
    raw_tags TEXT,
    raw_json_dump JSONB,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','AUTO_MATCHED','NEEDS_REVIEW','APPROVED','REJECTED')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
	`CREATE TABLE IF NOT EXISTS staging_variants (
    id SERIAL PRIMARY KEY,
    staging_product_id INTEGER REFERENCES staging_products(id) ON DELETE CASCADE,
    external_variant_id TEXT,
    raw_sku TEXT,
    raw_barcode TEXT,
    raw_price NUMERIC(10, 2),
    raw_options JSONB,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','AUTO_MATCHED','NEEDS_REVIEW','APPROVED','REJECTED')),
    matched_master_variant_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
	`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES brands(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    specifications JSONB,
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    rating NUMERIC(3, 1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('DRAFT','ACTIVE','ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
	`CREATE TABLE IF NOT EXISTS product_categories (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
  )`,
	`CREATE TABLE IF NOT EXISTS variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    internal_sku TEXT NOT NULL UNIQUE,
    gtin TEXT,
    mpn TEXT,
    weight_grams INTEGER,
    attributes JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
	`CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    src_url TEXT NOT NULL,
    alt_text TEXT,
    position INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
	`CREATE TABLE IF NOT EXISTS variant_media (
    variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, media_id)
  )`,
	`CREATE TABLE IF NOT EXISTS merchant_offers (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    external_product_id TEXT,
    external_variant_id TEXT,
    merchant_sku TEXT,
    metadata_hash TEXT,
    last_synced_at TIMESTAMPTZ,
    currency_code TEXT NOT NULL DEFAULT 'INR',
    cached_price_minor BIGINT NOT NULL,
    cached_settlement_price_minor BIGINT NOT NULL,
    current_stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    offer_status TEXT DEFAULT 'LIVE' CHECK(offer_status IN ('LIVE','PENDING_REVIEW')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (merchant_id, variant_id)
  )`,
	`CREATE TABLE IF NOT EXISTS offer_price_log (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER REFERENCES merchant_offers(id) ON DELETE CASCADE,
    currency_code TEXT NOT NULL,
    price_minor BIGINT NOT NULL,
    settlement_price_minor BIGINT NOT NULL,
    applied_margin_percentage NUMERIC(5, 2) NOT NULL,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_to TIMESTAMPTZ
  )`,
	`CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK(status IN ('SUCCESS','FAILED','IN_PROGRESS','PARTIAL_SUCCESS')),
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    notes TEXT
  )`,
	"CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)",
	"CREATE INDEX IF NOT EXISTS idx_staging_prod_merchant ON staging_products(merchant_id)",
	"CREATE INDEX IF NOT EXISTS idx_variants_gtin ON variants(gtin)",
	"CREATE INDEX IF NOT EXISTS idx_offers_merchant ON merchant_offers(merchant_id)",
	"CREATE INDEX IF NOT EXISTS idx_offers_variant ON merchant_offers(variant_id)",
	"CREATE INDEX IF NOT EXISTS idx_product_categories_cat ON product_categories(category_id)",
];

for (const statement of schemaStatements) {
	await sql.query(statement);
}

// Migration: Add store_config column if it doesn't exist
console.log("Running migrations...");
try {
	await sql.query(`
		ALTER TABLE loyalty_partners
		ADD COLUMN IF NOT EXISTS store_config JSONB DEFAULT '{}'::jsonb
	`);
	console.log("✓ store_config column exists or was added");
} catch (err) {
	// Column might already exist, which is fine
	console.log("store_config column check:", err.message);
}

const countRows = await sql.query(
	"SELECT COUNT(*)::int AS cnt FROM currencies",
);
const cnt = countRows[0]?.cnt ?? 0;
if (cnt === 0) {
	await sql.query(`
    INSERT INTO currencies (code, name, minor_units, symbol)
    VALUES
      ('INR', 'Indian Rupee', 2, '₹'),
      ('USD', 'US Dollar', 2, '$')
    ON CONFLICT (code) DO NOTHING
  `);

	// Default store configuration template
	const defaultStoreConfig = {
		theme: {
			colors: {
				primary: "#1e40af",
				primaryForeground: "#ffffff",
				secondary: "#f1f5f9",
				secondaryForeground: "#0f172a",
				accent: "#dbeafe",
				accentForeground: "#1e3a5f",
				background: "#ffffff",
				foreground: "#0f172a",
				muted: "#f1f5f9",
				mutedForeground: "#64748b",
				card: "#ffffff",
				cardForeground: "#0f172a",
				border: "#e2e8f0",
				destructive: "#dc2626",
				success: "#16a34a",
				warning: "#ca8a04",
			},
			typography: {
				fontFamily: "Inter, system-ui, sans-serif",
				headingFontFamily: "Inter, system-ui, sans-serif",
				baseFontSize: "16px",
				headingWeight: "700",
				bodyWeight: "400",
			},
			borderRadius: "0.5rem",
			spacing: {
				containerMaxWidth: "1280px",
				sectionPadding: "3rem",
			},
		},
		branding: {
			storeName: "Rewards Store",
			logo: null,
			logoDark: null,
			favicon: null,
			tagline: "Redeem your points for amazing rewards",
		},
		header: {
			style: "standard",
			sticky: true,
			showSearch: true,
			showPointsBalance: true,
			backgroundColor: null,
			transparent: false,
		},
		footer: {
			style: "standard",
			showSocialLinks: true,
			socialLinks: {
				facebook: null,
				twitter: null,
				instagram: null,
				linkedin: null,
			},
			copyrightText: "© 2025 All rights reserved.",
			quickLinks: [
				{ label: "About Us", url: "/about" },
				{ label: "Contact", url: "/contact" },
				{ label: "Terms & Conditions", url: "/terms" },
				{ label: "Privacy Policy", url: "/privacy" },
			],
			showNewsletter: false,
		},
		homepage: {
			sections: [
				{
					type: "hero",
					enabled: true,
					config: {
						style: "carousel",
						autoRotate: true,
						autoRotateSpeed: 5000,
						showDots: true,
						showArrows: true,
						slides: [
							{
								title: "Redeem Your Rewards",
								subtitle: "Turn your points into premium products",
								image: null,
								ctaText: "Shop Now",
								ctaLink: "/store/search",
								backgroundColor: null,
							},
						],
					},
				},
				{
					type: "categories",
					enabled: true,
					config: {
						title: "Shop by Category",
						subtitle: "Explore our wide range of categories",
						style: "grid",
						showIcons: true,
						maxItems: 6,
					},
				},
				{
					type: "featuredProducts",
					enabled: true,
					config: {
						title: "Featured Products",
						subtitle: "Hand-picked products just for you",
						style: "grid",
						maxItems: 8,
						showViewAll: true,
					},
				},
				{
					type: "promotionalBanner",
					enabled: false,
					config: {
						banners: [],
					},
				},
				{
					type: "brands",
					enabled: true,
					config: {
						title: "Top Brands",
						subtitle: "Shop from your favorite brands",
						style: "carousel",
						maxItems: 10,
					},
				},
				{
					type: "trustBadges",
					enabled: true,
					config: {
						badges: [
							{
								icon: "Shield",
								title: "Secure Redemption",
								description: "100% safe & secure",
							},
							{
								icon: "Truck",
								title: "Fast Delivery",
								description: "Quick shipping",
							},
							{
								icon: "RefreshCw",
								title: "Easy Returns",
								description: "Hassle-free returns",
							},
							{
								icon: "Headphones",
								title: "24/7 Support",
								description: "Always here to help",
							},
						],
					},
				},
				{
					type: "deals",
					enabled: false,
					config: {
						title: "Hot Deals",
						showCountdown: true,
						maxItems: 4,
					},
				},
				{
					type: "newArrivals",
					enabled: true,
					config: {
						title: "New Arrivals",
						subtitle: "Check out the latest additions",
						style: "carousel",
						maxItems: 8,
					},
				},
			],
		},
		productCard: {
			showBrand: true,
			showRating: true,
			showPointsPrice: true,
			showCurrencyPrice: true,
			showQuickView: false,
			showWishlist: false,
			imageAspectRatio: "square",
			hoverEffect: "zoom",
		},
		productListing: {
			defaultView: "grid",
			productsPerRow: 4,
			productsPerPage: 12,
			defaultSort: "featured",
			showFilters: true,
			filterPosition: "left",
		},
		pointsDisplay: {
			showPointsProminent: true,
			pointsLabel: "pts",
			showCurrencyEquivalent: true,
			primaryDisplay: "points",
		},
		components: {
			buttons: {
				borderRadius: "0.5rem",
				style: "solid",
				textTransform: "none",
			},
			cards: {
				borderRadius: "0.75rem",
				shadow: "sm",
				border: true,
				hoverEffect: "lift",
			},
			inputs: {
				borderRadius: "0.5rem",
				style: "outline",
			},
		},
		features: {
			wishlist: false,
			compare: false,
			quickView: false,
			socialSharing: true,
			recentlyViewed: true,
			productReviews: true,
		},
		customCss: "",
		analytics: {
			googleAnalyticsId: null,
			facebookPixelId: null,
		},
	};

	// Bank-specific configurations
	const sbiConfig = {
		...defaultStoreConfig,
		theme: {
			...defaultStoreConfig.theme,
			colors: {
				...defaultStoreConfig.theme.colors,
				primary: "#00457c",
				primaryForeground: "#ffffff",
				accent: "#e6f0f7",
				accentForeground: "#00457c",
			},
		},
		branding: {
			storeName: "SBI Rewardz",
			logo: null,
			tagline: "Redeem your SBI reward points",
		},
		homepage: {
			...defaultStoreConfig.homepage,
			sections: defaultStoreConfig.homepage.sections.map((s) =>
				s.type === "hero"
					? {
							...s,
							config: {
								...s.config,
								slides: [
									{
										title: "Welcome to SBI Rewardz",
										subtitle:
											"Redeem your reward points for exclusive products",
										ctaText: "Start Shopping",
										ctaLink: "/store/search",
									},
								],
							},
						}
					: s,
			),
		},
	};

	const hdfcConfig = {
		...defaultStoreConfig,
		theme: {
			...defaultStoreConfig.theme,
			colors: {
				...defaultStoreConfig.theme.colors,
				primary: "#004c8f",
				primaryForeground: "#ffffff",
				accent: "#e6f2ff",
				accentForeground: "#004c8f",
			},
		},
		branding: {
			storeName: "HDFC SmartBuy",
			logo: null,
			tagline: "Smart rewards for smart customers",
		},
		homepage: {
			...defaultStoreConfig.homepage,
			sections: defaultStoreConfig.homepage.sections.map((s) =>
				s.type === "hero"
					? {
							...s,
							config: {
								...s.config,
								slides: [
									{
										title: "HDFC SmartBuy Rewards",
										subtitle: "Convert your reward points to premium products",
										ctaText: "Explore Now",
										ctaLink: "/store/search",
									},
								],
							},
						}
					: s,
			),
		},
	};

	const axisConfig = {
		...defaultStoreConfig,
		theme: {
			...defaultStoreConfig.theme,
			colors: {
				...defaultStoreConfig.theme.colors,
				primary: "#97144d",
				primaryForeground: "#ffffff",
				accent: "#fce7ef",
				accentForeground: "#97144d",
			},
		},
		branding: {
			storeName: "Axis Edge Rewards",
			logo: null,
			tagline: "Get more from your Axis Bank points",
		},
	};

	const yesConfig = {
		...defaultStoreConfig,
		theme: {
			...defaultStoreConfig.theme,
			colors: {
				...defaultStoreConfig.theme.colors,
				primary: "#132054",
				primaryForeground: "#ffffff",
				accent: "#e8eaf2",
				accentForeground: "#132054",
			},
		},
		branding: {
			storeName: "YES Rewardz",
			logo: null,
			tagline: "YES to amazing rewards",
		},
	};

	const indusindConfig = {
		...defaultStoreConfig,
		theme: {
			...defaultStoreConfig.theme,
			colors: {
				...defaultStoreConfig.theme.colors,
				primary: "#00529b",
				primaryForeground: "#ffffff",
				accent: "#e6f0f8",
				accentForeground: "#00529b",
			},
		},
		branding: {
			storeName: "IndusInd Rewards",
			logo: null,
			tagline: "Unlock exclusive rewards with IndusInd",
		},
	};

	await sql.query(
		`
    INSERT INTO loyalty_partners (id, name, is_active, configuration, store_config)
    VALUES
      (1, 'SBI', true, '{"brand_color":"#00457c"}'::jsonb, $1::jsonb),
      (2, 'HDFC Bank', true, '{"brand_color":"#004c8f"}'::jsonb, $2::jsonb),
      (3, 'Axis Bank', true, '{"brand_color":"#97144d"}'::jsonb, $3::jsonb),
      (4, 'Yes Bank', true, '{"brand_color":"#132054"}'::jsonb, $4::jsonb),
      (5, 'IndusInd Bank', true, '{"brand_color":"#00529b"}'::jsonb, $5::jsonb)
    ON CONFLICT (id) DO UPDATE SET store_config = EXCLUDED.store_config
  `,
		[
			JSON.stringify(sbiConfig),
			JSON.stringify(hdfcConfig),
			JSON.stringify(axisConfig),
			JSON.stringify(yesConfig),
			JSON.stringify(indusindConfig),
		],
	);

	await sql.query(`
    INSERT INTO point_conversion_rules (id, partner_id, currency_code, points_to_currency_rate, is_active)
    VALUES
      (1, 1, 'INR', 0.25, true),
      (2, 2, 'INR', 0.5, true),
      (3, 3, 'INR', 0.35, true),
      (4, 4, 'INR', 0.3, true),
      (5, 5, 'INR', 0.28, true)
    ON CONFLICT (id) DO NOTHING
  `);

	await sql.query(`
    INSERT INTO merchants (id, name, email, source_type, source_config, shopify_configured)
    VALUES
      (1, 'Seller A', 'seller.a@example.com', 'SHOPIFY', '{"store_url":"seller-a.myshopify.com"}'::jsonb, true),
      (2, 'Seller B', 'seller.b@example.com', 'SHOPIFY', '{}'::jsonb, false)
    ON CONFLICT (id) DO NOTHING
  `);

	await sql.query(`
    INSERT INTO categories (id, parent_id, name, slug, icon, path, is_active)
    VALUES
      (1, NULL, 'Kitchen', 'kitchen', 'ChefHat', 'Kitchen', true),
      (2, NULL, 'Electronics', 'electronics', 'Smartphone', 'Electronics', true),
      (3, NULL, 'Fashion', 'fashion', 'Shirt', 'Fashion', true),
      (4, NULL, 'Home & Living', 'home', 'Sofa', 'Home & Living', true),
      (5, NULL, 'Fitness', 'fitness', 'Dumbbell', 'Fitness', true),
      (6, NULL, 'Books', 'books', 'BookOpen', 'Books', true),
      (7, 1, 'Cookware', 'cookware', NULL, 'Kitchen > Cookware', true),
      (8, 1, 'Appliances', 'appliances', NULL, 'Kitchen > Appliances', true),
      (9, 1, 'Storage', 'storage', NULL, 'Kitchen > Storage', true),
      (10, 2, 'Smartphones', 'smartphones', NULL, 'Electronics > Smartphones', true),
      (11, 2, 'Audio', 'audio', NULL, 'Electronics > Audio', true),
      (12, 2, 'Laptops', 'laptops', NULL, 'Electronics > Laptops', true),
      (13, 3, 'Men''s Wear', 'mens', NULL, 'Fashion > Men''s Wear', true),
      (14, 3, 'Women''s Wear', 'womens', NULL, 'Fashion > Women''s Wear', true),
      (15, 3, 'Footwear', 'footwear', NULL, 'Fashion > Footwear', true),
      (16, 4, 'Furniture', 'furniture', NULL, 'Home & Living > Furniture', true),
      (17, 4, 'Decor', 'decor', NULL, 'Home & Living > Decor', true),
      (18, 5, 'Equipment', 'equipment', NULL, 'Fitness > Equipment', true),
      (19, 5, 'Accessories', 'accessories', NULL, 'Fitness > Accessories', true)
    ON CONFLICT (id) DO NOTHING
  `);

	await sql.query(`
    INSERT INTO brands (id, name, slug)
    VALUES
      (1, 'Prestige', 'prestige'),
      (2, 'Samsung', 'samsung'),
      (3, 'Nike', 'nike'),
      (4, 'Adidas', 'adidas'),
      (5, 'Philips', 'philips'),
      (6, 'Bosch', 'bosch'),
      (7, 'Sony', 'sony'),
      (8, 'LG', 'lg'),
      (9, 'Puma', 'puma'),
      (10, 'Reebok', 'reebok')
    ON CONFLICT (id) DO NOTHING
  `);

	await sql.query(`
    INSERT INTO products (id, brand_id, title, slug, description, image_url, base_price, rating, review_count, status)
    VALUES
      (1, 1, 'Prestige Svachh Pressure Cooker 5L', 'prestige-svachh-pressure-cooker-5l',
       'The Prestige Svachh pressure cooker comes with a unique spillage control system that controls spillage from the lid. It features a deep lid for a better grip, a metallic safety plug, and a controlled gasket release system.',
       'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop',
       2499, 4.5, 1203, 'ACTIVE'),
      (2, 2, 'Samsung Galaxy Buds Pro', 'samsung-galaxy-buds-pro',
       'Intelligent Active Noise Cancelling with enhanced ambient sound. 360 Audio with Dolby Head Tracking. IPX7 water resistant for workouts.',
       'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop',
       4999, 4.3, 876, 'ACTIVE'),
      (3, 3, 'Nike Air Max 270', 'nike-air-max-270',
       'The Nike Air Max 270 delivers visible cushioning under every step. Updated for modern comfort, it nods to the original, 1991 Air Max 180 with its exaggerated tongue top and heritage tongue logo.',
       'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
       7999, 4.7, 2341, 'ACTIVE'),
      (4, 5, 'Philips Air Fryer HD9200', 'philips-air-fryer-hd9200',
       'Fry, bake, grill, roast, and even reheat with this amazing air fryer. Rapid Air Technology for healthier frying with up to 90% less fat.',
       'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop',
       5499, 4.4, 654, 'ACTIVE'),
      (5, 7, 'Sony WH-1000XM5 Headphones', 'sony-wh-1000xm5-headphones',
       'Industry-leading noise cancellation. Exceptional sound quality with 30-hour battery life. Ultra-comfortable and lightweight design.',
       'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
       19999, 4.8, 3120, 'ACTIVE'),
      (6, 4, 'Adidas Ultraboost 22', 'adidas-ultraboost-22',
       'Responsive Boost midsole cushioning delivers incredible energy return. Primeknit+ upper adapts to your foot, while a Linear Energy Push system propels you forward.',
       'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop',
       11999, 4.6, 1876, 'ACTIVE'),
      (7, 6, 'Bosch 7kg Washing Machine', 'bosch-7kg-washing-machine',
       'Anti-tangle feature, ExpressWash, and VarioDrum design for gentle fabric care. Energy efficient with A+++ rating.',
       'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=400&fit=crop',
       24999, 4.2, 432, 'ACTIVE'),
      (8, 8, 'LG 55-inch OLED TV', 'lg-55-inch-oled-tv',
       'Self-lit OLED pixels create perfect blacks and infinite contrast. Dolby Vision IQ and Dolby Atmos for an incredible viewing experience.',
       'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop',
       89999, 4.9, 567, 'ACTIVE'),
      (9, 9, 'Puma RS-X Reinvention', 'puma-rs-x-reinvention',
       'Bold colour combinations and unexpected material mixes. RS technology with new cushioning and support for exceptional comfort.',
       'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&h=400&fit=crop',
       6499, 4.1, 234, 'ACTIVE'),
      (10, 1, 'Prestige Iris Plus Mixer Grinder', 'prestige-iris-plus-mixer-grinder',
       '750-watt motor with 4 stainless steel jars. Powerful blending and grinding for all your kitchen needs.',
       'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop',
       3299, 4.0, 890, 'ACTIVE'),
      (11, 2, 'Samsung 256GB SSD', 'samsung-256gb-ssd',
       'Blazing fast read/write speeds up to 560/530 MB/s. V-NAND technology for reliability and performance.',
       'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop',
       2999, 4.6, 1567, 'ACTIVE'),
      (12, 10, 'Reebok Classic Leather', 'reebok-classic-leather',
       'A timeless classic with clean lines and premium leather upper. Soft garment leather and padded foam sockliner for comfort.',
       'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop',
       5499, 4.3, 678, 'ACTIVE')
    ON CONFLICT (id) DO NOTHING
  `);

	await sql.query(`
    INSERT INTO product_categories (product_id, category_id)
    VALUES
      (1, 1), (2, 2), (3, 3), (4, 1), (5, 2), (6, 3),
      (7, 4), (8, 2), (9, 3), (10, 1), (11, 2), (12, 3)
    ON CONFLICT (product_id, category_id) DO NOTHING
  `);

	await sql.query(`
    INSERT INTO variants (id, product_id, internal_sku, is_active)
    VALUES
      (1, 1, 'PRE-SC-5L', true),
      (2, 2, 'SAM-GBP-01', true),
      (3, 3, 'NIK-AM270', true),
      (4, 4, 'PHI-AF-HD9200', true),
      (5, 5, 'SON-WH1000XM5', true),
      (6, 6, 'ADI-UB22', true),
      (7, 7, 'BOS-WM-7KG', true),
      (8, 8, 'LG-OLED55', true),
      (9, 9, 'PUM-RSX', true),
      (10, 10, 'PRE-IRIS-750', true),
      (11, 11, 'SAM-SSD-256', true),
      (12, 12, 'REE-CL-LTH', true)
    ON CONFLICT (id) DO NOTHING
  `);

	await sql.query(`
    INSERT INTO variants (id, product_id, internal_sku, attributes, is_active)
    VALUES
      (13, 1, 'PRE-SC-3L', '{"Size":"3L"}'::jsonb, true),
      (14, 1, 'PRE-SC-5L-GOLD', '{"Size":"5L","Finish":"Gold"}'::jsonb, true),
      (15, 2, 'SAM-GBP-01-WHT', '{"Color":"White"}'::jsonb, true),
      (16, 3, 'NIK-AM270-BLK-42', '{"Color":"Black","Size":"42"}'::jsonb, true)
    ON CONFLICT (id) DO NOTHING
  `);

	await sql.query(`
    INSERT INTO merchant_offers (
      id, merchant_id, variant_id, currency_code,
      cached_price_minor, cached_settlement_price_minor,
      current_stock, offer_status, merchant_sku
    )
    VALUES
      (1, 1, 1, 'INR', 249900, 237405, 50, 'LIVE', 'PRE-SC-5L'),
      (13, 2, 1, 'INR', 254900, 242155, 35, 'LIVE', 'PRE-SC-5L-B'),
      (2, 1, 2, 'INR', 499900, 474905, 100, 'LIVE', 'SAM-GBP-01'),
      (3, 1, 3, 'INR', 799900, 759905, 75, 'LIVE', 'NIK-AM270'),
      (4, 2, 4, 'INR', 549900, 522405, 40, 'LIVE', 'PHI-AF-HD9200'),
      (5, 2, 5, 'INR', 1999900, 1899905, 30, 'LIVE', 'SON-WH1000XM5'),
      (6, 2, 6, 'INR', 1199900, 1139905, 60, 'LIVE', 'ADI-UB22'),
      (7, 1, 7, 'INR', 2499900, 2374905, 20, 'LIVE', 'BOS-WM-7KG'),
      (8, 2, 8, 'INR', 8999900, 8549905, 15, 'LIVE', 'LG-OLED55'),
      (9, 1, 9, 'INR', 649900, 617405, 80, 'LIVE', 'PUM-RSX'),
      (10, 1, 10, 'INR', 329900, 313405, 45, 'PENDING_REVIEW', 'PRE-IRIS-750'),
      (11, 2, 11, 'INR', 299900, 284905, 200, 'PENDING_REVIEW', 'SAM-SSD-256'),
      (12, 2, 12, 'INR', 549900, 522405, 55, 'PENDING_REVIEW', 'REE-CL-LTH')
    ON CONFLICT (id) DO NOTHING
  `);

	await sql.query(`
    INSERT INTO staging_products (id, merchant_id, external_product_id, raw_title, raw_vendor, raw_product_type, status)
    VALUES
      (1, 1, 'shopify-prod-10', 'Prestige Iris Plus Mixer Grinder 750W', 'Prestiege Inc', 'Kitchen', 'NEEDS_REVIEW'),
      (2, 2, 'shopify-prod-11', 'Samsung 256GB SSD Drive', 'Samsung Electronics', 'Electronics', 'NEEDS_REVIEW'),
      (3, 2, 'shopify-prod-12', 'Reebok Classic Leather Shoes', 'Reebok International', 'Fashion', 'NEEDS_REVIEW')
    ON CONFLICT (id) DO NOTHING
  `);
}

const tablesWithId = [
	"loyalty_partners",
	"point_conversion_rules",
	"merchants",
	"categories",
	"brands",
	"margin_rules",
	"staging_products",
	"staging_variants",
	"products",
	"variants",
	"media",
	"merchant_offers",
	"offer_price_log",
	"sync_logs",
];

for (const table of tablesWithId) {
	await sql.query(`
    SELECT CASE
      WHEN (SELECT MAX(id) FROM ${table}) IS NULL THEN
        setval(pg_get_serial_sequence('${table}', 'id'), 1, false)
      ELSE
        setval(pg_get_serial_sequence('${table}', 'id'), (SELECT MAX(id) FROM ${table}), true)
    END
  `);
}

console.log("Neon seed complete.");
