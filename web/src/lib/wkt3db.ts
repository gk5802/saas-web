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

// // -------------------------
// // Generic insert function
// // -------------------------
// export async function insertDocument(collection: string, doc: any) {
//   const res = await fetch(`${WKT3DB_URL}/collections/${collection}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(doc),
//   });

//   if (!res.ok) {
//     throw new Error(`Failed to insert document into ${collection}`);
//   }
//   return await res.json();
// }

// // -------------------------
// // Generic get function
// // -------------------------
// export async function getDocuments(collection: string) {
//   const res = await fetch(`${WKT3DB_URL}/collections/${collection}`, {
//     method: "GET",
//     headers: { "Content-Type": "application/json" },
//   });

//   if (!res.ok) {
//     throw new Error(`Failed to fetch documents from ${collection}`);
//   }
//   return await res.json();
// }

// -------------------------
// Generic get by id
// -------------------------
export async function getDocumentById(collection: string, id: string) {
  const res = await fetch(`${WKT3DB_URL}/collections/${collection}/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch document ${id} from ${collection}`);
  }
  return await res.json();
}

// apps/web/src/lib/wkt3db.ts
// Wrapper for our Go service wkt3db (append-only log + CRUD)

export interface Document {
  _id: string;
  [key: string]: any;
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${WKT3DB_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`wkt3db request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Insert document
export async function insertDocument(collection: string, doc: any): Promise<Document> {
  return request(`/collections/${collection}`, {
    method: "POST",
    body: JSON.stringify(doc),
  });
}


// Get multiple documents (with query)
export async function getDocuments(
  collection: string,
  query: Record<string, any> = {}
): Promise<Document[]> {
  return request(`/collections/${collection}/query`, {
    method: "POST",
    body: JSON.stringify(query),
  });
}
// Find documents (explicitly calling getDocuments to use query)
export async function findDocuments(
  collection: string,
  query: Record<string, any> = {}
): Promise<Document[]> {
  return getDocuments(collection, query);
}


// Update document (partial)
export async function updateDocument(
  collection: string,
  id: string,
  updates: Record<string, any>
): Promise<Document> {
  return request(`/collections/${collection}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
