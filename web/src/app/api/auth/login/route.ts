/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/wkt3db";
import { comparePassword } from "@/lib/crypto";
import { createSession } from "@/lib/authClient";
import { logInfo, logError } from "@/lib/logger";

/**
 * 🟢 Login API
 * हिंदी: यह API user login handle करती है
 * 1. email से user find करती है
 * 2. password verify करती है
 * 3. session token बनाती है और return करती है
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // ✅ check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ✅ compare password
    const match = await comparePassword(password, user.passwordHash);
    if (!match) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ✅ create session
    const token = await createSession(user.id);

    logInfo("auth-login", `User ${user.id} logged in`);

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        sessionToken: token,
      },
      { status: 200 }
    );
  } catch (err: any) {
    logError("auth-login", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
