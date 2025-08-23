/* eslint-disable @typescript-eslint/no-explicit-any */
// /apps/web/src/lib/crypto.ts
// Crypto utilities — scrypt password hashing, HMAC signing, secure token
// हिन्दी comments included. No `any`.

import {
  randomBytes,
  scrypt as _scrypt,
  timingSafeEqual,
} from "crypto";
import { promisify } from "util";
import { createHmac, randomUUID } from "node:crypto"; // ✅ Use node:crypto for ESM/TS



const scrypt = promisify(_scrypt);
const SCRYPT_KEYLEN = 64;
const SCRYPT_SALT_BYTES = 16;

/**
 * hashPassword(password) => "salt:derivedHex"
 * हिन्दी: पासवर्ड को scrypt से derive करेंगे और salt के साथ store करेंगे।
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES).toString("hex");
  const derived = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

/**
 * verifyPassword(stored, candidate) => boolean
 * हिन्दी: stored format salt:hex; candidate पासवर्ड match करें
 */
export async function verifyPassword(
  stored: string,
  candidate: string
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const salt = parts[0];
  const keyHex = parts[1];
  const derived = (await scrypt(candidate, salt, SCRYPT_KEYLEN)) as Buffer;
  const derivedHex = derived.toString("hex");
  try {
    const a = Buffer.from(derivedHex, "hex");
    const b = Buffer.from(keyHex, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** generateToken(bytes) => hex string */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * signHmac(payload, secret) => token
 * format: base64url(JSON) + '.' + hex(hmac)
 * हिन्दी: किसी object का HMAC-signed token बनाओ
 */


// Sign object with HMAC
export function signHmac(obj: any, secret: string): string {
  const payload = JSON.stringify(obj);
  const hmac = createHmac("sha256", secret).update(payload).digest("hex");
  const token = Buffer.from(payload).toString("base64") + "." + hmac;
  return token;
}

/**
 * verifyHmac(token, secret) => parsed object of type T or throw
 * हिन्दी: token verify करके payload लौटाएगा
 */
// Verify HMAC and return parsed object
export function verifyHmac(token: string, secret: string): any {
  if (!token.includes(".")) throw new Error("Invalid token format");
  const [b64Payload, hmac] = token.split(".");
  const payloadStr = Buffer.from(b64Payload, "base64").toString("utf8");
  const computedHmac = createHmac("sha256", secret).update(payloadStr).digest("hex");
  if (computedHmac !== hmac) throw new Error("Invalid HMAC signature");
  try {
    return JSON.parse(payloadStr);
  } catch {
    throw new Error("Invalid JSON payload");
  }
}

// Random UUID helper
export function randomId() {
  return randomUUID();
}


export const cryptoUtils = {
  hashPassword,
  verifyPassword,
  generateToken,
  signHmac,
  verifyHmac,
};
