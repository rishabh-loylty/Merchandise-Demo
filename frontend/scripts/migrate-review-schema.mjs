/**
 * Migration: Review system schema (per review-plan.txt)
 * - pg_trgm for fuzzy title matching
 * - staging_products: suggested_product_id, match_confidence_score, admin_notes, status values
 * - staging_variants: suggested_variant_id, status PENDING_SYNC
 * Run: node --env-file .env scripts/migrate-review-schema.mjs
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
  console.log("Running review schema migration...\n");

  await run(
    "CREATE EXTENSION IF NOT EXISTS pg_trgm",
    "pg_trgm extension (fuzzy matching)"
  );

  await run(
    `ALTER TABLE staging_products
     ADD COLUMN IF NOT EXISTS suggested_product_id integer REFERENCES products(id)`,
    "staging_products.suggested_product_id"
  );
  await run(
    `ALTER TABLE staging_products
     ADD COLUMN IF NOT EXISTS match_confidence_score integer DEFAULT 0`,
    "staging_products.match_confidence_score"
  );
  await run(
    `ALTER TABLE staging_products
     ADD COLUMN IF NOT EXISTS admin_notes text`,
    "staging_products.admin_notes"
  );

  await run(
    `ALTER TABLE staging_variants
     ADD COLUMN IF NOT EXISTS suggested_variant_id integer REFERENCES variants(id)`,
    "staging_variants.suggested_variant_id"
  );

  // Expand allowed statuses: add PENDING_SYNC, PROCESSING, ARCHIVED
  try {
    await sql.query(`
      ALTER TABLE staging_products
      DROP CONSTRAINT IF EXISTS staging_products_status_check
    `);
    console.log("✓ staging_products status constraint dropped");
  } catch (e) {
    console.warn("⚠ drop staging_products_status_check", e.message);
  }
  try {
    await sql.query(`
      ALTER TABLE staging_products
      ADD CONSTRAINT staging_products_status_check
      CHECK (status = ANY (ARRAY[
        'PENDING_SYNC', 'PENDING', 'PROCESSING', 'AUTO_MATCHED',
        'NEEDS_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'
      ]::text[]))
    `);
    console.log("✓ staging_products status constraint added");
  } catch (e) {
    console.warn("⚠ add staging_products_status_check", e.message);
  }

  try {
    await sql.query(`
      ALTER TABLE staging_variants
      DROP CONSTRAINT IF EXISTS staging_variants_status_check
    `);
    console.log("✓ staging_variants status constraint dropped");
  } catch (e) {
    console.warn("⚠ drop staging_variants_status_check", e.message);
  }
  try {
    await sql.query(`
      ALTER TABLE staging_variants
      ADD CONSTRAINT staging_variants_status_check
      CHECK (status = ANY (ARRAY[
        'PENDING_SYNC', 'PENDING', 'AUTO_MATCHED', 'NEEDS_REVIEW',
        'APPROVED', 'REJECTED'
      ]::text[]))
    `);
    console.log("✓ staging_variants status constraint added");
  } catch (e) {
    console.warn("⚠ add staging_variants_status_check", e.message);
  }

  console.log("\nReview schema migration complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
