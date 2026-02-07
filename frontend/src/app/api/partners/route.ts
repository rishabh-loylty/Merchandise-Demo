import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/partners - Get all loyalty partners with conversion rules
export async function GET() {
	try {
		const db = getDb();
		// One row per partner with INR rate (for storefront bank selector)
		const partners = await db
			.prepare(
				`
      SELECT DISTINCT ON (lp.id)
        lp.id, lp.name, lp.is_active, lp.configuration, lp.created_at,
        pcr.points_to_currency_rate, pcr.currency_code
      FROM loyalty_partners lp
      LEFT JOIN point_conversion_rules pcr
        ON pcr.partner_id = lp.id AND pcr.is_active = true AND pcr.currency_code = 'INR'
      ORDER BY lp.id, lp.name
    `,
			)
			.all();

		return NextResponse.json(partners);
	} catch (error) {
		console.error("GET /api/partners error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// POST /api/partners - Create a new loyalty partner
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, points_to_currency_rate, currency_code, is_active } = body;

		if (!name || typeof name !== "string" || name.trim().length === 0) {
			return NextResponse.json(
				{ error: "Partner name is required" },
				{ status: 400 },
			);
		}

		const db = getDb();

		// Check if partner with same name already exists
		const existing = (await db
			.prepare("SELECT id FROM loyalty_partners WHERE LOWER(name) = LOWER(?)")
			.get(name.trim())) as { id: number } | undefined;

		if (existing) {
			return NextResponse.json(
				{ error: "A partner with this name already exists" },
				{ status: 409 },
			);
		}

		// Create the partner
		const result = await db
			.prepare(
				`
      INSERT INTO loyalty_partners (name, is_active, configuration, created_at)
      VALUES (?, ?, ?::jsonb, NOW())
      RETURNING id
    `,
			)
			.run(name.trim(), is_active !== false, JSON.stringify({}));

		const partnerId = result.lastInsertRowid;

		if (!partnerId) {
			throw new Error("Failed to create partner");
		}

		// If conversion rate is provided, create a conversion rule
		if (points_to_currency_rate !== undefined && points_to_currency_rate > 0) {
			const currencyCode = currency_code || "INR";

			await db
				.prepare(
					`
        INSERT INTO point_conversion_rules
        (partner_id, currency_code, points_to_currency_rate, valid_from, is_active)
        VALUES (?, ?, ?, NOW(), true)
      `,
				)
				.run(partnerId, currencyCode, points_to_currency_rate);
		}

		// Fetch and return the created partner
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
			.get(partnerId);

		return NextResponse.json(partner, { status: 201 });
	} catch (error) {
		console.error("POST /api/partners error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
