/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { findDocuments } from "@/lib/wkt3db";
import { createSession } from "@/lib/session";
import { comparePassword } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const users = await findDocuments("users", { email });
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = users[0];
    if (!user.verified) {
      return NextResponse.json(
        { success: false, message: "Email not verified" },
        { status: 403 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.twoFASecret) {
      return NextResponse.json({ success: true, need_2fa: true });
    }

    const session = await createSession(user._id, user.email, user.role);
    return NextResponse.json({
      success: true,
      message: "Login success",
      session,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
