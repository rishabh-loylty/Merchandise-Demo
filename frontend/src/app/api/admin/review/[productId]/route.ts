import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/review/:productId - Approve or reject a product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const id = Number(productId);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }
    const body = await request.json();
    const { action, title, brand_id, category_id } = body;

    const db = getDb();

    if (action === "approve") {
      // Update product master data if provided
      if (title) {
        db.prepare("UPDATE products SET title = ?, updated_at = datetime('now') WHERE id = ?").run(title, id);
      }
      if (brand_id) {
        db.prepare("UPDATE products SET brand_id = ?, updated_at = datetime('now') WHERE id = ?").run(brand_id, id);
      }
      if (category_id) {
        // Update product_categories
        db.prepare("DELETE FROM product_categories WHERE product_id = ?").run(id);
        // Get top-level category for the selected category
        const cat = db.prepare("SELECT id, parent_id FROM categories WHERE id = ?").get(category_id) as { id: number; parent_id: number | null } | undefined;
        if (cat) {
          const topCatId = cat.parent_id ?? cat.id;
          db.prepare("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)").run(id, topCatId);
          if (cat.parent_id) {
            // Also link sub-category
            db.prepare("INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)").run(id, cat.id);
          }
        }
      }

      // Update offer status to LIVE
      db.prepare(`
        UPDATE merchant_offers SET offer_status = 'LIVE', updated_at = datetime('now')
        WHERE variant_id IN (SELECT id FROM variants WHERE product_id = ?)
      `).run(id);

      // Update staging product status
      db.prepare(`
        UPDATE staging_products SET status = 'APPROVED', updated_at = datetime('now')
        WHERE merchant_id IN (
          SELECT mo.merchant_id FROM merchant_offers mo
          JOIN variants v ON mo.variant_id = v.id
          WHERE v.product_id = ?
        ) AND status = 'NEEDS_REVIEW'
      `).run(id);

      return NextResponse.json({ success: true, action: "approved" });
    }

    if (action === "reject") {
      // Update offer status to inactive
      db.prepare(`
        UPDATE merchant_offers SET is_active = 0, offer_status = 'PENDING_REVIEW', updated_at = datetime('now')
        WHERE variant_id IN (SELECT id FROM variants WHERE product_id = ?)
      `).run(id);

      // Update staging product status
      db.prepare(`
        UPDATE staging_products SET status = 'REJECTED', rejection_reason = ?, updated_at = datetime('now')
        WHERE merchant_id IN (
          SELECT mo.merchant_id FROM merchant_offers mo
          JOIN variants v ON mo.variant_id = v.id
          WHERE v.product_id = ?
        ) AND status = 'NEEDS_REVIEW'
      `).run(body.rejection_reason || "Rejected by admin", id);

      // Archive the product
      db.prepare("UPDATE products SET status = 'ARCHIVED', updated_at = datetime('now') WHERE id = ?").run(id);

      return NextResponse.json({ success: true, action: "rejected" });
    }

    return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/admin/review/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
