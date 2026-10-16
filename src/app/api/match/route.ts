import { NextResponse } from "next/server";
import { findOwnerByApiKey, looksLikeApiKey } from "@/lib/apiKeys";
import { getAdminUser } from "@/lib/auth";
import { EmbeddingError } from "@/lib/embedding";
import { HttpError, jsonError, str } from "@/lib/http";
import { matchImage, VectorSearchUnavailable } from "@/lib/match";
import { fetchImageBytes } from "@/lib/storage";

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/match — find the catalogue product in a customer photo.
 *
 * Auth: `x-api-key: sv_…` (or `Authorization: Bearer sv_…`) for the Sendiee
 * webhook, or a signed-in admin session for the Test match page.
 *
 * Body, one of:
 *   multipart/form-data with an `image` file
 *   application/json { "imageUrl": "https://…" }
 *   application/json { "imageBase64": "…", "contentType": "image/jpeg" }
 *
 * The photo is embedded from memory and never stored.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const owner = await resolveOwner(request);
    if (!owner) return jsonError(401, "Unauthorized: send a valid x-api-key or sign in");

    const image = await readImage(request);
    const result = await matchImage({ ownerId: owner.id, bytes: image.bytes, contentType: image.contentType });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.message);
    if (err instanceof VectorSearchUnavailable) return jsonError(503, err.message);
    if (err instanceof EmbeddingError) return jsonError(502, `Embedding failed: ${err.message}`);
    console.error("[match] error:", err);
    return jsonError(500, "Internal server error");
  }
}

async function resolveOwner(request: Request): Promise<{ id: string } | null> {
  const header = request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (looksLikeApiKey(header)) return findOwnerByApiKey(header);
  if (header) return null; // a key was sent but it is not one of ours
  return getAdminUser();
}

async function readImage(request: Request): Promise<{ bytes: Buffer; contentType: string | null }> {
  const type = request.headers.get("content-type") ?? "";

  if (type.startsWith("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) throw new HttpError(400, "Send the photo as the 'image' file field");
    if (file.size > MAX_BYTES) throw new HttpError(413, "Image is larger than 10 MB");
    return { bytes: Buffer.from(await file.arrayBuffer()), contentType: file.type || null };
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Send multipart/form-data with an 'image' file, or JSON with imageUrl or imageBase64");
  }
  const imageUrl = str(body.imageUrl, 2000);
  if (imageUrl) {
    if (!/^https?:\/\//i.test(imageUrl)) throw new HttpError(400, "imageUrl must be an http(s) URL");
    try {
      return await fetchImageBytes(imageUrl, MAX_BYTES);
    } catch (err) {
      throw new HttpError(400, (err as Error).message);
    }
  }
  const b64 = typeof body.imageBase64 === "string" ? body.imageBase64.replace(/^data:[^;]+;base64,/, "") : "";
  if (b64) {
    const bytes = Buffer.from(b64, "base64");
    if (!bytes.length) throw new HttpError(400, "imageBase64 is not valid base64");
    if (bytes.length > MAX_BYTES) throw new HttpError(413, "Image is larger than 10 MB");
    return { bytes, contentType: str(body.contentType, 100) || null };
  }
  throw new HttpError(400, "Provide an 'image' file, imageUrl or imageBase64");
}
