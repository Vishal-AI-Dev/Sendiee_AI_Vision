// ─── API client used by the admin UI ─────────────────────────────────────────
// Thin fetch wrappers over the route handlers in src/app/api. Every call runs
// with the admin's session cookie; errors surface as thrown Errors with the
// server's message so components can show them.

import type { ApiKeyInfo, Folder, FlowId, LibraryStats, MatchResult, ProductImage } from "./types";

export type { Folder, ProductImage, LibraryStats, MatchResult, FlowId } from "./types";

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...(init?.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && typeof data.error === "string" && data.error) || `Request failed (${res.status})`);
  return data as T;
}

const folderParam = (id: string | null) => id ?? "root";

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function getFolders(parentId: string | null): Promise<Folder[]> {
  return call(`/api/folders?parentId=${encodeURIComponent(folderParam(parentId))}`);
}

export async function createFolder(name: string, parentId: string | null, flow: FlowId | null = null): Promise<Folder> {
  return call("/api/folders", { method: "POST", body: JSON.stringify({ name, parentId, flow }) });
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  return call(`/api/folders/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
}

export async function updateFolder(id: string, patch: { name?: string; flow?: FlowId | null; color?: string }): Promise<Folder> {
  return call(`/api/folders/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function deleteFolder(id: string): Promise<void> {
  await call(`/api/folders/${id}`, { method: "DELETE" });
}

// ─── Images ───────────────────────────────────────────────────────────────────

export async function getImages(folderId: string | null): Promise<ProductImage[]> {
  return call(`/api/images?folderId=${encodeURIComponent(folderParam(folderId))}`);
}

export async function updateImage(
  id: string,
  data: Partial<Pick<ProductImage, "productName" | "price" | "sku" | "tags" | "description">>
): Promise<ProductImage> {
  return call(`/api/images/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function moveImage(imageId: string, targetFolderId: string | null): Promise<void> {
  await call(`/api/images/${imageId}/move`, { method: "POST", body: JSON.stringify({ folderId: targetFolderId }) });
}

export async function deleteImage(id: string): Promise<void> {
  await call(`/api/images/${id}`, { method: "DELETE" });
}

export async function reembedImage(id: string): Promise<ProductImage> {
  return call(`/api/images/${id}/reembed`, { method: "POST" });
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface PresignedUrlResponse {
  uploadUrl: string;
  token: string;
  publicUrl: string;
  key: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getPresignedUrl(filename: string, contentType: string, _userId?: string): Promise<PresignedUrlResponse> {
  return call("/api/upload/presign", { method: "POST", body: JSON.stringify({ filename, contentType }) });
}

/** PUT the file to the signed Supabase upload URL, reporting progress. */
export function uploadFileToStorage(presignedUrl: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl, true);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.send(file);
  });
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
  fileSize?: number;
  contentType?: string;
}

/** Remove uploaded files that were never saved as products (after "Skip All"). */
export async function discardUploads(keys: string[]): Promise<{ removed: number }> {
  return call("/api/upload", { method: "DELETE", body: JSON.stringify({ keys }) });
}

/** Create the product record for an uploaded file. The server embeds it before answering. */
export async function saveImageRecord(payload: SaveImagePayload): Promise<ProductImage> {
  return call("/api/images", { method: "POST", body: JSON.stringify(payload) });
}

// ─── Dashboard, settings, matching ───────────────────────────────────────────

export async function getStats(): Promise<LibraryStats> {
  return call("/api/stats");
}

export async function getApiKeyInfo(): Promise<ApiKeyInfo> {
  return call("/api/settings/api-key");
}

export async function rotateApiKey(): Promise<{ key: string; prefix: string; createdAt: string }> {
  return call("/api/settings/api-key", { method: "POST" });
}

/** Run a photo through the matcher as the signed-in admin (the Test match page). */
export async function testMatch(file: File): Promise<MatchResult> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch("/api/match", { method: "POST", body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && typeof data.error === "string" && data.error) || `Match failed (${res.status})`);
  return data as MatchResult;
}
