"use client";

import { useState } from "react";
import type { Folder } from "@/lib/types";
import { FLOWS } from "@/lib/flows";
import ConfirmDialog from "./ConfirmDialog";

interface FolderGridProps {
  folders: Folder[];
  onFolderClick: (folder: Folder) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
}

const FOLDER_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  "#F59E0B": { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", icon: "#F59E0B" },
  "#6366F1": { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.25)", icon: "#6366F1" },
  "#EC4899": { bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.25)", icon: "#EC4899" },
  "#10B981": { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", icon: "#10B981" },
  "#8B5CF6": { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.25)", icon: "#8B5CF6" },
  "#06B6D4": { bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.25)", icon: "#06B6D4" },
};

function FolderCard({
  folder,
  onFolderClick,
  onRename,
  onDelete,
}: {
  folder: Folder;
  onFolderClick: (f: Folder) => void;
  onRename: (f: Folder) => void;
  onDelete: (f: Folder) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colors = FOLDER_COLORS[folder.color] ?? FOLDER_COLORS["#6366F1"];

  return (
    <>
      <div
        style={{
          background: "var(--bg-surface)",
          border: `1px solid var(--border)`,
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          cursor: "pointer",
          position: "relative",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = colors.border;
          el.style.boxShadow = "var(--shadow-md)";
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "var(--border)";
          el.style.boxShadow = "none";
          el.style.transform = "translateY(0)";
        }}
        onClick={() => onFolderClick(folder)}
      >
        {/* Top row: icon + menu */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          {/* Folder Icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                fill={colors.bg}
                stroke={colors.icon}
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Context Menu */}
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 6,
                borderRadius: 8,
                display: "flex",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              }}
              aria-label={`Options for ${folder.name}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 4px)",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md)",
                    minWidth: 160,
                    zIndex: 10,
                    overflow: "hidden",
                    animation: "slideUp 0.15s ease",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onRename(folder);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "10px 14px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      textAlign: "left",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg-surface)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      setConfirmDelete(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "10px 14px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--error)",
                      fontSize: 13,
                      textAlign: "left",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Name */}
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {folder.name}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {folder.imageCount} {folder.imageCount === 1 ? "image" : "images"} · {FLOWS[folder.effectiveFlow].short}{folder.flow ? "" : " (inherited)"}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Folder"
          message={`Are you sure you want to delete "${folder.name}"? All images inside will also be removed. This action cannot be undone.`}
          confirmLabel="Delete Folder"
          danger
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete(folder);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

export default function FolderGrid({
  folders,
  onFolderClick,
  onRename,
  onDelete,
}: FolderGridProps) {
  if (folders.length === 0) return null;

  return (
    <section>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        Folders
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onFolderClick={onFolderClick}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
