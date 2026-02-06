import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/products - List products with filters
// Query params: status, category, query, brands, minPrice, maxPrice, minRating, merchantId
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status"); // LIVE, PENDING_REVIEW, or all
    const category = searchParams.get("category");
    const query = searchParams.get("q");
    const brandsParam = searchParams.get("brands");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");
    const merchantId = searchParams.get("merchantId");

    let sql = `
      SELECT * FROM (
        SELECT DISTINCT ON (p.id)
          p.id, p.title, p.slug, p.description, p.image_url, p.base_price,
          p.rating, p.review_count, p.status as product_status, p.created_at,
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
        WHERE p.status = 'ACTIVE'
    `;

    const params: unknown[] = [];

    // Filter by offer status (LIVE or PENDING_REVIEW)
    if (status && status !== "all") {
      sql += " AND mo.offer_status = ?";
      params.push(status);
    }

    // Filter by category
    if (category) {
      sql += ` AND (c.slug = ? OR pc.category_id IN (SELECT id FROM categories WHERE slug = ?))`;
      params.push(category, category);
    }

    // Text search
    if (query) {
      sql += " AND (LOWER(p.title) LIKE ? OR LOWER(b.name) LIKE ? OR LOWER(p.description) LIKE ?)";
      const q = `%${query.toLowerCase()}%`;
      params.push(q, q, q);
    }

    // Brand filter
    if (brandsParam) {
      const brands = brandsParam.split(",");
      const placeholders = brands.map(() => "?").join(",");
      sql += ` AND b.name IN (${placeholders})`;
      params.push(...brands);
    }

    // Price range
    if (minPrice) {
      sql += " AND p.base_price >= ?";
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      sql += " AND p.base_price <= ?";
      params.push(Number(maxPrice));
    }

    // Rating
    if (minRating) {
      sql += " AND p.rating >= ?";
      params.push(Number(minRating));
    }

    // Merchant filter
    if (merchantId) {
      sql += " AND mo.merchant_id = ?";
      params.push(Number(merchantId));
    }

    sql += " ORDER BY p.id, (mo.offer_status IS NULL), v.id, p.created_at DESC) AS product_rows ORDER BY created_at DESC";

    const products = await db.prepare(sql).all(...params);

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
