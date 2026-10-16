"use client";

import { useState } from "react";
import type { ProductImage, Folder } from "@/lib/types";
import MoveToFolderModal from "./MoveToFolderModal";

interface ImageCardProps {
  image: ProductImage;
  allFolders: Folder[];
  onClick: (image: ProductImage) => void;
  onMove: (imageId: string, targetFolderId: string | null) => void;
}

export default function ImageCard({ image, allFolders, onClick, onMove }: ImageCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <>
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          cursor: "pointer",
          position: "relative",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "var(--border-hover)";
          el.style.boxShadow = "var(--shadow-md)";
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "var(--border)";
          el.style.boxShadow = "none";
          el.style.transform = "translateY(0)";
        }}
        onClick={() => onClick(image)}
      >
        {/* Thumbnail */}
        <div
          style={{
            aspectRatio: "4/3",
            background: "var(--bg-elevated)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {imgError ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.thumbnailUrl}
              alt={image.productName}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
              onError={() => setImgError(true)}
              onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
            />
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "12px 14px 14px", flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: 4,
            }}
          >
            {image.productName}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#A5B4FC" }}>
            ₹{image.price.toLocaleString("en-IN")}
          </div>
          {image.sku && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              SKU: {image.sku}
            </div>
          )}
        </div>

        {/* Kebab menu */}
        <div
          style={{ position: "absolute", top: 8, right: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            style={{
              background: "rgba(15,17,23,0.7)",
              backdropFilter: "blur(6px)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px 6px",
              display: "flex",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(15,17,23,0.9)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(15,17,23,0.7)")}
            aria-label={`Options for ${image.productName}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 9 }}
                onClick={() => setMenuOpen(false)}
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
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setMoveOpen(true);
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
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  Move to Folder
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {moveOpen && (
        <MoveToFolderModal
          folders={allFolders}
          currentFolderId={image.folderId}
          onClose={() => setMoveOpen(false)}
          onMove={(targetId) => {
            setMoveOpen(false);
            onMove(image.id, targetId);
          }}
        />
      )}
    </>
  );
}
