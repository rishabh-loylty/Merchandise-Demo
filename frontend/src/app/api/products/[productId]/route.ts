import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    const product = await db.prepare(`
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
      ORDER BY (mo.offer_status IS NULL), v.id
      LIMIT 1
    `).get(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variants = await db.prepare(`
      SELECT id, internal_sku, attributes, is_active
      FROM variants
      WHERE product_id = ? AND is_active = true
      ORDER BY id
    `).all(id);

    const normalizedVariants = variants.map((variant) => {
      const attributes = variant.attributes;
      if (typeof attributes === "string") {
        try {
          return { ...variant, attributes: JSON.parse(attributes) };
        } catch {
          return variant;
        }
      }
      return variant;
    });

    const offers = await db.prepare(`
      SELECT
        mo.id, mo.merchant_id, mo.variant_id, mo.offer_status,
        mo.cached_price_minor, mo.current_stock,
        m.name as merchant_name
      FROM merchant_offers mo
      JOIN merchants m ON mo.merchant_id = m.id
      JOIN variants v ON v.id = mo.variant_id
      WHERE v.product_id = ? AND mo.is_active = true
      ORDER BY m.name
    `).all(id);

    return NextResponse.json({
      ...product,
      variants: normalizedVariants,
      offers,
    });
  } catch (error) {
    console.error("GET /api/products/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
