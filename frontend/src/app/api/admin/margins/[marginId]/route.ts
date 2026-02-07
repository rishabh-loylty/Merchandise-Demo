import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/margins/:marginId - Get a single margin rule with details
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ marginId: string }> },
) {
	try {
		const { marginId } = await params;
		const id = Number(marginId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid margin rule id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		const marginRule = await db
			.prepare(
				`
				SELECT
					mr.id,
					mr.merchant_id,
					m.name as merchant_name,
					mr.brand_id,
					b.name as brand_name,
					mr.category_id,
					c.name as category_name,
					mr.margin_percentage,
					mr.valid_from,
					mr.valid_to,
					mr.is_active
				FROM margin_rules mr
				JOIN merchants m ON m.id = mr.merchant_id
				LEFT JOIN brands b ON b.id = mr.brand_id
				LEFT JOIN categories c ON c.id = mr.category_id
				WHERE mr.id = ?
			`,
			)
			.get(id);

		if (!marginRule) {
			return NextResponse.json(
				{ error: "Margin rule not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(marginRule);
	} catch (error) {
		console.error("GET /api/admin/margins/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// PATCH /api/admin/margins/:marginId - Update a margin rule
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ marginId: string }> },
) {
	try {
		const { marginId } = await params;
		const id = Number(marginId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid margin rule id" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const {
			merchant_id,
			brand_id,
			category_id,
			margin_percentage,
			valid_from,
			valid_to,
			is_active,
		} = body;

		const db = getDb();

		// Check if margin rule exists
		const existing = (await db
			.prepare("SELECT id, merchant_id, brand_id, category_id FROM margin_rules WHERE id = ?")
			.get(id)) as {
			id: number;
			merchant_id: number;
			brand_id: number | null;
			category_id: number | null;
		} | undefined;

		if (!existing) {
			return NextResponse.json(
				{ error: "Margin rule not found" },
				{ status: 404 },
			);
		}

		// Build update query dynamically
		const updates: string[] = [];
		const values: unknown[] = [];

		if (merchant_id !== undefined) {
			// Validate merchant exists
			const merchant = (await db
				.prepare("SELECT id FROM merchants WHERE id = ?")
				.get(merchant_id)) as { id: number } | undefined;

			if (!merchant) {
				return NextResponse.json(
					{ error: "Merchant not found" },
					{ status: 400 },
				);
			}

			updates.push("merchant_id = ?");
			values.push(merchant_id);
		}

		if (brand_id !== undefined) {
			if (brand_id !== null) {
				// Validate brand exists
				const brand = (await db
					.prepare("SELECT id FROM brands WHERE id = ?")
					.get(brand_id)) as { id: number } | undefined;

				if (!brand) {
					return NextResponse.json(
						{ error: "Brand not found" },
						{ status: 400 },
					);
				}
			}

			updates.push("brand_id = ?");
			values.push(brand_id);
		}

		if (category_id !== undefined) {
			if (category_id !== null) {
				// Validate category exists
				const category = (await db
					.prepare("SELECT id FROM categories WHERE id = ?")
					.get(category_id)) as { id: number } | undefined;

				if (!category) {
					return NextResponse.json(
						{ error: "Category not found" },
						{ status: 400 },
					);
				}
			}

			updates.push("category_id = ?");
			values.push(category_id);
		}

		if (margin_percentage !== undefined) {
			const marginValue = Number(margin_percentage);
			if (Number.isNaN(marginValue) || marginValue < 0 || marginValue > 100) {
				return NextResponse.json(
					{ error: "Margin percentage must be between 0 and 100" },
					{ status: 400 },
				);
			}

			updates.push("margin_percentage = ?");
			values.push(marginValue);
		}

		if (valid_from !== undefined) {
			updates.push("valid_from = ?::timestamptz");
			values.push(valid_from);
		}

		if (valid_to !== undefined) {
			updates.push("valid_to = ?::timestamptz");
			values.push(valid_to);
		}

		if (is_active !== undefined) {
			// If activating, check for duplicate active rule with same scope
			if (is_active === true) {
				const newMerchantId = merchant_id ?? existing.merchant_id;
				const newBrandId = brand_id !== undefined ? brand_id : existing.brand_id;
				const newCategoryId = category_id !== undefined ? category_id : existing.category_id;

				const duplicateRule = (await db
					.prepare(
						`
						SELECT id FROM margin_rules
						WHERE merchant_id = ?
						AND (brand_id IS NOT DISTINCT FROM ?)
						AND (category_id IS NOT DISTINCT FROM ?)
						AND is_active = true
						AND id != ?
					`,
					)
					.get(newMerchantId, newBrandId, newCategoryId, id)) as { id: number } | undefined;

				if (duplicateRule) {
					return NextResponse.json(
						{
							error:
								"Another active margin rule with the same scope already exists. Deactivate it first.",
						},
						{ status: 409 },
					);
				}
			}

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
			.prepare(`UPDATE margin_rules SET ${updates.join(", ")} WHERE id = ?`)
			.run(...values);

		// Fetch and return the updated margin rule
		const marginRule = await db
			.prepare(
				`
				SELECT
					mr.id,
					mr.merchant_id,
					m.name as merchant_name,
					mr.brand_id,
					b.name as brand_name,
					mr.category_id,
					c.name as category_name,
					mr.margin_percentage,
					mr.valid_from,
					mr.valid_to,
					mr.is_active
				FROM margin_rules mr
				JOIN merchants m ON m.id = mr.merchant_id
				LEFT JOIN brands b ON b.id = mr.brand_id
				LEFT JOIN categories c ON c.id = mr.category_id
				WHERE mr.id = ?
			`,
			)
			.get(id);

		return NextResponse.json(marginRule);
	} catch (error) {
		console.error("PATCH /api/admin/margins/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// DELETE /api/admin/margins/:marginId - Delete a margin rule
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ marginId: string }> },
) {
	try {
		const { marginId } = await params;
		const id = Number(marginId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid margin rule id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		// Check if margin rule exists
		const existing = (await db
			.prepare(
				`
				SELECT mr.id, m.name as merchant_name
				FROM margin_rules mr
				JOIN merchants m ON m.id = mr.merchant_id
				WHERE mr.id = ?
			`,
			)
			.get(id)) as { id: number; merchant_name: string } | undefined;

		if (!existing) {
			return NextResponse.json(
				{ error: "Margin rule not found" },
				{ status: 404 },
			);
		}

		// Delete the margin rule
		await db.prepare("DELETE FROM margin_rules WHERE id = ?").run(id);

		return NextResponse.json({
			success: true,
			deleted_id: id,
			merchant_name: existing.merchant_name,
		});
	} catch (error) {
		console.error("DELETE /api/admin/margins/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
