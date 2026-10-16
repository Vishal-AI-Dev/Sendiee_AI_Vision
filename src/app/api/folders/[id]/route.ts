import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";
import { parseId } from "@/lib/db";
import { deleteFolderCascade, updateFolder } from "@/lib/folders";
import { isFlowId } from "@/lib/flows";
import { handle, jsonError, readJson, str } from "@/lib/http";
import type { FlowId } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/folders/:id { name?, flow?, color? } */
export const PATCH = withAdmin<Ctx>(async (request, ctx, admin) =>
  handle(async () => {
    const id = parseId((await ctx.params).id);
    if (!id) return jsonError(400, "Invalid folder id");
    const body = await readJson(request);
    if (!body) return jsonError(400, "Invalid JSON body");
    const patch: { name?: string; flow?: FlowId | null; color?: string } = {};
    if (body.name !== undefined) patch.name = str(body.name, 60);
    if (body.flow !== undefined) {
      if (body.flow !== null && body.flow !== "" && !isFlowId(body.flow)) return jsonError(400, "flow must be 'visual', 'precise' or null");
      patch.flow = body.flow === "" ? null : (body.flow as FlowId | null);
    }
    if (body.color !== undefined) patch.color = str(body.color, 7);
    return NextResponse.json(await updateFolder(admin.id, id, patch));
  })
);

/** DELETE /api/folders/:id — removes the folder, its subfolders, their images and files. */
export const DELETE = withAdmin<Ctx>(async (_request, ctx, admin) =>
  handle(async () => {
    const id = parseId((await ctx.params).id);
    if (!id) return jsonError(400, "Invalid folder id");
    return NextResponse.json({ ok: true, ...(await deleteFolderCascade(admin.id, id)) });
  })
);
