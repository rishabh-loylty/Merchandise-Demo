/**
 * Migration: Improved Matching System v2
 * - Add MPN (Manufacturer Part Number) to variants
 * - Add normalized_attributes JSONB to variants for consistent matching
 * - Create index for global GTIN lookups
 * - Add matched_variant_id to staging_variants for tracking
 * 
 * Run: node --env-file .env scripts/migrate-matching-v2.mjs
 */

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL. Set it in .env or the shell.");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function run(statement, description) {
  try {
    await sql.query(statement);
    console.log("✓", description);
  } catch (err) {
    console.warn("⚠", description, "—", err.message);
  }
}

async function main() {
  console.log("Running matching v2 schema migration...\n");

  // 1. Add MPN to variants (already exists per schema, but ensure index)
  await run(
    `CREATE INDEX IF NOT EXISTS idx_variants_mpn ON variants(mpn) WHERE mpn IS NOT NULL`,
    "Index on variants.mpn"
  );

  // 2. Add global GTIN index (ensure it exists and is efficient)
  await run(
    `CREATE INDEX IF NOT EXISTS idx_variants_gtin_global ON variants(gtin) WHERE gtin IS NOT NULL AND is_active = true`,
    "Global index on variants.gtin"
  );

  // 3. Add normalized_attributes to variants for consistent matching
  await run(
    `ALTER TABLE variants ADD COLUMN IF NOT EXISTS normalized_attributes jsonb DEFAULT '{}'::jsonb`,
    "variants.normalized_attributes column"
  );

  // 4. Add matched_variant_id to staging_variants to track which master variant was matched
  await run(
    `ALTER TABLE staging_variants ADD COLUMN IF NOT EXISTS matched_variant_id integer REFERENCES variants(id)`,
    "staging_variants.matched_variant_id column"
  );

  // 5. Add raw_mpn to staging_variants for MPN extraction during sync
  await run(
    `ALTER TABLE staging_variants ADD COLUMN IF NOT EXISTS raw_mpn text`,
    "staging_variants.raw_mpn column"
  );

  // 6. Create composite index for brand + MPN matching on products
  await run(
    `CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id) WHERE brand_id IS NOT NULL`,
    "Index on products.brand_id"
  );

  // 7. Add brand matching support - raw_brand to staging_products
  await run(
    `ALTER TABLE staging_products ADD COLUMN IF NOT EXISTS matched_brand_id integer REFERENCES brands(id)`,
    "staging_products.matched_brand_id column"
  );

  console.log("\nMatching v2 schema migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
