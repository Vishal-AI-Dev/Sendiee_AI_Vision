import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { generateApiKey } from "@/lib/apiKeys";
import { withAdmin } from "@/lib/auth";
import { usersCol } from "@/lib/db";
import { handle, jsonError } from "@/lib/http";
import type { ApiKeyInfo } from "@/lib/types";

/** GET /api/settings/api-key — whether a key exists (prefix only; the key itself is never returned). */
export const GET = withAdmin(async (_request, _ctx, admin) =>
  handle(async () => {
    const user = await (await usersCol()).findOne({ _id: new ObjectId(admin.id) }, { projection: { apiKeyPrefix: 1, apiKeyCreatedAt: 1 } });
    if (!user) return jsonError(404, "User not found");
    const info: ApiKeyInfo = {
      prefix: user.apiKeyPrefix ?? null,
      createdAt: user.apiKeyCreatedAt ? user.apiKeyCreatedAt.toISOString() : null,
    };
    return NextResponse.json(info);
  })
);

/** POST /api/settings/api-key — create or rotate the key. The full key is returned once. */
export const POST = withAdmin(async (_request, _ctx, admin) =>
  handle(async () => {
    const { key, hash, prefix } = generateApiKey();
    const createdAt = new Date();
    await (await usersCol()).updateOne(
      { _id: new ObjectId(admin.id) },
      { $set: { apiKeyHash: hash, apiKeyPrefix: prefix, apiKeyCreatedAt: createdAt } }
    );
    return NextResponse.json({ key, prefix, createdAt: createdAt.toISOString() }, { status: 201 });
  })
);
