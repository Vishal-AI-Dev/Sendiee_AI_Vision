"use client";

import { useRef, useState } from "react";
import { testMatch } from "@/lib/api";
import { FLOWS } from "@/lib/flows";
import type { MatchResult } from "@/lib/types";

const pct = (n: number) => `${Math.round(n * 100)}%`;

const DECISION_LABEL: Record<MatchResult["decision"], { text: string; color: string }> = {
  match: { text: "Match", color: "var(--success)" },
  ambiguous: { text: "Ambiguous", color: "#F59E0B" },
  no_match: { text: "No match", color: "var(--error)" },
};

/** Upload a customer-style photo and see exactly what the webhook would get back. */
export default function MatchTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    setFile(f);
    setResult(null);
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setResult(await testMatch(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const label = result ? DECISION_LABEL[result.decision] : null;

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1
        style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize: 22,
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: 6,
        }}
      >
        Test a match
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
        Send a photo the way a customer would. The answer below is what Sendiee receives from <code>POST /api/match</code>.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 300px) 1fr", gap: 24, alignItems: "start" }}>
        {/* Picker */}
        <div>
          <div
            className="upload-zone"
            style={{ padding: 20, textAlign: "center", cursor: "pointer" }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files[0] ?? null);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            aria-label="Choose a photo to match"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
              id="match-test-input"
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Query" style={{ width: "100%", borderRadius: "var(--radius-md)", objectFit: "cover" }} />
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Drop a photo here or click to choose</p>
            )}
          </div>
          <button className="btn-primary" style={{ marginTop: 12, width: "100%" }} onClick={run} disabled={!file || busy} id="match-test-run">
            {busy ? "Matching…" : "Find the product"}
          </button>
          {error && <p style={{ fontSize: 13, color: "var(--error)", marginTop: 10 }}>{error}</p>}
        </div>

        {/* Result */}
        <div>
          {!result && !error && (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>The decision, the flow used and every candidate with its score will appear here.</p>
          )}
          {result && label && (
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "18px 20px",
                }}
                id="match-test-decision"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: label.color, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                    {label.text}
                  </span>
                  <span className="tag-chip">{FLOWS[result.flow].label}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>confidence {pct(result.confidence)}</span>
                  {result.verifiedBy && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>by {result.verifiedBy}</span>}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>{result.reason}</p>
                {result.notes.map((n) => (
                  <p key={n} style={{ fontSize: 12, color: "#F59E0B", marginTop: 6 }}>
                    {n}
                  </p>
                ))}
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                  {Object.entries(result.timings)
                    .map(([k, v]) => `${k.replace(/Ms$/, "")} ${v} ms`)
                    .join(" · ")}
                </p>
              </div>

              {result.product && (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-accent)",
                    borderRadius: "var(--radius-lg)",
                    padding: 16,
                  }}
                  id="match-test-product"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.product.thumbnailUrl} alt={result.product.productName} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: "var(--radius-md)" }} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{result.product.productName}</div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
                      ₹{result.product.price.toLocaleString("en-IN")} {result.product.sku ? `· ${result.product.sku}` : ""}
                    </div>
                    {result.product.description && (
                      <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{result.product.description}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                  Candidates
                </div>
                {result.candidates.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No reference images came back from the index.</p>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                  {result.candidates.map((c) => (
                    <div
                      key={c.product.id}
                      style={{
                        background: "var(--bg-surface)",
                        border: `1px solid ${result.product?.id === c.product.id ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.product.thumbnailUrl} alt={c.product.productName} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
                      <div style={{ padding: "8px 10px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.product.productName}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>similarity {pct(c.cosine)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
