import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/categories - Get all categories (hierarchical)
export async function GET() {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT id, parent_id, name, slug, icon, path, is_active
      FROM categories
      WHERE is_active = 1
      ORDER BY parent_id NULLS FIRST, name
    `).all() as Array<{
      id: number;
      parent_id: number | null;
      name: string;
      slug: string;
      icon: string | null;
      path: string | null;
      is_active: number;
    }>;

    // Build hierarchy
    const topLevel = categories.filter((c) => c.parent_id === null);
    const result = topLevel.map((cat) => ({
      ...cat,
      children: categories.filter((c) => c.parent_id === cat.id),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
