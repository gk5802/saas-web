import { validatePositiveInt, validateUUID } from "./validators";
import { wkt3dbClient } from "./wkt3db.mock";
import { signHmac } from "./crypto";
import { authClient } from "./authClient";

const BET_HMAC_SECRET =
  process.env.BET_HMAC_SECRET || "dev_bet_secret_change_me";

export interface PlaceBetInput {
  sessionToken: string;
  gameId: string;
  amountCents: number;
}

export interface PlaceBetResult {
  betId: string;
  newBalanceCents: number;
  receipt: string; // HMAC-signed receipt
}

export async function placeBet(input: PlaceBetInput): Promise<PlaceBetResult> {
  // 1️⃣ Validate inputs
  validateUUID(input.gameId);
  validatePositiveInt(input.amountCents);

  // 2️⃣ Verify session & role
  const session = await authClient.verifySessionToken(
    input.sessionToken,
    "player"
  );
  const userId = session.userId;

  // 3️⃣ Reserve funds (ledger-first)
  const reserveEntry = await wkt3dbClient.appendEntry({
    type: "reserve",
    userId,
    gameId: input.gameId,
    amountCents: -input.amountCents,
    clientRequestId: `reserve:${userId}:${input.gameId}:${Date.now()}`,
  });

  // 4️⃣ Confirm sufficient funds
  const balance = await wkt3dbClient.getUserBalanceCents(userId);
  if (balance < 0) {
    // Compensate reserve
    await wkt3dbClient.appendEntry({
      type: "compensate-reserve-failed",
      userId,
      gameId: input.gameId,
      amountCents: input.amountCents,
      relatedEntryId: reserveEntry.id,
    });
    throw new Error("Insufficient balance");
  }

  // 5️⃣ Finalize bet entry
  const betEntry = await wkt3dbClient.appendEntry({
    type: "bet",
    userId,
    gameId: input.gameId,
    amountCents: -input.amountCents,
    relatedEntryId: reserveEntry.id,
  });

  // 6️⃣ Get new balance
  const newBalance = await wkt3dbClient.getUserBalanceCents(userId);

  // 7️⃣ Return signed receipt
  const receipt = signHmac(
    { betId: betEntry.id, userId, newBalanceCents: newBalance },
    BET_HMAC_SECRET
  );

  return { betId: betEntry.id, newBalanceCents: newBalance, receipt };
}
