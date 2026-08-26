// ─── API Layer (stubbed) ───────────────────────────────────────────────────────
// All functions here are stubs. To wire up the real backend:
// 1. Replace the mock returns with real fetch() calls to your API routes.
// 2. The function signatures and return types stay the same.

import type { Folder, ProductImage } from "./mock-data";
import { MOCK_FOLDERS, MOCK_IMAGES } from "./mock-data";

// Simulate network latency in development
const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function getFolders(parentId: string | null): Promise<Folder[]> {
  await delay(300);
  // REAL: return fetch(`/api/folders?parentId=${parentId ?? "root"}`).then(r => r.json())
  return MOCK_FOLDERS.filter((f) => f.parentId === parentId);
}

export async function createFolder(
  name: string,
  parentId: string | null
): Promise<Folder> {
  await delay(200);
  // REAL: return fetch("/api/folders", { method: "POST", body: JSON.stringify({ name, parentId }) }).then(r => r.json())
  const newFolder: Folder = {
    id: `f${Date.now()}`,
    name,
    parentId,
    imageCount: 0,
    createdAt: new Date().toISOString(),
    color: "#6366F1",
  };
  return newFolder;
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  await delay(200);
  // REAL: return fetch(`/api/folders/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }).then(r => r.json())
  const folder = MOCK_FOLDERS.find((f) => f.id === id)!;
  return { ...folder, name };
}

export async function deleteFolder(id: string): Promise<void> {
  await delay(200);
  // REAL: await fetch(`/api/folders/${id}`, { method: "DELETE" })
}

// ─── Images ───────────────────────────────────────────────────────────────────

export async function getImages(folderId: string | null): Promise<ProductImage[]> {
  await delay(400);
  // REAL: return fetch(`/api/images?folderId=${folderId ?? "root"}`).then(r => r.json())
  return MOCK_IMAGES.filter((img) => img.folderId === folderId);
}

export async function updateImage(
  id: string,
  data: Partial<Pick<ProductImage, "productName" | "price" | "sku" | "tags" | "description">>
): Promise<ProductImage> {
  await delay(300);
  // REAL: return fetch(`/api/images/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then(r => r.json())
  const image = MOCK_IMAGES.find((img) => img.id === id)!;
  return { ...image, ...data };
}

export async function moveImage(
  imageId: string,
  targetFolderId: string | null
): Promise<void> {
  await delay(200);
  // REAL: await fetch(`/api/images/${imageId}/move`, { method: "POST", body: JSON.stringify({ folderId: targetFolderId }) })
}

export async function deleteImage(id: string): Promise<void> {
  await delay(200);
  // REAL: await fetch(`/api/images/${id}`, { method: "DELETE" })
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export async function getPresignedUrl(
  filename: string,
  contentType: string,
  userId?: string
): Promise<PresignedUrlResponse> {
  // REAL: return fetch("/api/upload/presign", { method: "POST", body: JSON.stringify({ filename, contentType, userId }) }).then(r => r.json())

  // Stub: simulate a successful presign response
  await delay(300);
  return {
    uploadUrl: `https://stub-storage.example.com/${userId ? `users/${userId}/` : ""}uploads/${filename}?token=mock`,
    publicUrl: `https://stub-storage.example.com/${userId ? `users/${userId}/` : ""}uploads/${filename}`,
    key: `${userId ? `users/${userId}/` : ""}uploads/${filename}`,
  };
}

export async function uploadFileToStorage(
  presignedUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  // Simulate upload progress
  // REAL: use XHR or fetch with a ReadableStream to track actual progress
  let progress = 0;
  const interval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 25, 100);
    onProgress(Math.round(progress));
    if (progress >= 100) clearInterval(interval);
  }, 200);

  await delay(1200);
  onProgress(100);
}

export interface SaveImagePayload {
  userId?: string;
  key: string;
  publicUrl: string;
  folderId: string | null;
  productName: string;
  price: number;
  sku: string;
  tags: string[];
  description: string;
}

export async function saveImageRecord(payload: SaveImagePayload): Promise<ProductImage> {
  await delay(300);
  // REAL: return fetch("/api/images", { method: "POST", body: JSON.stringify(payload) }).then(r => r.json())
  return {
    id: `i${Date.now()}`,
    folderId: payload.folderId,
    thumbnailUrl: payload.publicUrl,
    fullUrl: payload.publicUrl,
    productName: payload.productName,
    price: payload.price,
    sku: payload.sku,
    tags: payload.tags,
    description: payload.description,
    uploadedAt: new Date().toISOString(),
    fileSize: 0,
  };
}
