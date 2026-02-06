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

// POST /api/merchants/:merchantId/sync - Sync products from Shopify
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
    const syncedProducts: number[] = [];

    for (const shopifyProduct of shopifyProducts) {
      try {
        // 1. Upsert staging_product
        const existingStaging = (await db
          .prepare(
            `
          SELECT id FROM staging_products 
          WHERE merchant_id = ? AND external_product_id = ?
        `
          )
          .get(merchantIdNum, String(shopifyProduct.id))) as
          | { id: number }
          | undefined;

        let stagingProductId: number;

        if (existingStaging) {
          // Update existing staging product
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEEDS_REVIEW')
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

        // 2. Check if master product exists (by external_product_id via merchant_offers)
        const existingProduct = (await db
          .prepare(
            `
          SELECT DISTINCT p.id FROM products p
          JOIN variants v ON v.product_id = p.id
          JOIN merchant_offers mo ON mo.variant_id = v.id
          WHERE mo.merchant_id = ? AND mo.external_product_id = ?
        `
          )
          .get(merchantIdNum, String(shopifyProduct.id))) as
          | { id: number }
          | undefined;

        let productId: number;
        const slug = `${shopifyProduct.handle}-${merchantIdNum}-${Date.now()}`;
        const basePrice = Math.round(
          parseFloat(shopifyProduct.variants[0]?.price || "0") * 100
        );
        const imageUrl =
          shopifyProduct.image?.src ||
          shopifyProduct.images[0]?.src ||
          "https://placehold.co/400x400?text=No+Image";

        if (existingProduct) {
          // Update existing product
          await db
            .prepare(
              `
            UPDATE products SET
              title = ?,
              description = ?,
              image_url = ?,
              base_price = ?,
              updated_at = NOW()
            WHERE id = ?
          `
            )
            .run(
              shopifyProduct.title,
              shopifyProduct.body_html || "",
              imageUrl,
              basePrice,
              existingProduct.id
            );
          productId = existingProduct.id;
        } else {
          // Create new master product
          const productResult = await db
            .prepare(
              `
            INSERT INTO products (title, slug, description, image_url, base_price, rating, review_count, status)
            VALUES (?, ?, ?, ?, ?, 0, 0, 'ACTIVE')
            RETURNING id
          `
            )
            .run(
              shopifyProduct.title,
              slug,
              shopifyProduct.body_html || "",
              imageUrl,
              basePrice
            );
          productId = productResult.lastInsertRowid ?? 0;

          // Link to default category (can be updated during review)
          await db
            .prepare(
              `
            INSERT INTO product_categories (product_id, category_id)
            SELECT ?, id FROM categories WHERE parent_id IS NULL LIMIT 1
          `
            )
            .run(productId);
        }

        // 3. Sync product images to media table
        for (const image of shopifyProduct.images) {
          const existingMedia = (await db
            .prepare(
              `
            SELECT id FROM media WHERE product_id = ? AND src_url = ?
          `
            )
            .get(productId, image.src)) as { id: number } | undefined;

          if (!existingMedia) {
            await db
              .prepare(
                `
              INSERT INTO media (product_id, src_url, alt_text, position)
              VALUES (?, ?, ?, ?)
            `
              )
              .run(productId, image.src, image.alt || "", image.position);
          }
        }

        // 4. Sync variants
        for (const shopifyVariant of shopifyProduct.variants) {
          // Upsert staging_variant
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
                raw_options = ?
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
              VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
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

          // Check if master variant exists
          const internalSku =
            shopifyVariant.sku ||
            `${merchantIdNum}-${shopifyProduct.id}-${shopifyVariant.id}`;
          const existingVariant = (await db
            .prepare(
              `
            SELECT v.id FROM variants v
            JOIN merchant_offers mo ON mo.variant_id = v.id
            WHERE mo.merchant_id = ? AND mo.external_variant_id = ?
          `
            )
            .get(merchantIdNum, String(shopifyVariant.id))) as
            | { id: number }
            | undefined;

          let variantId: number;
          const priceMinor = Math.round(parseFloat(shopifyVariant.price) * 100);
          const settlementPriceMinor = Math.round(priceMinor * 0.95); // 5% margin

          if (existingVariant) {
            // Update existing variant
            await db
              .prepare(
                `
              UPDATE variants SET
                gtin = ?,
                weight_grams = ?,
                attributes = ?,
                updated_at = NOW()
              WHERE id = ?
            `
              )
              .run(
                shopifyVariant.barcode || null,
                shopifyVariant.grams || null,
                JSON.stringify(options),
                existingVariant.id
              );
            variantId = existingVariant.id;

            // Update merchant offer
            await db
              .prepare(
                `
              UPDATE merchant_offers SET
                cached_price_minor = ?,
                cached_settlement_price_minor = ?,
                current_stock = ?,
                merchant_sku = ?,
                last_synced_at = NOW(),
                updated_at = NOW()
              WHERE merchant_id = ? AND variant_id = ?
            `
              )
              .run(
                priceMinor,
                settlementPriceMinor,
                shopifyVariant.inventory_quantity || 0,
                shopifyVariant.sku || internalSku,
                merchantIdNum,
                variantId
              );
          } else {
            // Create new variant with unique SKU
            const uniqueSku = `${internalSku}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const variantResult = await db
              .prepare(
                `
              INSERT INTO variants (product_id, internal_sku, gtin, weight_grams, attributes, is_active)
              VALUES (?, ?, ?, ?, ?, true)
              RETURNING id
            `
              )
              .run(
                productId,
                uniqueSku,
                shopifyVariant.barcode || null,
                shopifyVariant.grams || null,
                JSON.stringify(options)
              );
            variantId = variantResult.lastInsertRowid ?? 0;

            // Create merchant offer (PENDING_REVIEW for new products)
            await db
              .prepare(
                `
              INSERT INTO merchant_offers (
                merchant_id, variant_id, external_product_id, external_variant_id,
                merchant_sku, currency_code, cached_price_minor, cached_settlement_price_minor,
                current_stock, offer_status, is_active, last_synced_at
              )
              VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, 'PENDING_REVIEW', true, NOW())
            `
              )
              .run(
                merchantIdNum,
                variantId,
                String(shopifyProduct.id),
                String(shopifyVariant.id),
                shopifyVariant.sku || uniqueSku,
                priceMinor,
                settlementPriceMinor,
                shopifyVariant.inventory_quantity || 0
              );
          }
        }

        syncedProducts.push(productId);
        recordsProcessed++;
      } catch (productError) {
        console.error(
          `Error syncing product ${shopifyProduct.id}:`,
          productError
        );
        recordsFailed++;
      }
    }

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
        `Synced ${recordsProcessed} products, ${recordsFailed} failed`,
        syncLogId
      );

    return NextResponse.json({
      success: true,
      syncLogId,
      recordsProcessed,
      recordsFailed,
      productIds: syncedProducts,
    });
  } catch (error) {
    console.error("POST /api/merchants/:id/sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
