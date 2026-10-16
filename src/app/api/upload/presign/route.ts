import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";
import { handle, jsonError, readJson, str } from "@/lib/http";
import { buildObjectKey, createSignedUpload, publicUrlFor, storageConfigured } from "@/lib/storage";

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * POST /api/upload/presign { filename, contentType }
 * Returns a Supabase signed upload URL. The browser PUTs the file there, then
 * saves the product record through POST /api/images with the returned key.
 */
export const POST = withAdmin(async (request, _ctx, admin) =>
  handle(async () => {
    const body = await readJson(request);
    if (!body) return jsonError(400, "Invalid JSON body");
    const filename = str(body.filename, 200);
    const contentType = str(body.contentType, 100);
    if (!filename || !contentType) return jsonError(400, "filename and contentType are required");
    if (!ACCEPTED.has(contentType)) return jsonError(415, "Only JPEG, PNG and WebP images are accepted");
    if (!storageConfigured()) return jsonError(503, "Image storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");

    const key = buildObjectKey(admin.id, filename);
    const { uploadUrl, token } = await createSignedUpload(key);
    return NextResponse.json({ uploadUrl, token, publicUrl: publicUrlFor(key), key });
  })
);
