// /apps/web/src/app/api/health/route.ts
// साधारण health-check API — Postman/ThunderClient से टेस्ट करने के लिए
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type HealthPayload = {
  status: "ok";
  ts: number;
  message?: string;
};

/**
 * GET /api/health
 * - सर्वर चालू है या नहीं बताने के लिए
 * - Postman में GET करके JSON response और security headers चेक करें
 */
export async function GET(_req: NextRequest) {
  const payload: HealthPayload = {
    status: "ok",
    ts: Date.now(),
    message: "wkt3 web: health OK",
  };
  return NextResponse.json(payload);
}
