"use client";

import { useEffect } from "react";
import type { Folder } from "@/lib/types";

interface MoveToFolderModalProps {
  folders: Folder[];
  currentFolderId: string | null;
  onClose: () => void;
  onMove: (targetFolderId: string | null) => void;
}

export default function MoveToFolderModal({
  folders,
  currentFolderId,
  onClose,
  onMove,
}: MoveToFolderModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const FOLDER_COLORS: Record<string, string> = {
    "#F59E0B": "rgba(245,158,11,0.12)",
    "#6366F1": "rgba(99,102,241,0.12)",
    "#EC4899": "rgba(236,72,153,0.12)",
    "#10B981": "rgba(16,185,129,0.12)",
    "#8B5CF6": "rgba(139,92,246,0.12)",
    "#06B6D4": "rgba(6,182,212,0.12)",
  };

  const targets: { id: string | null; name: string; color?: string }[] = [
    { id: null, name: "Root (no folder)" },
    ...folders.filter((f) => f.id !== currentFolderId),
  ];

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-modal-title"
    >
      <div className="modal-panel">
        {/* Header */}
        <div
          style={{
            padding: "24px 24px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2
            id="move-modal-title"
            style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Move to Folder
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 6,
              borderRadius: 8,
              display: "flex",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Folder List */}
        <div style={{ padding: "12px 16px 20px", maxHeight: 360, overflowY: "auto" }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 8px 12px" }}>
            Select a destination folder
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {targets.map((target) => {
              const folder = folders.find((f) => f.id === target.id);
              const color = folder?.color ?? "#6366F1";
              const bg = FOLDER_COLORS[color] ?? "rgba(99,102,241,0.12)";

              return (
                <button
                  key={String(target.id)}
                  onClick={() => onMove(target.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    background:
                      target.id === currentFolderId
                        ? "var(--accent-subtle)"
                        : "transparent",
                    border: `1px solid ${target.id === currentFolderId ? "var(--border-accent)" : "transparent"}`,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s ease",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (target.id !== currentFolderId)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    if (target.id !== currentFolderId)
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: target.id === null ? "var(--bg-elevated)" : bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={target.id === null ? "var(--text-muted)" : color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color:
                        target.id === null
                          ? "var(--text-muted)"
                          : "var(--text-primary)",
                    }}
                  >
                    {target.name}
                  </span>
                  {folder && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        color: "var(--text-muted)",
                      }}
                    >
                      {folder.imageCount} items
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
