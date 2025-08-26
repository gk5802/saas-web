// apps/web/src/app/api/admin/logs/route.ts
// 📝 हिंदी: यह API केवल super-admin के लिए available होगी

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roleGuard";
import { getDocuments } from "@/lib/wkt3db";

export async function GET(req: NextRequest) {
  // ✅ केवल super-admin allow
  const guard = await requireRole(req, ["super-admin"]);
  if (!guard.success) return guard.res!;

  // Super admin verified → अब logs fetch करो
  const logs = await getDocuments("logs");

  return NextResponse.json({
    success: true,
    logs,
  });
}
