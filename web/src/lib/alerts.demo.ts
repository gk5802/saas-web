import alerts from "./alerts";
// import { wkt3dbClient } from "./wkt3db.mock";

// Simple alert for large bet (>5000 cents)
alerts.registerRule("large-bet-alert", async (evt) => {
  if (!evt || evt.type !== "bet") return null;
  if (evt.amountCents < -5000) {
    // negative because reserve
    return {
      ts: Date.now(),
      severity: "high",
      title: "Large Bet Placed",
      description: `User ${
        evt.userId
      } placed a very large bet: ${-evt.amountCents} cents`,
      userId: evt.userId,
      meta: evt,
    };
  }
  return null;
});
