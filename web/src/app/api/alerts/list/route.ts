/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

// In-memory store of webhook alerts
const alertStore: any[] = [];

// Expose alertStore globally for other API routes to push
(global as any).ALERT_STORE = (global as any).ALERT_STORE || alertStore;

export async function GET() {
  return NextResponse.json({
    success: true,
    alerts: (global as any).ALERT_STORE,
  });
}
