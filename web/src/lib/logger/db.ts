/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/src/lib/logger/db.ts
// 📝 हिंदी: Log को database (wkt3db) में save करने का काम

import { insertDocument } from "@/lib/wkt3db";
import { LogEntry, LogLevel } from "./types";

const APP_NAME = "web";

export async function logToDb(level: LogLevel, message: string, meta?: any) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    app: APP_NAME,
    level,
    message,
    meta: meta || {},
  };

  try {
    await insertDocument("logs", entry);
  } catch (err) {
    console.error(`[Logger-DB] failed`, err);
  }
}
