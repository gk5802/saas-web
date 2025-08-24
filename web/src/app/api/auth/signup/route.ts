/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { validateEmail, validatePassword } from "@/lib/validators";
import { hashPassword } from "@/lib/crypto";
import { insertUser } from "@/lib/wkt3db";
import { sendVerificationEmail } from "@/lib/mailer";
import { v4 as uuidv4 } from "uuid";

/**
 * 📝 Signup API
 * नया user register करेगा
 * - Email + Password validate करेगा
 * - Password को hash करेगा
 * - User को DB में store करेगा (verified = false initially)
 * - Verification email भेजेगा
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, username } = body;

    // 🛡️ Input validation (Email)
    if (!validateEmail(email)) {
      return NextResponse.json({ success: false, message: "Invalid email" }, { status: 400 });
    }

    // 🛡️ Input validation (Password)
    if (!validatePassword(password)) {
      return NextResponse.json({ success: false, message: "Weak password" }, { status: 400 });
    }

    // 🔑 Password hash करना
    const hashedPassword = await hashPassword(password);

    // 🆔 नया user object बनाना
    const newUser = {
      id: uuidv4(), // unique userId
      email,
      username: username || email.split("@")[0],
      passwordHash: hashedPassword,
      verified: false, // email verify होना बाकी है
      balance: 10000, // default balance (cents)
      role: "player", // default role
      createdAt: new Date().toISOString(),
    };

    // 💾 DB में user insert करना
    await insertUser(newUser);

    // 📧 Verification email भेजना
    await sendVerificationEmail(newUser.email, newUser.id);

    return NextResponse.json({
      success: true,
      message: "Signup successful, please verify your email.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Error: " + err.message },
      { status: 500 }
    );
  }
}
