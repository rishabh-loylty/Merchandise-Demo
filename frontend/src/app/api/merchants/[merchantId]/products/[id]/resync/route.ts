import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// POST /api/merchant/products/:id/resync - Trigger resync for a specific product
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ merchantId: string, id: string }> }
) {
  try {
    const { merchantId, id } = await params;
    const db = getDb();
    
    // Reset status to PENDING_SYNC
    await db.prepare(`
      UPDATE staging_products 
      SET status = 'PENDING_SYNC'
      WHERE id = ? AND merchant_id = ?
    `).run(Number(id), Number(merchantId));

    // Note: In a real app, this would trigger an actual Shopify fetch for this ID
    // For now, we'll let the next global sync pick it up or simulate it here.
    
    return NextResponse.json({ success: true, message: "Product queued for resync" });
  } catch (error) {
    console.error("POST /api/merchant/products/:id/resync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
