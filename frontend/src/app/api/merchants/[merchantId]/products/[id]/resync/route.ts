import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  images: { id: number; src: string; alt: string | null; position: number }[];
  image: { id: number; src: string } | null;
}

// POST /api/merchants/:merchantId/products/:id/resync — Fetch product from Shopify, update staging, re-run matcher
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; id: string }> }
) {
  try {
    const { merchantId, id } = await params;
    const db = getDb();
    const merchantIdNum = Number(merchantId);
    const stagingId = Number(id);

    const staging = (await db.prepare(`
      SELECT id, external_product_id FROM staging_products
      WHERE id = ? AND merchant_id = ?
    `).get(stagingId, merchantIdNum)) as { id: number; external_product_id: string | null } | undefined;

    if (!staging?.external_product_id) {
      return NextResponse.json(
        { error: "Staging product not found or has no external ID" },
        { status: 404 }
      );
    }

    const merchant = (await db.prepare(`
      SELECT source_config FROM merchants WHERE id = ? AND is_active = true
    `).get(merchantIdNum)) as { source_config: { store_url: string; access_token: string } } | undefined;

    if (!merchant?.source_config?.store_url || !merchant?.source_config?.access_token) {
      return NextResponse.json(
        { error: "Merchant not configured for Shopify" },
        { status: 400 }
      );
    }

    const { store_url, access_token } = merchant.source_config;
    const response = await fetch(
      `https://${store_url}/admin/api/2024-01/products/${staging.external_product_id}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": access_token,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch product from Shopify", status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    const shopifyProduct: ShopifyProduct = data.product;

    if (!shopifyProduct) {
      return NextResponse.json({ error: "Product not found in Shopify" }, { status: 404 });
    }

    await db.prepare(`
      UPDATE staging_products SET
        raw_title = ?,
        raw_body_html = ?,
        raw_vendor = ?,
        raw_product_type = ?,
        raw_tags = ?,
        raw_json_dump = ?,
        status = 'PENDING_SYNC',
        suggested_product_id = NULL,
        match_confidence_score = 0,
        rejection_reason = NULL,
        updated_at = NOW()
      WHERE id = ?
    `).run(
      shopifyProduct.title,
      shopifyProduct.body_html,
      shopifyProduct.vendor,
      shopifyProduct.product_type,
      shopifyProduct.tags,
      JSON.stringify(shopifyProduct),
      stagingId
    );

    for (const shopifyVariant of shopifyProduct.variants) {
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

      const existing = (await db.prepare(`
        SELECT id FROM staging_variants
        WHERE staging_product_id = ? AND external_variant_id = ?
      `).get(stagingId, String(shopifyVariant.id))) as { id: number } | undefined;

      if (existing) {
        await db.prepare(`
          UPDATE staging_variants SET
            raw_sku = ?, raw_barcode = ?, raw_price = ?, raw_options = ?, status = 'PENDING_SYNC'
          WHERE id = ?
        `).run(
          shopifyVariant.sku || "",
          shopifyVariant.barcode || "",
          parseFloat(shopifyVariant.price),
          JSON.stringify(options),
          existing.id
        );
      } else {
        await db.prepare(`
          INSERT INTO staging_variants (
            staging_product_id, external_variant_id, raw_sku, raw_barcode, raw_price, raw_options, status
          )
          VALUES (?, ?, ?, ?, ?, ?, 'PENDING_SYNC')
        `).run(
          stagingId,
          String(shopifyVariant.id),
          shopifyVariant.sku || "",
          shopifyVariant.barcode || "",
          parseFloat(shopifyVariant.price),
          JSON.stringify(options)
        );
      }
    }

    await runMatcherForStaging(db, stagingId);

    return NextResponse.json({
      success: true,
      message: "Product re-synced from Shopify and queued for review",
    });
  } catch (error) {
    console.error("POST resync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function runMatcherForStaging(db: ReturnType<typeof getDb>, stagingProductId: number) {
  const sp = (await db.prepare(`
    SELECT id, raw_title FROM staging_products
    WHERE id = ? AND status = 'PENDING_SYNC'
  `).get(stagingProductId)) as { id: number; raw_title: string } | undefined;

  if (!sp) return;

  let suggestedId: number | null = null;
  let confidence = 0;

  const barcodeMatch = (await db.prepare(`
    SELECT p.id FROM products p
    JOIN variants v ON v.product_id = p.id
    JOIN staging_variants sv ON sv.raw_barcode = v.gtin
    WHERE sv.staging_product_id = ? AND v.gtin IS NOT NULL
    LIMIT 1
  `).get(sp.id)) as { id: number } | undefined;

  if (barcodeMatch) {
    suggestedId = barcodeMatch.id;
    confidence = 100;
  } else {
    const titleMatch = (await db.prepare(`
      SELECT id, similarity(title, ?) as score
      FROM products
      WHERE similarity(title, ?) > 0.4
      ORDER BY score DESC
      LIMIT 1
    `).get(sp.raw_title, sp.raw_title)) as { id: number; score: number } | undefined;
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
