import { NextRequest, NextResponse } from "next/server";
import { placeBet } from "@/lib/placeBet.server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, gameId, amountCents } = body;

    const betResult = await placeBet({ sessionToken, gameId, amountCents });

    return NextResponse.json({
      success: true,
      betResult,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 400 }
    );
  }
}
