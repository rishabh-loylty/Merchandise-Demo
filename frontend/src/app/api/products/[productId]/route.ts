import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper to extract unique option groups from variants (e.g. Color, Size)
function extractOptionGroups(variants: { attributes?: unknown }[]): { name: string; values: string[] }[] {
  const groups: Record<string, Set<string>> = {};

  variants.forEach((v) => {
    const attrs = v.attributes;
    if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) return;
    const obj = attrs as Record<string, unknown>;
    if (Object.keys(obj).length === 0) return;

    Object.entries(obj).forEach(([key, value]) => {
      if (!groups[key]) groups[key] = new Set();
      groups[key].add(String(value));
    });
  });

  return Object.entries(groups).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }));
}

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
      let attrs = variant.attributes;
      if (typeof attrs === "string") {
        try {
          attrs = JSON.parse(attrs);
        } catch {
          attrs = {};
        }
      }
      if (attrs == null) attrs = {};
      return { ...variant, attributes: attrs };
    });

    const available_options = extractOptionGroups(normalizedVariants);

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

    // Normalize numeric fields (DB may return strings for numeric/decimal types)
    const toNum = (x: unknown): number =>
      typeof x === "number" ? x : typeof x === "string" ? parseFloat(x) || 0 : 0;
    const toInt = (x: unknown): number =>
      typeof x === "number" ? x : typeof x === "string" ? parseInt(x, 10) || 0 : 0;

    const productPayload = {
      ...product,
      base_price: toNum(product.base_price),
      rating: toNum(product.rating),
      review_count: toInt(product.review_count),
      cached_price_minor: toNum(product.cached_price_minor),
      current_stock: toInt(product.current_stock),
    };

    const offersPayload = (offers as { cached_price_minor?: unknown; current_stock?: unknown }[]).map(
      (o) => ({
        ...o,
        cached_price_minor: toNum(o.cached_price_minor),
        current_stock: toInt(o.current_stock),
      })
    );

    return NextResponse.json({
      ...productPayload,
      variants: normalizedVariants,
      available_options,
      offers: offersPayload,
    });
  } catch (error) {
    console.error("GET /api/products/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
