/* eslint-disable @typescript-eslint/no-explicit-any */
// /apps/web/src/lib/crypto.ts
// Crypto utilities — scrypt password hashing, HMAC signing, secure token
// हिन्दी comments included. No `any`.
import crypto from "crypto";

import {
  randomBytes,
  scrypt as _scrypt,
  timingSafeEqual,
} from "crypto";
import { promisify } from "util";
import { randomUUID } from "node:crypto"; // ✅ Use node:crypto for ESM/TS



const scrypt = promisify(_scrypt);
const SCRYPT_KEYLEN = 64;

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


// Random UUID helper
export function randomId() {
  return randomUUID();
}


/**
 * 🔑 Password Hash करना
 * Hindi: signup के दौरान password को secure hash में convert करता है
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}$${hash}`;
}

/**
 * 🔑 Password Compare करना
 * Hindi: login में user द्वारा दिया password और stored hash match करता है या नहीं
 */
export async function comparePassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, originalHash] = storedHash.split("$");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === originalHash;
}

/**
 * 🔐 HMAC Sign (Session Token)
 */
export function signHmac(data: any, secret: string): string {
  const payload = JSON.stringify(data);
  return (
    crypto.createHmac("sha256", secret).update(payload).digest("hex") +
    "." +
    Buffer.from(payload).toString("base64")
  );
}

/**
 * 🔐 HMAC Verify (Session Token)
 */
export function verifyHmac(token: string, secret: string): any {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [signature, payloadB64] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(Buffer.from(payloadB64, "base64"))
    .digest("hex");
  if (signature !== expectedSignature)
    throw new Error("Invalid token signature");
  return JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"));
}



export const cryptoUtils = {
  hashPassword,
  verifyPassword,
  generateToken,
  signHmac,
  verifyHmac,
  randomId,
};
