import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "rewardify.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure the data directory exists
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    // Initialize tables if they don't exist
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    -- Currencies
    CREATE TABLE IF NOT EXISTS currencies (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      minor_units INTEGER NOT NULL,
      symbol TEXT NOT NULL
    );

    -- Loyalty Partners (Banks)
    CREATE TABLE IF NOT EXISTS loyalty_partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1 NOT NULL,
      configuration TEXT, -- JSON
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Point Conversion Rules
    CREATE TABLE IF NOT EXISTS point_conversion_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id INTEGER NOT NULL REFERENCES loyalty_partners(id) ON DELETE CASCADE,
      currency_code TEXT NOT NULL REFERENCES currencies(code) ON DELETE RESTRICT,
      points_to_currency_rate REAL NOT NULL,
      valid_from TEXT NOT NULL DEFAULT (datetime('now')),
      valid_to TEXT,
      is_active INTEGER DEFAULT 1 NOT NULL
    );

    -- Merchants
    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      source_type TEXT NOT NULL DEFAULT 'SHOPIFY',
      source_config TEXT NOT NULL DEFAULT '{}', -- JSON
      is_active INTEGER DEFAULT 1 NOT NULL,
      shopify_configured INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Categories (Hierarchical)
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT,
      path TEXT,
      is_active INTEGER DEFAULT 1
    );

    -- Brands
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Margin Rules
    CREATE TABLE IF NOT EXISTS margin_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      margin_percentage REAL NOT NULL,
      valid_from TEXT NOT NULL DEFAULT (datetime('now')),
      valid_to TEXT,
      is_active INTEGER DEFAULT 1
    );

    -- Staging Products
    CREATE TABLE IF NOT EXISTS staging_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL REFERENCES merchants(id),
      external_product_id TEXT,
      raw_title TEXT,
      raw_body_html TEXT,
      raw_vendor TEXT,
      raw_product_type TEXT,
      raw_tags TEXT,
      raw_json_dump TEXT, -- JSON
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','AUTO_MATCHED','NEEDS_REVIEW','APPROVED','REJECTED')),
      rejection_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Staging Variants
    CREATE TABLE IF NOT EXISTS staging_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staging_product_id INTEGER REFERENCES staging_products(id) ON DELETE CASCADE,
      external_variant_id TEXT,
      raw_sku TEXT,
      raw_barcode TEXT,
      raw_price REAL,
      raw_options TEXT, -- JSON
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','AUTO_MATCHED','NEEDS_REVIEW','APPROVED','REJECTED')),
      matched_master_variant_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Master Catalog Products
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER REFERENCES brands(id),
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image_url TEXT,
      specifications TEXT, -- JSON
      base_price REAL NOT NULL DEFAULT 0,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('DRAFT','ACTIVE','ARCHIVED')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Product Categories (many-to-many)
    CREATE TABLE IF NOT EXISTS product_categories (
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, category_id)
    );

    -- Variants
    CREATE TABLE IF NOT EXISTS variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      internal_sku TEXT NOT NULL UNIQUE,
      gtin TEXT,
      mpn TEXT,
      weight_grams INTEGER,
      attributes TEXT, -- JSON
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Media
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      src_url TEXT NOT NULL,
      alt_text TEXT,
      position INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Variant Media
    CREATE TABLE IF NOT EXISTS variant_media (
      variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
      media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      PRIMARY KEY (variant_id, media_id)
    );

    -- Merchant Offers (marketplace layer)
    CREATE TABLE IF NOT EXISTS merchant_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
      external_product_id TEXT,
      external_variant_id TEXT,
      merchant_sku TEXT,
      metadata_hash TEXT,
      last_synced_at TEXT,
      currency_code TEXT NOT NULL DEFAULT 'INR',
      cached_price_minor INTEGER NOT NULL,
      cached_settlement_price_minor INTEGER NOT NULL,
      current_stock INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      offer_status TEXT DEFAULT 'LIVE' CHECK(offer_status IN ('LIVE','PENDING_REVIEW')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE (merchant_id, variant_id)
    );

    -- Offer Price Log
    CREATE TABLE IF NOT EXISTS offer_price_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER REFERENCES merchant_offers(id) ON DELETE CASCADE,
      currency_code TEXT NOT NULL,
      price_minor INTEGER NOT NULL,
      settlement_price_minor INTEGER NOT NULL,
      applied_margin_percentage REAL NOT NULL,
      valid_from TEXT DEFAULT (datetime('now')),
      valid_to TEXT
    );

    -- Sync Logs
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('SUCCESS','FAILED','IN_PROGRESS','PARTIAL_SUCCESS')),
      started_at TEXT NOT NULL,
      finished_at TEXT,
      records_processed INTEGER DEFAULT 0,
      records_failed INTEGER DEFAULT 0,
      notes TEXT
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
    CREATE INDEX IF NOT EXISTS idx_staging_prod_merchant ON staging_products(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_variants_gtin ON variants(gtin);
    CREATE INDEX IF NOT EXISTS idx_offers_merchant ON merchant_offers(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_offers_variant ON merchant_offers(variant_id);
    CREATE INDEX IF NOT EXISTS idx_product_categories_cat ON product_categories(category_id);
  `);

  // Seed if empty
  const count = db.prepare("SELECT COUNT(*) as cnt FROM currencies").get() as { cnt: number };
  if (count.cnt === 0) {
    seedDb(db);
  }
}

function seedDb(db: Database.Database) {
  const insertCurrency = db.prepare("INSERT INTO currencies (code, name, minor_units, symbol) VALUES (?, ?, ?, ?)");
  const insertPartner = db.prepare("INSERT INTO loyalty_partners (name, is_active, configuration) VALUES (?, ?, ?)");
  const insertRule = db.prepare("INSERT INTO point_conversion_rules (partner_id, currency_code, points_to_currency_rate, is_active) VALUES (?, ?, ?, 1)");
  const insertMerchant = db.prepare("INSERT INTO merchants (name, email, source_type, source_config, shopify_configured) VALUES (?, ?, ?, ?, ?)");
  const insertCategory = db.prepare("INSERT INTO categories (parent_id, name, slug, icon, path) VALUES (?, ?, ?, ?, ?)");
  const insertBrand = db.prepare("INSERT INTO brands (name, slug) VALUES (?, ?)");
  const insertProduct = db.prepare("INSERT INTO products (brand_id, title, slug, description, image_url, base_price, rating, review_count, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const insertProductCategory = db.prepare("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)");
  const insertVariant = db.prepare("INSERT INTO variants (product_id, internal_sku, is_active) VALUES (?, ?, 1)");
  const insertOffer = db.prepare("INSERT INTO merchant_offers (merchant_id, variant_id, currency_code, cached_price_minor, cached_settlement_price_minor, current_stock, offer_status, merchant_sku) VALUES (?, ?, 'INR', ?, ?, ?, ?, ?)");

  const seed = db.transaction(() => {
    // Currencies
    insertCurrency.run("INR", "Indian Rupee", 2, "₹");
    insertCurrency.run("USD", "US Dollar", 2, "$");

    // Loyalty Partners (Banks)
    insertPartner.run("SBI", 1, JSON.stringify({ brand_color: "#00457c" }));     // id=1
    insertPartner.run("HDFC", 1, JSON.stringify({ brand_color: "#004c8f" }));    // id=2
    insertPartner.run("Axis", 1, JSON.stringify({ brand_color: "#97144d" }));    // id=3

    // Point Conversion Rules
    insertRule.run(1, "INR", 0.25);  // SBI: 1pt = 0.25 INR
    insertRule.run(2, "INR", 0.50);  // HDFC: 1pt = 0.50 INR
    insertRule.run(3, "INR", 0.35);  // Axis: 1pt = 0.35 INR

    // Merchants
    insertMerchant.run("Seller A", "seller.a@example.com", "SHOPIFY", JSON.stringify({ store_url: "seller-a.myshopify.com" }), 1); // id=1
    insertMerchant.run("Seller B", "seller.b@example.com", "SHOPIFY", "{}", 0); // id=2

    // Categories - Top Level
    insertCategory.run(null, "Kitchen", "kitchen", "ChefHat", "Kitchen");           // id=1
    insertCategory.run(null, "Electronics", "electronics", "Smartphone", "Electronics"); // id=2
    insertCategory.run(null, "Fashion", "fashion", "Shirt", "Fashion");             // id=3
    insertCategory.run(null, "Home & Living", "home", "Sofa", "Home & Living");     // id=4
    insertCategory.run(null, "Fitness", "fitness", "Dumbbell", "Fitness");           // id=5
    insertCategory.run(null, "Books", "books", "BookOpen", "Books");                 // id=6

    // Sub-categories
    insertCategory.run(1, "Cookware", "cookware", null, "Kitchen > Cookware");       // id=7
    insertCategory.run(1, "Appliances", "appliances", null, "Kitchen > Appliances"); // id=8
    insertCategory.run(1, "Storage", "storage", null, "Kitchen > Storage");           // id=9
    insertCategory.run(2, "Smartphones", "smartphones", null, "Electronics > Smartphones"); // id=10
    insertCategory.run(2, "Audio", "audio", null, "Electronics > Audio");             // id=11
    insertCategory.run(2, "Laptops", "laptops", null, "Electronics > Laptops");       // id=12
    insertCategory.run(3, "Men's Wear", "mens", null, "Fashion > Men's Wear");       // id=13
    insertCategory.run(3, "Women's Wear", "womens", null, "Fashion > Women's Wear"); // id=14
    insertCategory.run(3, "Footwear", "footwear", null, "Fashion > Footwear");       // id=15
    insertCategory.run(4, "Furniture", "furniture", null, "Home & Living > Furniture"); // id=16
    insertCategory.run(4, "Decor", "decor", null, "Home & Living > Decor");           // id=17
    insertCategory.run(5, "Equipment", "equipment", null, "Fitness > Equipment");     // id=18
    insertCategory.run(5, "Accessories", "accessories", null, "Fitness > Accessories"); // id=19

    // Brands
    insertBrand.run("Prestige", "prestige");   // id=1
    insertBrand.run("Samsung", "samsung");     // id=2
    insertBrand.run("Nike", "nike");           // id=3
    insertBrand.run("Adidas", "adidas");       // id=4
    insertBrand.run("Philips", "philips");     // id=5
    insertBrand.run("Bosch", "bosch");         // id=6
    insertBrand.run("Sony", "sony");           // id=7
    insertBrand.run("LG", "lg");               // id=8
    insertBrand.run("Puma", "puma");           // id=9
    insertBrand.run("Reebok", "reebok");       // id=10

    // Products (Master Catalog)
    // 1. Prestige Svachh Pressure Cooker 5L
    insertProduct.run(1, "Prestige Svachh Pressure Cooker 5L", "prestige-svachh-pressure-cooker-5l",
      "The Prestige Svachh pressure cooker comes with a unique spillage control system that controls spillage from the lid. It features a deep lid for a better grip, a metallic safety plug, and a controlled gasket release system.",
      "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop",
      2499, 4.5, 1203, "ACTIVE"); // id=1
    insertProductCategory.run(1, 1); // kitchen

    // 2. Samsung Galaxy Buds Pro
    insertProduct.run(2, "Samsung Galaxy Buds Pro", "samsung-galaxy-buds-pro",
      "Intelligent Active Noise Cancelling with enhanced ambient sound. 360 Audio with Dolby Head Tracking. IPX7 water resistant for workouts.",
      "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop",
      4999, 4.3, 876, "ACTIVE"); // id=2
    insertProductCategory.run(2, 2); // electronics

    // 3. Nike Air Max 270
    insertProduct.run(3, "Nike Air Max 270", "nike-air-max-270",
      "The Nike Air Max 270 delivers visible cushioning under every step. Updated for modern comfort, it nods to the original, 1991 Air Max 180 with its exaggerated tongue top and heritage tongue logo.",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
      7999, 4.7, 2341, "ACTIVE"); // id=3
    insertProductCategory.run(3, 3); // fashion

    // 4. Philips Air Fryer HD9200
    insertProduct.run(5, "Philips Air Fryer HD9200", "philips-air-fryer-hd9200",
      "Fry, bake, grill, roast, and even reheat with this amazing air fryer. Rapid Air Technology for healthier frying with up to 90% less fat.",
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop",
      5499, 4.4, 654, "ACTIVE"); // id=4
    insertProductCategory.run(4, 1); // kitchen

    // 5. Sony WH-1000XM5 Headphones
    insertProduct.run(7, "Sony WH-1000XM5 Headphones", "sony-wh-1000xm5-headphones",
      "Industry-leading noise cancellation. Exceptional sound quality with 30-hour battery life. Ultra-comfortable and lightweight design.",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      19999, 4.8, 3120, "ACTIVE"); // id=5
    insertProductCategory.run(5, 2); // electronics

    // 6. Adidas Ultraboost 22
    insertProduct.run(4, "Adidas Ultraboost 22", "adidas-ultraboost-22",
      "Responsive Boost midsole cushioning delivers incredible energy return. Primeknit+ upper adapts to your foot, while a Linear Energy Push system propels you forward.",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop",
      11999, 4.6, 1876, "ACTIVE"); // id=6
    insertProductCategory.run(6, 3); // fashion

    // 7. Bosch 7kg Washing Machine
    insertProduct.run(6, "Bosch 7kg Washing Machine", "bosch-7kg-washing-machine",
      "Anti-tangle feature, ExpressWash, and VarioDrum design for gentle fabric care. Energy efficient with A+++ rating.",
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=400&fit=crop",
      24999, 4.2, 432, "ACTIVE"); // id=7
    insertProductCategory.run(7, 4); // home

    // 8. LG 55-inch OLED TV
    insertProduct.run(8, "LG 55-inch OLED TV", "lg-55-inch-oled-tv",
      "Self-lit OLED pixels create perfect blacks and infinite contrast. Dolby Vision IQ and Dolby Atmos for an incredible viewing experience.",
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
      89999, 4.9, 567, "ACTIVE"); // id=8
    insertProductCategory.run(8, 2); // electronics

    // 9. Puma RS-X Reinvention
    insertProduct.run(9, "Puma RS-X Reinvention", "puma-rs-x-reinvention",
      "Bold colour combinations and unexpected material mixes. RS technology with new cushioning and support for exceptional comfort.",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&h=400&fit=crop",
      6499, 4.1, 234, "ACTIVE"); // id=9
    insertProductCategory.run(9, 3); // fashion

    // 10. Prestige Iris Plus Mixer Grinder (PENDING)
    insertProduct.run(1, "Prestige Iris Plus Mixer Grinder", "prestige-iris-plus-mixer-grinder",
      "750-watt motor with 4 stainless steel jars. Powerful blending and grinding for all your kitchen needs.",
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop",
      3299, 4.0, 890, "ACTIVE"); // id=10
    insertProductCategory.run(10, 1); // kitchen

    // 11. Samsung 256GB SSD (PENDING)
    insertProduct.run(2, "Samsung 256GB SSD", "samsung-256gb-ssd",
      "Blazing fast read/write speeds up to 560/530 MB/s. V-NAND technology for reliability and performance.",
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop",
      2999, 4.6, 1567, "ACTIVE"); // id=11
    insertProductCategory.run(11, 2); // electronics

    // 12. Reebok Classic Leather (PENDING)
    insertProduct.run(10, "Reebok Classic Leather", "reebok-classic-leather",
      "A timeless classic with clean lines and premium leather upper. Soft garment leather and padded foam sockliner for comfort.",
      "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop",
      5499, 4.3, 678, "ACTIVE"); // id=12
    insertProductCategory.run(12, 3); // fashion

    // Variants (one per product for simplicity)
    insertVariant.run(1, "PRE-SC-5L");    // v_id=1
    insertVariant.run(2, "SAM-GBP-01");   // v_id=2
    insertVariant.run(3, "NIK-AM270");    // v_id=3
    insertVariant.run(4, "PHI-AF-HD9200"); // v_id=4
    insertVariant.run(5, "SON-WH1000XM5"); // v_id=5
    insertVariant.run(6, "ADI-UB22");     // v_id=6
    insertVariant.run(7, "BOS-WM-7KG");  // v_id=7
    insertVariant.run(8, "LG-OLED55");   // v_id=8
    insertVariant.run(9, "PUM-RSX");     // v_id=9
    insertVariant.run(10, "PRE-IRIS-750"); // v_id=10
    insertVariant.run(11, "SAM-SSD-256"); // v_id=11
    insertVariant.run(12, "REE-CL-LTH"); // v_id=12

    // Merchant Offers
    // Products 1-3, 7, 9 belong to merchant-1 (Seller A, id=1)
    // Products 4-6, 8 belong to merchant-2 (Seller B, id=2)
    // Products 10-12 are PENDING_REVIEW

    // LIVE offers
    insertOffer.run(1, 1, "INR", 249900, 237405, 50, "LIVE", "PRE-SC-5L");        // prod 1
    insertOffer.run(1, 2, "INR", 499900, 474905, 100, "LIVE", "SAM-GBP-01");      // prod 2
    insertOffer.run(1, 3, "INR", 799900, 759905, 75, "LIVE", "NIK-AM270");        // prod 3
    insertOffer.run(2, 4, "INR", 549900, 522405, 40, "LIVE", "PHI-AF-HD9200");    // prod 4
    insertOffer.run(2, 5, "INR", 1999900, 1899905, 30, "LIVE", "SON-WH1000XM5"); // prod 5
    insertOffer.run(2, 6, "INR", 1199900, 1139905, 60, "LIVE", "ADI-UB22");      // prod 6
    insertOffer.run(1, 7, "INR", 2499900, 2374905, 20, "LIVE", "BOS-WM-7KG");    // prod 7
    insertOffer.run(2, 8, "INR", 8999900, 8549905, 15, "LIVE", "LG-OLED55");     // prod 8
    insertOffer.run(1, 9, "INR", 649900, 617405, 80, "LIVE", "PUM-RSX");          // prod 9

    // PENDING_REVIEW offers
    insertOffer.run(1, 10, "INR", 329900, 313405, 45, "PENDING_REVIEW", "PRE-IRIS-750"); // prod 10
    insertOffer.run(2, 11, "INR", 299900, 284905, 200, "PENDING_REVIEW", "SAM-SSD-256"); // prod 11
    insertOffer.run(2, 12, "INR", 549900, 522405, 55, "PENDING_REVIEW", "REE-CL-LTH");  // prod 12

    // Staging products for pending items
    const insertStaging = db.prepare("INSERT INTO staging_products (merchant_id, external_product_id, raw_title, raw_vendor, raw_product_type, status) VALUES (?, ?, ?, ?, ?, ?)");
    insertStaging.run(1, "shopify-prod-10", "Prestige Iris Plus Mixer Grinder 750W", "Prestiege Inc", "Kitchen", "NEEDS_REVIEW"); // id=1
    insertStaging.run(2, "shopify-prod-11", "Samsung 256GB SSD Drive", "Samsung Electronics", "Electronics", "NEEDS_REVIEW");       // id=2
    insertStaging.run(2, "shopify-prod-12", "Reebok Classic Leather Shoes", "Reebok International", "Fashion", "NEEDS_REVIEW");     // id=3
  });

  seed();
}
