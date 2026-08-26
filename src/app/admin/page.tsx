"use client";

import { MOCK_STATS } from "@/lib/mock-data";
import Link from "next/link";

const stats = [
  {
    label: "Total Images",
    value: MOCK_STATS.totalImages,
    change: `+${MOCK_STATS.thisWeekGrowth} this week`,
    positive: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    color: "#6366F1",
  },
  {
    label: "Folders",
    value: MOCK_STATS.totalFolders,
    change: "Organized collections",
    positive: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    color: "#F59E0B",
  },
  {
    label: "Recent Uploads",
    value: MOCK_STATS.recentUploads,
    change: "Last 7 days",
    positive: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    ),
    color: "#10B981",
  },
  {
    label: "Storage Used",
    value: MOCK_STATS.storageUsed,
    change: `of ${MOCK_STATS.storageTotal} total`,
    positive: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    color: "#8B5CF6",
  },
];

const quickActions = [
  { label: "Upload Images", href: "/admin/gallery", icon: "↑", desc: "Add new product images" },
  { label: "Create Folder", href: "/admin/gallery", icon: "📁", desc: "Organize your library" },
  { label: "Browse Gallery", href: "/admin/gallery", icon: "🖼️", desc: "View all images" },
  { label: "Settings", href: "/admin/settings", icon: "⚙️", desc: "Manage your account" },
];

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          Welcome back 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Here&apos;s an overview of your Sendiee Vision library.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: `${stat.color}18`,
                  border: `1px solid ${stat.color}35`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: stat.color,
                }}
              >
                {stat.icon}
              </div>
              {stat.positive === true && (
                <span
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    color: "var(--success)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    borderRadius: 99,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  ↑ {MOCK_STATS.thisWeekGrowth}%
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 2 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Storage Bar */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Storage Usage</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {MOCK_STATS.storageUsed} / {MOCK_STATS.storageTotal}
          </span>
        </div>
        <div className="progress-bar-track" style={{ height: 8 }}>
          <div className="progress-bar-fill" style={{ width: "24%" }} />
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          You have used 24% of your storage capacity.
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 16,
          }}
        >
          Quick Actions
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "18px 20px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "var(--border-accent)";
                  el.style.boxShadow = "var(--shadow-md)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = "var(--border)";
                  el.style.boxShadow = "none";
                  el.style.transform = "translateY(0)";
                }}
              >
                <span style={{ fontSize: 22 }}>{action.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {action.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {action.desc}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}