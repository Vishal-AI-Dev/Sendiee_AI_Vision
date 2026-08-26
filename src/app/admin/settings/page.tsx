"use client";

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

      {[
        { title: "Account", desc: "Update your name, email, and profile picture." },
        { title: "Notifications", desc: "Configure email and in-app notification preferences." },
        { title: "Storage", desc: "View and manage your storage quota." },
        { title: "API Keys", desc: "Generate and manage API keys for integrations." },
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
            cursor: "pointer",
            transition: "border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = section.danger
              ? "rgba(239,68,68,0.5)"
              : "var(--border-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = section.danger
              ? "rgba(239,68,68,0.25)"
              : "var(--border)";
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
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{section.desc}</div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      ))}
    </div>
  );
}
