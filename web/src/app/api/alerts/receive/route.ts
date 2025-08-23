/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Use global in-memory store
(global as any).ALERT_STORE = (global as any).ALERT_STORE || [];

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Push to in-memory store
    (global as any).ALERT_STORE.push(payload);

    // Log the incoming alert for debugging
    await logger.info({
      action: "webhook-alert-received",
      detail: payload,
    });

    console.log("[Webhook Alert Received]:", JSON.stringify(payload, null, 2));

    return NextResponse.json({ success: true, message: "Alert received" });
  } catch (err) {
    console.error("Error receiving alert:", err);
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 400 }
    );
  }
}
