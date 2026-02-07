import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/brands - Get all brands (including inactive) with product counts
export async function GET() {
	try {
		const db = getDb();
		const brands = await db
			.prepare(
				`
				SELECT
					b.id,
					b.name,
					b.slug,
					b.logo_url,
					b.is_active,
					b.created_at,
					COALESCE(product_stats.product_count, 0) as product_count
				FROM brands b
				LEFT JOIN (
					SELECT brand_id, COUNT(*) as product_count
					FROM products
					GROUP BY brand_id
				) product_stats ON product_stats.brand_id = b.id
				ORDER BY b.name
			`,
			)
			.all();

		return NextResponse.json(brands);
	} catch (error) {
		console.error("GET /api/admin/brands error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// POST /api/admin/brands - Create a new brand
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, slug, logo_url } = body;

		if (!name || typeof name !== "string" || name.trim().length === 0) {
			return NextResponse.json(
				{ error: "Brand name is required" },
				{ status: 400 },
			);
		}

		if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
			return NextResponse.json(
				{ error: "Slug is required" },
				{ status: 400 },
			);
		}

		// Validate slug format
		const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
		if (!slugRegex.test(slug.trim())) {
			return NextResponse.json(
				{ error: "Invalid slug format. Use lowercase letters, numbers, and hyphens only." },
				{ status: 400 },
			);
		}

		const db = getDb();

		// Check if brand with same name already exists
		const existingName = (await db
			.prepare("SELECT id FROM brands WHERE LOWER(name) = LOWER(?)")
			.get(name.trim())) as { id: number } | undefined;

		if (existingName) {
			return NextResponse.json(
				{ error: "A brand with this name already exists" },
				{ status: 409 },
			);
		}

		// Check if brand with same slug already exists
		const existingSlug = (await db
			.prepare("SELECT id FROM brands WHERE slug = ?")
			.get(slug.trim())) as { id: number } | undefined;

		if (existingSlug) {
			return NextResponse.json(
				{ error: "A brand with this slug already exists" },
				{ status: 409 },
			);
		}

		// Create the brand
		const result = await db
			.prepare(
				`
				INSERT INTO brands (name, slug, logo_url, is_active, created_at)
				VALUES (?, ?, ?, true, NOW())
				RETURNING id
			`,
			)
			.run(name.trim(), slug.trim(), logo_url?.trim() || null);

		const brandId = result.lastInsertRowid;

		if (!brandId) {
			throw new Error("Failed to create brand");
		}

		// Fetch and return the created brand
		const brand = await db
			.prepare(
				`
				SELECT id, name, slug, logo_url, is_active, created_at
				FROM brands
				WHERE id = ?
			`,
			)
			.get(brandId);

		return NextResponse.json(brand, { status: 201 });
	} catch (error) {
		console.error("POST /api/admin/brands error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
