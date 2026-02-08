import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/merchants/:merchantId/staging — Staging products under review (PENDING_SYNC, NEEDS_REVIEW)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    const db = getDb();
    const merchantIdNum = Number(merchantId);

    const rows = (await db.prepare(`
      SELECT 
        sp.id,
        sp.raw_title as title,
        sp.raw_vendor as vendor,
        sp.raw_product_type as product_type,
        sp.status,
        sp.match_confidence_score,
        sp.created_at,
        sp.raw_json_dump
      FROM staging_products sp
      WHERE sp.merchant_id = ?
        AND sp.status IN ('PENDING_SYNC', 'NEEDS_REVIEW')
      ORDER BY sp.created_at DESC
    `).all(merchantIdNum)) as Array<{
      id: number;
      title: string;
      vendor: string | null;
      product_type: string | null;
      status: string;
      match_confidence_score: number | null;
      created_at: string;
      raw_json_dump: string | null;
    }>;

    const list = rows.map((r) => {
      let image_url: string | null = null;
      const rawDump = r.raw_json_dump;
      if (rawDump != null) {
        try {
          const raw =
            typeof rawDump === "string"
              ? (JSON.parse(rawDump) as Record<string, unknown>)
              : (rawDump as Record<string, unknown>);
          const img = raw?.image as { src?: string } | undefined;
          const imgs = raw?.images as { src?: string }[] | undefined;
          image_url =
            (img?.src as string | undefined) ??
            (imgs?.[0]?.src as string | undefined) ??
            null;
        } catch {
          // ignore
        }
      }
      return {
        id: r.id,
        title: r.title,
        vendor: r.vendor,
        product_type: r.product_type,
        status: r.status,
        match_confidence_score: r.match_confidence_score,
        created_at: r.created_at,
        image_url,
      };
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("GET /api/merchants/:merchantId/staging error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
