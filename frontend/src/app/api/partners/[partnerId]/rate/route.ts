import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// POST /api/partners/:partnerId/rate - Create or update conversion rate
export async function POST(
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
		const { points_to_currency_rate, currency_code } = body;

		// Validate rate
		if (
			points_to_currency_rate === undefined ||
			typeof points_to_currency_rate !== "number" ||
			points_to_currency_rate <= 0
		) {
			return NextResponse.json(
				{ error: "Valid points_to_currency_rate is required (must be > 0)" },
				{ status: 400 },
			);
		}

		const currencyCode = currency_code || "INR";

		// Validate currency code
		const validCurrencies = ["INR", "USD", "EUR", "GBP"];
		if (!validCurrencies.includes(currencyCode)) {
			return NextResponse.json(
				{ error: `Invalid currency code. Must be one of: ${validCurrencies.join(", ")}` },
				{ status: 400 },
			);
		}

		const db = getDb();

		// Check if partner exists
		const partner = (await db
			.prepare("SELECT id, name FROM loyalty_partners WHERE id = ?")
			.get(id)) as { id: number; name: string } | undefined;

		if (!partner) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 });
		}

		// Deactivate all existing conversion rules for this partner and currency
		await db
			.prepare(
				`
        UPDATE point_conversion_rules
        SET is_active = false, valid_to = NOW()
        WHERE partner_id = ? AND currency_code = ? AND is_active = true
      `,
			)
			.run(id, currencyCode);

		// Create new conversion rule
		const result = await db
			.prepare(
				`
        INSERT INTO point_conversion_rules
        (partner_id, currency_code, points_to_currency_rate, valid_from, is_active)
        VALUES (?, ?, ?, NOW(), true)
        RETURNING id
      `,
			)
			.run(id, currencyCode, points_to_currency_rate);

		const ruleId = result.lastInsertRowid;

		// Fetch the new rule
		const newRule = await db
			.prepare(
				`
        SELECT id, partner_id, currency_code, points_to_currency_rate, valid_from, valid_to, is_active
        FROM point_conversion_rules
        WHERE id = ?
      `,
			)
			.get(ruleId);

		return NextResponse.json(
			{
				success: true,
				message: `Conversion rate updated for ${partner.name}`,
				rule: newRule,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("POST /api/partners/:id/rate error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// GET /api/partners/:partnerId/rate - Get all conversion rates for a partner
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

		// Check if partner exists
		const partner = (await db
			.prepare("SELECT id, name FROM loyalty_partners WHERE id = ?")
			.get(id)) as { id: number; name: string } | undefined;

		if (!partner) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 });
		}

		// Get all conversion rules (active first, then by date)
		const rules = await db
			.prepare(
				`
        SELECT id, partner_id, currency_code, points_to_currency_rate, valid_from, valid_to, is_active
        FROM point_conversion_rules
        WHERE partner_id = ?
        ORDER BY is_active DESC, valid_from DESC
      `,
			)
			.all(id);

		// Get current active rates by currency
		const activeRates = await db
			.prepare(
				`
        SELECT currency_code, points_to_currency_rate
        FROM point_conversion_rules
        WHERE partner_id = ? AND is_active = true
      `,
			)
			.all(id);

		return NextResponse.json({
			partner_id: id,
			partner_name: partner.name,
			active_rates: activeRates,
			history: rules,
		});
	} catch (error) {
		console.error("GET /api/partners/:id/rate error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
