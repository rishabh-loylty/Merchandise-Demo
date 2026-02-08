import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

// PATCH is in [stagingId]/route.ts — PATCH /api/admin/review/:stagingId

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
