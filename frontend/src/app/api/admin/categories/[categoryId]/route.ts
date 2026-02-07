import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/categories/:categoryId - Get a single category with details
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ categoryId: string }> },
) {
	try {
		const { categoryId } = await params;
		const id = Number(categoryId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid category id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		const category = await db
			.prepare(
				`
				SELECT
					c.id,
					c.parent_id,
					c.name,
					c.slug,
					c.icon,
					c.path,
					c.is_active
				FROM categories c
				WHERE c.id = ?
			`,
			)
			.get(id);

		if (!category) {
			return NextResponse.json(
				{ error: "Category not found" },
				{ status: 404 },
			);
		}

		// Get product count
		const productStats = await db
			.prepare(
				`
				SELECT COUNT(*) as product_count
				FROM product_categories
				WHERE category_id = ?
			`,
			)
			.get(id);

		// Get subcategories count
		const childCount = await db
			.prepare(
				`
				SELECT COUNT(*) as child_count
				FROM categories
				WHERE parent_id = ?
			`,
			)
			.get(id);

		return NextResponse.json({
			...category,
			product_count: (productStats as Record<string, unknown>)?.product_count ?? 0,
			child_count: (childCount as Record<string, unknown>)?.child_count ?? 0,
		});
	} catch (error) {
		console.error("GET /api/admin/categories/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// PATCH /api/admin/categories/:categoryId - Update a category
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ categoryId: string }> },
) {
	try {
		const { categoryId } = await params;
		const id = Number(categoryId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid category id" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { name, slug, parent_id, icon, is_active } = body;

		const db = getDb();

		// Check if category exists
		const existing = (await db
			.prepare("SELECT id, parent_id, name FROM categories WHERE id = ?")
			.get(id)) as { id: number; parent_id: number | null; name: string } | undefined;

		if (!existing) {
			return NextResponse.json(
				{ error: "Category not found" },
				{ status: 404 },
			);
		}

		// Build update query dynamically
		const updates: string[] = [];
		const values: unknown[] = [];
		let newPath: string | null = null;

		if (name !== undefined) {
			if (typeof name !== "string" || name.trim().length === 0) {
				return NextResponse.json(
					{ error: "Category name cannot be empty" },
					{ status: 400 },
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
				.prepare("SELECT id FROM categories WHERE slug = ? AND id != ?")
				.get(slug.trim(), id)) as { id: number } | undefined;

			if (duplicateSlug) {
				return NextResponse.json(
					{ error: "A category with this slug already exists" },
					{ status: 409 },
				);
			}

			updates.push("slug = ?");
			values.push(slug.trim());
		}

		if (parent_id !== undefined) {
			// Prevent setting self as parent
			if (parent_id === id) {
				return NextResponse.json(
					{ error: "Category cannot be its own parent" },
					{ status: 400 },
				);
			}

			// Prevent setting a child category as parent (would create cycle)
			if (parent_id !== null) {
				const isDescendant = await checkIsDescendant(db, parent_id, id);
				if (isDescendant) {
					return NextResponse.json(
						{ error: "Cannot set a subcategory as parent (would create circular reference)" },
						{ status: 400 },
					);
				}

				// Validate parent exists
				const parent = (await db
					.prepare("SELECT id, name, path FROM categories WHERE id = ?")
					.get(parent_id)) as { id: number; name: string; path: string | null } | undefined;

				if (!parent) {
					return NextResponse.json(
						{ error: "Parent category not found" },
						{ status: 400 },
					);
				}

				// Build new path
				const categoryName = name?.trim() || existing.name;
				newPath = parent.path
					? `${parent.path} > ${categoryName}`
					: `${parent.name} > ${categoryName}`;
			} else {
				newPath = name?.trim() || existing.name;
			}

			updates.push("parent_id = ?");
			values.push(parent_id);
		}

		if (icon !== undefined) {
			updates.push("icon = ?");
			values.push(icon?.trim() || null);
		}

		if (is_active !== undefined) {
			updates.push("is_active = ?");
			values.push(Boolean(is_active));
		}

		// Update path if name or parent changed
		if (newPath !== null || (name !== undefined && parent_id === undefined)) {
			if (newPath === null && name !== undefined) {
				// Name changed but parent didn't - rebuild path
				if (existing.parent_id !== null) {
					const parent = (await db
						.prepare("SELECT name, path FROM categories WHERE id = ?")
						.get(existing.parent_id)) as { name: string; path: string | null } | undefined;

					if (parent) {
						newPath = parent.path
							? `${parent.path} > ${name.trim()}`
							: `${parent.name} > ${name.trim()}`;
					}
				} else {
					newPath = name.trim();
				}
			}

			if (newPath !== null) {
				updates.push("path = ?");
				values.push(newPath);
			}
		}

		if (updates.length === 0) {
			return NextResponse.json(
				{ error: "No fields to update" },
				{ status: 400 },
			);
		}

		values.push(id);
		await db
			.prepare(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`)
			.run(...values);

		// Update paths of all child categories if this category's path changed
		if (newPath !== null) {
			await updateChildPaths(db, id, newPath);
		}

		// Fetch and return the updated category
		const category = await db
			.prepare(
				`
				SELECT id, parent_id, name, slug, icon, path, is_active
				FROM categories
				WHERE id = ?
			`,
			)
			.get(id);

		return NextResponse.json(category);
	} catch (error) {
		console.error("PATCH /api/admin/categories/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// DELETE /api/admin/categories/:categoryId - Delete a category
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ categoryId: string }> },
) {
	try {
		const { categoryId } = await params;
		const id = Number(categoryId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid category id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		// Check if category exists
		const existing = (await db
			.prepare("SELECT id, name FROM categories WHERE id = ?")
			.get(id)) as { id: number; name: string } | undefined;

		if (!existing) {
			return NextResponse.json(
				{ error: "Category not found" },
				{ status: 404 },
			);
		}

		// Check if category has products
		const productCount = (await db
			.prepare("SELECT COUNT(*) as count FROM product_categories WHERE category_id = ?")
			.get(id)) as { count: number };

		if (productCount.count > 0) {
			return NextResponse.json(
				{
					error: `Cannot delete category. It has ${productCount.count} product(s) assigned. Please reassign or remove those products first.`,
				},
				{ status: 409 },
			);
		}

		// Move child categories to top level (set parent_id to null)
		const children = await db
			.prepare("SELECT id, name FROM categories WHERE parent_id = ?")
			.all(id) as { id: number; name: string }[];

		for (const child of children) {
			await db
				.prepare("UPDATE categories SET parent_id = NULL, path = ? WHERE id = ?")
				.run(child.name, child.id);

			// Update paths of grandchildren
			await updateChildPaths(db, child.id, child.name);
		}

		// Delete margin rules associated with this category
		await db.prepare("DELETE FROM margin_rules WHERE category_id = ?").run(id);

		// Delete the category
		await db.prepare("DELETE FROM categories WHERE id = ?").run(id);

		return NextResponse.json({
			success: true,
			deleted_id: id,
			deleted_name: existing.name,
			promoted_children: children.length,
		});
	} catch (error) {
		console.error("DELETE /api/admin/categories/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// Helper function to check if targetId is a descendant of categoryId
async function checkIsDescendant(
	db: ReturnType<typeof getDb>,
	targetId: number,
	categoryId: number,
): Promise<boolean> {
	const children = await db
		.prepare("SELECT id FROM categories WHERE parent_id = ?")
		.all(categoryId) as { id: number }[];

	for (const child of children) {
		if (child.id === targetId) {
			return true;
		}
		const isDescendant = await checkIsDescendant(db, targetId, child.id);
		if (isDescendant) {
			return true;
		}
	}

	return false;
}

// Helper function to update paths of all child categories
async function updateChildPaths(
	db: ReturnType<typeof getDb>,
	parentId: number,
	parentPath: string,
): Promise<void> {
	const children = await db
		.prepare("SELECT id, name FROM categories WHERE parent_id = ?")
		.all(parentId) as { id: number; name: string }[];

	for (const child of children) {
		const childPath = `${parentPath} > ${child.name}`;
		await db
			.prepare("UPDATE categories SET path = ? WHERE id = ?")
			.run(childPath, child.id);

		// Recursively update grandchildren
		await updateChildPaths(db, child.id, childPath);
	}
}
