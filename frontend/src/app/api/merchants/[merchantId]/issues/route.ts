import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/merchant/products/issues - Get rejected staging products for a merchant
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    const db = getDb();
    
    const issues = await db.prepare(`
      SELECT 
        id, 
        raw_title as title, 
        rejection_reason, 
        updated_at as rejected_at,
        raw_vendor as vendor
      FROM staging_products
      WHERE merchant_id = ? AND status = 'REJECTED'
      ORDER BY updated_at DESC
    `).all(Number(merchantId));

    return NextResponse.json(issues);
  } catch (error) {
    console.error("GET /api/merchant/products/issues error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
