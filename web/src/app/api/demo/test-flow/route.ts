import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/authClient";
import { placeBet } from "@/lib/placeBet.server";
import { wkt3dbClient } from "@/lib/wkt3db.mock";
import alerts from "@/lib/alerts";
import { logger } from "@/lib/logger";

// Single route demo — all steps together
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, role, gameId, betAmount } = body;

    // 1️⃣ Dev Token (HMAC signed)
    const sessionToken = await authClient._dev_issueToken(userId, role);
    await logger.audit({ action: "dev-token-issued", userId });

    // 2️⃣ Place Bet
    const betResult = await placeBet({
      sessionToken,
      gameId,
      amountCents: betAmount,
    });
    await logger.audit({ action: "bet-placed", userId, detail: betResult });

    // 3️⃣ Get Balance
    const session = await authClient.verifySessionToken(sessionToken);
    const balance = await wkt3dbClient.getUserBalanceCents(session.userId);
    await logger.info({
      action: "balance-checked",
      userId: session.userId,
      detail: { balance },
    });

    // 4️⃣ Trigger Alert manually (large bet >5000 cents)
    await alerts.evaluateEvent({
      type: "bet",
      userId: session.userId,
      gameId,
      amountCents: betAmount,
    });

    // 5️⃣ Collect ledger entries for demo
    const ledger = await wkt3dbClient.getLedger();

    return NextResponse.json({
      success: true,
      sessionToken,
      betResult,
      balance,
      ledger,
    });
  } catch (err) {
    await logger.error({ action: "demo-flow-failed", detail: String(err) });
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 400 }
    );
  }
}
