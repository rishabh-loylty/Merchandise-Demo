import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/admin/review - Get all PENDING_REVIEW products
export async function GET() {
  try {
    const db = getDb();

    const products = db.prepare(`
      SELECT 
        p.id, p.title, p.slug, p.description, p.image_url, p.base_price,
        p.rating, p.review_count, p.status as product_status,
        b.name as brand_name, b.slug as brand_slug, b.id as brand_id,
        v.internal_sku as sku, v.id as variant_id,
        mo.offer_status, mo.merchant_id, mo.cached_price_minor, mo.current_stock, mo.id as offer_id,
        m.name as merchant_name,
        c.slug as category_slug, c.name as category_name, c.id as category_id,
        sp.raw_title, sp.raw_vendor, sp.raw_product_type, sp.id as staging_id
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN variants v ON v.product_id = p.id
      LEFT JOIN merchant_offers mo ON mo.variant_id = v.id
      LEFT JOIN merchants m ON mo.merchant_id = m.id
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON pc.category_id = c.id AND c.parent_id IS NULL
      LEFT JOIN staging_products sp ON sp.merchant_id = mo.merchant_id 
        AND sp.raw_title LIKE '%' || SUBSTR(p.title, 1, 15) || '%'
        AND sp.status = 'NEEDS_REVIEW'
      WHERE mo.offer_status = 'PENDING_REVIEW'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/admin/review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
