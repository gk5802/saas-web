/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/app/api/dev/test-2fa-verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyTOTP } from "@/lib/totp"; // OTP verify function
import { logInfo, logError } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const { secret, token } = await req.json();

    // 👉 basic validations
    if (!secret || !token) {
      return NextResponse.json({
        success: false,
        message: "❌ secret और token दोनों ज़रूरी हैं",
      });
    }

    // 👉 OTP verification
    const isValid = verifyTOTP(secret, token);

    if (!isValid) {
      logError("2FA verification failed", { token });
      return NextResponse.json({ success: false, message: "❌ Invalid OTP" });
    }

    logInfo("2FA verification success", { secret });
    return NextResponse.json({
      success: true,
      message: "✅ OTP verified successfully",
    });
  } catch (err: any) {
    logError("test-2fa-verify error", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}
