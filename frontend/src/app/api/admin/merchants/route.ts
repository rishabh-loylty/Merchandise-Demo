import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/merchants - Get all merchants (including inactive) with stats
export async function GET() {
	try {
		const db = getDb();
		const merchants = await db
			.prepare(
				`
			SELECT
				m.id,
				m.name,
				m.email,
				m.source_type,
				m.shopify_configured,
				m.is_active,
				m.created_at,
				COALESCE(product_stats.product_count, 0) as product_count,
				COALESCE(pending_stats.pending_count, 0) as pending_count
			FROM merchants m
			LEFT JOIN (
				SELECT merchant_id, COUNT(*) as product_count
				FROM merchant_offers
				GROUP BY merchant_id
			) product_stats ON product_stats.merchant_id = m.id
			LEFT JOIN (
				SELECT merchant_id, COUNT(*) as pending_count
				FROM staging_products
				WHERE status = 'PENDING' OR status = 'NEEDS_REVIEW'
				GROUP BY merchant_id
			) pending_stats ON pending_stats.merchant_id = m.id
			ORDER BY m.created_at DESC
		`,
			)
			.all();

		return NextResponse.json(merchants);
	} catch (error) {
		console.error("GET /api/admin/merchants error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// POST /api/admin/merchants - Create a new merchant (admin version with more options)
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, email, source_type } = body;

		if (!name || typeof name !== "string" || name.trim().length === 0) {
			return NextResponse.json(
				{ error: "Merchant name is required" },
				{ status: 400 },
			);
		}

		if (!email || typeof email !== "string" || email.trim().length === 0) {
			return NextResponse.json(
				{ error: "Email is required" },
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

		const db = getDb();

		// Check if merchant with same email already exists
		const existing = (await db
			.prepare("SELECT id FROM merchants WHERE LOWER(email) = LOWER(?)")
			.get(email.trim())) as { id: number } | undefined;

		if (existing) {
			return NextResponse.json(
				{ error: "A merchant with this email already exists" },
				{ status: 409 },
			);
		}

		// Create the merchant
		const sourceTypeValue = source_type || "SHOPIFY";
		const result = await db
			.prepare(
				`
			INSERT INTO merchants (name, email, source_type, source_config, shopify_configured, is_active, created_at, updated_at)
			VALUES (?, ?, ?::ECOMMERCE_SOURCE, ?::jsonb, false, true, NOW(), NOW())
			RETURNING id
		`,
			)
			.run(name.trim(), email.trim(), sourceTypeValue, JSON.stringify({}));

		const merchantId = result.lastInsertRowid;

		if (!merchantId) {
			throw new Error("Failed to create merchant");
		}

		// Fetch and return the created merchant
		const merchant = await db
			.prepare(
				`
			SELECT id, name, email, source_type, shopify_configured, is_active, created_at
			FROM merchants
			WHERE id = ?
		`,
			)
			.get(merchantId);

		return NextResponse.json(merchant, { status: 201 });
	} catch (error) {
		console.error("POST /api/admin/merchants error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
