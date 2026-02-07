import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/merchants/:merchantId - Get a single merchant with details
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ merchantId: string }> },
) {
	try {
		const { merchantId } = await params;
		const id = Number(merchantId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid merchant id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		const merchant = await db
			.prepare(
				`
				SELECT
					m.id,
					m.name,
					m.email,
					m.source_type,
					m.source_config,
					m.shopify_configured,
					m.is_active,
					m.created_at,
					m.updated_at
				FROM merchants m
				WHERE m.id = ?
			`,
			)
			.get(id);

		if (!merchant) {
			return NextResponse.json(
				{ error: "Merchant not found" },
				{ status: 404 },
			);
		}

		// Get product stats
		const stats = await db
			.prepare(
				`
				SELECT
					COALESCE(SUM(CASE WHEN mo.id IS NOT NULL THEN 1 ELSE 0 END), 0) as total_offers,
					COALESCE(SUM(CASE WHEN mo.is_active = true THEN 1 ELSE 0 END), 0) as active_offers
				FROM merchant_offers mo
				WHERE mo.merchant_id = ?
			`,
			)
			.get(id);

		// Get pending staging products count
		const pendingStats = await db
			.prepare(
				`
				SELECT COUNT(*) as pending_count
				FROM staging_products
				WHERE merchant_id = ? AND (status = 'PENDING' OR status = 'NEEDS_REVIEW')
			`,
			)
			.get(id);

		return NextResponse.json({
			...merchant,
			stats: {
				total_offers: (stats as Record<string, unknown>)?.total_offers ?? 0,
				active_offers: (stats as Record<string, unknown>)?.active_offers ?? 0,
				pending_reviews:
					(pendingStats as Record<string, unknown>)?.pending_count ?? 0,
			},
		});
	} catch (error) {
		console.error("GET /api/admin/merchants/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// PATCH /api/admin/merchants/:merchantId - Update a merchant
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ merchantId: string }> },
) {
	try {
		const { merchantId } = await params;
		const id = Number(merchantId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid merchant id" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { name, email, source_type, source_config, shopify_configured, is_active } = body;

		const db = getDb();

		// Check if merchant exists
		const existing = (await db
			.prepare("SELECT id FROM merchants WHERE id = ?")
			.get(id)) as { id: number } | undefined;

		if (!existing) {
			return NextResponse.json(
				{ error: "Merchant not found" },
				{ status: 404 },
			);
		}

		// Build update query dynamically
		const updates: string[] = [];
		const values: unknown[] = [];

		if (name !== undefined) {
			if (typeof name !== "string" || name.trim().length === 0) {
				return NextResponse.json(
					{ error: "Merchant name cannot be empty" },
					{ status: 400 },
				);
			}
			updates.push("name = ?");
			values.push(name.trim());
		}

		if (email !== undefined) {
			if (typeof email !== "string" || email.trim().length === 0) {
				return NextResponse.json(
					{ error: "Email cannot be empty" },
					{ status: 400 },
				);
			}
			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email.trim())) {
				return NextResponse.json(
					{ error: "Invalid email format" },
					{ status: 400 },
				);
			}
			// Check for duplicate email
			const duplicate = (await db
				.prepare(
					"SELECT id FROM merchants WHERE LOWER(email) = LOWER(?) AND id != ?",
				)
				.get(email.trim(), id)) as { id: number } | undefined;

			if (duplicate) {
				return NextResponse.json(
					{ error: "A merchant with this email already exists" },
					{ status: 409 },
				);
			}

			updates.push("email = ?");
			values.push(email.trim());
		}

		if (source_type !== undefined) {
			const validTypes = ["SHOPIFY", "WOOCOMMERCE", "MAGENTO", "MANUAL"];
			if (!validTypes.includes(source_type)) {
				return NextResponse.json(
					{ error: "Invalid source type" },
					{ status: 400 },
				);
			}
			updates.push("source_type = ?::ECOMMERCE_SOURCE");
			values.push(source_type);
		}

		if (source_config !== undefined) {
			updates.push("source_config = ?::jsonb");
			values.push(JSON.stringify(source_config));
		}

		if (shopify_configured !== undefined) {
			updates.push("shopify_configured = ?");
			values.push(Boolean(shopify_configured));
		}

		if (is_active !== undefined) {
			updates.push("is_active = ?");
			values.push(Boolean(is_active));
		}

		if (updates.length === 0) {
			return NextResponse.json(
				{ error: "No fields to update" },
				{ status: 400 },
			);
		}

		// Always update the updated_at timestamp
		updates.push("updated_at = NOW()");
		values.push(id);

		await db
			.prepare(`UPDATE merchants SET ${updates.join(", ")} WHERE id = ?`)
			.run(...values);

		// Fetch and return the updated merchant
		const merchant = await db
			.prepare(
				`
				SELECT id, name, email, source_type, shopify_configured, is_active, created_at, updated_at
				FROM merchants
				WHERE id = ?
			`,
			)
			.get(id);

		return NextResponse.json(merchant);
	} catch (error) {
		console.error("PATCH /api/admin/merchants/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// DELETE /api/admin/merchants/:merchantId - Delete a merchant
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ merchantId: string }> },
) {
	try {
		const { merchantId } = await params;
		const id = Number(merchantId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid merchant id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		// Check if merchant exists
		const existing = (await db
			.prepare("SELECT id, name FROM merchants WHERE id = ?")
			.get(id)) as { id: number; name: string } | undefined;

		if (!existing) {
			return NextResponse.json(
				{ error: "Merchant not found" },
				{ status: 404 },
			);
		}

		// Delete in order to respect foreign key constraints
		// 1. Delete staging variants linked to staging products
		await db
			.prepare(
				`
				DELETE FROM staging_variants
				WHERE staging_product_id IN (
					SELECT id FROM staging_products WHERE merchant_id = ?
				)
			`,
			)
			.run(id);

		// 2. Delete staging products
		await db.prepare("DELETE FROM staging_products WHERE merchant_id = ?").run(id);

		// 3. Delete offer price logs
		await db
			.prepare(
				`
				DELETE FROM offer_price_log
				WHERE offer_id IN (
					SELECT id FROM merchant_offers WHERE merchant_id = ?
				)
			`,
			)
			.run(id);

		// 4. Delete merchant offers
		await db.prepare("DELETE FROM merchant_offers WHERE merchant_id = ?").run(id);

		// 5. Delete margin rules
		await db.prepare("DELETE FROM margin_rules WHERE merchant_id = ?").run(id);

		// 6. Delete sync logs
		await db.prepare("DELETE FROM sync_logs WHERE merchant_id = ?").run(id);

		// 7. Finally delete the merchant
		await db.prepare("DELETE FROM merchants WHERE id = ?").run(id);

		return NextResponse.json({
			success: true,
			deleted_id: id,
			deleted_name: existing.name,
		});
	} catch (error) {
		console.error("DELETE /api/admin/merchants/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
