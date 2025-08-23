// /apps/web/src/lib/sanitizers.ts
// Input sanitizers and output escaping, हिन्दी comments

/** invisible/control characters हटाएँ */
export function stripInvisibleChars(s: string): string {
  return s.replace(
    /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E]/g,
    ""
  );
}

/** HTML escape — output में XSS रोकने के लिए */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** sanitizeForDB: canonicalize + trim + length limit */
export function sanitizeForDB(raw: string, maxLen = 2000): string {
  const n = stripInvisibleChars(raw.normalize("NFC"))
    .replace(/\s+/g, " ")
    .trim();
  return n.slice(0, maxLen);
}

export const sanitizers = { stripInvisibleChars, escapeHtml, sanitizeForDB };
