/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/wkt3db";

/**
 * 📝 Email Verification API
 * Hindi: जब user verification link पर click करता है, यह route उसका account verified mark करता है
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing userId" },
        { status: 400 }
      );
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid userId" },
        { status: 404 }
      );
    }

    if (user.verified) {
      return NextResponse.json({
        success: true,
        message: "User already verified",
      });
    }

    // ✅ Email verify कर देना
    user.verified = true;

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Error: " + err.message },
      { status: 500 }
    );
  }
}
