/* eslint-disable @typescript-eslint/no-explicit-any */
// /apps/web/src/lib/alerts.ts
// Simple alerting system: rule-based detectors + email/webhook notify. No external dependencies.

import { logger } from "./logger";
import nodemailer from "nodemailer";
import { wkt3dbClient } from "./wkt3db";
export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface AlertPayload {
  id?: string;
  ts: number;
  severity: AlertSeverity;
  title: string;
  description?: string;
  userId?: string;
  meta?: Record<string, any>;
}



// Transporter (nodemailer) config — only used if SMTP env vars set
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || "0");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

let transporter: any = null;
if (SMTP_HOST && SMTP_PORT) {
  transporter = nodemailer.createTransport({
    service: "smtp.gmail.com",
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    requireTLS: true,
    tls: {
      ciphers: "SSLv3",
    },
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

// Simple rule registry
type RuleFn = (
  event: any
) => Promise<AlertPayload | null> | (AlertPayload | null);
const rules: { id: string; fn: RuleFn }[] = [];

export const alerts = {
  registerRule(id: string, fn: RuleFn) {
    rules.push({ id, fn });
  },

  async evaluateEvent(evt: any) {
    // run all rules; if rule returns alert -> notify
    for (const r of rules) {
      try {
        const res = await r.fn(evt);
        if (res) {
          await this.sendAlert(res);
        }
      } catch (e) {
        logger.error({
          action: "rule-eval-failed",
          detail: { rule: r.id, err: String(e) },
        });
      }
    }
  },

  async sendAlert(payload: AlertPayload) {
    payload.ts = payload.ts || Date.now();
    // write to ledger as audit record
    try {
      await wkt3dbClient.appendEntryIdempotent({
        type: "alert",
        clientRequestId: `alert:${payload.ts}:${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        userId: payload.userId,
        metadata: payload,
        amountCents: 0,
        ts: payload.ts,
      });
    } catch (e) {
      logger.warn({ action: "alert-audit-failed", detail: String(e) });
    }
    // console + logger
    logger.warn({ action: "alert", userId: payload.userId, detail: payload });

    // send email if transporter present and severity high/critical
    if (
      transporter &&
      (payload.severity === "high" || payload.severity === "critical")
    ) {
      try {
        await transporter.sendMail({
          from: process.env.ALERTS_FROM || "alerts@wkt3.com",
          to: process.env.ALERTS_TO || "",
          subject: `[${payload.severity.toUpperCase()}] ${payload.title}`,
          text: payload.description || JSON.stringify(payload),
        });
      } catch (e) {
        logger.error({ action: "alert-email-failed", detail: String(e) });
      }
    }
    // optional: webhook
    const webhookUrl = process.env.ALERTS_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        logger.warn({ action: "alert-webhook-failed", detail: String(e) });
      }
    }
  },
};

// Example built-in rules you can register at app startup
// 1) Rapid bets rule
alerts.registerRule("rapid-bets", async (evt) => {
  // evt expected shape: { type: 'bet', userId, ts }
  if (!evt || evt.type !== "bet") return null;
  // naive: if same user placed > 20 bets in last minute -> alert
  // production: use counters/redis or query analytics store
  // we'll keep simple placeholder
  return null;
});

// 2) Multiple failed logins
alerts.registerRule("failed-logins", (evt) => {
  if (!evt || evt.type !== "auth:login_failed") return null;
  // if threshold crossed -> return alert payload
  return null;
});

// export types
export default alerts;
