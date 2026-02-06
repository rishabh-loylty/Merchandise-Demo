import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/merchants - Get all merchants
export async function GET() {
  try {
    const db = getDb();
    const merchants = db.prepare(`
      SELECT id, name, email, source_type, shopify_configured, is_active, created_at
      FROM merchants
      WHERE is_active = 1
      ORDER BY name
    `).all();

    return NextResponse.json(merchants);
  } catch (error) {
    console.error("GET /api/merchants error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/merchants - Create a new merchant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO merchants (name, email, source_type, source_config, shopify_configured)
      VALUES (?, ?, 'SHOPIFY', '{}', 0)
    `).run(name, email);

    const merchant = db.prepare("SELECT id, name, email, source_type, shopify_configured, is_active, created_at FROM merchants WHERE id = ?").get(result.lastInsertRowid);

    return NextResponse.json(merchant, { status: 201 });
  } catch (error) {
    console.error("POST /api/merchants error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
