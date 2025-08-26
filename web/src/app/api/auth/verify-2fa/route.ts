import { NextRequest, NextResponse } from "next/server";
import { findDocuments } from "@/lib/wkt3db";
import { verifyTOTP } from "@/lib/totp";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const { userId, otp } = (await req.json()) as {
      userId: string;
      otp: string;
    };

    if (!userId || !otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: "Missing/invalid params" },
        { status: 400 }
      );
    }

    const users = await findDocuments("users", { _id: userId });
    if (!users.length || !users[0].twoFAEnabled) {
      return NextResponse.json(
        { success: false, message: "2FA not enabled" },
        { status: 400 }
      );
    }

    const secret: string = users[0].twoFASecret;
    const ok = verifyTOTP(secret, otp);

    if (!ok) {
      await logger.warn({ action: "2fa-verify-invalid", userId });
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    await logger.info({ action: "2fa-verify-ok", userId });
    return NextResponse.json({ success: true, message: "OTP verified" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await logger.error({ action: "2fa-verify-failed", detail: msg });
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
