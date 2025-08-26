/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/src/lib/logger/console.ts
// 📝 हिंदी: Log को console पर print करने का काम

import { LogLevel } from "./types";

const APP_NAME = "web";

export function logToConsole(level: LogLevel, message: string, meta?: any) {
  const time = new Date().toISOString();
  const metaStr = meta ? JSON.stringify(meta) : "";

  switch (level) {
    case "info":
      console.log(`[${time}] [INFO] [${APP_NAME}] ${message}`, metaStr);
      break;
    case "error":
      console.error(`[${time}] [ERROR] [${APP_NAME}] ${message}`, metaStr);
      break;
    case "warn":
      console.warn(`[${time}] [WARN] [${APP_NAME}] ${message}`, metaStr);
      break;
    case "audit":
      console.log(`[${time}] [AUDIT] [${APP_NAME}] ${message}`, metaStr);
      break;
  }
}
