import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filename, contentType, userId } = body as {
      filename?: string;
      contentType?: string;
      userId?: string;
    };

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    // ─── Stub response ───────────────────────────────────────────────────────
    // REAL implementation: generate a presigned PUT URL from your cloud storage
    // provider (AWS S3, Cloudflare R2, GCP GCS, etc.) and return it here.
    //
    // Example with AWS SDK v3:
    // import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
    // import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
    //
    // const s3 = new S3Client({ region: process.env.AWS_REGION });
    // const key = `uploads/${Date.now()}-${filename}`;
    // const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType });
    // const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    // const publicUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
    // return NextResponse.json({ uploadUrl, publicUrl, key });
    // ─────────────────────────────────────────────────────────────────────────

    const key = `${userId ? `users/${userId}/` : ""}uploads/${Date.now()}-${filename}`;
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
}
