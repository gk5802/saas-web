/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// /apps/web/src/lib/logger.ts
// Simple structured logger + audit helpers. Writes lightweight logs to console and optionally to wkt3db as audit entries.

import { wkt3dbClient } from "./wkt3db";

export type LogLevel = "debug" | "info" | "warn" | "error" | "audit";

export interface LogRecord {
  id?: string;
  level: LogLevel;
  ts: number; // ms
  service?: string;
  userId?: string;
  action?: string;
  detail?: Record<string, any> | string;
}

const SERVICE_NAME = process.env.SERVICE_NAME || "web";
const ENABLE_AUDIT = process.env.ENABLE_AUDIT === "true";

function safeStringify(v: any) {
  try {
    return JSON.stringify(v);
  } catch (e) {
    return String(v);
  }
}

export const logger = {
  async log(level: LogLevel, payload: Partial<LogRecord>) {
    const rec: LogRecord = {
      ts: Date.now(),
      level,
      service: SERVICE_NAME,
      ...payload,
    };

    // Console output (structured)
    const out = `[${new Date(
      rec.ts
    ).toISOString()}] [${rec.level.toUpperCase()}] [${rec.service}]${
      rec.userId ? " [uid:" + rec.userId + "]" : ""
    } ${rec.action || ""} ${
      typeof rec.detail === "string"
        ? rec.detail
        : safeStringify(rec.detail || "")
    }`;
    if (level === "error" || level === "audit") console.error(out);
    else console.log(out);

    // Write to audit ledger optionally (lightweight entry)
    if (ENABLE_AUDIT) {
      try {
        await wkt3dbClient.appendEntryIdempotent({
          type: level === "audit" ? "audit" : "log",
          userId: rec.userId,
          amountCents: 0,
          clientRequestId: `log:${rec.service}:${rec.ts}:${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          metadata: { action: rec.action, detail: rec.detail },
          ts: rec.ts,
        });
      } catch (e) {
        // don't crash app because logging failed
        console.warn("audit write failed", e);
      }
    }
    return rec;
  },
  debug(payload: Partial<LogRecord>) {
    return this.log("debug", payload);
  },
  info(payload: Partial<LogRecord>) {
    return this.log("info", payload);
  },
  warn(payload: Partial<LogRecord>) {
    return this.log("warn", payload);
  },
  error(payload: Partial<LogRecord>) {
    return this.log("error", payload);
  },
  audit(payload: Partial<LogRecord>) {
    return this.log("audit", payload);
  },
};

/**
 * 🟢 Logger utility
 * हिंदी: Console पर structured logs लिखने के लिए
 */

function format(level: string, source: string, message: string) {
  return `[${new Date().toISOString()}] [${level}] [web] [${source}] ${message}`;
}

export function logInfo(source: string, message: string) {
  console.log(format("INFO", source, message));
}

export function logError(source: string, error: any) {
  console.error(format("ERROR", source, error?.message || String(error)));
}

export function logWarn(source: string, message: string) {
  console.warn(format("WARN", source, message));
}
export function logDebug(source: string, message: string) {
  console.debug(format("DEBUG", source, message));
}
