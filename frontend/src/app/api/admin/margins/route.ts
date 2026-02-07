import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/admin/margins - Get all margin rules with related data
export async function GET() {
	try {
		const db = getDb();
		const margins = await db
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
				ORDER BY mr.merchant_id, mr.is_active DESC, mr.valid_from DESC
			`,
			)
			.all();

		return NextResponse.json(margins);
	} catch (error) {
		console.error("GET /api/admin/margins error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// POST /api/admin/margins - Create a new margin rule
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			merchant_id,
			brand_id,
			category_id,
			margin_percentage,
			valid_from,
			valid_to,
		} = body;

		// Validate required fields
		if (!merchant_id) {
			return NextResponse.json(
				{ error: "Merchant is required" },
				{ status: 400 },
			);
		}

		if (margin_percentage === undefined || margin_percentage === null) {
			return NextResponse.json(
				{ error: "Margin percentage is required" },
				{ status: 400 },
			);
		}

		const marginValue = Number(margin_percentage);
		if (Number.isNaN(marginValue) || marginValue < 0 || marginValue > 100) {
			return NextResponse.json(
				{ error: "Margin percentage must be between 0 and 100" },
				{ status: 400 },
			);
		}

		if (!valid_from) {
			return NextResponse.json(
				{ error: "Valid from date is required" },
				{ status: 400 },
			);
		}

		const db = getDb();

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

		// Validate brand if provided
		if (brand_id !== null && brand_id !== undefined) {
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

		// Validate category if provided
		if (category_id !== null && category_id !== undefined) {
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

		// Check for duplicate active rule with same scope
		const existingRule = (await db
			.prepare(
				`
				SELECT id FROM margin_rules
				WHERE merchant_id = ?
				AND (brand_id IS NOT DISTINCT FROM ?)
				AND (category_id IS NOT DISTINCT FROM ?)
				AND is_active = true
			`,
			)
			.get(
				merchant_id,
				brand_id ?? null,
				category_id ?? null,
			)) as { id: number } | undefined;

		if (existingRule) {
			return NextResponse.json(
				{
					error:
						"An active margin rule with the same scope already exists. Deactivate it first or edit the existing rule.",
				},
				{ status: 409 },
			);
		}

		// Create the margin rule
		const result = await db
			.prepare(
				`
				INSERT INTO margin_rules (
					merchant_id,
					brand_id,
					category_id,
					margin_percentage,
					valid_from,
					valid_to,
					is_active
				)
				VALUES (?, ?, ?, ?, ?::timestamptz, ?::timestamptz, true)
				RETURNING id
			`,
			)
			.run(
				merchant_id,
				brand_id ?? null,
				category_id ?? null,
				marginValue,
				valid_from,
				valid_to ?? null,
			);

		const marginId = result.lastInsertRowid;

		if (!marginId) {
			throw new Error("Failed to create margin rule");
		}

		// Fetch and return the created margin rule with related data
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
			.get(marginId);

		return NextResponse.json(marginRule, { status: 201 });
	} catch (error) {
		console.error("POST /api/admin/margins error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
