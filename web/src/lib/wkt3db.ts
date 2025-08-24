/* eslint-disable @typescript-eslint/no-explicit-any */
// wkt3db.ts
// 👉 हमारी Go सर्विस (wkt3db) से बात करने के लिए client
// हिन्दी comments दिए गए हैं

import { v4 as uuidv4 } from "uuid";

const myUuid: string = uuidv4();
console.log(myUuid);

// 📝 Mock DB (abhi के लिए memory में store करेंगे)
const users: any[] = [];

/**
 * 👤 User Insert Function
 * Hindi: यह function नया user users[] list में add करता है
 */
export async function insertUser(user: any) {
  users.push(user);
  return user;
}

/**
 * 🔍 User Fetch by Email
 * Hindi: email के आधार पर user खोजने के लिए
 */
export async function getUserByEmail(email: string) {
  return users.find((u) => u.email === email) || null;
}

/**
 * 🔍 User Fetch by ID
 * Hindi: id के आधार पर user खोजने के लिए
 */
export async function getUserById(id: string) {
  return users.find((u) => u.id === id) || null;
}

/**
 * 📋 Debugging: Users list देखना
 */
export async function listUsers() {
  return users;
}


export interface LedgerEntry {
  id: string;
  type: string;
  userId?: string;
  gameId?: string;
  amountCents: number;
  clientRequestId: string;
  relatedEntryId?: string;
  metadata?: Record<string, any>;
  ts?: number;
}

const WKT3DB_URL = process.env.WKT3DB_URL || "http://localhost:8080";

export const wkt3dbClient = {
  // 👉 नया entry append करना
  async appendEntry(entry: Omit<LedgerEntry, "id">): Promise<LedgerEntry> {
    const res = await fetch(`${WKT3DB_URL}/append`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`wkt3db append failed: ${res.status}`);
    return res.json();
  },

  // 👉 Idempotent append (clientRequestId same रहेगा)
  async appendEntryIdempotent(
    entry: Omit<LedgerEntry, "id">
  ): Promise<LedgerEntry> {
    const res = await fetch(`${WKT3DB_URL}/append-idempotent`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok)
      throw new Error(`wkt3db append-idempotent failed: ${res.status}`);
    return res.json();
  },

  // 👉 यूज़र का balance निकालना
  async getUserBalanceCents(userId: string): Promise<number> {
    const res = await fetch(`${WKT3DB_URL}/balance/${userId}`);
    if (!res.ok) throw new Error(`wkt3db balance fetch failed: ${res.status}`);
    const data = await res.json();
    return data.balanceCents;
  },
};
