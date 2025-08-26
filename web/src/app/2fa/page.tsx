"use client";

// हिन्दी: यह simple client page है जो provisioning call करता है,
// QR दिखाता है, download links देता है और OTP verify करके 2FA enable करता है।

import { useEffect, useState, useCallback } from "react";

type ProvisionRes = {
  success: boolean;
  message: string;
  otpauth?: string;
  qr?: string;
  secret?: string;
  downloadLinks?: Record<string, string>;
};

export default function TwoFASetupPage() {
  // हिन्दी: states
  const [loading, setLoading] = useState<boolean>(false);
  const [prov, setProv] = useState<ProvisionRes | null>(null);
  const [otp, setOtp] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // हिन्दी: token dev mode — ?token=... से भी आ सकता है
  const tokenFromQuery =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token")
      : null;

  const callProvision = useCallback(async () => {
    setLoading(true);
    setStatus("");
    try {
      const url = tokenFromQuery
        ? `/api/auth/provision-2fa?token=${encodeURIComponent(tokenFromQuery)}`
        : `/api/auth/provision-2fa`;
      const res = await fetch(url, { method: "POST" });
      const data = (await res.json()) as ProvisionRes;
      setProv(data);
      if (!data.success) setStatus(data.message || "Failed to provision");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tokenFromQuery]);

  useEffect(() => {
    void callProvision();
  }, [callProvision]);

  // हिन्दी: debounce verify
  useEffect(() => {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) return;
    const t = setTimeout(async () => {
      try {
        const url = tokenFromQuery
          ? `/api/auth/enable-2fa?token=${encodeURIComponent(tokenFromQuery)}`
          : `/api/auth/enable-2fa`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ otp }),
        });
        const data = (await res.json()) as {
          success: boolean;
          message: string;
        };
        setStatus(data.message);
        if (data.success) {
          // हिन्दी: success पर आप redirect/login complete कर सकते हैं
        }
      } catch (e) {
        setStatus((e as Error).message);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(t);
  }, [otp, tokenFromQuery]);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">
        Enable Two-Factor Authentication (2FA)
      </h1>

      <p className="text-sm">
        {/* हिन्दी: user education */}
        कृपया Google Authenticator (या कोई भी TOTP app) install करें और नीचे दिख
        रहे QR को scan करें। अगर QR scan नहीं कर सकते तो <b>
          Manual Entry
        </b> से <code>Base32 Secret</code> डालें।
      </p>

      {loading && <div>Provisioning…</div>}

      {prov?.success && (
        <div className="space-y-4">
          {prov.qr && (
            <div className="border rounded-lg p-4">
              <div className="font-medium mb-2">Scan this QR</div>
              <img src={prov.qr} alt="2FA QR" className="w-56 h-56" />
            </div>
          )}

          <div className="border rounded-lg p-4">
            <div className="font-medium mb-1">Manual Entry (Base32 Secret)</div>
            <code className="block break-words">{prov.secret}</code>
            <div className="text-xs mt-1">
              Type: Time-based (TOTP), Digits: 6, Period: 30s
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="font-medium mb-2">Download Authenticator</div>
            <ul className="list-disc ml-6 text-sm">
              {prov.downloadLinks &&
                Object.entries(prov.downloadLinks).map(([k, v]) => (
                  <li key={k}>
                    <a
                      href={v}
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {k}
                    </a>
                  </li>
                ))}
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <label className="font-medium">Enter 6-digit OTP</label>
            <input
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="mt-2 w-full border rounded px-3 py-2"
              placeholder="123456"
            />
            <div className="text-xs text-gray-500 mt-1">
              OTP हर 30 सेकंड में बदलता है
            </div>
          </div>
        </div>
      )}

      {!!status && <div className="text-sm">{status}</div>}
    </div>
  );
}
