import { NextRequest, NextResponse } from "next/server";
import { authClient, UserRole } from "@/lib/authClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) throw new Error("Missing userId or role");

    // 1️⃣ Dev: Issue token
    const sessionToken = await authClient._dev_issueToken(
      userId,
      role as UserRole
    );

    // 2️⃣ Verify token immediately
    const payload = await authClient.verifySessionToken(sessionToken);

    // 3️⃣ Return session token + payload
    return NextResponse.json({
      success: true,
      sessionToken,
      payload,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 400 }
    );
  }
}
