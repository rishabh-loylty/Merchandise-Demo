import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/review - Get all staging products that NEED_REVIEW
export async function GET() {
  try {
    const db = getDb();

    // Fetch products from staging that need review
    const products = await db.prepare(`
      SELECT 
        sp.id as staging_id,
        sp.merchant_id,
        sp.raw_title as title,
        sp.raw_vendor as vendor,
        sp.raw_product_type as product_type,
        sp.raw_json_dump,
        sp.match_confidence_score,
        sp.suggested_product_id,
        sp.created_at,
        m.name as merchant_name,
        p.title as suggested_title,
        p.image_url as suggested_image_url
      FROM staging_products sp
      JOIN merchants m ON sp.merchant_id = m.id
      LEFT JOIN products p ON sp.suggested_product_id = p.id
      WHERE sp.status = 'NEEDS_REVIEW'
      ORDER BY sp.match_confidence_score DESC, sp.created_at DESC
    `).all();

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/admin/review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/review/:stagingId - Handle Review Actions (Approve/Reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stagingId: string }> }
) {
  try {
    const { stagingId } = await params;
    const body = await request.json();
    const { action, suggested_product_id, rejection_reason, admin_notes } = body;
    const db = getDb();
    const idNum = Number(stagingId);

    const stagingProduct = await db.prepare(`
      SELECT * FROM staging_products WHERE id = ?
    `).get(idNum) as any;

    if (!stagingProduct) {
      return NextResponse.json({ error: "Staging product not found" }, { status: 404 });
    }

    if (action === 'approve_new') {
      // Scenario 1: Approve as New
      const raw = JSON.parse(stagingProduct.raw_json_dump);
      const slug = `${raw.handle}-${stagingProduct.merchant_id}-${Date.now()}`;
      const basePrice = Math.round(parseFloat(raw.variants[0]?.price || "0") * 100);
      const imageUrl = raw.image?.src || raw.images[0]?.src || "https://placehold.co/400x400?text=No+Image";

      const productResult = await db.prepare(`
        INSERT INTO products (title, slug, description, image_url, base_price, status)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE')
        RETURNING id
      `).run(stagingProduct.raw_title, slug, stagingProduct.raw_body_html || "", imageUrl, basePrice);
      
      const productId = productResult.lastInsertRowid!;

      // Link categories (logic from existing setup)
      await db.prepare(`
        INSERT INTO product_categories (product_id, category_id)
        SELECT ?, id FROM categories WHERE parent_id IS NULL LIMIT 1
      `).run(productId);

      // Create Variants and Offers
      for (const v of raw.variants) {
        const uniqueSku = `${v.sku || raw.id}-${Date.now()}`;
        const varResult = await db.prepare(`
          INSERT INTO variants (product_id, internal_sku, gtin, weight_grams, attributes, is_active)
          VALUES (?, ?, ?, ?, ?, true)
          RETURNING id
        `).run(productId, uniqueSku, v.barcode || null, v.grams || null, JSON.stringify({}));
        
        const variantId = varResult.lastInsertRowid!;
        const priceMinor = Math.round(parseFloat(v.price) * 100);

        await db.prepare(`
          INSERT INTO merchant_offers (
            merchant_id, variant_id, external_product_id, external_variant_id,
            merchant_sku, currency_code, cached_price_minor, cached_settlement_price_minor,
            current_stock, offer_status, is_active, last_synced_at
          )
          VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, 'LIVE', true, NOW())
        `).run(stagingProduct.merchant_id, variantId, String(raw.id), String(v.id), v.sku || uniqueSku, priceMinor, Math.round(priceMinor * 0.95), v.inventory_quantity || 0);
      }

      await db.prepare(`UPDATE staging_products SET status = 'APPROVED', admin_notes = ? WHERE id = ?`).run(admin_notes || null, idNum);

    } else if (action === 'approve_match') {
      // Scenario 2: Approve as Match
      const targetProductId = suggested_product_id || stagingProduct.suggested_product_id;
      if (!targetProductId) return NextResponse.json({ error: "No target product for match" }, { status: 400 });

      const raw = JSON.parse(stagingProduct.raw_json_dump);
      
      for (const v of raw.variants) {
        // Logic: Check for existing variant by SKU or Attributes (simplified for now to unique link)
        const uniqueSku = `${v.sku || raw.id}-${stagingProduct.merchant_id}`;
        const varResult = await db.prepare(`
          INSERT INTO variants (product_id, internal_sku, gtin, weight_grams, attributes, is_active)
          VALUES (?, ?, ?, ?, ?, true)
          ON CONFLICT (internal_sku) DO UPDATE SET updated_at = NOW()
          RETURNING id
        `).run(targetProductId, uniqueSku, v.barcode || null, v.grams || null, JSON.stringify({}));
        
        const variantId = varResult.lastInsertRowid!;
        const priceMinor = Math.round(parseFloat(v.price) * 100);

        await db.prepare(`
          INSERT INTO merchant_offers (
            merchant_id, variant_id, external_product_id, external_variant_id,
            merchant_sku, currency_code, cached_price_minor, cached_settlement_price_minor,
            current_stock, offer_status, is_active, last_synced_at
          )
          VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, 'LIVE', true, NOW())
          ON CONFLICT (merchant_id, variant_id) DO UPDATE SET last_synced_at = NOW()
        `).run(stagingProduct.merchant_id, variantId, String(raw.id), String(v.id), v.sku || uniqueSku, priceMinor, Math.round(priceMinor * 0.95), v.inventory_quantity || 0);
      }

      await db.prepare(`UPDATE staging_products SET status = 'APPROVED', admin_notes = ? WHERE id = ?`).run(admin_notes || null, idNum);

    } else if (action === 'reject') {
      // Scenario 3: Reject
      await db.prepare(`
        UPDATE staging_products SET 
          status = 'REJECTED', 
          rejection_reason = ?,
          admin_notes = ?
        WHERE id = ?
      `).run(rejection_reason, admin_notes || null, idNum);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
