// Reference-image storage on Supabase Storage.
//
// The browser uploads straight to a signed upload URL; the server only hands
// out URLs, downloads bytes when it needs to embed an image, and deletes objects.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

let client: SupabaseClient | null = null;

export function storageBucket(): string {
  return process.env.SUPABASE_BUCKET || "products";
}

function supabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export function storageConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Object key for a new upload: namespaced by owner, never trusting the client's path. */
export function buildObjectKey(ownerId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "image";
  return `users/${ownerId}/${randomUUID()}-${safe}`;
}

export async function createSignedUpload(key: string): Promise<{ uploadUrl: string; token: string }> {
  const { data, error } = await supabase().storage.from(storageBucket()).createSignedUploadUrl(key);
  if (error || !data) throw new Error(`Supabase presign failed: ${error?.message ?? "no data"}`);
  return { uploadUrl: data.signedUrl, token: data.token };
}

export function publicUrlFor(key: string): string {
  return supabase().storage.from(storageBucket()).getPublicUrl(key).data.publicUrl;
}

export async function downloadObject(key: string): Promise<{ bytes: Buffer; contentType: string | null }> {
  const { data, error } = await supabase().storage.from(storageBucket()).download(key);
  if (error || !data) throw new Error(`Supabase download failed for ${key}: ${error?.message ?? "no data"}`);
  return { bytes: Buffer.from(await data.arrayBuffer()), contentType: data.type || null };
}

export async function removeObjects(keys: string[]): Promise<void> {
  if (!keys.length) return;
  const { error } = await supabase().storage.from(storageBucket()).remove(keys);
  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}

/** Fetch an image the customer sent as a URL (e.g. a WhatsApp media link). */
export async function fetchImageBytes(url: string, maxBytes = 10 * 1024 * 1024): Promise<{ bytes: Buffer; contentType: string | null }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) throw new Error("Image is larger than 10 MB");
  return { bytes: buf, contentType: res.headers.get("content-type") };
}
