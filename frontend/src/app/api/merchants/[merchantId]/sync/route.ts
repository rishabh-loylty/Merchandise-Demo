import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/merchants/:merchantId/sync - Simulate Shopify sync
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    const db = getDb();

    // Verify merchant exists
    const merchant = db.prepare("SELECT id, name FROM merchants WHERE id = ? AND is_active = 1").get(Number(merchantId)) as { id: number; name: string } | undefined;
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Log sync start
    const syncLog = db.prepare(`
      INSERT INTO sync_logs (merchant_id, status, started_at, records_processed, notes)
      VALUES (?, 'IN_PROGRESS', datetime('now'), 0, 'Simulated Shopify sync')
    `).run(Number(merchantId));

    // Simulate: create a new product in staging
    const timestamp = Date.now();
    const rawTitle = "New Shopify Product - Ceramic Pan Set";
    const rawVendor = "Prestiege Inc";

    // Insert staging product
    const stagingResult = db.prepare(`
      INSERT INTO staging_products (merchant_id, external_product_id, raw_title, raw_vendor, raw_product_type, status)
      VALUES (?, ?, ?, ?, 'Kitchen', 'NEEDS_REVIEW')
    `).run(Number(merchantId), `shopify-sync-${timestamp}`, rawTitle, rawVendor);

    const stagingProductId = stagingResult.lastInsertRowid;

    // Insert staging variant
    db.prepare(`
      INSERT INTO staging_variants (staging_product_id, external_variant_id, raw_sku, raw_price, status)
      VALUES (?, ?, ?, 3499.00, 'PENDING')
    `).run(stagingProductId, `variant-${timestamp}`, `SYNC-${timestamp}`);

    // Create master product (in ACTIVE state but offer will be PENDING_REVIEW)
    const brandId = 1; // Prestige
    const slug = `ceramic-pan-set-${timestamp}`;
    const productResult = db.prepare(`
      INSERT INTO products (brand_id, title, slug, description, image_url, base_price, rating, review_count, status)
      VALUES (?, ?, ?, 'Premium non-stick ceramic pan set from Shopify store.', 
              'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
              3499, 0, 0, 'ACTIVE')
    `).run(brandId, rawTitle, slug);

    const newProductId = productResult.lastInsertRowid;

    // Link to kitchen category
    db.prepare("INSERT INTO product_categories (product_id, category_id) VALUES (?, 1)").run(newProductId);

    // Create variant
    const variantResult = db.prepare(`
      INSERT INTO variants (product_id, internal_sku, is_active)
      VALUES (?, ?, 1)
    `).run(newProductId, `SYNC-${timestamp}`);

    const newVariantId = variantResult.lastInsertRowid;

    // Create offer (PENDING_REVIEW)
    db.prepare(`
      INSERT INTO merchant_offers (merchant_id, variant_id, currency_code, cached_price_minor, cached_settlement_price_minor, current_stock, offer_status, merchant_sku)
      VALUES (?, ?, 'INR', 349900, 332405, 30, 'PENDING_REVIEW', ?)
    `).run(Number(merchantId), newVariantId, `SYNC-${timestamp}`);

    // Update sync log
    db.prepare(`
      UPDATE sync_logs SET status = 'SUCCESS', finished_at = datetime('now'), records_processed = 1
      WHERE id = ?
    `).run(syncLog.lastInsertRowid);

    // Return the new product in the format the frontend expects
    const newProduct = db.prepare(`
      SELECT 
        p.id, p.title, p.slug, p.description, p.image_url, p.base_price,
        p.rating, p.review_count, p.status as product_status,
        b.name as brand_name, b.slug as brand_slug,
        v.internal_sku as sku,
        mo.offer_status, mo.merchant_id, mo.cached_price_minor, mo.current_stock,
        m.name as merchant_name,
        c.slug as category_slug, c.name as category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN variants v ON v.product_id = p.id
      LEFT JOIN merchant_offers mo ON mo.variant_id = v.id
      LEFT JOIN merchants m ON mo.merchant_id = m.id
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON pc.category_id = c.id AND c.parent_id IS NULL
      WHERE p.id = ?
    `).get(newProductId);

    return NextResponse.json({ product: newProduct, syncLogId: syncLog.lastInsertRowid });
  } catch (error) {
    console.error("POST /api/merchants/:id/sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
