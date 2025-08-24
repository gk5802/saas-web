/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { verifySession, revokeSession } from "@/lib/authClient";
import { logInfo, logError } from "@/lib/logger";

// 📝 हिंदी Comment: यह API user को logout करने के लिए है
// Steps:
// 1. Header से session token लेना
// 2. Token verify करना
// 3. अगर valid है तो उसे revoke कर देना (invalidate)
// 4. Response भेजना

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Missing Bearer token" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // Step 1: Verify session token
    const session = verifySession(token);

    // Step 2: Revoke session
    revokeSession(token);

    logInfo("logout", `User ${session.userId} logged out`);

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    });
  } catch (err: any) {
    logError("logout-error", err);
    return NextResponse.json(
      { success: false, message: `Error: ${err.message}` },
      { status: 400 }
    );
  }
}
