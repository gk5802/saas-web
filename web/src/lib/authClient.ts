// authClient.ts
// 👉 सेशन टोकन verify, sign और revoke करने के लिए helper
// हिन्दी comments दिए गए हैं ताकि आसानी से समझा जा सके

import crypto from "crypto";
import { verifyHmac, signHmac } from "./crypto";
import { validateUUID } from "./validators";


export type UserRole =
  | "super-admin"
  | "admin"
  | "manager"
  | "employee"
  | "player";

export interface SessionTokenPayload {
  userId: string; // यूज़र की यूनिक ID
  role: UserRole; // रोल (player, admin आदि)
  exp: number; // expiry समय (epoch seconds)
  iat: number; // issued at
  jti: string; // token ID (revocation के लिए)
}

// memory में revoked टोकन store करने के लिए (dev mode)
const revokedJti = new Set<string>();

const SESSION_HMAC_SECRET =
  process.env.SESSION_HMAC_SECRET || "dev_secret_change_me";

export const authClient = {
  /**
   * Verify a session token:
   * - signature check
   * - expiry check
   * - role check (optional)
   * हिन्दी: टोकन validate करेगा और payload लौटाएगा
   */
  async verifySessionToken(
    token: string,
    requiredRole?: UserRole
  ): Promise<SessionTokenPayload> {
    if (!token) throw new Error("Missing session token");

    let payload: SessionTokenPayload;
    try {
      payload = verifyHmac(token, SESSION_HMAC_SECRET) as SessionTokenPayload;
    } catch {
      throw new Error("Invalid session token signature");
    }

    // ✅ validateUUID अब void return करता है, direct call
    try {
      validateUUID(payload.userId);
    } catch {
      throw new Error("Invalid user ID in token");
    }

    if (!payload.role) throw new Error("Missing role in token");

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) throw new Error("Session expired");
    if (!payload.iat) throw new Error("Invalid issued-at timestamp");
    if (!payload.jti) throw new Error("Missing token ID");

    if (revokedJti.has(payload.jti)) throw new Error("Token revoked");

    if (requiredRole && payload.role !== requiredRole) {
      throw new Error("Insufficient role");
    }

    return payload;
  },

  /**
   * Revoke a session token by its jti.
   * हिन्दी: revoke करने के लिए jti memory में add किया जाएगा
   */
  async revokeToken(jti: string) {
    revokedJti.add(jti);
  },

  /**
   * Dev helper: नया token issue करना
   * हिन्दी: केवल dev/test mode के लिए, production में auth service से issue करेंगे
   */
  async _dev_issueToken(userId: string, role: UserRole, ttlSeconds = 3600) {
    try {
      validateUUID(userId); // validate userId before issuing
    } catch {
      throw new Error("Invalid userId");
    }

    const now = Math.floor(Date.now() / 1000);
    const payload: SessionTokenPayload = {
      userId,
      role,
      exp: now + ttlSeconds,
      iat: now,
      jti: crypto.randomUUID(),
    };
    return signHmac(payload, SESSION_HMAC_SECRET);
  },
};
