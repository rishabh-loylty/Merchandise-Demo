// @ts-nocheck
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface StagingVariant {
  id: number;
  external_variant_id: string;
  raw_sku: string | null;
  raw_barcode: string | null;
  raw_price: number | null;
  raw_options: Record<string, string> | null;
}

interface MasterVariant {
  id: number;
  internal_sku: string;
  gtin: string | null;
  mpn: string | null;
  attributes: Record<string, string>;
  product_id: number;
  product_title: string;
  merchant_count: number;
}

interface VariantMatchResult {
  staging_variant: StagingVariant;
  match_type: "gtin_exact" | "gtin_global" | "mpn_brand" | "none";
  matched_variant: MasterVariant | null;
  confidence: number;
  warning?: string;
}

// GET /api/admin/review/:stagingId/variants?targetProductId=123
// Returns staging variants with their potential matches from the master catalog
// targetProductId: optional - the master product ID to match against (admin-selected or auto-suggested)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stagingId: string }> }
) {
  try {
    const { stagingId } = await params;
    const idNum = Number(stagingId);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "Invalid staging id" }, { status: 400 });
    }

    // Accept target product ID from query params (admin-selected product)
    const { searchParams } = new URL(request.url);
    const targetProductIdParam = searchParams.get("targetProductId");

    const db = getDb();

    // Get staging product with suggested master product
    const stagingProduct = (await db
      .prepare(
        `
      SELECT sp.id, sp.suggested_product_id, sp.raw_vendor, sp.raw_json_dump
      FROM staging_products sp
      WHERE sp.id = ?
    `
      )
      .get(idNum)) as {
      id: number;
      suggested_product_id: number | null;
      raw_vendor: string | null;
      raw_json_dump: string | Record<string, unknown>;
    } | undefined;

    if (!stagingProduct) {
      return NextResponse.json(
        { error: "Staging product not found" },
        { status: 404 }
      );
    }

    // Use admin-selected product ID, fallback to DB suggested_product_id
    const targetProductId = targetProductIdParam
      ? Number(targetProductIdParam)
      : stagingProduct.suggested_product_id;

    // Parse raw_json_dump to get variants
    const rawDump =
      typeof stagingProduct.raw_json_dump === "string"
        ? JSON.parse(stagingProduct.raw_json_dump)
        : stagingProduct.raw_json_dump;

    const rawVariants = (rawDump?.variants ?? []) as Array<{
      id: number;
      sku?: string;
      barcode?: string;
      price?: string;
      option1?: string;
      option2?: string;
      option3?: string;
      title?: string;
    }>;

    const rawOptions = (rawDump?.options ?? []) as Array<{
      name: string;
      position: number;
    }>;

    // Build staging variants with options
    const stagingVariants: StagingVariant[] = rawVariants.map((v) => {
      const options: Record<string, string> = {};
      if (v.option1 && rawOptions[0]) options[rawOptions[0].name] = v.option1;
      if (v.option2 && rawOptions[1]) options[rawOptions[1].name] = v.option2;
      if (v.option3 && rawOptions[2]) options[rawOptions[2].name] = v.option3;

      return {
        id: v.id,
        external_variant_id: String(v.id),
        raw_sku: v.sku ?? null,
        raw_barcode: v.barcode ?? null,
        raw_price: v.price ? parseFloat(v.price) : null,
        raw_options: Object.keys(options).length > 0 ? options : null,
      };
    });

    // Try to find brand match for MPN lookups
    const vendor = stagingProduct.raw_vendor?.toLowerCase().trim();
    let matchedBrandId: number | null = null;
    if (vendor) {
      const brandMatch = (await db
        .prepare(
          `
        SELECT id FROM brands 
        WHERE LOWER(name) = ? OR LOWER(slug) = ?
        LIMIT 1
      `
        )
        .get(vendor, vendor.replace(/\s+/g, "-"))) as { id: number } | undefined;
      matchedBrandId = brandMatch?.id ?? null;
    }

    // Get existing variants for the target master product (if any)
    let masterVariants: MasterVariant[] = [];
    if (targetProductId) {
      masterVariants = (await db
        .prepare(
          `
        SELECT 
          v.id, v.internal_sku, v.gtin, v.mpn, v.attributes, v.product_id,
          p.title as product_title,
          (SELECT COUNT(DISTINCT mo.merchant_id) FROM merchant_offers mo 
           WHERE mo.variant_id = v.id AND mo.is_active = true) as merchant_count
        FROM variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.product_id = ? AND v.is_active = true
        ORDER BY v.id
      `
        )
        .all(targetProductId)) as MasterVariant[];
    }

    // Match each staging variant
    const results: VariantMatchResult[] = [];

    for (const sv of stagingVariants) {
      let matchResult: VariantMatchResult = {
        staging_variant: sv,
        match_type: "none",
        matched_variant: null,
        confidence: 0,
      };

      // 1. Try GTIN exact match within target product
      if (sv.raw_barcode && targetProductId) {
        const gtinMatch = masterVariants.find(
          (mv) => mv.gtin === sv.raw_barcode
        );
        if (gtinMatch) {
          matchResult = {
            staging_variant: sv,
            match_type: "gtin_exact",
            matched_variant: gtinMatch,
            confidence: 100,
          };
          results.push(matchResult);
          continue;
        }
      }

      // 2. Try GTIN global match (across entire catalog)
      if (sv.raw_barcode) {
        const globalGtinMatch = (await db
          .prepare(
            `
          SELECT 
            v.id, v.internal_sku, v.gtin, v.mpn, v.attributes, v.product_id,
            p.title as product_title,
            (SELECT COUNT(DISTINCT mo.merchant_id) FROM merchant_offers mo 
             WHERE mo.variant_id = v.id AND mo.is_active = true) as merchant_count
          FROM variants v
          JOIN products p ON v.product_id = p.id
          WHERE v.gtin = ? AND v.is_active = true
          LIMIT 1
        `
          )
          .get(sv.raw_barcode)) as MasterVariant | undefined;

        if (globalGtinMatch) {
          // Found globally - may be in a different product than target
          const warning =
            targetProductId &&
            globalGtinMatch.product_id !== targetProductId
              ? `GTIN found in different product: "${globalGtinMatch.product_title}" (ID: ${globalGtinMatch.product_id})`
              : undefined;

          matchResult = {
            staging_variant: sv,
            match_type: "gtin_global",
            matched_variant: globalGtinMatch,
            confidence: 100,
            warning,
          };
          results.push(matchResult);
          continue;
        }
      }

      // 3. Try MPN + Brand match (if we have brand)
      if (sv.raw_sku && matchedBrandId) {
        const mpnMatch = (await db
          .prepare(
            `
          SELECT 
            v.id, v.internal_sku, v.gtin, v.mpn, v.attributes, v.product_id,
            p.title as product_title,
            (SELECT COUNT(DISTINCT mo.merchant_id) FROM merchant_offers mo 
             WHERE mo.variant_id = v.id AND mo.is_active = true) as merchant_count
          FROM variants v
          JOIN products p ON v.product_id = p.id
          WHERE v.mpn = ? AND p.brand_id = ? AND v.is_active = true
          LIMIT 1
        `
          )
          .get(sv.raw_sku, matchedBrandId)) as MasterVariant | undefined;

        if (mpnMatch) {
          matchResult = {
            staging_variant: sv,
            match_type: "mpn_brand",
            matched_variant: mpnMatch,
            confidence: 95,
          };
          results.push(matchResult);
          continue;
        }
      }

      // 4. No match found
      results.push(matchResult);
    }

    return NextResponse.json({
      staging_product_id: stagingProduct.id,
      suggested_product_id: stagingProduct.suggested_product_id,
      target_product_id: targetProductId,
      matched_brand_id: matchedBrandId,
      vendor: stagingProduct.raw_vendor,
      master_variants: masterVariants,
      variant_matches: results,
      summary: {
        total: results.length,
        matched: results.filter((r) => r.match_type !== "none").length,
        unmatched: results.filter((r) => r.match_type === "none").length,
        warnings: results.filter((r) => r.warning).length,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/review/[stagingId]/variants error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
