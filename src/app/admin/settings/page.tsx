"use client";

import ApiKeyCard from "@/components/admin/ApiKeyCard";
import { FLOW_IDS, FLOWS } from "@/lib/flows";

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          fontSize: 26,
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: 6,
        }}
      >
        Settings
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 32 }}>
        Manage your account and workspace preferences.
      </p>

      <ApiKeyCard />

      {/* Matching flows */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Matching flows</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
          Each folder picks a flow, or inherits its parent&apos;s. Products in a folder are matched the way its flow says.
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {FLOW_IDS.map((id) => {
            const f = FLOWS[id];
            return (
              <div
                key={id}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{f.label}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{f.description}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                  For: {f.examples}. Floor {Math.round(f.retrieval.minCosine * 100)}% similarity, margin{" "}
                  {Math.round(f.retrieval.minMargin * 100)}%
                  {f.secondStage === "tiebreak" ? ", close candidates double-checked" : ""}.
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {[
        { title: "Account", desc: "Update your name, email, and profile picture." },
        { title: "Notifications", desc: "Configure email and in-app notification preferences." },
        { title: "Danger Zone", desc: "Delete your account or reset all data.", danger: true },
      ].map((section) => (
        <div
          key={section.title}
          style={{
            background: "var(--bg-surface)",
            border: `1px solid ${section.danger ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: 0.7,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: section.danger ? "var(--error)" : "var(--text-primary)",
                marginBottom: 4,
              }}
            >
              {section.title}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{section.desc} Coming soon.</div>
          </div>
        </div>
      ))}
    </div>
  );
}
