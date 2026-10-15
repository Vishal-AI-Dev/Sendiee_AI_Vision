import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";

export const POST = withAdmin(async (request, _ctx, admin) => {
  try {
    const body = await request.json();
    const { filename, contentType } = body as {
      filename?: string;
      contentType?: string;
    };

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    // ─── Stub response ───────────────────────────────────────────────────────
    // REAL implementation: generate a signed upload URL from Supabase Storage
    // and return it here. The object key is namespaced by the signed-in admin's
    // id (never by a client-supplied userId).
    // ─────────────────────────────────────────────────────────────────────────

    const key = `users/${admin.id}/uploads/${Date.now()}-${filename}`;
    const stubUrl = `https://stub-storage.example.com/${key}`;

    return NextResponse.json({
      uploadUrl: `${stubUrl}?token=presigned-stub`,
      publicUrl: stubUrl,
      key,
    });
  } catch (err) {
    console.error("[presign] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
