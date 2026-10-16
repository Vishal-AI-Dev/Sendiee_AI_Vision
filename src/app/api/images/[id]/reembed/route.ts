import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";
import { parseId } from "@/lib/db";
import { handle, jsonError } from "@/lib/http";
import { reembedProduct } from "@/lib/products";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/images/:id/reembed — retry a failed embedding. */
export const POST = withAdmin<Ctx>(async (_request, ctx, admin) =>
  handle(async () => {
    const id = parseId((await ctx.params).id);
    if (!id) return jsonError(400, "Invalid image id");
    return NextResponse.json(await reembedProduct(admin.id, id));
  })
);
