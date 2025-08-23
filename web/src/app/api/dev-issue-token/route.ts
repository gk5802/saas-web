import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/authClient";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, role } = body;

  try {
    const token = await authClient._dev_issueToken(userId, role);
    return NextResponse.json({ success: true, token });
  } catch (e) {
    return NextResponse.json(
      { success: false, message: String(e) },
      { status: 400 }
    );
  }
}
