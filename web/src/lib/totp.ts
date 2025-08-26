// apps/web/lib/totp.ts
// ⚡ हिंदी comments added for clarity

import crypto from "crypto";
import qrcode from "qrcode";

// 🔑 TOTP generate करने का function
export function generateTOTP(secret: string, window: number = 0): string {
  const timeStep = 30; // हर 30 सेकंड में नया OTP
  const counter = Math.floor(Date.now() / 1000 / timeStep) + window;

  const key = Buffer.from(secret, "hex");
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1_000_000).toString().padStart(6, "0"); // 6 digit OTP
}

// 🔑 Secret generate करने का function
export function generateSecret(length: number = 20): string {
  return crypto.randomBytes(length).toString("hex");
}

// 🔑 QR Code बनाने का function (Google Authenticator compatible)
export async function generateQRCode(
  userEmail: string,
  secret: string,
  appName: string
) {
  const otpauth = `otpauth://totp/${appName}:${userEmail}?secret=${secret}&issuer=${appName}&algorithm=SHA1&digits=6&period=30`;
  const qr = await qrcode.toDataURL(otpauth);
  return { otpauth, qr };
}

// 🔑 Verify करने का function (±1 window tolerance)
export function verifyTOTP(secret: string, token: string): boolean {
  const current = generateTOTP(secret);
  const prev = generateTOTP(secret, -1);
  const next = generateTOTP(secret, 1);

  return token === current || token === prev || token === next;
}
