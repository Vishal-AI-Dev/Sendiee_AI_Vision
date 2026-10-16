"use client";

import { useEffect, useState } from "react";
import { getApiKeyInfo, rotateApiKey } from "@/lib/api";
import type { ApiKeyInfo } from "@/lib/types";

/** Shows whether an API key exists and lets the admin create or rotate it. The key is shown once. */
export default function ApiKeyCard() {
  const [info, setInfo] = useState<ApiKeyInfo | null>(null);
  const [freshKey, setFreshKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getApiKeyInfo()
      .then(setInfo)
      .catch((err: Error) => setError(err.message));
  }, []);

  const rotate = async () => {
    if (info?.prefix && !window.confirm("Rotating replaces the current key. Sendiee must be updated with the new one. Continue?")) return;
    setBusy(true);
    setError("");
    try {
      const created = await rotateApiKey();
      setFreshKey(created.key);
      setInfo({ prefix: created.prefix, createdAt: created.createdAt });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(freshKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy; select the key and copy it manually.");
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-accent)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        marginBottom: 12,
      }}
      id="api-key-card"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Match API key</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Sendiee sends customer photos to <code>POST /api/match</code> with this key in the <code>x-api-key</code> header.
          </div>
        </div>
        <button className="btn-primary" onClick={rotate} disabled={busy} id="api-key-rotate-btn">
          {busy ? "Working…" : info?.prefix ? "Rotate key" : "Create key"}
        </button>
      </div>

      <div style={{ marginTop: 14, fontSize: 13, color: "var(--text-secondary)" }}>
        {info === null && !error && "Loading…"}
        {info && !info.prefix && "No key yet."}
        {info && info.prefix && (
          <>
            Current key starts with <code>{info.prefix}…</code>
            {info.createdAt ? `, created ${new Date(info.createdAt).toLocaleString()}` : ""}
          </>
        )}
      </div>

      {freshKey && (
        <div
          style={{
            marginTop: 12,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <code style={{ fontSize: 13, color: "var(--text-primary)", wordBreak: "break-all", flex: 1 }} id="api-key-value">
            {freshKey}
          </code>
          <button className="btn-ghost" onClick={copy} type="button">
            {copied ? "Copied" : "Copy"}
          </button>
          <div style={{ width: "100%", fontSize: 12, color: "var(--warning, #F59E0B)" }}>
            Copy it now. It will not be shown again.
          </div>
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: "var(--error)", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
