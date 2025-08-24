/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { insertUser } from "@/lib/wkt3db";
import { hashPassword, comparePassword } from "@/lib/crypto";
import { createSession } from "@/lib/authClient";
import { logInfo, logError } from "@/lib/logger";

/**
 * 🟢 Dev Test Auth Full
 * हिंदी: ये API एक ही step में signup → verify → login कर देती है
 * ताकि testing में बार बार token, verify link, आदि न manage करना पड़े
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email और Password required" },
        { status: 400 }
      );
    }

    // 1️⃣ Hash password
    const hashedPassword = await hashPassword(password);

    // 2️⃣ Insert user in mock DB
    const user = await insertUser({
      email,
      password: hashedPassword,
      verified: true, // ✅ Dev shortcut: auto verified
    });

    logInfo("dev-test-auth-full", `User created & verified: ${email}`);

    // 3️⃣ Compare password (simulate login)
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 4️⃣ Create session
    const sessionToken = createSession(user.id);

    logInfo("dev-test-auth-full", `Session created for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Signup + Verify + Login done (Dev only)",
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err: any) {
    logError("dev-test-auth-full", err);
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 500 }
    );
  }
}
