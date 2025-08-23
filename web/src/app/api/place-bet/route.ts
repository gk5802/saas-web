import { NextRequest, NextResponse } from "next/server";
import { placeBet } from "@/lib/placeBet.server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await placeBet(body);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 400 }
    );
  }
}
