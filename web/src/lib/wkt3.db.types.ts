/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/src/lib/wkt3db.types.ts

export interface LogEntry {
  id: string; // uuid
  level: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  source: "web" | "auth" | "db" | "game" | "email";
  message: string;
  userId?: string; // optional, कौन user/employee था
  metadata?: any; // extra info (game, bet, etc.)
  createdAt?: string;
  updatedAt?: string;
}
