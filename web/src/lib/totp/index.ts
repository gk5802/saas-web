// Base32 + TOTP (SHA1, 6 digits, 30s) — Google/Authy compatible
// हिंदी: छोटा/साफ़, कोई external crypto lib नहीं (Node's crypto ही)

import crypto from "crypto";
import { base32Decode, base32Encode } from "./base32";
import qrcode from "qrcode"; // आपने already install कर लिया है

const STEP = 30; // seconds
const DIGITS = 6;

export function generateBase32Secret(byteLen = 20): string {
  const raw = crypto.randomBytes(byteLen);
  return base32Encode(new Uint8Array(raw));
}

function hotp(base32Secret: string, counter: number): string {
  const key = Buffer.from(base32Decode(base32Secret));
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

export function generateTOTP(
  base32Secret: string,
  t = Date.now(),
  window = 0
): string {
  const counter = Math.floor(t / 1000 / STEP) + window;
  return hotp(base32Secret, counter);
}

export function verifyTOTP(base32Secret: string, token: string): boolean {
  const now = Date.now();
  return (
    token === generateTOTP(base32Secret, now, 0) ||
    token === generateTOTP(base32Secret, now, -1) ||
    token === generateTOTP(base32Secret, now, 1)
  );
}

export async function makeOtpAuthAndQr(opts: {
  email: string;
  secret: string;
  issuer?: string;
}) {
  const issuer = encodeURIComponent(opts.issuer || "WKT3");
  const label = encodeURIComponent(`${issuer}:${opts.email}`);
  const secret = opts.secret.replace(/[\s=]/g, "");
  const otpauth = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${DIGITS}&period=${STEP}`;
  const qr = await qrcode.toDataURL(otpauth);
  return { otpauth, qr };
}
