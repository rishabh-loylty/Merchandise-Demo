import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/products/search - Search master catalog products for matching
// Query params: q (search query), limit (default 20)
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    // Search by title, brand name, or GTIN
    // Using a subquery to handle DISTINCT properly with ORDER BY
    const products = await db
      .prepare(
        `
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.image_url,
        p.base_price,
        p.status,
        b.id as brand_id,
        b.name as brand_name,
        (SELECT COUNT(*) FROM variants v WHERE v.product_id = p.id) as variant_count,
        (SELECT COUNT(DISTINCT mo.merchant_id) FROM variants v 
         JOIN merchant_offers mo ON mo.variant_id = v.id 
         WHERE v.product_id = p.id AND mo.is_active = true) as merchant_count
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'ACTIVE'
        AND (
          LOWER(p.title) LIKE ?
          OR LOWER(b.name) LIKE ?
          OR EXISTS (
            SELECT 1 FROM variants v 
            WHERE v.product_id = p.id 
            AND (v.gtin = ? OR v.internal_sku LIKE ?)
          )
        )
      ORDER BY 
        CASE WHEN LOWER(p.title) LIKE ? THEN 0 ELSE 1 END,
        p.title
      LIMIT ?
    `
      )
      .all(
        `%${query.toLowerCase()}%`,
        `%${query.toLowerCase()}%`,
        query, // exact GTIN match
        `%${query}%`,
        `${query.toLowerCase()}%`, // prioritize starts-with matches
        limit
      );

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/admin/products/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
