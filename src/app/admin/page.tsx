"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStats } from "@/lib/api";
import { FLOWS } from "@/lib/flows";
import type { LibraryStats } from "@/lib/types";

const STORAGE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // nominal quota shown on the bar

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

const icons = {
  images: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  folders: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  storage: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  ),
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
};

const quickActions = [
  { label: "Upload Images", href: "/admin/gallery", icon: icons.upload, desc: "Add new product images" },
  { label: "Create Folder", href: "/admin/gallery", icon: icons.folders, desc: "Organise by flow and category" },
  { label: "Test a Match", href: "/admin/match-test", icon: icons.target, desc: "Try a customer photo" },
  { label: "Settings", href: "/admin/settings", icon: icons.settings, desc: "API key for Sendiee" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  const used = stats?.storageUsedBytes ?? 0;
  const usedPct = Math.min(100, Math.round((used / STORAGE_QUOTA_BYTES) * 100));
  const dash = "—";

  const cards = [
    {
      label: "Total Images",
      value: stats ? stats.totalImages : dash,
      change: stats ? `${stats.readyImages} matchable${stats.failedImages ? `, ${stats.failedImages} failed` : ""}` : "Loading…",
      icon: icons.images,
      color: "#6366F1",
    },
    {
      label: "Folders",
      value: stats ? stats.totalFolders : dash,
      change: stats ? `${stats.byFlow.visual} on ${FLOWS.visual.short}, ${stats.byFlow.precise} on ${FLOWS.precise.short}` : "Loading…",
      icon: icons.folders,
      color: "#F59E0B",
    },
    {
      label: "Recent Uploads",
      value: stats ? stats.recentUploads : dash,
      change: "Last 7 days",
      icon: icons.upload,
      color: "#10B981",
    },
    {
      label: "Storage Used",
      value: stats ? formatBytes(used) : dash,
      change: `of ${formatBytes(STORAGE_QUOTA_BYTES)} nominal`,
      icon: icons.storage,
      color: "#8B5CF6",
    },
  ];

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
          Welcome back
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Here&apos;s an overview of your Sendiee Vision library.
        </p>
        {error && (
          <p style={{ color: "var(--error)", fontSize: 13, marginTop: 8 }}>Could not load stats: {error}</p>
        )}
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
        {cards.map((stat) => (
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
            {stats ? formatBytes(used) : dash} / {formatBytes(STORAGE_QUOTA_BYTES)}
          </span>
        </div>
        <div className="progress-bar-track" style={{ height: 8 }}>
          <div className="progress-bar-fill" style={{ width: `${usedPct}%` }} />
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          {stats ? `You have used ${usedPct}% of the nominal quota.` : "Loading…"}
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
            <Link key={action.label} href={action.href} style={{ textDecoration: "none" }}>
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
                <span style={{ color: "var(--accent)", display: "flex" }}>{action.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{action.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{action.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
