import { NextRequest, NextResponse } from "next/server";
import { wkt3dbClient } from "@/lib/wkt3db.mock";
import { authClient } from "@/lib/authClient";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionToken } = body;

  try {
    const session = await authClient.verifySessionToken(sessionToken);
    const balance = await wkt3dbClient.getUserBalanceCents(session.userId);
    return NextResponse.json({ userId: session.userId, balanceCents: balance });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 400 }
    );
  }
}
