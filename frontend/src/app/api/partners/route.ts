import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/partners - Get all loyalty partners with conversion rules
export async function GET() {
  try {
    const db = getDb();
    // One row per partner with INR rate (for storefront bank selector)
    const partners = db.prepare(`
      SELECT lp.id, lp.name, lp.is_active, lp.configuration,
             pcr.points_to_currency_rate, pcr.currency_code
      FROM loyalty_partners lp
      LEFT JOIN point_conversion_rules pcr ON pcr.partner_id = lp.id AND pcr.is_active = 1 AND pcr.currency_code = 'INR'
      WHERE lp.is_active = 1
      GROUP BY lp.id
      ORDER BY lp.name
    `).all();

    return NextResponse.json(partners);
  } catch (error) {
    console.error("GET /api/partners error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
