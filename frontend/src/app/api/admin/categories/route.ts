import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/categories - Get all categories (including inactive) with product counts
export async function GET() {
	try {
		const db = getDb();
		const categories = await db
			.prepare(
				`
				SELECT
					c.id,
					c.parent_id,
					c.name,
					c.slug,
					c.icon,
					c.path,
					c.is_active,
					COALESCE(product_stats.product_count, 0) as product_count
				FROM categories c
				LEFT JOIN (
					SELECT category_id, COUNT(*) as product_count
					FROM product_categories
					GROUP BY category_id
				) product_stats ON product_stats.category_id = c.id
				ORDER BY CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END, c.parent_id, c.name
			`,
			)
			.all();

		// Build hierarchy for response
		const categoryMap = new Map<number, Record<string, unknown>>();
		const result: Record<string, unknown>[] = [];

		// First pass: create all categories in map
		for (const cat of categories as Record<string, unknown>[]) {
			categoryMap.set(cat.id as number, { ...cat, children: [] });
		}

		// Second pass: build tree structure
		for (const cat of categories as Record<string, unknown>[]) {
			const category = categoryMap.get(cat.id as number)!;
			if (cat.parent_id === null) {
				result.push(category);
			} else {
				const parent = categoryMap.get(cat.parent_id as number);
				if (parent) {
					(parent.children as Record<string, unknown>[]).push(category);
				}
			}
		}

		return NextResponse.json(result);
	} catch (error) {
		console.error("GET /api/admin/categories error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// POST /api/admin/categories - Create a new category
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, slug, parent_id, icon } = body;

		if (!name || typeof name !== "string" || name.trim().length === 0) {
			return NextResponse.json(
				{ error: "Category name is required" },
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

		// Check if category with same slug already exists
		const existingSlug = (await db
			.prepare("SELECT id FROM categories WHERE slug = ?")
			.get(slug.trim())) as { id: number } | undefined;

		if (existingSlug) {
			return NextResponse.json(
				{ error: "A category with this slug already exists" },
				{ status: 409 },
			);
		}

		// If parent_id is provided, validate it exists
		let path = name.trim();
		if (parent_id !== undefined && parent_id !== null) {
			const parent = (await db
				.prepare("SELECT id, name, path FROM categories WHERE id = ?")
				.get(parent_id)) as { id: number; name: string; path: string | null } | undefined;

			if (!parent) {
				return NextResponse.json(
					{ error: "Parent category not found" },
					{ status: 400 },
				);
			}

			// Build path string
			path = parent.path ? `${parent.path} > ${name.trim()}` : `${parent.name} > ${name.trim()}`;
		}

		// Create the category
		const result = await db
			.prepare(
				`
				INSERT INTO categories (parent_id, name, slug, icon, path, is_active)
				VALUES (?, ?, ?, ?, ?, true)
				RETURNING id
			`,
			)
			.run(
				parent_id ?? null,
				name.trim(),
				slug.trim(),
				icon?.trim() || null,
				path,
			);

		const categoryId = result.lastInsertRowid;

		if (!categoryId) {
			throw new Error("Failed to create category");
		}

		// Fetch and return the created category
		const category = await db
			.prepare(
				`
				SELECT id, parent_id, name, slug, icon, path, is_active
				FROM categories
				WHERE id = ?
			`,
			)
			.get(categoryId);

		return NextResponse.json(category, { status: 201 });
	} catch (error) {
		console.error("POST /api/admin/categories error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
