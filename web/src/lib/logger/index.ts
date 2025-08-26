/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/src/lib/logger/index.ts
// 📝 हिंदी: Public API (logInfo, logError...) जो बाकी app use करेगा

import { logToDb } from "./db";
import { logToConsole } from "./console";
import { LogLevel } from "./types";

async function log(level: LogLevel, message: string, meta?: any) {
  logToConsole(level, message, meta);
  await logToDb(level, message, meta);
}

export async function logInfo(message: string, meta?: any) {
  await log("info", message, meta);
}

export async function logError(message: string, meta?: any) {
  await log("error", message, meta);
}

export async function logWarn(message: string, meta?: any) {
  await log("warn", message, meta);
}

export async function logAudit(message: string, meta?: any) {
  await log("audit", message, meta);
}
