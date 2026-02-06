import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/brands - Get all brands
export async function GET() {
  try {
    const db = getDb();
    const brands = db.prepare(`
      SELECT id, name, slug, logo_url, is_active
      FROM brands
      WHERE is_active = 1
      ORDER BY name
    `).all();

    return NextResponse.json(brands);
  } catch (error) {
    console.error("GET /api/brands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
