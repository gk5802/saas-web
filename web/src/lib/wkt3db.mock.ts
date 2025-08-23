/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomId } from "./crypto";

// In-memory ledger & balances
let ledger: any[] = [];
let balances: Record<string, number> = {};

// Append entry to ledger
export const wkt3dbClient = {
  appendEntry: async (entry: {
    type: string;
    userId: string;
    gameId?: string;
    amountCents: number;
    clientRequestId?: string;
    relatedEntryId?: string;
  }) => {
    const id = randomId();
    const ts = Date.now();

    const newEntry = { id, ts, ...entry };
    ledger.push(newEntry);

    // Update balance if userId exists
    if (entry.userId) {
      balances[entry.userId] =
        (balances[entry.userId] || 0) + entry.amountCents;
    }

    return newEntry;
  },

  getUserBalanceCents: async (userId: string) => {
    return balances[userId] || 0;
  },

  getLedger: async () => {
    return ledger;
  },

  // Reset ledger (for dev/testing)
  reset: async () => {
    ledger = [];
    balances = {};
  },
};
