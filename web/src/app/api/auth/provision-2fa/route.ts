/* eslint-disable @typescript-eslint/no-explicit-any */
// हिंदी: यह API login के बाद (password verify के बाद) call होगी
// → secret generate, otpauth+QR return, साथ में downloads links
import { NextRequest, NextResponse } from "next/server";
import { generateBase32Secret, makeOtpAuthAndQr } from "@/lib/totp/index";
import { insertDocument } from "@/lib/wkt3db";
import { logger } from "@/lib/logger";
import { verifySessionToken } from "@/lib/session";


// हिंदी: session verify के लिए secret (dev में env से)
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
    // हिन्दी: token header या query param — दोनों चलेंगे
    const token = getBearerOrQueryToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No session token" },
        { status: 401 }
      );
    }
    const session = verifySessionToken(token, SESSION_SECRET);
    const userId = session.userId;

    // हिन्दी: Base32 secret बनाओ (Google Auth compatible)
    const secret: string = generateBase32Secret(20);
    // NOTE: email ideally user record से — demo में userId as label
    const { otpauth, qr } = await makeOtpAuthAndQr({
      email: userId,
      secret,
      issuer: "WKT3",
    });

    // हिन्दी: provisioning entry create करें (pending)
    await insertDocument("twofa_provisioning", {
      userId,
      secret,
      createdAt: new Date().toISOString(),
      status: "pending",
    });

    await logger.info({ action: "2fa-provision", userId, detail: "pending" });

    return NextResponse.json({
      success: true,
      message:
        "Scan the QR in Google Authenticator, or enter the Base32 secret manually.",
      otpauth,
      qr, // <img src={qr} />
      secret, // manual entry के लिए
      downloadLinks: {
        googleAuthenticatorAndroid:
          "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2",
        googleAuthenticatorIOS:
          "https://apps.apple.com/app/google-authenticator/id388497605",
        authy: "https://authy.com/download/",
        microsoftAuthenticator:
          "https://www.microsoft.com/security/mobile-authenticator-app",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await logger.error({ action: "2fa-provision-failed", detail: msg });
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
