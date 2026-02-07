import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// PATCH /api/partners/:partnerId - Update a partner
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ partnerId: string }> },
) {
	try {
		const { partnerId } = await params;
		const id = Number(partnerId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid partner id" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { name, is_active, configuration } = body;

		const db = getDb();

		// Check if partner exists
		const existing = (await db
			.prepare("SELECT id FROM loyalty_partners WHERE id = ?")
			.get(id)) as { id: number } | undefined;

		if (!existing) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 });
		}

		// Build update query dynamically
		const updates: string[] = [];
		const values: unknown[] = [];

		if (name !== undefined) {
			if (typeof name !== "string" || name.trim().length === 0) {
				return NextResponse.json(
					{ error: "Partner name cannot be empty" },
					{ status: 400 },
				);
			}
			// Check for duplicate name
			const duplicate = (await db
				.prepare(
					"SELECT id FROM loyalty_partners WHERE LOWER(name) = LOWER(?) AND id != ?",
				)
				.get(name.trim(), id)) as { id: number } | undefined;

			if (duplicate) {
				return NextResponse.json(
					{ error: "A partner with this name already exists" },
					{ status: 409 },
				);
			}

			updates.push("name = ?");
			values.push(name.trim());
		}

		if (is_active !== undefined) {
			updates.push("is_active = ?");
			values.push(Boolean(is_active));
		}

		if (configuration !== undefined) {
			updates.push("configuration = ?::jsonb");
			values.push(JSON.stringify(configuration));
		}

		if (updates.length === 0) {
			return NextResponse.json(
				{ error: "No fields to update" },
				{ status: 400 },
			);
		}

		values.push(id);
		await db
			.prepare(`UPDATE loyalty_partners SET ${updates.join(", ")} WHERE id = ?`)
			.run(...values);

		// Fetch and return the updated partner
		const partner = await db
			.prepare(
				`
      SELECT
        lp.id, lp.name, lp.is_active, lp.configuration, lp.created_at,
        pcr.points_to_currency_rate, pcr.currency_code
      FROM loyalty_partners lp
      LEFT JOIN point_conversion_rules pcr
        ON pcr.partner_id = lp.id AND pcr.is_active = true
      WHERE lp.id = ?
    `,
			)
			.get(id);

		return NextResponse.json(partner);
	} catch (error) {
		console.error("PATCH /api/partners/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// DELETE /api/partners/:partnerId - Delete a partner
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ partnerId: string }> },
) {
	try {
		const { partnerId } = await params;
		const id = Number(partnerId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid partner id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		// Check if partner exists
		const existing = (await db
			.prepare("SELECT id FROM loyalty_partners WHERE id = ?")
			.get(id)) as { id: number } | undefined;

		if (!existing) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 });
		}

		// Delete associated conversion rules first (cascade should handle this, but explicit is safer)
		await db
			.prepare("DELETE FROM point_conversion_rules WHERE partner_id = ?")
			.run(id);

		// Delete the partner
		await db.prepare("DELETE FROM loyalty_partners WHERE id = ?").run(id);

		return NextResponse.json({ success: true, deleted_id: id });
	} catch (error) {
		console.error("DELETE /api/partners/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// GET /api/partners/:partnerId - Get a single partner
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ partnerId: string }> },
) {
	try {
		const { partnerId } = await params;
		const id = Number(partnerId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid partner id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		const partner = await db
			.prepare(
				`
      SELECT
        lp.id, lp.name, lp.is_active, lp.configuration, lp.created_at,
        pcr.points_to_currency_rate, pcr.currency_code
      FROM loyalty_partners lp
      LEFT JOIN point_conversion_rules pcr
        ON pcr.partner_id = lp.id AND pcr.is_active = true
      WHERE lp.id = ?
    `,
			)
			.get(id);

		if (!partner) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 });
		}

		// Get all conversion rules for this partner
		const rules = await db
			.prepare(
				`
      SELECT id, currency_code, points_to_currency_rate, valid_from, valid_to, is_active
      FROM point_conversion_rules
      WHERE partner_id = ?
      ORDER BY is_active DESC, valid_from DESC
    `,
			)
			.all(id);

		return NextResponse.json({
			...partner,
			conversion_rules: rules,
		});
	} catch (error) {
		console.error("GET /api/partners/:id error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
