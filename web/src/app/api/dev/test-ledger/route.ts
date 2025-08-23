import { NextRequest, NextResponse } from "next/server";
import { wkt3dbClient } from "@/lib/wkt3db.mock";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, gameId, amountCents } = body;

    if (!userId || !amountCents)
      throw new Error("Missing userId or amountCents");

    // Append test entry
    const entry = await wkt3dbClient.appendEntry({
      type: "test-entry",
      userId,
      gameId,
      amountCents,
    });

    const balance = await wkt3dbClient.getUserBalanceCents(userId);
    const ledger = await wkt3dbClient.getLedger();

    return NextResponse.json({
      success: true,
      entry,
      balance,
      ledger,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 400 }
    );
  }
}
