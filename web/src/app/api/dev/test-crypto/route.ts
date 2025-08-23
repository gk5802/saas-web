import { NextRequest, NextResponse } from "next/server";
import { signHmac, verifyHmac, randomId } from "@/lib/crypto";
import { validateUUID } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { obj, secret } = body;

    if (!obj || !secret) throw new Error("Missing obj or secret");

    // 1️⃣ Validate any UUIDs in obj (demo only)
    if (obj.userId) validateUUID(obj.userId);

    // 2️⃣ Sign HMAC
    const token = signHmac(obj, secret);

    // 3️⃣ Verify HMAC
    const verified = verifyHmac(token, secret);

    // 4️⃣ Random ID helper test
    const randomUUID = randomId();

    return NextResponse.json({
      success: true,
      token,
      verified,
      randomUUID,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 400 }
    );
  }
}
