// apps/web/src/app/api/dev/test-logger/route.ts
// 📝 हिंदी: Test route जिससे हम logger check करेंगे

import { NextResponse } from "next/server";
import { logInfo, logError, logWarn, logAudit } from "@/lib/logger";

export async function GET() {
  await logInfo("Test info log", { foo: "bar" });
  await logError("Test error log", { foo: "bar" });
  await logWarn("Test warn log", { foo: "bar" });
  await logAudit("Test audit log", { userId: "123", action: "bet" });

  return NextResponse.json({ success: true, message: "Logs tested" });
}
