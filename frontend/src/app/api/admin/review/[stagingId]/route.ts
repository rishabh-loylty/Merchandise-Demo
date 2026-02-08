import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/review/:stagingId - Get single staging product for review modal
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ stagingId: string }> }
) {
  try {
    const { stagingId } = await params;
    const idNum = Number(stagingId);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "Invalid staging id" }, { status: 400 });
    }
    const db = getDb();

    const row = await db.prepare(`
      SELECT 
        sp.id as staging_id,
        sp.merchant_id,
        sp.raw_title as title,
        sp.raw_vendor as vendor,
        sp.raw_product_type as product_type,
        sp.raw_body_html,
        sp.raw_json_dump,
        sp.match_confidence_score,
        sp.suggested_product_id,
        sp.admin_notes,
        sp.created_at,
        sp.updated_at,
        m.name as merchant_name,
        p.id as suggested_product_id,
        p.title as suggested_title,
        p.image_url as suggested_image_url,
        p.slug as suggested_slug
      FROM staging_products sp
      JOIN merchants m ON sp.merchant_id = m.id
      LEFT JOIN products p ON sp.suggested_product_id = p.id
      WHERE sp.id = ?
    `).get(idNum);

    if (!row) {
      return NextResponse.json({ error: "Staging product not found" }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (error) {
    console.error("GET /api/admin/review/[stagingId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/review/:stagingId - Approve (new or match) or Reject
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stagingId: string }> }
) {
  try {
    const { stagingId } = await params;
    const body = await request.json();
    const {
      action,
      suggested_product_id,
      rejection_reason,
      admin_notes,
      brand_id,
      category_id,
    } = body as {
      action: string;
      suggested_product_id?: number;
      rejection_reason?: string;
      admin_notes?: string;
      brand_id?: number | null;
      category_id?: number | null;
    };
    const db = getDb();
    const idNum = Number(stagingId);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "Invalid staging id" }, { status: 400 });
    }

    const stagingProduct = (await db.prepare(`
      SELECT * FROM staging_products WHERE id = ?
    `).get(idNum)) as {
      id: number;
      merchant_id: number;
      raw_title: string;
      raw_body_html: string | null;
      raw_json_dump: string | Record<string, unknown>;
      suggested_product_id: number | null;
    } | undefined;

    if (!stagingProduct) {
      return NextResponse.json({ error: "Staging product not found" }, { status: 404 });
    }

    // Safely parse raw_json_dump — Neon returns JSONB as already-parsed objects
    const parseDump = (dump: string | Record<string, unknown> | null) => {
      if (!dump) return null;
      if (typeof dump === "object") return dump;
      try { return JSON.parse(dump); } catch { return null; }
    };

    if (action === "approve_new") {
      const raw = (parseDump(stagingProduct.raw_json_dump) ?? { handle: "", id: 0, variants: [], options: [] }) as {
        handle?: string;
        id: number;
        image?: { src?: string };
        images?: { src?: string }[];
        variants?: { price?: string; sku?: string; id: number; barcode?: string; grams?: number; inventory_quantity?: number; option1?: string; option2?: string; option3?: string }[];
        options?: { name: string; position: number }[];
      };
      const slug = `${raw.handle ?? "product"}-${stagingProduct.merchant_id}-${Date.now()}`.replace(/\s+/g, "-");
      const firstVariant = raw.variants?.[0];
      const basePrice = Math.round(parseFloat(firstVariant?.price ?? "0") * 100);
      const imageUrl =
        raw.image?.src ?? raw.images?.[0]?.src ?? "https://placehold.co/400x400?text=No+Image";

      // Insert product with optional brand_id
      const productResult = await db.prepare(`
        INSERT INTO products (title, slug, description, image_url, base_price, brand_id, status)
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
        RETURNING id
      `).run(
        stagingProduct.raw_title,
        slug,
        stagingProduct.raw_body_html ?? "",
        imageUrl,
        basePrice,
        brand_id ?? null
      );
      const productId = (productResult as { lastInsertRowid?: number }).lastInsertRowid;
      if (productId == null) throw new Error("Product insert failed");

      // Insert product category - use provided category_id or fallback to first root category
      if (category_id) {
        await db.prepare(`
          INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)
        `).run(productId, category_id);
      } else {
        await db.prepare(`
          INSERT INTO product_categories (product_id, category_id)
          SELECT ?, id FROM categories WHERE parent_id IS NULL LIMIT 1
        `).run(productId);
      }

      for (const v of raw.variants ?? []) {
        const attrs: Record<string, string> = {};
        if (v.option1 && raw.options?.[0]) attrs[raw.options[0].name] = v.option1;
        if (v.option2 && raw.options?.[1]) attrs[raw.options[1].name] = v.option2;
        if (v.option3 && raw.options?.[2]) attrs[raw.options[2].name] = v.option3;

        const uniqueSku = `${v.sku ?? raw.id}-${Date.now()}-${v.id}`.replace(/\s/g, "-");
        const varResult = await db.prepare(`
          INSERT INTO variants (product_id, internal_sku, gtin, weight_grams, attributes, is_active)
          VALUES (?, ?, ?, ?, ?::jsonb, true)
          RETURNING id
        `).run(productId, uniqueSku, v.barcode ?? null, v.grams ?? null, JSON.stringify(attrs));
        const variantId = (varResult as { lastInsertRowid?: number }).lastInsertRowid;
        if (variantId == null) throw new Error("Variant insert failed");
        const priceMinor = Math.round(parseFloat(v.price ?? "0") * 100);
        await db.prepare(`
          INSERT INTO merchant_offers (
            merchant_id, variant_id, external_product_id, external_variant_id,
            merchant_sku, currency_code, cached_price_minor, cached_settlement_price_minor,
            current_stock, offer_status, is_active, last_synced_at
          )
          VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, 'LIVE', true, NOW())
        `).run(
          stagingProduct.merchant_id,
          variantId,
          String(raw.id),
          String(v.id),
          v.sku ?? uniqueSku,
          priceMinor,
          Math.round(priceMinor * 0.95),
          v.inventory_quantity ?? 0
        );
      }

      await db.prepare(`
        UPDATE staging_products SET status = 'APPROVED', admin_notes = ?, updated_at = NOW() WHERE id = ?
      `).run(admin_notes ?? null, idNum);
    } else if (action === "approve_match") {
      const targetProductId = suggested_product_id ?? stagingProduct.suggested_product_id;
      if (!targetProductId) {
        return NextResponse.json({ error: "No target product for match" }, { status: 400 });
      }

      const raw = (parseDump(stagingProduct.raw_json_dump) ?? { id: 0, variants: [], options: [] }) as {
        id: number;
        variants?: { price?: string; sku?: string; id: number; barcode?: string; grams?: number; inventory_quantity?: number; option1?: string; option2?: string; option3?: string }[];
        options?: { name: string; position: number }[];
      };

      // Get variant mappings from request body if provided (admin-selected mappings)
      const variantMappings = (body.variant_mappings ?? {}) as Record<string, number | null>;

      for (const v of raw.variants ?? []) {
        const gtin = v.barcode ?? null;
        let variantId: number | undefined;

        // 1. Check if admin explicitly mapped this variant
        const explicitMapping = variantMappings[String(v.id)];
        if (explicitMapping !== undefined) {
          if (explicitMapping === null) {
            // Admin said "create new variant"
            variantId = undefined;
          } else {
            // Admin selected a specific master variant
            variantId = explicitMapping;
          }
        }

        // 2. If no explicit mapping, try GLOBAL GTIN search (not just within target product)
        if (variantId === undefined && gtin) {
          const globalMatch = (await db.prepare(`
            SELECT id, product_id FROM variants
            WHERE gtin = ? AND is_active = true
            LIMIT 1
          `).get(gtin)) as { id: number; product_id: number } | undefined;
          
          if (globalMatch) {
            variantId = globalMatch.id;
            // Log if found in different product (data quality insight)
            if (globalMatch.product_id !== targetProductId) {
              console.log(`GTIN ${gtin} found in product ${globalMatch.product_id}, linking to it instead of ${targetProductId}`);
            }
          }
        }

        // 3. If still no match, try to find by attributes within target product
        if (variantId === undefined && raw.options && raw.options.length > 0) {
          // Build attribute object for matching
          const attrs: Record<string, string> = {};
          if (v.option1 && raw.options[0]) attrs[raw.options[0].name.toLowerCase()] = v.option1.toLowerCase();
          if (v.option2 && raw.options[1]) attrs[raw.options[1].name.toLowerCase()] = v.option2.toLowerCase();
          if (v.option3 && raw.options[2]) attrs[raw.options[2].name.toLowerCase()] = v.option3.toLowerCase();

          if (Object.keys(attrs).length > 0) {
            // Try to find existing variant with matching attributes
            const existingVariants = (await db.prepare(`
              SELECT id, attributes FROM variants
              WHERE product_id = ? AND is_active = true
            `).all(targetProductId)) as { id: number; attributes: Record<string, string> | string }[];

            for (const ev of existingVariants) {
              const evAttrs = typeof ev.attributes === 'string' 
                ? JSON.parse(ev.attributes) 
                : (ev.attributes ?? {});
              
              // Normalize and compare
              const normalizedEvAttrs: Record<string, string> = {};
              for (const [k, val] of Object.entries(evAttrs)) {
                normalizedEvAttrs[k.toLowerCase()] = String(val).toLowerCase();
              }

              // Check if all staging attrs match
              let allMatch = true;
              for (const [k, val] of Object.entries(attrs)) {
                if (normalizedEvAttrs[k] !== val) {
                  allMatch = false;
                  break;
                }
              }

              if (allMatch && Object.keys(attrs).length === Object.keys(normalizedEvAttrs).length) {
                variantId = ev.id;
                break;
              }
            }
          }
        }

        // 4. If still no match, create new variant under target product
        if (variantId === undefined) {
          // Build attributes from options
          const attrs: Record<string, string> = {};
          if (v.option1 && raw.options?.[0]) attrs[raw.options[0].name] = v.option1;
          if (v.option2 && raw.options?.[1]) attrs[raw.options[1].name] = v.option2;
          if (v.option3 && raw.options?.[2]) attrs[raw.options[2].name] = v.option3;

          const uniqueSku = `${targetProductId}-${v.sku ?? v.id}-${Date.now()}`;
          const varResult = await db.prepare(`
            INSERT INTO variants (product_id, internal_sku, gtin, mpn, weight_grams, attributes, is_active)
            VALUES (?, ?, ?, ?, ?, ?::jsonb, true)
            RETURNING id
          `).run(
            targetProductId, 
            uniqueSku, 
            gtin, 
            v.sku ?? null,  // Use SKU as MPN
            v.grams ?? null,
            JSON.stringify(attrs)
          );
          const insertedId = (varResult as { lastInsertRowid?: number }).lastInsertRowid;
          if (insertedId == null) throw new Error("Variant insert failed");
          variantId = insertedId;
        }

        // Create/update merchant offer
        const priceMinor = Math.round(parseFloat(v.price ?? "0") * 100);
        await db.prepare(`
          INSERT INTO merchant_offers (
            merchant_id, variant_id, external_product_id, external_variant_id,
            merchant_sku, currency_code, cached_price_minor, cached_settlement_price_minor,
            current_stock, offer_status, is_active, last_synced_at
          )
          VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, 'LIVE', true, NOW())
          ON CONFLICT (merchant_id, variant_id) DO UPDATE SET
            external_product_id = EXCLUDED.external_product_id,
            external_variant_id = EXCLUDED.external_variant_id,
            cached_price_minor = EXCLUDED.cached_price_minor,
            cached_settlement_price_minor = EXCLUDED.cached_settlement_price_minor,
            current_stock = EXCLUDED.current_stock,
            last_synced_at = NOW(),
            updated_at = NOW()
        `).run(
          stagingProduct.merchant_id,
          variantId,
          String(raw.id),
          String(v.id),
          v.sku ?? `sku-${v.id}`,
          priceMinor,
          Math.round(priceMinor * 0.95),
          v.inventory_quantity ?? 0
        );
      }

      await db.prepare(`
        UPDATE staging_products SET status = 'APPROVED', admin_notes = ?, updated_at = NOW() WHERE id = ?
      `).run(admin_notes ?? null, idNum);
    } else if (action === "reject") {
      await db.prepare(`
        UPDATE staging_products SET
          status = 'REJECTED',
          rejection_reason = ?,
          admin_notes = ?,
          updated_at = NOW()
        WHERE id = ?
      `).run(rejection_reason ?? "Rejected", admin_notes ?? null, idNum);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use approve_new, approve_match, or reject" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/review/[stagingId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
