import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// PATCH /api/admin/review/:productId - Approve or reject a product
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> },
) {
	try {
		const { productId } = await params;
		const id = Number(productId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid product id" },
				{ status: 400 },
			);
		}
		const body = await request.json();
		const { action, title, brand_id, category_id, rejection_reason } = body;

		const db = getDb();

		if (action === "approve") {
			// Update product master data if provided
			if (title) {
				await db
					.prepare(
						"UPDATE products SET title = ?, updated_at = NOW() WHERE id = ?",
					)
					.run(title, id);
			}
			if (brand_id) {
				await db
					.prepare(
						"UPDATE products SET brand_id = ?, updated_at = NOW() WHERE id = ?",
					)
					.run(brand_id, id);
			}
			if (category_id) {
				// Update product_categories
				await db
					.prepare("DELETE FROM product_categories WHERE product_id = ?")
					.run(id);
				// Get top-level category for the selected category
				const cat = (await db
					.prepare("SELECT id, parent_id FROM categories WHERE id = ?")
					.get(category_id)) as
					| { id: number; parent_id: number | null }
					| undefined;
				if (cat) {
					const topCatId = cat.parent_id ?? cat.id;
					await db
						.prepare(
							"INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)",
						)
						.run(id, topCatId);
					if (cat.parent_id) {
						// Also link sub-category
						await db
							.prepare(
								"INSERT INTO product_categories (product_id, category_id) VALUES (?, ?) ON CONFLICT (product_id, category_id) DO NOTHING",
							)
							.run(id, cat.id);
					}
				}
			}

			// Update offer status to LIVE
			await db
				.prepare(
					`
        UPDATE merchant_offers SET offer_status = 'LIVE', updated_at = NOW()
        WHERE variant_id IN (SELECT id FROM variants WHERE product_id = ?)
      `,
				)
				.run(id);

			// Update staging product status to APPROVED
			await db
				.prepare(
					`
        UPDATE staging_products SET status = 'APPROVED', rejection_reason = NULL, updated_at = NOW()
        WHERE merchant_id IN (
          SELECT mo.merchant_id FROM merchant_offers mo
          JOIN variants v ON mo.variant_id = v.id
          WHERE v.product_id = ?
        ) AND status IN ('NEEDS_REVIEW', 'PENDING', 'AUTO_MATCHED')
      `,
				)
				.run(id);

			return NextResponse.json({ success: true, action: "approved" });
		}

		if (action === "reject") {
			// Validate rejection reason
			if (
				!rejection_reason ||
				typeof rejection_reason !== "string" ||
				rejection_reason.trim().length === 0
			) {
				return NextResponse.json(
					{ error: "Rejection reason is required" },
					{ status: 400 },
				);
			}

			const trimmedReason = rejection_reason.trim();

			// Update offer status - keep is_active but set offer_status to indicate rejection
			// We don't set is_active to false so the product can be resubmitted
			await db
				.prepare(
					`
        UPDATE merchant_offers SET offer_status = 'REJECTED', updated_at = NOW()
        WHERE variant_id IN (SELECT id FROM variants WHERE product_id = ?)
      `,
				)
				.run(id);

			// Update staging product status with rejection reason
			await db
				.prepare(
					`
        UPDATE staging_products SET status = 'REJECTED', rejection_reason = ?, updated_at = NOW()
        WHERE merchant_id IN (
          SELECT mo.merchant_id FROM merchant_offers mo
          JOIN variants v ON mo.variant_id = v.id
          WHERE v.product_id = ?
        ) AND status IN ('NEEDS_REVIEW', 'PENDING', 'AUTO_MATCHED')
      `,
				)
				.run(trimmedReason, id);

			// Archive the product (can be restored if merchant resubmits)
			await db
				.prepare(
					"UPDATE products SET status = 'ARCHIVED', updated_at = NOW() WHERE id = ?",
				)
				.run(id);

			return NextResponse.json({
				success: true,
				action: "rejected",
				rejection_reason: trimmedReason,
			});
		}

		return NextResponse.json(
			{ error: "Invalid action. Use 'approve' or 'reject'" },
			{ status: 400 },
		);
	} catch (error) {
		console.error("PATCH /api/admin/review/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// GET /api/admin/review/:productId - Get single product details for review
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> },
) {
	try {
		const { productId } = await params;
		const id = Number(productId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid product id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		const product = await db
			.prepare(
				`
      SELECT
        p.id, p.title, p.slug, p.description, p.image_url, p.base_price,
        p.rating, p.review_count, p.status as product_status, p.specifications,
        b.id as brand_id, b.name as brand_name, b.slug as brand_slug,
        v.internal_sku as sku, v.id as variant_id,
        mo.offer_status, mo.merchant_id, mo.cached_price_minor, mo.current_stock, mo.id as offer_id,
        m.name as merchant_name,
        c.id as category_id, c.slug as category_slug, c.name as category_name,
        sp.raw_title, sp.raw_vendor, sp.raw_product_type, sp.raw_tags, sp.status as staging_status,
        sp.rejection_reason, sp.id as staging_id
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN variants v ON v.product_id = p.id
      LEFT JOIN merchant_offers mo ON mo.variant_id = v.id
      LEFT JOIN merchants m ON mo.merchant_id = m.id
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON pc.category_id = c.id AND c.parent_id IS NULL
      LEFT JOIN staging_products sp ON sp.merchant_id = mo.merchant_id
        AND sp.external_product_id = mo.external_product_id
      WHERE p.id = ?
      ORDER BY v.id
      LIMIT 1
    `,
			)
			.get(id);

		if (!product) {
			return NextResponse.json({ error: "Product not found" }, { status: 404 });
		}

		// Get all images
		const images = (await db
			.prepare(
				`
      SELECT src_url, alt_text, position
      FROM media
      WHERE product_id = ?
      ORDER BY position
    `,
			)
			.all(id)) as Array<{
			src_url: string;
			alt_text: string;
			position: number;
		}>;

		// Get all variants
		const variants = await db
			.prepare(
				`
      SELECT id, internal_sku, gtin, weight_grams, attributes, is_active
      FROM variants
      WHERE product_id = ?
      ORDER BY id
    `,
			)
			.all(id);

		return NextResponse.json({
			...product,
			images: images.map((img) => img.src_url),
			variants,
		});
	} catch (error) {
		console.error("GET /api/admin/review/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
