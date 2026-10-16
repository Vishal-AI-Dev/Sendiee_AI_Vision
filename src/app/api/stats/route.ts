import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth";
import { handle } from "@/lib/http";
import { libraryStats } from "@/lib/products";

/** GET /api/stats — dashboard numbers for the signed-in admin's library. */
export const GET = withAdmin(async (_request, _ctx, admin) => handle(async () => NextResponse.json(await libraryStats(admin.id))));
