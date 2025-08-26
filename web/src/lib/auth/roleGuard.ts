/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/src/lib/auth/roleGuard.ts
// 📝 हिंदी: यह function check करेगा कि user के पास required role है या नहीं

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "../session";

// Allowed roles type
type Role = "super-admin" | "admin" | "manager" | "employee" | "player";

export async function requireRole(
  req: NextRequest,
  allowedRoles: Role[]
): Promise<{ success: boolean; res?: NextResponse; user?: any }> {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return {
        success: false,
        res: NextResponse.json(
          { success: false, message: "No token provided" },
          { status: 401 }
        ),
      };
    }

    // Verify session token
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      return {
        success: false,
        res: NextResponse.json(
          { success: false, message: "Server misconfiguration: SESSION_SECRET missing" },
          { status: 500 }
        ),
      };
    }
    const session = await verifySessionToken(token, sessionSecret);
    if (!session) {
      return {
        success: false,
        res: NextResponse.json(
          { success: false, message: "Invalid or expired session" },
          { status: 401 }
        ),
      };
    }

    // Check role
    if (!allowedRoles.includes(session.role as Role)) {
      return {
        success: false,
        res: NextResponse.json(
          { success: false, message: "Forbidden: insufficient role" },
          { status: 403 }
        ),
      };
    }

    // ✅ अगर सब ठीक है → user return कर दो
    return { success: true, user: session };
  } catch (err: any) {
    return {
      success: false,
      res: NextResponse.json(
        { success: false, message: err.message },
        { status: 500 }
      ),
    };
  }
}
