"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getFolders,
  getImages,
  createFolder,
  renameFolder,
  deleteFolder,
  moveImage,
} from "@/lib/api";
import type { Folder, ProductImage } from "@/lib/mock-data";
import FolderGrid from "@/components/admin/FolderGrid";
import ImageGrid from "@/components/admin/ImageGrid";
import CreateFolderModal from "@/components/admin/CreateFolderModal";
import ImageDetailModal from "@/components/admin/ImageDetailModal";
import UploadZone from "@/components/admin/UploadZone";
import PostUploadForm from "@/components/admin/PostUploadForm";

// Navigation stack entry
interface NavEntry {
  folderId: string | null;
  folderName: string;
}

export default function GalleryPage() {
  // ── Navigation / breadcrumb state ────────────────────────────────────────
  const [navStack, setNavStack] = useState<NavEntry[]>([
    { folderId: null, folderName: "Gallery" },
  ]);
  const currentNav = navStack[navStack.length - 1];

  // ── Data ─────────────────────────────────────────────────────────────────
  const [folders, setFolders] = useState<Folder[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    { file: File; publicUrl: string; key: string }[]
  >([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [folderData, imageData, allFolderData] = await Promise.all([
        getFolders(currentNav.folderId),
        getImages(currentNav.folderId),
        getFolders(null), // for move-to-folder picker (all root folders)
      ]);
      setFolders(folderData);
      setImages(imageData);
      setAllFolders(allFolderData);
    } finally {
      setLoading(false);
    }
  }, [currentNav.folderId]);

  useEffect(() => {
    // This effect synchronizes the gallery with the selected folder.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // ── Filtered images ────────────────────────────────────────────────────────
  const filteredImages = searchQuery
    ? images.filter(
        (img) =>
          img.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          img.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          img.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : images;

  // ── Folder handlers ────────────────────────────────────────────────────────
  const handleFolderClick = (folder: Folder) => {
    setSearchQuery("");
    setNavStack((prev) => [
      ...prev,
      { folderId: folder.id, folderName: folder.name },
    ]);
  };

  const handleBreadcrumbNav = (idx: number) => {
    setNavStack((prev) => prev.slice(0, idx + 1));
  };

  const handleCreateFolder = async (name: string) => {
    const created = await createFolder(name, currentNav.folderId);
    setFolders((prev) => [...prev, created]);
    setShowCreateFolder(false);
  };

  const handleRenameFolder = async (name: string) => {
    if (!renamingFolder) return;
    const updated = await renameFolder(renamingFolder.id, name);
    setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setRenamingFolder(null);
  };

  const handleDeleteFolder = async (folder: Folder) => {
    await deleteFolder(folder.id);
    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
  };

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleMoveImage = async (imageId: string, targetFolderId: string | null) => {
    await moveImage(imageId, targetFolderId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleImageSaved = (updated: ProductImage) => {
    setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
    setSelectedImage(null);
  };

  const handleImageDeleted = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setSelectedImage(null);
  };

  // ── Upload handlers ────────────────────────────────────────────────────────
  const handleUploadComplete = (
    results: { file: File; publicUrl: string; key: string }[]
  ) => {
    setUploadedFiles(results);
    setShowUploadPanel(false);
  };

  const handlePostUploadSaved = (newImages: ProductImage[]) => {
    setImages((prev) => [...newImages, ...prev]);
    setUploadedFiles([]);
  };

  // ── Breadcrumb config ──────────────────────────────────────────────────────
  const breadcrumbs = navStack.map((entry, idx) => ({
    label: entry.folderName,
    onClick: idx < navStack.length - 1 ? () => handleBreadcrumbNav(idx) : undefined,
  }));

  const isEmpty = !loading && folders.length === 0 && images.length === 0;

  return (
    <>
      <div style={{ maxWidth: 1400 }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Breadcrumbs inline */}
          <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {idx > 0 && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
                <button
                  onClick={crumb.onClick}
                  disabled={!crumb.onClick}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: crumb.onClick ? "pointer" : "default",
                    color: idx === breadcrumbs.length - 1 ? "var(--text-primary)" : "var(--text-muted)",
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    fontSize: idx === 0 ? 22 : 18,
                    fontWeight: 800,
                    padding: 0,
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (crumb.onClick)
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      idx === breadcrumbs.length - 1 ? "var(--text-primary)" : "var(--text-muted)";
                  }}
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </nav>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search (mobile-visible inline) */}
            <div style={{ position: "relative" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="2"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Filter…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:hidden"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "7px 12px 7px 30px",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                  width: 120,
                }}
                aria-label="Filter images"
              />
            </div>

            <button
              className="btn-ghost"
              onClick={() => setShowCreateFolder(true)}
              id="create-folder-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
              New Folder
            </button>

            <button
              className="btn-primary"
              onClick={() => setShowUploadPanel((s) => !s)}
              id="upload-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
              Upload
            </button>
          </div>
        </div>

        {/* Upload Panel (collapsible) */}
        {showUploadPanel && (
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
              marginBottom: 24,
              animation: "slideUp 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}>
                Upload Images
              </h3>
              <button
                onClick={() => setShowUploadPanel(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <UploadZone
              folderId={currentNav.folderId}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}

        {/* Empty State */}
        {isEmpty && !showUploadPanel && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "var(--accent-subtle)",
                border: "1px solid var(--border-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 10,
              }}
            >
              This folder is empty
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 380, marginBottom: 24 }}>
              Start building your product library by uploading images or creating a new folder.
            </p>
            <button className="btn-primary" onClick={() => setShowUploadPanel(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
              Upload First Image
            </button>
          </div>
        )}

        {/* Folder Grid */}
        {(folders.length > 0 || loading) && (
          <div style={{ marginBottom: 32 }}>
            {loading ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Folders
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton" style={{ height: 110, borderRadius: "var(--radius-lg)" }} />
                  ))}
                </div>
              </div>
            ) : (
              <FolderGrid
                folders={folders}
                onFolderClick={handleFolderClick}
                onRename={setRenamingFolder}
                onDelete={handleDeleteFolder}
              />
            )}
          </div>
        )}

        {/* Image Grid */}
        {(images.length > 0 || loading) && (
          <ImageGrid
            images={filteredImages}
            allFolders={allFolders}
            loading={loading}
            onImageClick={setSelectedImage}
            onMove={handleMoveImage}
          />
        )}

        {/* Search no-results */}
        {!loading && searchQuery && filteredImages.length === 0 && images.length > 0 && (
          <div style={{ textAlign: "center", padding: "40px 24px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              No images match &ldquo;<strong style={{ color: "var(--text-secondary)" }}>{searchQuery}</strong>&rdquo;
            </p>
            <button
              onClick={() => setSearchQuery("")}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 13, marginTop: 6 }}
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreateFolder && (
        <CreateFolderModal
          onClose={() => setShowCreateFolder(false)}
          onConfirm={handleCreateFolder}
        />
      )}

      {renamingFolder && (
        <CreateFolderModal
          existingFolder={renamingFolder}
          onClose={() => setRenamingFolder(null)}
          onConfirm={handleRenameFolder}
        />
      )}

      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onSaved={handleImageSaved}
          onDeleted={handleImageDeleted}
        />
      )}

      {uploadedFiles.length > 0 && (
        <PostUploadForm
          uploadedFiles={uploadedFiles}
          folderId={currentNav.folderId}
          onSaved={handlePostUploadSaved}
          onClose={() => setUploadedFiles([])}
        />
      )}
    </>
  );
}
