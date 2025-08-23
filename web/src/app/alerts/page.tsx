/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";

interface AlertPayload {
  ts: number;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  userId?: string;
  meta?: Record<string, any>;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);

  // Fetch alerts from API every 2 seconds
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/alerts/list");
        const data = await res.json();
        if (data.success) setAlerts(data.alerts);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Webhook Alerts</h1>
      {alerts.length === 0 ? (
        <p>No alerts yet.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a, i) => (
            <li key={i} className="border p-2 rounded shadow-sm bg-white">
              <div>
                <strong>Time:</strong> {new Date(a.ts).toLocaleString()}
              </div>
              <div>
                <strong>Severity:</strong> {a.severity}
              </div>
              <div>
                <strong>Title:</strong> {a.title}
              </div>
              {a.description && (
                <div>
                  <strong>Description:</strong> {a.description}
                </div>
              )}
              {a.userId && (
                <div>
                  <strong>User:</strong> {a.userId}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
