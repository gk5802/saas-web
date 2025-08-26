/* eslint-disable @typescript-eslint/no-explicit-any */
import { logInfo, logError } from "@/lib/logger";

import { NextRequest, NextResponse } from "next/server";
import { verifyTOTP } from "@/lib/totp";
import { findDocuments, updateDocument } from "@/lib/wkt3db";
import { logger } from "@/lib/logger";
import { verifySessionToken } from "@/lib/session";


const SESSION_SECRET: string =
  process.env.SESSION_HMAC_SECRET || "dev_session_change_me";

function getBearerOrQueryToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  const url = new URL(req.url);
  const tokenParam = url.searchParams.get("token");
  return tokenParam || null;
}

export async function POST(req: NextRequest) {
  try {
    const { otp } = (await req.json()) as { otp: string };

    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP format" },
        { status: 400 }
      );
    }

    const token = getBearerOrQueryToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "No session token" },
        { status: 401 }
      );

    const session = verifySessionToken(token, SESSION_SECRET);
    const userId = session.userId;

    // हिन्दी: pending provisioning fetch करें
    const pending = await findDocuments("twofa_provisioning", {
      userId,
      status: "pending",
    });
    if (!pending.length) {
      return NextResponse.json(
        { success: false, message: "No pending 2FA setup" },
        { status: 400 }
      );
    }
    const prov = pending[0];
    const secret: string = prov.secret;

    // हिन्दी: OTP verify करें
    const ok = verifyTOTP(secret, otp);
    if (!ok) {
      await logger.warn({ action: "2fa-enable-invalid-otp", userId });
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // हिन्दी: user profile में 2FA persist करें
    await updateDocument("users", userId, {
      twoFAEnabled: true,
      twoFASecret: secret,
      twoFAEnabledAt: new Date().toISOString(),
    });

    // हिन्दी: provisioning entry complete mark
    await updateDocument("twofa_provisioning", prov._id, {
      status: "enabled",
      enabledAt: new Date().toISOString(),
    });

    await logger.info({ action: "2fa-enabled", userId });

    return NextResponse.json({
      success: true,
      message: "2FA successfully enabled",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await logger.error({ action: "2fa-enable-failed", detail: msg });
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
