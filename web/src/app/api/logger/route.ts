import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { level, action, detail, userId } = body;

  try {
    const logEntry = await logger.log(level || "info", {
      action,
      detail,
      userId,
    });
    return NextResponse.json({ success: true, logEntry });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 400 }
    );
  }
}
