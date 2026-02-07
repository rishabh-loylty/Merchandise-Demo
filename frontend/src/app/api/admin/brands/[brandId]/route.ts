import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/brands/:brandId - Get a single brand with details
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ brandId: string }> },
) {
	try {
		const { brandId } = await params;
		const id = Number(brandId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid brand id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		const brand = await db
			.prepare(
				`
				SELECT
					b.id,
					b.name,
					b.slug,
					b.logo_url,
					b.is_active,
					b.created_at
				FROM brands b
				WHERE b.id = ?
			`,
			)
			.get(id);

		if (!brand) {
			return NextResponse.json(
				{ error: "Brand not found" },
				{ status: 404 },
			);
		}

		// Get product count
		const productStats = await db
			.prepare(
				`
				SELECT COUNT(*) as product_count
				FROM products
				WHERE brand_id = ?
			`,
			)
			.get(id);

		return NextResponse.json({
			...brand,
			product_count: (productStats as Record<string, unknown>)?.product_count ?? 0,
		});
	} catch (error) {
		console.error("GET /api/admin/brands/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// PATCH /api/admin/brands/:brandId - Update a brand
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ brandId: string }> },
) {
	try {
		const { brandId } = await params;
		const id = Number(brandId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid brand id" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { name, slug, logo_url, is_active } = body;

		const db = getDb();

		// Check if brand exists
		const existing = (await db
			.prepare("SELECT id FROM brands WHERE id = ?")
			.get(id)) as { id: number } | undefined;

		if (!existing) {
			return NextResponse.json(
				{ error: "Brand not found" },
				{ status: 404 },
			);
		}

		// Build update query dynamically
		const updates: string[] = [];
		const values: unknown[] = [];

		if (name !== undefined) {
			if (typeof name !== "string" || name.trim().length === 0) {
				return NextResponse.json(
					{ error: "Brand name cannot be empty" },
					{ status: 400 },
				);
			}
			// Check for duplicate name
			const duplicateName = (await db
				.prepare(
					"SELECT id FROM brands WHERE LOWER(name) = LOWER(?) AND id != ?",
				)
				.get(name.trim(), id)) as { id: number } | undefined;

			if (duplicateName) {
				return NextResponse.json(
					{ error: "A brand with this name already exists" },
					{ status: 409 },
				);
			}

			updates.push("name = ?");
			values.push(name.trim());
		}

		if (slug !== undefined) {
			if (typeof slug !== "string" || slug.trim().length === 0) {
				return NextResponse.json(
					{ error: "Slug cannot be empty" },
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

			// Check for duplicate slug
			const duplicateSlug = (await db
				.prepare("SELECT id FROM brands WHERE slug = ? AND id != ?")
				.get(slug.trim(), id)) as { id: number } | undefined;

			if (duplicateSlug) {
				return NextResponse.json(
					{ error: "A brand with this slug already exists" },
					{ status: 409 },
				);
			}

			updates.push("slug = ?");
			values.push(slug.trim());
		}

		if (logo_url !== undefined) {
			updates.push("logo_url = ?");
			values.push(logo_url?.trim() || null);
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

		values.push(id);
		await db
			.prepare(`UPDATE brands SET ${updates.join(", ")} WHERE id = ?`)
			.run(...values);

		// Fetch and return the updated brand
		const brand = await db
			.prepare(
				`
				SELECT id, name, slug, logo_url, is_active, created_at
				FROM brands
				WHERE id = ?
			`,
			)
			.get(id);

		return NextResponse.json(brand);
	} catch (error) {
		console.error("PATCH /api/admin/brands/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// DELETE /api/admin/brands/:brandId - Delete a brand
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ brandId: string }> },
) {
	try {
		const { brandId } = await params;
		const id = Number(brandId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid brand id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		// Check if brand exists
		const existing = (await db
			.prepare("SELECT id, name FROM brands WHERE id = ?")
			.get(id)) as { id: number; name: string } | undefined;

		if (!existing) {
			return NextResponse.json(
				{ error: "Brand not found" },
				{ status: 404 },
			);
		}

		// Check if brand is used by any products
		const productCount = (await db
			.prepare("SELECT COUNT(*) as count FROM products WHERE brand_id = ?")
			.get(id)) as { count: number };

		if (productCount.count > 0) {
			return NextResponse.json(
				{
					error: `Cannot delete brand. It is used by ${productCount.count} product(s). Please reassign or delete those products first.`,
				},
				{ status: 409 },
			);
		}

		// Check if brand is used by any margin rules
		const marginRuleCount = (await db
			.prepare("SELECT COUNT(*) as count FROM margin_rules WHERE brand_id = ?")
			.get(id)) as { count: number };

		if (marginRuleCount.count > 0) {
			// Delete associated margin rules
			await db.prepare("DELETE FROM margin_rules WHERE brand_id = ?").run(id);
		}

		// Delete the brand
		await db.prepare("DELETE FROM brands WHERE id = ?").run(id);

		return NextResponse.json({
			success: true,
			deleted_id: id,
			deleted_name: existing.name,
		});
	} catch (error) {
		console.error("DELETE /api/admin/brands/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
