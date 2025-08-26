// apps/web/app/api/dev/test-2fa/route.ts
// ⚡ हिंदी comments for easy understanding

import { NextRequest, NextResponse } from "next/server";
import { generateSecret, generateQRCode, verifyTOTP } from "@/lib/totp";

// Dummy store (🚨 production में DB use होगा)
let tempSecret: string | null = null;

export async function GET() {
  // जब user पहली बार 2FA enable करेगा
  const email = "testuser@example.com"; // यह dynamic होगा production में
  const secret = generateSecret();
  tempSecret = secret;

  const { otpauth, qr } = await generateQRCode(email, secret, "WKT3-SaaS");

  return NextResponse.json({
    success: true,
    message: "Scan this QR in Google Authenticator",
    otpauth,
    qr, // frontend पर <img src={qr} /> show कर सकते हो
  });
}

export async function POST(req: NextRequest) {
  // जब user OTP डाल कर verify करेगा
  const body = await req.json();
  const { token } = body;

  if (!tempSecret) {
    return NextResponse.json({
      success: false,
      message: "No secret generated yet",
    });
  }

  const isValid = verifyTOTP(tempSecret, token);

  return NextResponse.json({
    success: isValid,
    message: isValid ? "2FA verified successfully ✅" : "Invalid OTP ❌",
  });
}
