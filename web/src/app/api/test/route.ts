// /apps/web/src/app/api/test/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validators } from "@/lib/validators";
import { sanitizers } from "@/lib/sanitizers";
import { cryptoUtils } from "@/lib/crypto";

type SignupBody = {
  email: string;
  username: string;
  password: string;
};

type SignupResponse = {
  success: boolean;
  message?: string;
  userId?: string;
  hash?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SignupBody;

    // Basic shape check
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "invalid_body" },
        { status: 400 }
      );
    }

    const email = validators.normalizeInput(body.email || "");
    const username = validators.normalizeInput(body.username || "");
    const password = body.password || "";

    if (!validators.isValidEmail(email))
      return NextResponse.json(
        { success: false, message: "invalid_email" },
        { status: 400 }
      );
    if (!validators.isValidUsername(username))
      return NextResponse.json(
        { success: false, message: "invalid_username" },
        { status: 400 }
      );
    if (typeof password !== "string" || password.length < 8)
      return NextResponse.json(
        { success: false, message: "weak_password" },
        { status: 400 }
      );

    // Sanitization
    const emailSafe = sanitizers.sanitizeForDB(email);
    const usernameSafe = sanitizers.sanitizeForDB(username, 64);

    // Hash password (scrypt)
    const hash = await cryptoUtils.hashPassword(password);

    // Demo userId
    const userId = cryptoUtils.generateToken(8);

    // NOTE: demo only — do not return hash in production
    const res: SignupResponse = {
      success: true,
      message: "user_created_demo",
      userId,
      hash,
    };
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 500 }
    );
  }
}
