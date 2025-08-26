// apps/web/src/app/api/super-admin/analytics/route.ts
import { NextResponse } from "next/server";
import { getDocuments } from "@/lib/wkt3db";

export async function GET() {
  // 📝 हिंदी: सिर्फ super admin को ही access होगा
  // (यहाँ RBAC check भी लगेगा)

  const logs = await getDocuments("logs");
  const users = await getDocuments("users");
  const sessions = await getDocuments("sessions");
  const bets = await getDocuments("bets");

  return NextResponse.json({
    totalUsers: users.length,
    totalLogs: logs.length,
    totalBets: bets.length,
    totalSessions: sessions.length,
    revenue: bets.reduce(
      (sum: number, b: { commission?: number }) => sum + (b.commission || 0),
      0
    ),
    activeUsers: sessions.filter((s: { isActive: boolean }) => s.isActive)
      .length,
  });
}
