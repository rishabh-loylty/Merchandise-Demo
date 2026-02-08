import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Types for Shopify API response
interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  barcode: string;
  inventory_quantity: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  weight: number;
  weight_unit: string;
  grams: number;
}

interface ShopifyOption {
  id: number;
  name: string;
  values: string[];
}

interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  position: number;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: string;
  tags: string;
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  images: ShopifyImage[];
  image: ShopifyImage | null;
}

// POST /api/merchants/:merchantId/sync - Sync products from Shopify to STAGING
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    const db = getDb();
    const merchantIdNum = Number(merchantId);

    // Verify merchant exists
    const merchant = (await db
      .prepare("SELECT * FROM merchants WHERE id = ? AND is_active = true")
      .get(merchantIdNum)) as
      | {
          id: number;
          name: string;
          source_config: { store_url: string; access_token: string };
        }
      | undefined;

    if (!merchant || !merchant.source_config) {
      return NextResponse.json(
        { error: "Merchant not found or not configured" },
        { status: 404 }
      );
    }

    const { store_url, access_token } = merchant.source_config;

    // Create sync log
    const syncLog = await db
      .prepare(
        `
      INSERT INTO sync_logs (merchant_id, status, started_at, records_processed, notes)
      VALUES (?, 'IN_PROGRESS', NOW(), 0, 'Shopify product sync started')
      RETURNING id
    `
      )
      .run(merchantIdNum);
    const syncLogId = syncLog.lastInsertRowid;

    // Fetch products from Shopify
    const response = await fetch(
      `https://${store_url}/admin/api/2024-01/products.json`,
      {
        headers: {
          "X-Shopify-Access-Token": access_token,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      await db
        .prepare(
          `
        UPDATE sync_logs SET status = 'FAILED', finished_at = NOW(), notes = ?
        WHERE id = ?
      `
        )
        .run(`Shopify API error: ${response.status}`, syncLogId);
      return NextResponse.json(
        { error: "Failed to fetch from Shopify" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const shopifyProducts: ShopifyProduct[] = data.products || [];

    let recordsProcessed = 0;
    let recordsFailed = 0;

    for (const shopifyProduct of shopifyProducts) {
      try {
        // 1. Upsert staging_product
        const existingStaging = (await db
          .prepare(
            `
          SELECT id, status FROM staging_products 
          WHERE merchant_id = ? AND external_product_id = ?
        `
          )
          .get(merchantIdNum, String(shopifyProduct.id))) as
          | { id: number; status: string }
          | undefined;

        let stagingProductId: number;

        if (existingStaging) {
          // If rejected, reset to PENDING_SYNC for resubmission
          const newStatus = existingStaging.status === 'REJECTED' ? 'PENDING_SYNC' : existingStaging.status;
          
          await db
            .prepare(
              `
            UPDATE staging_products SET
              raw_title = ?,
              raw_body_html = ?,
              raw_vendor = ?,
              raw_product_type = ?,
              raw_tags = ?,
              raw_json_dump = ?,
              status = ?,
              updated_at = NOW()
            WHERE id = ?
          `
            )
            .run(
              shopifyProduct.title,
              shopifyProduct.body_html,
              shopifyProduct.vendor,
              shopifyProduct.product_type,
              shopifyProduct.tags,
              JSON.stringify(shopifyProduct),
              newStatus,
              existingStaging.id
            );
          stagingProductId = existingStaging.id;
        } else {
          // Insert new staging product
          const stagingResult = await db
            .prepare(
              `
            INSERT INTO staging_products (
              merchant_id, external_product_id, raw_title, raw_body_html, 
              raw_vendor, raw_product_type, raw_tags, raw_json_dump, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_SYNC')
            RETURNING id
          `
            )
            .run(
              merchantIdNum,
              String(shopifyProduct.id),
              shopifyProduct.title,
              shopifyProduct.body_html,
              shopifyProduct.vendor,
              shopifyProduct.product_type,
              shopifyProduct.tags,
              JSON.stringify(shopifyProduct)
            );
          stagingProductId = stagingResult.lastInsertRowid ?? 0;
        }

        // 2. Sync variants to staging_variants
        for (const shopifyVariant of shopifyProduct.variants) {
          const existingStagingVariant = (await db
            .prepare(
              `
            SELECT id FROM staging_variants 
            WHERE staging_product_id = ? AND external_variant_id = ?
          `
            )
            .get(stagingProductId, String(shopifyVariant.id))) as
            | { id: number }
            | undefined;

          // Build options JSON
          const options: Record<string, string> = {};
          if (shopifyVariant.option1 && shopifyProduct.options[0]) {
            options[shopifyProduct.options[0].name] = shopifyVariant.option1;
          }
          if (shopifyVariant.option2 && shopifyProduct.options[1]) {
            options[shopifyProduct.options[1].name] = shopifyVariant.option2;
          }
          if (shopifyVariant.option3 && shopifyProduct.options[2]) {
            options[shopifyProduct.options[2].name] = shopifyVariant.option3;
          }

          if (existingStagingVariant) {
            await db
              .prepare(
                `
              UPDATE staging_variants SET
                raw_sku = ?,
                raw_barcode = ?,
                raw_price = ?,
                raw_options = ?,
                status = 'PENDING_SYNC'
              WHERE id = ?
            `
              )
              .run(
                shopifyVariant.sku || "",
                shopifyVariant.barcode || "",
                parseFloat(shopifyVariant.price),
                JSON.stringify(options),
                existingStagingVariant.id
              );
          } else {
            await db
              .prepare(
                `
              INSERT INTO staging_variants (
                staging_product_id, external_variant_id, raw_sku, raw_barcode, raw_price, raw_options, status
              )
              VALUES (?, ?, ?, ?, ?, ?, 'PENDING_SYNC')
            `
              )
              .run(
                stagingProductId,
                String(shopifyVariant.id),
                shopifyVariant.sku || "",
                shopifyVariant.barcode || "",
                parseFloat(shopifyVariant.price),
                JSON.stringify(options)
              );
          }
        }

        recordsProcessed++;
      } catch (productError) {
        console.error(
          `Error syncing product ${shopifyProduct.id}:`,
          productError
        );
        recordsFailed++;
      }
    }

    // Trigger Matcher (internal call or background task simulation)
    // For this implementation, we'll run the matcher logic directly or via a simple fetch
    // But since it's a small app, we can just process matches here for simplicity
    await runMatcher(merchantIdNum);

    // Update sync log
    const finalStatus =
      recordsFailed === 0
        ? "SUCCESS"
        : recordsFailed === shopifyProducts.length
          ? "FAILED"
          : "PARTIAL_SUCCESS";

    await db
      .prepare(
        `
      UPDATE sync_logs SET 
        status = ?, 
        finished_at = NOW(), 
        records_processed = ?,
        records_failed = ?,
        notes = ?
      WHERE id = ?
    `
      )
      .run(
        finalStatus,
        recordsProcessed,
        recordsFailed,
        `Synced ${recordsProcessed} products to staging`,
        syncLogId
      );

    return NextResponse.json({
      success: true,
      syncLogId,
      recordsProcessed,
      recordsFailed,
    });
  } catch (error) {
    console.error("POST /api/merchants/:id/sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function runMatcher(merchantId: number) {
  const db = getDb();
  
  // 1. Get all pending staging products
  const pending = await db.prepare(`
    SELECT id, raw_title FROM staging_products 
    WHERE merchant_id = ? AND status = 'PENDING_SYNC'
  `).all(merchantId) as { id: number; raw_title: string }[];

  for (const sp of pending) {
    let suggestedId = null;
    let confidence = 0;

    // 2. Barcode Match (Variants)
    const barcodeMatch = await db.prepare(`
      SELECT p.id FROM products p
      JOIN variants v ON v.product_id = p.id
    JOIN staging_variants sv ON sv.raw_barcode = v.gtin
      WHERE sv.staging_product_id = ? AND v.gtin IS NOT NULL
      LIMIT 1
    `).get(sp.id) as { id: number } | undefined;

    if (barcodeMatch) {
      suggestedId = barcodeMatch.id;
      confidence = 100;
    } else {
      // 3. Title fuzzy match
      const titleMatch = await db.prepare(`
        SELECT id, similarity(title, ?) as score
        FROM products
        WHERE similarity(title, ?) > 0.4
        ORDER BY score DESC
        LIMIT 1
      `).get(sp.raw_title, sp.raw_title) as { id: number; score: number } | undefined;

      if (titleMatch && titleMatch.score > 0.8) {
        suggestedId = titleMatch.id;
        confidence = Math.round(titleMatch.score * 100);
      }
    }

    await db.prepare(`
      UPDATE staging_products SET
        suggested_product_id = ?,
        match_confidence_score = ?,
        status = 'NEEDS_REVIEW'
      WHERE id = ?
    `).run(suggestedId, confidence, sp.id);
  }
}
