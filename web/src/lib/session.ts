// apps/web/lib/session.ts
// ⚡ यह file session create, verify और destroy करने के लिए है
// हिंदी में comments ताकि आपको हर जगह समझ आए

import { signHmac, verifyHmac } from "@/lib/crypto";

export interface SessionTokenPayload {
  userId: string;
  role: string; // super-admin, admin, manager, employee, player
  exp: number; // expiry timestamp
}

// Session expiry (e.g., 7 days)
const SESSION_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7;

// यह function session token create करता है
export function createSessionToken(
  userId: string,
  role: string,
  secret: string
): string {
  const payload: SessionTokenPayload = {
    userId,
    role,
    exp: Date.now() + SESSION_EXPIRY_MS,
  };

  const payloadString = JSON.stringify(payload);
  return signHmac(payloadString, secret);
}

// यह function session token verify करता है
export function verifySessionToken(
  token: string,
  secret: string
): SessionTokenPayload {
  const payloadString = verifyHmac(token, secret) as string;

  let payload: SessionTokenPayload;
  try {
    payload = JSON.parse(payloadString);
  } catch {
    throw new Error("Invalid session token payload");
  }

  if (payload.exp < Date.now()) {
    throw new Error("Session expired");
  }

  return payload;
}

// यह function सिर्फ check करने के लिए है
export function isSessionValid(token: string, secret: string): boolean {
  try {
    verifySessionToken(token, secret);
    return true;
  } catch {
    return false;
  }
}
export async function createSession(
  userId: string,
  role: string,
  secret: string
) {
  return createSessionToken(userId, role, secret);
}
