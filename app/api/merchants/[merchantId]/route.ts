import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/merchants/:merchantId - Update merchant (e.g. connect shopify)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    const body = await request.json();
    const db = getDb();

    const sets: string[] = [];
    const values: unknown[] = [];

    if (body.shopify_configured !== undefined) {
      sets.push("shopify_configured = ?");
      values.push(body.shopify_configured ? 1 : 0);
    }
    if (body.source_config !== undefined) {
      sets.push("source_config = ?");
      values.push(JSON.stringify(body.source_config));
    }
    if (body.name !== undefined) {
      sets.push("name = ?");
      values.push(body.name);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    sets.push("updated_at = datetime('now')");
    values.push(merchantId);

    db.prepare(`UPDATE merchants SET ${sets.join(", ")} WHERE id = ?`).run(...values);

    const merchant = db.prepare(
      "SELECT id, name, email, source_type, shopify_configured, is_active, created_at FROM merchants WHERE id = ?"
    ).get(merchantId);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    return NextResponse.json(merchant);
  } catch (error) {
    console.error("PATCH /api/merchants/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
