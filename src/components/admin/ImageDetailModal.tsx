"use client";

import { useState, useEffect } from "react";
import type { ProductImage } from "@/lib/types";
import { updateImage, deleteImage } from "@/lib/api";
import ConfirmDialog from "./ConfirmDialog";

interface ImageDetailModalProps {
  image: ProductImage;
  onClose: () => void;
  onSaved: (updated: ProductImage) => void;
  onDeleted: (id: string) => void;
}

export default function ImageDetailModal({
  image,
  onClose,
  onSaved,
  onDeleted,
}: ImageDetailModalProps) {
  const [productName, setProductName] = useState(image.productName);
  const [price, setPrice] = useState(String(image.price));
  const [sku, setSku] = useState(image.sku);
  const [tags, setTags] = useState(image.tags.join(", "));
  const [description, setDescription] = useState(image.description);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgError, setImgError] = useState(false);

  const dirty =
    productName !== image.productName ||
    price !== String(image.price) ||
    sku !== image.sku ||
    tags !== image.tags.join(", ") ||
    description !== image.description;

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateImage(image.id, {
        productName,
        price: parseFloat(price) || 0,
        sku,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        description,
      });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteImage(image.id);
      onDeleted(image.id);
    } finally {
      setDeleting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "—";
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
  };

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
      >
        <div
          className="modal-panel modal-panel-wide"
          style={{ maxWidth: 780, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 24px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <h2
              id="detail-modal-title"
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: 17,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Image Details
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

          {/* Body */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* Image Preview */}
            <div
              style={{
                width: 280,
                flexShrink: 0,
                borderRight: "1px solid var(--border)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  background: "var(--bg-elevated)",
                  aspectRatio: "3/4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {imgError ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.fullUrl}
                    alt={image.productName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={() => setImgError(true)}
                  />
                )}
              </div>

              {/* Meta info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "File size", value: formatBytes(image.fileSize) },
                  { label: "Uploaded", value: new Date(image.uploadedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Tags preview */}
              {image.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {image.tags.map((tag) => (
                    <span key={tag} className="tag-chip">{tag}</span>
                  ))}
                </div>
              )}

              {/* Delete */}
              <button
                className="btn-danger"
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                style={{ marginTop: "auto", width: "100%" }}
                id="delete-image-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Delete Image
              </button>
            </div>

            {/* Edit Form */}
            <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Product Name
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    id="edit-product-name"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      min="0"
                      step="0.01"
                      id="edit-product-price"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                      SKU / ID
                    </label>
                    <input
                      type="text"
                      className="input-base"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      id="edit-product-sku"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="silk, festive, banarasi"
                    id="edit-product-tags"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    className="input-base"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    style={{ resize: "vertical", fontFamily: "inherit" }}
                    id="edit-product-description"
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  style={{ opacity: dirty ? 1 : 0.5 }}
                  id="save-image-btn"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Image"
          message={`Permanently delete "${image.productName}"? This will remove the image file and all its metadata from Sendiee Vision. This cannot be undone.`}
          confirmLabel="Delete Forever"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
