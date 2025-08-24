/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/authClient";
import { logInfo, logError } from "@/lib/logger";

/**
 * 🟢 Verify Session API
 * हिंदी: यह API session token verify करती है
 * 1. Header से token लेती है
 * 2. authClient.verifySession() से check करती है
 * 3. valid होने पर userId return करती है
 */
export async function GET(req: NextRequest) {
  try {
    // ✅ Header से token लेना
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " हटाना

    // ✅ session verify करना
    const session = await verifySession(token);

    logInfo("auth-verify", `Session verified for user ${session.userId}`);

    return NextResponse.json(
      {
        success: true,
        message: "Session is valid",
        userId: session.userId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    logError("auth-verify", err);
    return NextResponse.json(
      { success: false, message: "Invalid or expired session" },
      { status: 401 }
    );
  }
}
