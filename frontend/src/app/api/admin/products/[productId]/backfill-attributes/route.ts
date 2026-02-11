import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * POST /api/admin/products/:productId/backfill-attributes
 *
 * Backfills variant.attributes from staging_variants.raw_options for variants
 * that currently have empty attributes. Uses merchant_offers.external_variant_id
 * to match variants to staging_variants, then copies raw_options into attributes.
 * Use this for products that were approved before attributes were written.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const db = getDb();
    const id = Number(productId);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const product = (await db.prepare("SELECT id FROM products WHERE id = ?").get(id)) as
      | { id: number }
      | undefined;
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Variants for this product with their merchant_offer external_variant_id
    const variantLinks = (await db.prepare(`
      SELECT v.id AS variant_id, mo.external_variant_id, mo.merchant_id
      FROM variants v
      JOIN merchant_offers mo ON mo.variant_id = v.id
      WHERE v.product_id = ? AND mo.is_active = true
    `).all(id)) as { variant_id: number; external_variant_id: string | null; merchant_id: number }[];

    if (variantLinks.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: "No variants with merchant offers found",
      });
    }

    const merchantId = variantLinks?.[0]?.merchant_id;
    const externalIds = variantLinks
      .map((l) => l.external_variant_id)
      .filter(Boolean) as string[];

    if (externalIds.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: "No external_variant_id on offers; cannot match staging",
      });
    }

    // Find a staging product for this merchant whose staging_variants cover all our external_variant_ids
    const placeholders = externalIds.map(() => "?").join(",");
    const stagingProducts = (await db.prepare(`
      SELECT sp.id AS staging_product_id
      FROM staging_products sp
      JOIN staging_variants sv ON sv.staging_product_id = sp.id
      WHERE sp.merchant_id = ?
      GROUP BY sp.id
      HAVING SUM(CASE WHEN sv.external_variant_id IN (${placeholders}) THEN 1 ELSE 0 END) = ?
    `).all(merchantId, ...externalIds, externalIds.length)) as { staging_product_id: number }[];

    const stagingProductId = stagingProducts[0]?.staging_product_id;
    if (!stagingProductId) {
      return NextResponse.json({
        success: false,
        updated: 0,
        message:
          "No staging product found with matching variants for this merchant. Re-sync the product and ensure staging has raw_options, then run backfill again.",
      });
    }

    const stagingVariants = (await db.prepare(`
      SELECT external_variant_id, raw_options
      FROM staging_variants
      WHERE staging_product_id = ?
    `).all(stagingProductId)) as { external_variant_id: string; raw_options: string | Record<string, string> | null }[];

    const rawOptionsByExternalId = new Map<string, Record<string, string>>();
    for (const sv of stagingVariants) {
      let opts = sv.raw_options;
      if (typeof opts === "string") {
        try {
          opts = JSON.parse(opts) as Record<string, string>;
        } catch {
          opts = {};
        }
      }
      if (opts && typeof opts === "object" && !Array.isArray(opts) && Object.keys(opts).length > 0) {
        rawOptionsByExternalId.set(String(sv.external_variant_id), opts as Record<string, string>);
      }
    }

    let updated = 0;
    for (const link of variantLinks) {
      const extId = link.external_variant_id;
      if (!extId) continue;
      const rawOptions = rawOptionsByExternalId.get(extId);
      if (!rawOptions || Object.keys(rawOptions).length === 0) continue;

      await db.prepare(`
        UPDATE variants SET attributes = ? WHERE id = ?
      `).run(JSON.stringify(rawOptions), link.variant_id);
      updated++;
    }

    return NextResponse.json({
      success: true,
      updated,
      message: `Updated attributes for ${updated} variant(s). Refresh the product page to see Size/Color options.`,
    });
  } catch (error) {
    console.error("POST /api/admin/products/[productId]/backfill-attributes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
