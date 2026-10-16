import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";
import { parseId } from "@/lib/db";
import { handle, jsonError, num, readJson, str, strList } from "@/lib/http";
import { deleteProduct, updateProduct } from "@/lib/products";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/images/:id { productName?, price?, sku?, tags?, description? } */
export const PATCH = withAdmin<Ctx>(async (request, ctx, admin) =>
  handle(async () => {
    const id = parseId((await ctx.params).id);
    if (!id) return jsonError(400, "Invalid image id");
    const body = await readJson(request);
    if (!body) return jsonError(400, "Invalid JSON body");
    const patch: Parameters<typeof updateProduct>[2] = {};
    if (body.productName !== undefined) patch.productName = str(body.productName, 120);
    if (body.price !== undefined) patch.price = Math.max(0, num(body.price));
    if (body.sku !== undefined) patch.sku = str(body.sku, 60);
    if (body.tags !== undefined) patch.tags = strList(body.tags);
    if (body.description !== undefined) patch.description = str(body.description, 2000);
    return NextResponse.json(await updateProduct(admin.id, id, patch));
  })
);

/** DELETE /api/images/:id — removes the record and the stored file. */
export const DELETE = withAdmin<Ctx>(async (_request, ctx, admin) =>
  handle(async () => {
    const id = parseId((await ctx.params).id);
    if (!id) return jsonError(400, "Invalid image id");
    await deleteProduct(admin.id, id);
    return NextResponse.json({ ok: true });
  })
);
