import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/products/:productId - Get single product with full details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const db = getDb();

    const id = Number(productId);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }
    const product = db.prepare(`
      SELECT 
        p.id, p.title, p.slug, p.description, p.image_url, p.base_price,
        p.rating, p.review_count, p.status as product_status, p.specifications,
        b.name as brand_name, b.slug as brand_slug,
        v.internal_sku as sku, v.id as variant_id,
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
    `).get(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET /api/products/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
