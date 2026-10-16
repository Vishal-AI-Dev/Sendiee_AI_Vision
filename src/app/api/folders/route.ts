import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";
import { parseFolderId } from "@/lib/db";
import { createFolder, listFolders } from "@/lib/folders";
import { isFlowId } from "@/lib/flows";
import { handle, jsonError, readJson, str } from "@/lib/http";

/** GET /api/folders?parentId=root|<id> — the folders directly under a parent. */
export const GET = withAdmin(async (request, _ctx, admin) =>
  handle(async () => {
    const parent = parseFolderId(new URL(request.url).searchParams.get("parentId"));
    if (!parent.ok) return jsonError(400, "Invalid parentId");
    return NextResponse.json(await listFolders(admin.id, parent.id));
  })
);

/** POST /api/folders { name, parentId, flow? , color? } */
export const POST = withAdmin(async (request, _ctx, admin) =>
  handle(async () => {
    const body = await readJson(request);
    if (!body) return jsonError(400, "Invalid JSON body");
    const parent = parseFolderId(body.parentId);
    if (!parent.ok) return jsonError(400, "Invalid parentId");
    const flow = body.flow === undefined || body.flow === null || body.flow === "" ? null : body.flow;
    if (flow !== null && !isFlowId(flow)) return jsonError(400, "flow must be 'visual', 'precise' or null");
    const folder = await createFolder(admin.id, {
      name: str(body.name, 60),
      parentId: parent.id,
      flow,
      color: str(body.color, 7) || undefined,
    });
    return NextResponse.json(folder, { status: 201 });
  })
);
