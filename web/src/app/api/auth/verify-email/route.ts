/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { updateDocument, findDocuments } from "@/lib/wkt3db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Missing token" },
        { status: 400 }
      );
    }

    const users = await findDocuments("users", { verificationToken: token });
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const user = users[0];
    await updateDocument("users", user._id, {
      verified: true,
      verificationToken: null,
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
