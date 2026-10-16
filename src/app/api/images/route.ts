import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";
import { parseFolderId } from "@/lib/db";
import { handle, jsonError, num, readJson, str, strList } from "@/lib/http";
import { createProduct, listProducts } from "@/lib/products";

/** GET /api/images?folderId=root|<id> — the product images directly in a folder. */
export const GET = withAdmin(async (request, _ctx, admin) =>
  handle(async () => {
    const folder = parseFolderId(new URL(request.url).searchParams.get("folderId"));
    if (!folder.ok) return jsonError(400, "Invalid folderId");
    return NextResponse.json(await listProducts(admin.id, folder.id));
  })
);

/**
 * POST /api/images — save the product record for an uploaded file and embed it.
 * Body: { key, publicUrl?, folderId, productName, price, sku, tags, description, fileSize?, contentType? }
 */
export const POST = withAdmin(async (request, _ctx, admin) =>
  handle(async () => {
    const body = await readJson(request);
    if (!body) return jsonError(400, "Invalid JSON body");
    const folder = parseFolderId(body.folderId);
    if (!folder.ok) return jsonError(400, "Invalid folderId");
    const product = await createProduct(admin.id, {
      storageKey: str(body.key, 300),
      publicUrl: str(body.publicUrl, 2000),
      folderId: folder.id,
      productName: str(body.productName, 120),
      price: Math.max(0, num(body.price)),
      sku: str(body.sku, 60),
      tags: strList(body.tags),
      description: str(body.description, 2000),
      fileSize: Math.max(0, Math.round(num(body.fileSize))),
      contentType: str(body.contentType, 100) || null,
    });
    return NextResponse.json(product, { status: 201 });
  })
);
