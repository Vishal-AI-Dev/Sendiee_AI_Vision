"use client";

import { useState } from "react";
import { saveImageRecord } from "@/lib/api";
import type { ProductImage } from "@/lib/types";

interface PostUploadFormProps {
  uploadedFiles: { file: File; publicUrl: string; key: string }[];
  folderId: string | null;
  userId?: string;
  onSaved: (images: ProductImage[]) => void;
  onClose: () => void;
}

interface FileFormState {
  productName: string;
  price: string;
  sku: string;
  tags: string;
  description: string;
}

export default function PostUploadForm({
  uploadedFiles,
  folderId,
  userId,
  onSaved,
  onClose,
}: PostUploadFormProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedImages, setSavedImages] = useState<ProductImage[]>([]);
  const [formState, setFormState] = useState<FileFormState[]>(
    uploadedFiles.map((f) => ({
      productName: f.file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      price: "",
      sku: "",
      tags: "",
      description: "",
    }))
  );

  const current = uploadedFiles[currentIdx];
  const currentForm = formState[currentIdx];

  const updateField = (field: keyof FileFormState, value: string) => {
    setFormState((prev) =>
      prev.map((f, i) => (i === currentIdx ? { ...f, [field]: value } : f))
    );
  };

  const handleSaveOne = async () => {
    setSaving(true);
    try {
      const img = await saveImageRecord({
        userId,
        key: current.key,
        publicUrl: current.publicUrl,
        folderId,
        productName: currentForm.productName || current.file.name,
        price: parseFloat(currentForm.price) || 0,
        sku: currentForm.sku,
        tags: currentForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description: currentForm.description,
        fileSize: current.file.size,
        contentType: current.file.type,
      });

      const updated = [...savedImages, img];
      setSavedImages(updated);

      if (currentIdx + 1 < uploadedFiles.length) {
        setCurrentIdx((i) => i + 1);
      } else {
        onSaved(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const isLast = currentIdx === uploadedFiles.length - 1;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-form-title"
    >
      <div className="modal-panel modal-panel-wide" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div
          style={{
            padding: "22px 24px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <h2
              id="upload-form-title"
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Add Product Details
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {currentIdx + 1} of {uploadedFiles.length} images
            </p>
          </div>
          {/* Step dots */}
          <div style={{ display: "flex", gap: 6 }}>
            {uploadedFiles.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentIdx ? 20 : 8,
                  height: 8,
                  borderRadius: 99,
                  background: i <= currentIdx ? "var(--accent)" : "var(--border)",
                  transition: "width 0.2s ease, background 0.2s ease",
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {/* Preview */}
          <div
            style={{
              width: 220,
              flexShrink: 0,
              padding: 20,
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                aspectRatio: "3/4",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                background: "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.publicUrl}
                alt={current.file.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {current.file.name}
            </p>
          </div>

          {/* Form */}
          <div style={{ flex: 1, padding: "20px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="form-label" style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Product Name <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-base"
                  value={currentForm.productName}
                  onChange={(e) => updateField("productName", e.target.value)}
                  placeholder="e.g. Banarasi Silk Saree"
                  id="product-name-input"
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
                    value={currentForm.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    id="product-price-input"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                    SKU / ID
                  </label>
                  <input
                    type="text"
                    className="input-base"
                    value={currentForm.sku}
                    onChange={(e) => updateField("sku", e.target.value)}
                    placeholder="e.g. SAR-001"
                    id="product-sku-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Tags
                </label>
                <input
                  type="text"
                  className="input-base"
                  value={currentForm.tags}
                  onChange={(e) => updateField("tags", e.target.value)}
                  placeholder="silk, festive, banarasi (comma-separated)"
                  id="product-tags-input"
                />
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  Separate tags with commas
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  className="input-base"
                  value={currentForm.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Brief product description…"
                  rows={3}
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                  id="product-description-input"
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={onClose}>
                Skip All
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveOne}
                disabled={saving}
                id="save-product-btn"
              >
                {saving ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Saving…
                  </span>
                ) : isLast ? (
                  "Save & Finish"
                ) : (
                  "Save & Next →"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
