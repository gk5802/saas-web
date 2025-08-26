/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/src/lib/logger/types.ts
// 📝 हिंदी: यहाँ log की types defined हैं

export type LogLevel = "info" | "error" | "warn" | "audit";

export interface LogEntry {
  timestamp: string;
  app: string;
  level: LogLevel;
  message: string;
  meta?: any;
}
