import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";
import { parseFolderId, parseId } from "@/lib/db";
import { handle, jsonError, readJson } from "@/lib/http";
import { moveProduct } from "@/lib/products";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/images/:id/move { folderId: null | <id> } */
export const POST = withAdmin<Ctx>(async (request, ctx, admin) =>
  handle(async () => {
    const id = parseId((await ctx.params).id);
    if (!id) return jsonError(400, "Invalid image id");
    const body = await readJson(request);
    if (!body) return jsonError(400, "Invalid JSON body");
    const folder = parseFolderId(body.folderId);
    if (!folder.ok) return jsonError(400, "Invalid folderId");
    return NextResponse.json(await moveProduct(admin.id, id, folder.id));
  })
);
