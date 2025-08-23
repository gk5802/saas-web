// /apps/web/src/lib/validators.ts
// Input validation utilities — हिन्दी comments के साथ, no `any`

export const MAX_EMAIL_LENGTH = 254;
export const MAX_USERNAME_LENGTH = 30;

/**
 * Normalize और basic cleanup करें:
 * - Unicode NFC normalize
 * - control/zero-width/bidi characters remove
 * - multiple whitespace collapse करना
 */
export function normalizeInput(input: string): string {
  const s = input === null || input === undefined ? "" : String(input);
  const n = s.normalize("NFC");
  return n
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function enforceMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function isValidEmail(raw: string): boolean {
  const s = normalizeInput(raw).toLowerCase();
  if (!enforceMaxLength(s, MAX_EMAIL_LENGTH)) return false;
  // conservative regex
  const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$/i;
  return re.test(s);
}

export function isValidUsername(raw: string): boolean {
  const s = normalizeInput(raw);
  if (!enforceMaxLength(s, MAX_USERNAME_LENGTH)) return false;
  // start with letter/number, allow letters/numbers/_/-
  return /^[A-Za-z0-9][A-Za-z0-9_-]{2,29}$/.test(s);
}

/** UUID validate — throws on invalid (useful for routes) */
export function validateUUID(id: string): void {
  const s = normalizeInput(id);
  if (
    !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      s
    )
  ) {
    throw new Error("invalid_uuid");
  }
}

/** Positive integer validate — throws on invalid */
export function validatePositiveInt(n: number): void {
  if (!Number.isInteger(n) || n <= 0) throw new Error("invalid_positive_int");
}

/** Amount validation (currency-safe two decimals) */
export function isValidAmount(
  value: unknown,
  min = 1,
  max = 100000000
): boolean {
  if (typeof value === "string" && value.trim().length === 0) return false;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return false;
  const rounded = Math.round(num * 100) / 100; // two decimals
  return rounded >= min && rounded <= max;
}

/** Safe integer parse, returns integer or null */
export function parseIntegerSafe(raw: string): number | null {
  const s = normalizeInput(raw);
  if (!/^-?\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export const validators = {
  normalizeInput,
  enforceMaxLength,
  isValidEmail,
  isValidUsername,
  validateUUID,
  validatePositiveInt,
  isValidAmount,
  parseIntegerSafe,
};
