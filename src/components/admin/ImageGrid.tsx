"use client";

import type { ProductImage, Folder } from "@/lib/types";
import ImageCard from "./ImageCard";

interface ImageGridProps {
  images: ProductImage[];
  allFolders: Folder[];
  loading: boolean;
  onImageClick: (image: ProductImage) => void;
  onMove: (imageId: string, targetFolderId: string | null) => void;
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <div className="skeleton" style={{ aspectRatio: "4/3" }} />
      <div style={{ padding: "12px 14px 14px" }}>
        <div className="skeleton" style={{ height: 14, width: "80%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 18, width: "40%" }} />
      </div>
    </div>
  );
}

export default function ImageGrid({
  images,
  allFolders,
  loading,
  onImageClick,
  onMove,
}: ImageGridProps) {
  if (loading) {
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
          Images
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <h3
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: 17,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          No images here yet
        </h3>
        <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 320 }}>
          Drag and drop your product images or click the upload button to get started.
        </p>
      </div>
    );
  }

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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Images</span>
        <span style={{ fontWeight: 400 }}>{images.length} results</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            allFolders={allFolders}
            onClick={onImageClick}
            onMove={onMove}
          />
        ))}
      </div>
    </section>
  );
}
