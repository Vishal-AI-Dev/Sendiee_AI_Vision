"use client";

import { useState, useRef, useCallback } from "react";
import { getPresignedUrl, uploadFileToStorage } from "@/lib/api";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  publicUrl?: string;
  key?: string;
}

interface UploadZoneProps {
  folderId: string | null;
  userId?: string;
  onUploadComplete: (results: { file: File; publicUrl: string; key: string }[]) => void;
}

export default function UploadZone({ userId, onUploadComplete }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `"${file.name}" is not supported. Only JPG, PNG, and WebP are accepted.`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `"${file.name}" exceeds the ${MAX_SIZE_MB}MB limit.`;
    }
    return null;
  };

  const processFiles = useCallback(
    async (rawFiles: File[]) => {
      const newEntries: UploadFile[] = rawFiles.map((f) => {
        const error = validateFile(f);
        return {
          id: `${f.name}-${Date.now()}-${Math.random()}`,
          file: f,
          progress: 0,
          status: error ? "error" : "pending",
          error: error ?? undefined,
        };
      });

      setFiles((prev) => [...prev, ...newEntries]);

      // Upload valid files
      const valid = newEntries.filter((e) => e.status === "pending");
      const completed: { file: File; publicUrl: string; key: string }[] = [];

      for (const entry of valid) {
        // Mark as uploading
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, status: "uploading" } : f))
        );

        try {
          const { uploadUrl, publicUrl, key } = await getPresignedUrl(
            entry.file.name,
            entry.file.type,
            userId
          );

          await uploadFileToStorage(uploadUrl, entry.file, (pct) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === entry.id ? { ...f, progress: pct } : f))
            );
          });

          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: "done", progress: 100, publicUrl, key }
                : f
            )
          );

          completed.push({ file: entry.file, publicUrl, key });
        } catch {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: "error", error: "Upload failed. Please try again." }
                : f
            )
          );
        }
      }

      if (completed.length > 0) {
        onUploadComplete(completed);
      }
    },
    [onUploadComplete, userId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = Array.from(e.dataTransfer.files);
      processFiles(dropped);
    },
    [processFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div>
      {/* Drop Zone */}
      <div
        className={`upload-zone ${isDragOver ? "drag-over" : ""}`}
        style={{
          padding: "40px 24px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        aria-label="Upload images — click or drag and drop"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          style={{ display: "none" }}
          onChange={handleFileInput}
          id="file-upload-input"
        />

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: isDragOver ? "var(--accent-subtle)" : "var(--bg-elevated)",
            border: `1px solid ${isDragOver ? "var(--accent)" : "var(--border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDragOver ? "var(--accent)" : "var(--text-muted)"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: "stroke 0.2s ease" }}
          >
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
        </div>

        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: isDragOver ? "var(--accent)" : "var(--text-primary)",
            marginBottom: 6,
            transition: "color 0.2s ease",
          }}
        >
          {isDragOver ? "Drop to upload" : "Drag & drop images here"}
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          or{" "}
          <span style={{ color: "var(--accent)", fontWeight: 500 }}>browse files</span>
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          Accepts JPG, PNG, WebP · Max {MAX_SIZE_MB}MB per file
        </p>
      </div>

      {/* File Progress List */}
      {files.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {files.map((f) => (
            <div
              key={f.id}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* File type icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background:
                    f.status === "error"
                      ? "rgba(239,68,68,0.12)"
                      : f.status === "done"
                      ? "rgba(34,197,94,0.12)"
                      : "var(--accent-subtle)",
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
                  stroke={
                    f.status === "error"
                      ? "var(--error)"
                      : f.status === "done"
                      ? "var(--success)"
                      : "var(--accent)"
                  }
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.file.name}
                </div>

                {f.status === "error" ? (
                  <div style={{ fontSize: 12, color: "var(--error)", marginTop: 2 }}>
                    {f.error}
                  </div>
                ) : f.status === "done" ? (
                  <div style={{ fontSize: 12, color: "var(--success)", marginTop: 2 }}>
                    Upload complete ✓
                  </div>
                ) : (
                  <div style={{ marginTop: 6 }}>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                      {f.status === "uploading" ? `${f.progress}%` : "Waiting…"}
                    </div>
                  </div>
                )}
              </div>

              {(f.status === "done" || f.status === "error") && (
                <button
                  onClick={() => removeFile(f.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: 4,
                    display: "flex",
                    flexShrink: 0,
                  }}
                  aria-label="Remove"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
