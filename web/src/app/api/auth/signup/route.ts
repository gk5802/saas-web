/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { insertDocument } from "@/lib/wkt3db";
import { generateToken, hashPassword } from "@/lib/crypto";
import { validateEmail, validatePassword } from "@/lib/validators";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email" },
        { status: 400 }
      );
    }
    if (!validatePassword(password)) {
      return NextResponse.json(
        { success: false, message: "Weak password" },
        { status: 400 }
      );
    }

    const token = generateToken();
    const passwordHash = await hashPassword(password);

    await insertDocument("users", {
      email,
      passwordHash,
      verified: false,
      verificationToken: token,
      createdAt: new Date().toISOString(),
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json({
      success: true,
      message: "Signup successful, check your email.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
