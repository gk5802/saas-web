import { NextRequest, NextResponse } from "next/server";
import { authClient, UserRole } from "@/lib/authClient";
import { wkt3dbClient } from "@/lib/wkt3db.mock";
import { placeBet } from "@/lib/placeBet.server";
import { logger } from "@/lib/logger";
import alerts, { AlertSeverity } from "@/lib/alerts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      role,
      gameId,
      betAmount,
      simulateRapidBets = 0,
      simulateFailedLogins = 0,
    } = body;

    if (!userId || !role || !gameId || !betAmount)
      throw new Error("Missing required fields");

    // 1️⃣ Dev Token Issue
    const sessionToken = await authClient._dev_issueToken(
      userId,
      role as UserRole
    );

    // 2️⃣ Auto deposit initial balance if not exists
    const currentBalance = await wkt3dbClient.getUserBalanceCents(userId);
    if (currentBalance < betAmount) {
      await wkt3dbClient.appendEntry({
        type: "deposit",
        userId,
        gameId,
        amountCents: betAmount * 2, // enough balance for testing
        clientRequestId: `init-deposit:${Date.now()}`,
      });
    }

    // 3️⃣ Place Bet
    const betResult = await placeBet({
      sessionToken,
      gameId,
      amountCents: betAmount,
    });

    // 4️⃣ Logger entry
    await logger.audit({
      userId,
      action: "place-bet",
      detail: { betId: betResult.betId, amountCents: betAmount },
    });

    // 5️⃣ Alerts Simulation
    // Large bet alert
    if (betAmount > 5000) {
      await alerts.sendAlert({
        ts: Date.now(),
        severity: "high",
        title: "Large Bet Placed",
        description: `User ${userId} placed a bet of ${betAmount} cents`,
        userId,
      });
    }

    // Rapid bets simulation
    for (let i = 0; i < simulateRapidBets; i++) {
      await alerts.evaluateEvent({ type: "bet", userId, ts: Date.now() });
    }

    // Failed login simulation
    for (let i = 0; i < simulateFailedLogins; i++) {
      await alerts.evaluateEvent({
        type: "auth:login_failed",
        userId,
        ts: Date.now(),
      });
    }

    // 6️⃣ Return response
    const newBalance = await wkt3dbClient.getUserBalanceCents(userId);
    const ledger = await wkt3dbClient.getLedger();

    return NextResponse.json({
      success: true,
      sessionToken,
      betResult,
      newBalance,
      ledger,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 400 }
    );
  }
}
